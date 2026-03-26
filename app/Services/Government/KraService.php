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
}
