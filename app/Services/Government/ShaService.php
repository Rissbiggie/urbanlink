<?php

namespace App\Services\Government;

use App\Models\Application;

class ShaService extends GovernmentService
{
    public function submitApplication(Application $application): array
    {
        if (! $this->enabled() || ! $this->baseUrl()) {
            return $this->stubResponse();
        }

        // TODO: Implement real SHA API integration using the configured base URL and token.
        // Example:
        // $response = $this->client()->post('/v1/memberships', [...]);
        // $response->throw();
        // return $response->json();

        return $this->stubResponse();
    }
    public function checkStatus(array $data = []): array
    {
        if (!$this->enabled() || !$this->baseUrl()) {
            return $this->stubResponse([
                'status' => 'unavailable',
                'notes' => 'SHA API not configured; returning stubbed state.',
            ]);
        }

        try {
            $response = $this->client()->post('/api/v1/member/status', [
                'national_id' => $data['national_id'] ?? null,
            ]);

            $result = $response->json();

            return [
                'reference' => 'SHA-' . uniqid(),
                'status' => $result['membership_status'] ?? 'unknown',
                'member_id' => $result['member_id'] ?? null,
                'next_due_date' => $result['next_due_date'] ?? null,
                'premium_paid' => $result['premium_paid'] ?? false,
                'notes' => $result['message'] ?? 'SHA status checked successfully',
            ];
        } catch (\Exception $e) {
            return $this->stubResponse([
                'status' => 'error',
                'notes' => 'Failed to check SHA status: ' . $e->getMessage(),
            ]);
        }
    }

    public function submitDependant($user, array $data): array
    {
        if (!$this->enabled() || !$this->baseUrl()) {
            return $this->stubResponse([
                'status' => 'unavailable',
                'notes' => 'SHA API not configured; returning stubbed state.',
            ]);
        }

        try {
            $response = $this->client()->post('/api/v1/dependants', [
                'member_national_id' => $user->national_id,
                'dependant_name' => $data['name'],
                'relationship' => $data['relationship'],
                'dependant_national_id' => $data['national_id'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
            ]);

            return $response->json();
        } catch (\Exception $e) {
            return $this->stubResponse([
                'status' => 'error',
                'notes' => 'Failed to submit dependant to SHA: ' . $e->getMessage(),
            ]);
        }
    }}
