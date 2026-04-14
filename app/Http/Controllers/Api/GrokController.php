<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GrokService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GrokController extends Controller
{
    public function __construct(protected GrokService $grokService)
    {
    }

    /**
     * Get Grok service health status
     */
    public function health(): JsonResponse
    {
        try {
            $status = $this->grokService->getHealthStatus();

            return response()->json([
                'success' => true,
                'data' => $status,
            ]);
        } catch (\Exception $e) {
            Log::error('Grok health check failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'error' => 'Grok service unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    /**
     * Analyze ride data
     */
    public function analyzeRide(Request $request): JsonResponse
    {
        $request->validate([
            'ride_data' => 'required|array',
        ]);

        try {
            $analysis = $this->grokService->analyzeRideData($request->ride_data);

            return response()->json([
                'success' => true,
                'data' => $analysis,
            ]);
        } catch (\Exception $e) {
            Log::error('Ride analysis failed', [
                'error' => $e->getMessage(),
                'ride_data' => $request->ride_data,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Analysis failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate pricing suggestions
     */
    public function suggestPricing(Request $request): JsonResponse
    {
        $request->validate([
            'ride_details' => 'required|array',
        ]);

        try {
            $suggestions = $this->grokService->suggestPricing($request->ride_details);

            return response()->json([
                'success' => true,
                'data' => $suggestions,
            ]);
        } catch (\Exception $e) {
            Log::error('Pricing suggestions failed', [
                'error' => $e->getMessage(),
                'ride_details' => $request->ride_details,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Pricing suggestions failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate customer support response
     */
    public function generateSupportResponse(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string',
            'context' => 'nullable|array',
        ]);

        try {
            $response = $this->grokService->generateSupportResponse(
                $request->query(),
                $request->context ?? []
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'response' => $response,
                    'query' => $request->query,
                    'context' => $request->context,
                    'generated_at' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Support response generation failed', [
                'error' => $e->getMessage(),
                'query' => $request->query,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Support response generation failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Analyze driver performance
     */
    public function analyzeDriver(Request $request): JsonResponse
    {
        $request->validate([
            'driver_data' => 'required|array',
        ]);

        try {
            $analysis = $this->grokService->analyzeDriverPerformance($request->driver_data);

            return response()->json([
                'success' => true,
                'data' => $analysis,
            ]);
        } catch (\Exception $e) {
            Log::error('Driver analysis failed', [
                'error' => $e->getMessage(),
                'driver_data' => $request->driver_data,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Driver analysis failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Predict demand patterns
     */
    public function predictDemand(Request $request): JsonResponse
    {
        $request->validate([
            'historical_data' => 'required|array',
        ]);

        try {
            $predictions = $this->grokService->predictDemand($request->historical_data);

            return response()->json([
                'success' => true,
                'data' => $predictions,
            ]);
        } catch (\Exception $e) {
            Log::error('Demand prediction failed', [
                'error' => $e->getMessage(),
                'historical_data' => $request->historical_data,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Demand prediction failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * General chat endpoint
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'prompt' => 'required|string',
            'options' => 'nullable|array',
        ]);

        try {
            $response = $this->grokService->generateResponse(
                $request->prompt,
                $request->options ?? []
            );

            return response()->json([
                'success' => true,
                'data' => $response,
            ]);
        } catch (\Exception $e) {
            Log::error('Grok chat failed', [
                'error' => $e->getMessage(),
                'prompt' => $request->prompt,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Chat request failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a simple text response
     */
    public function ask(Request $request): JsonResponse
    {
        $request->validate([
            'question' => 'required|string',
            'options' => 'nullable|array',
        ]);

        try {
            $answer = $this->grokService->ask(
                $request->question,
                $request->options ?? []
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'answer' => $answer,
                    'question' => $request->question,
                    'asked_at' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Grok ask failed', [
                'error' => $e->getMessage(),
                'question' => $request->question,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Question failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}