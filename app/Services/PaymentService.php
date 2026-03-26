<?php

namespace App\Services;

use App\Models\Payment;
use App\Services\MpesaService;

class PaymentService
{
    public function __construct(protected MpesaService $mpesa)
    {
    }

    public function initiateMpesa(array $data): Payment
    {
        $payment = Payment::create([
            'user_id' => $data['user_id'],
            'payable_type' => $data['payable_type'],
            'payable_id' => $data['payable_id'],
            'payment_method' => 'mpesa',
            'status' => 'pending',
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'KES',
            'meta' => [
                'phone' => $data['phone'] ?? null,
            ],
        ]);

        $response = $this->mpesa->stkPush([
            'amount' => $data['amount'],
            'phone' => $data['phone'],
            'account_reference' => $payment->id,
            'description' => 'UrbanLink payment',
        ]);

        $payment->meta = array_merge($payment->meta ?? [], [
            'stk_request_id' => $response['CheckoutRequestID'] ?? null,
            'merchant_request_id' => $response['MerchantRequestID'] ?? null,
            'request_timestamp' => now()->toIso8601String(),
            'raw_response' => $response,
        ]);

        $payment->save();

        return $payment;
    }

    public function queryMpesaStatus(Payment $payment): array
    {
        $checkoutRequestId = $payment->meta['stk_request_id'] ?? null;

        if (! $checkoutRequestId) {
            throw new \RuntimeException('No checkout request id available for payment.');
        }

        $response = $this->mpesa->stkPushQuery($checkoutRequestId);

        // Update cached meta so frontend can see the latest response
        $payment->meta = array_merge($payment->meta ?? [], ['last_status_query' => $response]);
        $payment->save();

        return $response;
    }

    public function updateFromMpesaCallback(array $callbackData): Payment
    {
        $callback = $callbackData['Body']['stkCallback'] ?? [];
        $checkoutRequestId = $callback['CheckoutRequestID'] ?? null;
        $resultCode = $callback['ResultCode'] ?? null;
        $resultDesc = $callback['ResultDesc'] ?? null;

        $metadataItems = $callback['CallbackMetadata']['Item'] ?? [];
        $callbackMap = collect($metadataItems)->mapWithKeys(fn ($item) => [$item['Name'] => $item['Value'] ?? null])->all();

        $payment = Payment::whereJsonContains('meta->stk_request_id', $checkoutRequestId)
            ->orWhere('mpesa_transaction_id', $callbackMap['MpesaReceiptNumber'] ?? null)
            ->first();

        if (! $payment) {
            throw new \RuntimeException('Payment not found for callback');
        }

        // Idempotent: if already completed, return immediately.
        if ($payment->status === 'completed' && $resultCode === 0) {
            return $payment;
        }

        $payment->mpesa_transaction_id = $callbackMap['MpesaReceiptNumber'] ?? $payment->mpesa_transaction_id;
        $payment->result_code = $resultCode;
        $payment->result_desc = $resultDesc;
        $payment->receipt_number = $callbackMap['MpesaReceiptNumber'] ?? $payment->receipt_number;
        $payment->meta = array_merge($payment->meta ?? [], ['raw_callback' => $callbackData]);

        $payment->status = $resultCode === 0 ? 'completed' : 'failed';

        // If the payment relates to a ride, update the ride's final fare and status if applicable.
        if ($payment->payable_type === 'ride') {
            $ride = $payment->payable;

            if ($ride instanceof \App\Models\Ride) {
                if (is_null($ride->final_fare)) {
                    $ride->final_fare = $payment->amount;
                }

                // If ride is already completed, keep; otherwise mark as completed.
                if ($ride->status !== 'completed' && $payment->status === 'completed') {
                    $ride->status = 'completed';
                }

                $ride->save();
            }
        }

        $payment->save();

        return $payment;
    }

    public function getStatus(Payment $payment): string
    {
        return $payment->status;
    }
}
