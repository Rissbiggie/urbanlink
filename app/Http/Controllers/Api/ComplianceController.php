<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ComplianceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ComplianceController extends Controller
{
    public function __construct(protected ComplianceService $service)
    {
    }

    public function snapshot(Request $request): JsonResponse
    {
        $snapshot = $this->service->getSnapshot($request->user());
        
        if (!$snapshot) {
            return response()->json(['message' => 'Compliance data not found. Try refreshing.'], 404);
        }

        return response()->json($snapshot);
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $snapshot = $this->service->refresh($user);

        return response()->json([
            'message' => 'Sync initiated successfully.',
            'data' => $snapshot
        ]);
    }

    public function kra(Request $request): JsonResponse
    {
        $snapshot = $this->service->getSnapshot($request->user());

        return $snapshot 
            ? response()->json(['kra' => [
                'status' => $snapshot->kra_status ?? 'unknown',
                'pin' => $snapshot->kra_pin,
                'tcc_status' => $snapshot->kra_tcc_status,
                'tcc_expiry' => $snapshot->kra_tcc_expiry,
                'last_filing_date' => $snapshot->kra_last_filing_date,
            ]])
            : response()->json(['message' => 'KRA data unavailable'], 404);
    }

    public function ntsa(Request $request): JsonResponse
    {
        $snapshot = $this->service->getSnapshot($request->user());

        return $snapshot 
            ? response()->json(['ntsa' => [
                'license_status' => $snapshot->ntsa_license_status ?? 'unknown',
                'license_expiry' => $snapshot->ntsa_license_expiry,
                'pending_fines' => $snapshot->ntsa_pending_fines,
                'fine_amount' => $snapshot->ntsa_fine_amount,
            ]])
            : response()->json(['message' => 'NTSA data unavailable'], 404);
    }

    public function sha(Request $request): JsonResponse
    {
    $snapshot = $this->service->getSnapshot($request->user());

    // 1. Check if the snapshot exists
    if (!$snapshot) {
        return response()->json([
            'sha' => [
                'status' => 'not_synced',
                'message' => 'No SHA data found. Please trigger a refresh.'
            ]
        ], 404);
    }

    // 2. If it exists, return the data safely
    return response()->json([ 
        'sha' => [
            'status' => $snapshot->sha_status ?? 'unknown',
            'member_id' => $snapshot->sha_member_id,
            'next_due_date' => $snapshot->sha_next_due_date,
            'premium_paid' => $snapshot->sha_premium_paid,
        ]
    ]);
}
   public function nssf(Request $request): JsonResponse
{
    // 1. Retrieve the snapshot for the authenticated user
    $snapshot = $this->service->getSnapshot($request->user());

    // 2. If no snapshot exists, return a 404 instead of crashing
    if (!$snapshot) {
        return response()->json([
            'nssf' => [
                'status' => 'not_found',
                'message' => 'NSSF data has not been synced for this account.'
            ]
        ], 404);
    }

    // 3. Return the data safely using the null-coalescing operator
    return response()->json([ 
        'nssf' => [
            'status' => $snapshot->nssf_status ?? 'unknown',
            'member_number' => $snapshot->nssf_member_number,
            'balance' => $snapshot->nssf_balance ?? 0,
            'last_contribution_date' => $snapshot->nssf_last_contribution_date,
        ]
    ]);
}
    public function addDependant(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'relationship' => 'required|string|max:50',
            'national_id' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
        ]);

        $user = $request->user();

        // For now, we'll store dependants in the user's compliance snapshot metadata
        $snapshot = $this->service->getSnapshot($user);

        if (!$snapshot) {
            $snapshot = \App\Models\ComplianceSnapshot::create([
                'user_id' => $user->id,
                'last_synced_at' => now(),
            ]);
        }

        $dependants = $snapshot->dependants ?? [];
        $dependants[] = array_merge($data, [
            'id' => uniqid('dep_'),
            'added_at' => now()->toISOString(),
        ]);

        $snapshot->dependants = $dependants;
        $snapshot->save();

        // If SHA API is configured, submit the dependant
        if (config('services.government.sha.enabled', false)) {
            try {
                $shaService = app(\App\Services\Government\ShaService::class);
                $result = $shaService->submitDependant($user, $data);

                // Update the dependant with the result
                $dependants[count($dependants) - 1]['sha_reference'] = $result['reference'] ?? null;
                $dependants[count($dependants) - 1]['sha_status'] = $result['status'] ?? 'pending';
                $snapshot->dependants = $dependants;
                $snapshot->save();
            } catch (\Exception $e) {
                // Log error but don't fail the request
                Log::warning('Failed to submit dependant to SHA', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Dependant added successfully',
            'dependant' => end($dependants),
        ]);
    }
}