<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RideService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RideController extends Controller
{
    public function __construct(protected RideService $rideService)
    {
    }

    public function quote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'distance_km' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:0',
            'vehicle_type' => 'required|string|in:economy,comfort,xl',
        ]);

        $fare = $this->rideService->calculateFare(
            (float) $data['distance_km'],
            (int) $data['duration_minutes'],
            $data['vehicle_type']
        );

        return response()->json(['fare' => $fare]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pickup_lat' => 'required|numeric',
            'pickup_lng' => 'required|numeric',
            'pickup_address' => 'required|string',
            'dropoff_lat' => 'required|numeric',
            'dropoff_lng' => 'required|numeric',
            'dropoff_address' => 'required|string',
            'vehicle_type' => 'required|string|in:economy,comfort,xl',
            'payment_method' => 'required|string|in:mpesa,cash',
            'distance_km' => 'nullable|numeric|min:0',
            'duration_minutes' => 'nullable|integer|min:0',
        ]);

        $ride = $this->rideService->createRide($request->user(), $data);

        return response()->json($ride);
    }

    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->rides();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->boolean('today')) {
            $query->whereDate('created_at', today());
        }

        $rides = $query->latest()->paginate(15);

        return response()->json($rides);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $ride = $request->user()->rides()->findOrFail($id);
        $this->authorize('view', $ride);

        return response()->json($ride);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $ride = $request->user()->rides()->findOrFail($id);
        $this->authorize('cancel', $ride);

        if (! in_array($ride->status, ['pending', 'accepted'], true)) {
            return response()->json(['message' => 'Ride cannot be cancelled'], 422);
        }

        $ride->status = 'cancelled';
        $ride->save();

        if ($ride->driver_profile_id) {
            \App\Models\Notification::create([
                'user_id' => $ride->driver_profile->user_id,
                'type' => 'ride_cancelled',
                'title' => 'Ride Cancelled',
                'message' => "Ride ({$ride->ride_reference}) was cancelled by the passenger.",
                'data' => ['ride_id' => $ride->id],
            ]);
        }

        return response()->json(['message' => 'Ride cancelled']);
    }

    public function rate(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $ride = $request->user()->rides()->where('status', 'completed')->findOrFail($id);
        $this->authorize('rate', $ride);

        $ride->passenger_rating = $data['rating'];
        $ride->save();

        return response()->json(['message' => 'Ride rated']);
    }
}
