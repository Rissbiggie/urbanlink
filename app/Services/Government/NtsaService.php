<?php

namespace App\Services\Government;

use App\Models\Application;

class NtsaService extends GovernmentService
{
    public function submitApplication(Application $application): array
    {
        if (! $this->enabled() || ! $this->baseUrl()) {
            return $this->stubResponse();
        }

        // TODO: Implement real NTSA API integration using the configured base URL and token.
        // Example:
        // $response = $this->client()->post('/v1/licenses', [...]);
        // $response->throw();
        // return $response->json();

        return $this->stubResponse();
    }

    public function checkStatus(array $data = []): array
    {
        if (!$this->enabled() || !$this->baseUrl()) {
            return $this->stubResponse([
                'status' => 'unavailable',
                'notes' => 'NTSA API not configured; returning stubbed state.',
            ]);
        }

        try {
            $response = $this->client()->post('/api/v1/driver/status', [
                'national_id' => $data['national_id'] ?? null,
            ]);

            $result = $response->json();

            return [
                'reference' => 'NTSA-' . uniqid(),
                'status' => $result['license_status'] ?? 'unknown',
                'license_expiry' => $result['license_expiry'] ?? null,
                'pending_fines' => $result['pending_fines'] ?? false,
                'fine_amount' => $result['fine_amount'] ?? 0,
                'notes' => $result['message'] ?? 'NTSA status checked successfully',
            ];
        } catch (\Exception $e) {
            return $this->stubResponse([
                'status' => 'error',
                'notes' => 'Failed to check NTSA status: ' . $e->getMessage(),
            ]);
        }
    }
}
