<?php

namespace App\Services\Government;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

abstract class GovernmentService
{
    abstract public function submitApplication(\App\Models\Application $application): array;

    protected function serviceKey(): string
    {
        return strtolower(str_replace('Service', '', class_basename($this)));
    }

    protected function config(string $key, $default = null)
    {
        return config("services.government.{$this->serviceKey()}.{$key}", $default);
    }

    protected function enabled(): bool
    {
        return (bool) config('services.government.enabled', false) && (bool) $this->config('enabled', false);
    }

    protected function baseUrl(): ?string
    {
        return $this->config('base_url');
    }

    protected function token(): ?string
    {
        return $this->config('token');
    }

    protected function client(): PendingRequest
    {
        $client = Http::acceptJson();

        if ($token = $this->token()) {
            $client = $client->withToken($token);
        }

        if ($base = $this->baseUrl()) {
            $client = $client->baseUrl(rtrim($base, '/'));
        }

        return $client;
    }

    /**
     * A generic status check. Override in subclasses to implement real checks.
     */
    public function checkStatus(array $data = []): array
    {
        if (! $this->enabled() || ! $this->baseUrl()) {
            return $this->stubResponse([
                'status' => 'unavailable',
                'notes' => 'Government API not configured; returning stubbed state.',
            ]);
        }

        return $this->stubResponse([
            'status' => 'unknown',
            'notes' => 'Status check not implemented for this service.',
        ]);
    }

    protected function stubResponse(array $overrides = []): array
    {
        return array_merge([
            'reference' => strtoupper(class_basename($this)).'-'.uniqid(),
            'status' => 'submitted',
            'notes' => 'Stubbed '.class_basename($this).' submission',
        ], $overrides);
    }
}
