<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ComplianceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ComplianceController extends Controller
{
    public function __construct(protected ComplianceService $service)
    {
    }

    public function snapshot(Request $request): JsonResponse
    {
        $snapshot = $this->service->getSnapshot($request->user());

        return response()->json($snapshot);
    }

    public function refresh(Request $request): JsonResponse
    {
        $snapshot = $this->service->refresh($request->user());

        return response()->json($snapshot);
    }

    public function kra(Request $request): JsonResponse
    {
        $snapshot = $this->service->getSnapshot($request->user());

        return response()->json([ 'kra' => [
            'status' => $snapshot->kra_status ?? 'unknown',
            'pin' => $snapshot->kra_pin,
            'tcc_status' => $snapshot->kra_tcc_status,
            'tcc_expiry' => $snapshot->kra_tcc_expiry,
            'last_filing_date' => $snapshot->kra_last_filing_date,
        ]]);
    }

    public function ntsa(Request $request): JsonResponse
    {
        $snapshot = $this->service->getSnapshot($request->user());

        return response()->json([ 'ntsa' => [
            'license_status' => $snapshot->ntsa_license_status ?? 'unknown',
            'license_expiry' => $snapshot->ntsa_license_expiry,
            'pending_fines' => $snapshot->ntsa_pending_fines,
            'fine_amount' => $snapshot->ntsa_fine_amount,
        ]]);
    }

    public function nssf(Request $request): JsonResponse
    {
        $snapshot = $this->service->getSnapshot($request->user());

        return response()->json([ 'nssf' => [
            'status' => $snapshot->nssf_status ?? 'unknown',
            'member_number' => $snapshot->nssf_member_number,
            'balance' => $snapshot->nssf_balance,
            'last_contribution_date' => $snapshot->nssf_last_contribution_date,
        ]]);
    }

    public function sha(Request $request): JsonResponse
    {
        $snapshot = $this->service->getSnapshot($request->user());

        return response()->json([ 'sha' => [
            'status' => $snapshot->sha_status ?? 'unknown',
            'member_id' => $snapshot->sha_member_id,
            'next_due_date' => $snapshot->sha_next_due_date,
            'premium_paid' => $snapshot->sha_premium_paid,
        ]]);
    }

    public function addDependant(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'relationship' => 'required|string|max:50',
            'national_id' => 'nullable|string|max:20',
        ]);

        // This should call the SHA service to add a dependant. Placeholder.

        return response()->json(['message' => 'Dependant added (stub)']);
    }
}
