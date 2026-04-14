<?php

namespace App\Services\Government;

use App\Models\Application;

class KraService extends GovernmentService
{
    public function submitApplication(Application $application): array
    {
        if (! $this->enabled() || ! $this->baseUrl()) {
            return $this->stubResponse();
        }

        // TODO: Implement real KRA API integration using the configured base URL and token.
        // Example:
        // $response = $this->client()->post('/v1/pin/applications', [...]);
        // $response->throw();
        // return $response->json();

        return $this->stubResponse();
    }

    public function checkStatus(array $data = []): array
    {
        if (!$this->enabled() || !$this->baseUrl()) {
            return $this->stubResponse([
                'status' => 'unavailable',
                'notes' => 'KRA API not configured; returning stubbed state.',
            ]);
        }

        try {
            $response = $this->client()->post('/api/v1/taxpayer/status', [
                'kra_pin' => $data['kra_pin'] ?? null,
                'national_id' => $data['national_id'] ?? null,
            ]);

            $result = $response->json();

            return [
                'reference' => 'KRA-' . uniqid(),
                'status' => $result['status'] ?? 'unknown',
                'tax_compliance' => $result['tax_compliance'] ?? 'unknown',
                'last_filing_date' => $result['last_filing_date'] ?? null,
                'notes' => $result['message'] ?? 'KRA status checked successfully',
            ];
        } catch (\Exception $e) {
            return $this->stubResponse([
                'status' => 'error',
                'notes' => 'Failed to check KRA status: ' . $e->getMessage(),
            ]);
        }
    }
}
