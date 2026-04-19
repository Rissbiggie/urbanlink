<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Ride;
use App\Models\GovernmentService;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Str;


class PaymentController extends Controller
{
    public function __construct(protected PaymentService $service)
    {
    }

  public function initiate(Request $request): JsonResponse
{
    // 1. Determine the table name dynamically for validation
    $table = $request->payable_type === 'ride' ? 'rides' : 'applications';

    $data = $request->validate([
        'payable_type' => 'required|string|in:ride,application',
        // 2. Changed 'integer' to 'numeric' to handle string-numbers from React
        // 3. Added 'exists' to verify the record is actually in the DB
        'payable_id'   => "required|numeric|exists:{$table},id", 
        'phone'        => 'required|string',
        'amount'       => 'required|numeric|min:1',
    ]);

    $data['user_id'] = $request->user()->id;

    // The service will now only run if the record was found
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

 // Changed 'int $id' to '$id' to prevent the TypeError seen in your logs
public function status(Request $request, $id): JsonResponse
{
    // Find the payment belonging to the user
    $payment = $request->user()->payments()->findOrFail($id);

    if ($payment->payment_method === 'mpesa') {
        try {
            $this->service->queryMpesaStatus($payment);
        } catch (\Throwable $e) {
            logger()->warning('Failed to query Mpesa status', [
                'payment' => $payment->id, 
                'error' => $e->getMessage()
            ]);
        }
    }

    return response()->json([
        'status' => $this->service->getStatus($payment),
        'result_desc' => $payment->result_desc // Added this field
    ]);
}

public function getPayableTypes(): JsonResponse
{
    // Fetch the keys from the Morph Map defined in your ServiceProvider
    $map = Relation::morphMap();

    $types = collect($map)->map(function ($className, $alias) {
        return [
            'id' => $alias, // e.g., 'ride'
            // Generates a pretty name from the class name (e.g., 'Ride' or 'Government Service')
            'name' => Str::headline(class_basename($className)) 
        ];
    })->values();

    return response()->json([
        'status' => 'success',
        'types' => $types
    ]);
}
}