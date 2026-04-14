<?php

namespace App\Services\Government;

use App\Models\Application;

class NssfService extends GovernmentService
{
    public function submitApplication(Application $application): array
    {
        if (! $this->enabled() || ! $this->baseUrl()) {
            return $this->stubResponse();
        }

        // TODO: Implement real NSSF API integration using the configured base URL and token.
        // Example:
        // $response = $this->client()->post('/v1/contributions', [...]);
        // $response->throw();
        // return $response->json();

        return $this->stubResponse();
    }

    public function checkStatus(array $data = []): array
    {
        if (!$this->enabled() || !$this->baseUrl()) {
            return $this->stubResponse([
                'status' => 'unavailable',
                'notes' => 'NSSF API not configured; returning stubbed state.',
            ]);
        }

        try {
            $response = $this->client()->post('/api/v1/member/status', [
                'national_id' => $data['national_id'] ?? null,
            ]);

            $result = $response->json();

            return [
                'reference' => 'NSSF-' . uniqid(),
                'status' => $result['membership_status'] ?? 'unknown',
                'member_number' => $result['member_number'] ?? null,
                'balance' => $result['balance'] ?? 0,
                'last_contribution_date' => $result['last_contribution_date'] ?? null,
                'notes' => $result['message'] ?? 'NSSF status checked successfully',
            ];
        } catch (\Exception $e) {
            return $this->stubResponse([
                'status' => 'error',
                'notes' => 'Failed to check NSSF status: ' . $e->getMessage(),
            ]);
        }
    }
}
