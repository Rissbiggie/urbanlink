<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class MpesaService
{
    protected function config(string $key, $default = null)
    {
        return config('services.mpesa.'.$key, $default);
    }

    public function baseUrl(): string
    {
        return $this->config('sandbox', true)
            ? 'https://sandbox.safaricom.co.ke'
            : 'https://api.safaricom.co.ke';
    }

    public function authToken(): string
    {
        return Cache::remember('mpesa_oauth_token', now()->addMinutes(30), function () {
            $response = Http::withBasicAuth(
                $this->config('consumer_key'),
                $this->config('consumer_secret')
            )
            ->get($this->baseUrl().'/oauth/v1/generate?grant_type=client_credentials');

            $response->throw();

            return $response->json('access_token');
        });
    }

    public function generatePassword(string $timestamp): string
    {
        $shortcode = $this->config('shortcode');
        $passkey = $this->config('passkey');

        return base64_encode($shortcode.$passkey.$timestamp);
    }

    public function stkPush(array $data): array
    {
        $timestamp = now()->format('YmdHis');

        $payload = [
            'BusinessShortCode' => $this->config('shortcode'),
            'Password' => $this->generatePassword($timestamp),
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => $data['amount'],
            'PartyA' => $data['phone'],
            'PartyB' => $this->config('shortcode'),
            'PhoneNumber' => $data['phone'],
            'CallBackURL' => $this->config('callback_url'),
            'AccountReference' => $data['account_reference'] ?? 'UrbanLink',
            'TransactionDesc' => $data['description'] ?? 'UrbanLink payment',
        ];

        $response = Http::withToken($this->authToken())
            ->acceptJson()
            ->post($this->baseUrl().'/mpesa/stkpush/v1/processrequest', $payload);

        $response->throw();

        return $response->json();
    }

    public function stkPushQuery(string $checkoutRequestId): array
    {
        $timestamp = now()->format('YmdHis');

        $payload = [
            'BusinessShortCode' => $this->config('shortcode'),
            'Password' => $this->generatePassword($timestamp),
            'Timestamp' => $timestamp,
            'CheckoutRequestID' => $checkoutRequestId,
        ];

        $response = Http::withToken($this->authToken())
            ->acceptJson()
            ->post($this->baseUrl().'/mpesa/stkpushquery/v1/query', $payload);

        $response->throw();

        return $response->json();
    }
}
