<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class GrokService
{
    protected ?string $apiKey;
    protected string $baseUrl;
    protected int $maxRetries;
    protected int $timeout;

    public function __construct()
    {
        $this->apiKey = config('services.grok.api_key', '');
        $this->baseUrl = config('services.grok.base_url', 'https://api.x.ai/v1');
        $this->maxRetries = config('services.grok.max_retries', 3);
        $this->timeout = config('services.grok.timeout', 30);
    }

    /**
     * Generate a response from Grok AI
     */
    public function generateResponse(string $prompt, array $options = []): array
    {
        $cacheKey = 'grok_response_' . md5($prompt . json_encode($options));

        // Check cache first
        if (config('services.grok.cache_responses', true)) {
            $cached = Cache::get($cacheKey);
            if ($cached) {
                return $cached;
            }
        }

        $payload = array_merge([
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'model' => $options['model'] ?? 'grok-1',
            'stream' => false,
            'temperature' => $options['temperature'] ?? 0.7,
            'max_tokens' => $options['max_tokens'] ?? 1000,
        ], $options);

        $attempts = 0;
        $lastException = null;

        while ($attempts < $this->maxRetries) {
            try {
                $response = Http::timeout($this->timeout)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $this->apiKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->post($this->baseUrl . '/chat/completions', $payload);

                if ($response->successful()) {
                    $data = $response->json();

                    // Cache the response
                    if (config('services.grok.cache_responses', true)) {
                        Cache::put($cacheKey, $data, now()->addMinutes(config('services.grok.cache_ttl', 60)));
                    }

                    return $data;
                } else {
                    Log::warning('Grok API error', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                        'attempt' => $attempts + 1,
                    ]);

                    if ($response->status() === 429) {
                        // Rate limited, wait before retry
                        sleep(pow(2, $attempts));
                    }
                }

            } catch (\Exception $e) {
                $lastException = $e;
                Log::error('Grok API request failed', [
                    'error' => $e->getMessage(),
                    'attempt' => $attempts + 1,
                ]);
            }

            $attempts++;
            if ($attempts < $this->maxRetries) {
                sleep(1); // Wait 1 second before retry
            }
        }

        throw new \RuntimeException('Grok API request failed after ' . $this->maxRetries . ' attempts: ' . ($lastException?->getMessage() ?? 'Unknown error'));
    }

    /**
     * Get a simple text response from Grok
     */
    public function ask(string $question, array $options = []): string
    {
        $response = $this->generateResponse($question, $options);

        return $response['choices'][0]['message']['content'] ?? '';
    }

    /**
     * Analyze ride data and provide insights
     */
    public function analyzeRideData(array $rideData): array
    {
        $prompt = "Analyze the following ride data and provide insights about patterns, optimization opportunities, and recommendations:\n\n" . json_encode($rideData, JSON_PRETTY_PRINT);

        $response = $this->ask($prompt, [
            'temperature' => 0.3,
            'max_tokens' => 1500,
        ]);

        return [
            'analysis' => $response,
            'ride_data' => $rideData,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Generate smart pricing suggestions
     */
    public function suggestPricing(array $rideDetails): array
    {
        $prompt = "Based on the following ride details, suggest optimal pricing considering distance, time, demand, and market conditions:\n\n" . json_encode($rideDetails, JSON_PRETTY_PRINT) . "\n\nProvide pricing suggestions with reasoning.";

        $response = $this->ask($prompt, [
            'temperature' => 0.2,
            'max_tokens' => 800,
        ]);

        return [
            'suggestions' => $response,
            'ride_details' => $rideDetails,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Generate customer support responses
     */
    public function generateSupportResponse(string $customerQuery, array $context = []): string
    {
        $contextStr = !empty($context) ? "\n\nContext: " . json_encode($context) : '';

        $prompt = "You are a helpful customer support agent for UrbanLink, a ride-sharing and government services platform. Respond professionally and helpfully to this customer query:\n\nQuery: {$customerQuery}{$contextStr}\n\nProvide a clear, concise, and helpful response.";

        return $this->ask($prompt, [
            'temperature' => 0.7,
            'max_tokens' => 500,
        ]);
    }

    /**
     * Analyze driver performance
     */
    public function analyzeDriverPerformance(array $driverData): array
    {
        $prompt = "Analyze this driver's performance data and provide insights, recommendations for improvement, and performance metrics:\n\n" . json_encode($driverData, JSON_PRETTY_PRINT);

        $response = $this->ask($prompt, [
            'temperature' => 0.3,
            'max_tokens' => 1200,
        ]);

        return [
            'analysis' => $response,
            'driver_data' => $driverData,
            'analyzed_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Predict demand patterns
     */
    public function predictDemand(array $historicalData): array
    {
        $prompt = "Based on this historical ride data, predict demand patterns for the next 24 hours and provide recommendations for driver allocation:\n\n" . json_encode($historicalData, JSON_PRETTY_PRINT);

        $response = $this->ask($prompt, [
            'temperature' => 0.2,
            'max_tokens' => 1000,
        ]);

        return [
            'predictions' => $response,
            'historical_data' => $historicalData,
            'predicted_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Check if Grok service is available
     */
    public function isAvailable(): bool
    {
        try {
            $response = $this->ask('Hello', ['max_tokens' => 10]);
            return !empty($response);
        } catch (\Exception $e) {
            Log::error('Grok service availability check failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get service health status
     */
    public function getHealthStatus(): array
    {
        return [
            'service' => 'Grok AI',
            'available' => $this->isAvailable(),
            'base_url' => $this->baseUrl,
            'max_retries' => $this->maxRetries,
            'timeout' => $this->timeout,
            'cache_enabled' => config('services.grok.cache_responses', true),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}