<?php

namespace App\Services;

use App\Models\Payment;
use App\Services\MpesaService;
use Illuminate\Support\Facades\Log;
class PaymentService
{
    public function __construct(protected MpesaService $mpesa)
    {
    }

    public function initiateMpesa(array $data): Payment
    {
        // Validate phone number format
        $phone = $this->formatPhoneNumber($data['phone']);

        $payment = Payment::create([
            'user_id' => $data['user_id'],
            'payable_type' => $data['payable_type'],
            'payable_id' => $data['payable_id'],
            'payment_method' => 'mpesa',
            'status' => 'pending',
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'KES',
            'meta' => [
                'phone' => $phone,
                'original_phone' => $data['phone'],
                'initiated_at' => now()->toIso8601String(),
            ],
        ]);

        try {
            $response = $this->mpesa->stkPush([
                'amount' => $data['amount'],
                'phone' => $phone,
                'account_reference' => 'UL-' . $payment->id,
                'description' => 'UrbanLink - ' . ucfirst($data['payable_type']) . ' Payment',
            ]);

            $payment->meta = array_merge($payment->meta ?? [], [
                'stk_request_id' => $response['CheckoutRequestID'] ?? null,
                'merchant_request_id' => $response['MerchantRequestID'] ?? null,
                'response_code' => $response['ResponseCode'] ?? null,
                'response_description' => $response['ResponseDescription'] ?? null,
                'customer_message' => $response['CustomerMessage'] ?? null,
                'request_timestamp' => now()->toIso8601String(),
                'raw_response' => $response,
            ]);

            // Check if STK push was successful
            if (($response['ResponseCode'] ?? null) === '0') {
                $payment->status = 'processing';
                // Send notification to user that STK push was sent
                $this->sendStkPushNotification($payment);
            } else {
                $payment->status = 'failed';
                $payment->result_desc = $response['ResponseDescription'] ?? 'STK push failed';
            }

        } catch (\Exception $e) {
            $payment->status = 'failed';
            $payment->result_desc = 'STK push error: ' . $e->getMessage();
            $payment->meta = array_merge($payment->meta ?? [], [
                'error' => $e->getMessage(),
                'error_timestamp' => now()->toIso8601String(),
            ]);

            Log::error('M-Pesa STK push failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
                'phone' => $phone,
            ]);
        }

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
/**
     * Handle the M-Pesa Callback from Safaricom.
     * * This function is wrapped in a DB Transaction to ensure that if the Ride
     * update fails, the Payment update is also rolled back, maintaining data integrity.
     */
    public function updateFromMpesaCallback(array $callbackData): Payment
    {
        $callback = $callbackData['Body']['stkCallback'] ?? [];
        $checkoutRequestId = $callback['CheckoutRequestID'] ?? null;
        $resultCode = $callback['ResultCode'] ?? null;
        $resultDesc = $callback['ResultDesc'] ?? null;

        // Parse Metadata into a flat key-value array (ReceiptNumber, Amount, etc.)
        $metadataItems = $callback['CallbackMetadata']['Item'] ?? [];
        $callbackMap = collect($metadataItems)->mapWithKeys(function ($item) {
            return [$item['Name'] => $item['Value'] ?? null];
        })->all();

        // Find the payment using the unique CheckoutRequestID stored during initiation
        $payment = Payment::whereJsonContains('meta->stk_request_id', $checkoutRequestId)
            ->first();

        if (!$payment) {
            Log::error('M-Pesa Callback: Payment record not found', [
                'checkout_request_id' => $checkoutRequestId,
                'callback_data' => $callbackData,
            ]);
            throw new \RuntimeException('Payment not found for callback');
        }

        // Idempotency: If the payment was already marked as completed, don't process again.
        if ($payment->status === 'completed') {
            return $payment;
        }

        // We wrap the updates in a transaction to ensure "All or Nothing" success
        return \Illuminate\Support\Facades\DB::transaction(function () use ($payment, $resultCode, $resultDesc, $callbackData, $callbackMap) {
            
            // 1. Update general payment data
            $payment->mpesa_transaction_id = $callbackMap['MpesaReceiptNumber'] ?? $payment->mpesa_transaction_id;
            $payment->result_code = $resultCode;
            $payment->result_desc = $resultDesc;
            $payment->receipt_number = $callbackMap['MpesaReceiptNumber'] ?? $payment->receipt_number;
            
            $payment->meta = array_merge($payment->meta ?? [], [
                'raw_callback' => $callbackData,
                'callback_processed_at' => now()->toIso8601String(),
                'callback_metadata' => $callbackMap,
            ]);

            // 2. Handle Success (ResultCode 0)
            if ($resultCode === 0) {
                // This updates Payment status AND calls updatePayableModel() for the Ride
                $this->handleSuccessfulPayment($payment);
                
            } else {
                // 3. Handle Failures
                $payment->status = $this->mapResultCodeToStatus($resultCode);
                $this->sendPaymentFailureNotification($payment, $resultDesc ?? 'Payment failed');
            }

            $payment->save();

            Log::info('M-Pesa callback processed successfully', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'result_code' => $resultCode
            ]);

            return $payment;
        });
    }

    

    /**
     * Helper to map Safaricom ResultCodes to internal statuses.
     */
    private function mapResultCodeToStatus(int $resultCode): string
    {
        return match ($resultCode) {
            1032    => 'cancelled',
            1       => 'failed', // Insufficient funds
            2001    => 'failed', // Wrong PIN
            default => 'failed',
        };
    }

    public function getStatus(Payment $payment): string
    {
        return $payment->status;
    }

    /**
     * Format phone number for M-Pesa (Kenya format)
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/\D/', '', $phone);

        // Handle different formats
        if (str_starts_with($phone, '254')) {
            // Already in international format
            return $phone;
        } elseif (str_starts_with($phone, '0')) {
            // Local format, convert to international
            return '254' . substr($phone, 1);
        } elseif (str_starts_with($phone, '7') || str_starts_with($phone, '1')) {
            // Missing country code
            return '254' . $phone;
        }

        // Assume it's already properly formatted
        return $phone;
    }

    /**
     * Send notification when STK push is initiated
     */
    private function sendStkPushNotification(Payment $payment): void
    {
        try {
            $notificationService = app(\App\Services\NotificationService::class);

            $message = "STK push sent to your phone. Please check your M-Pesa and enter your PIN to complete the payment of KES {$payment->amount}.";

            // Send real-time notification
            $notificationService->sendRealTimeNotification(
                $payment->user,
                'payment_stk_push',
                'Payment Request Sent',
                $message,
                [
                    'payment_id' => $payment->id,
                    'amount' => $payment->amount,
                    'phone' => $payment->meta['phone'],
                    'payable_type' => $payment->payable_type,
                    'payable_id' => $payment->payable_id,
                ]
            );

            // Send SMS notification
            $notificationService->sendSmsNotification(
                $payment->user,
                $message
            );

        } catch (\Exception $e) {
            Log::error('Failed to send STK push notification', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

/**
 * Master function called when Safaricom confirms the money is moved.
 */
public function handleSuccessfulPayment(Payment $payment): void
{
    // 1. Update the Payment record first
    $payment->update([
        'status' => 'completed',
        'completed_at' => now(), // Optional: record when the money hit your account
    ]);

    // 2. Delegate the 'Payable' update (Ride, Application, etc.)
    $this->updatePayableModel($payment);
    
    Log::info("M-Pesa Flow Complete for Payment #{$payment->id}");
}

/**
 * Specifically handles the business logic for what was being paid for.
 */
protected function updatePayableModel(Payment $payment): void
{
    switch ($payment->payable_type) {
        case 'ride':
            $ride = \App\Models\Ride::find($payment->payable_id);
            if ($ride) {
                $ride->update(['payment_status' => 'paid']);
                Log::info("Ride #{$ride->id} marked as PAID.");
            }
            break;

        case 'application':
            $profile = \App\Models\DriverProfile::find($payment->payable_id);
            if ($profile) {
                $profile->update(['onboarding_fee_paid' => true]);
                Log::info("Driver Profile #{$profile->id} onboarding fee cleared.");
            }
            break;
            
        default:
            Log::warning("Unknown payable type: {$payment->payable_type}");
            break;
    }
}

    /**
     * Send payment success notification
     */
    private function sendPaymentSuccessNotification(Payment $payment): void
    {
        try {
            $notificationService = app(\App\Services\NotificationService::class);

            $message = "Payment of KES {$payment->amount} has been successfully processed. Receipt: {$payment->receipt_number}";

            // Send real-time notification
            $notificationService->sendRealTimeNotification(
                $payment->user,
                'payment_success',
                'Payment Successful',
                $message,
                [
                    'payment_id' => $payment->id,
                    'amount' => $payment->amount,
                    'receipt_number' => $payment->receipt_number,
                    'transaction_id' => $payment->mpesa_transaction_id,
                ]
            );

            // Send SMS notification
            $notificationService->sendSmsNotification(
                $payment->user,
                $message
            );

        } catch (\Exception $e) {
            Log::error('Failed to send payment success notification', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send payment failure notification
     */
    private function sendPaymentFailureNotification(Payment $payment, string $reason): void
    {
        try {
            $notificationService = app(\App\Services\NotificationService::class);

            $message = "Payment of KES {$payment->amount} failed. Reason: {$reason}";

            // Send real-time notification
            $notificationService->sendRealTimeNotification(
                $payment->user,
                'payment_failed',
                'Payment Failed',
                $message,
                [
                    'payment_id' => $payment->id,
                    'amount' => $payment->amount,
                    'reason' => $reason,
                    'result_code' => $payment->result_code,
                ]
            );

            // Send SMS notification
            $notificationService->sendSmsNotification(
                $payment->user,
                $message
            );

        } catch (\Exception $e) {
            Log::error('Failed to send payment failure notification', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
