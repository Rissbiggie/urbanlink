<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function __construct(protected PaymentService $service)
    {
    }

    public function initiate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'payable_type' => 'required|string|in:ride,application',
            'payable_id' => 'required|integer',
            'phone' => 'required|string',
            'amount' => 'required|numeric|min:0',
        ]);

        $data['user_id'] =$request->user()->id;

        $payment = $this->service->initiateMpesa($data);

        return response()->json($payment);
    }

    public function callback(Request $request): JsonResponse
    {
        $callbackData = $request->all();

        try {
            $payment = $this->service->updateFromMpesaCallback($callbackData);

            return response()->json(['status' => 'ok', 'payment_id' => $payment->id]);
        } catch (\Throwable $e) {
            // Logging might be useful for diagnosing callback issues.
            logger()->warning('Mpesa callback error', [
                'error' => $e->getMessage(),
                'payload' => $callbackData,
            ]);

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $payments = $request->user()->payments()->latest()->paginate(15);

        return response()->json($payments);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $payment = $request->user()->payments()->findOrFail($id);

        return response()->json($payment);
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $payment = $request->user()->payments()->findOrFail($id);

        // If this is an MPesa payment, refresh its status from the API if possible.
        if ($payment->payment_method === 'mpesa') {
            try {
                $this->service->queryMpesaStatus($payment);
            } catch (\Throwable $e) {
                logger()->warning('Failed to query Mpesa status', ['payment' => $payment->id, 'error' => $e->getMessage()]);
            }
        }

        return response()->json(['status' => $this->service->getStatus($payment)]);
    }
}
