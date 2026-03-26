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
}
