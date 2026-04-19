<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverProfile;
use App\Services\RideService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Ride;
use Illuminate\Support\Facades\Log;
class RideController extends Controller
{
    public function __construct(protected RideService $rideService, protected AuditService $auditService)
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
        // ADD THIS:
        'driver_profile_id' => 'nullable|exists:driver_profiles,id',
    ]);

    $ride = $this->rideService->createRide($request->user(), $data);

    return response()->json($ride);
}
public function index(Request $request): JsonResponse
{
    // Eager load the driverProfile
    $query = $request->user()->rides()->with(['driverProfile.user', 'driverProfile.vehicle']);

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
    try {
        // 1. Scope the query to the user to prevent 500s from cross-user access
        // 2. Eager load relationships to prevent "Property access on null" in the UI
        $ride = $request->user()->rides()
            ->with([
                'driverProfile.user', 
                'driverProfile.vehicle', 
                'payment'
            ])
            ->find($id);

        // Handle case where ride doesn't exist for this user (404 instead of 500)
        if (!$ride) {
            return response()->json([
                'message' => 'Ride manifest not found in the registry.'
            ], 404);
        }

        // 3. Authorization check
        // Ensure your RidePolicy is correctly registered to avoid 500s here
        $this->authorize('view', $ride);

        return response()->json($ride);

    } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
        return response()->json(['message' => 'Insufficient clearance level.'], 403);
    } catch (\Exception $e) {
        // Catch-all to prevent the default Laravel 500 screen
        Log::error("Ride Detail Retrieval Error: " . $e->getMessage());
        return response()->json(['message' => 'System error during manifest retrieval.'], 500);
    }
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

        // Audit log the cancellation
        $this->auditService->logRideAction($request->user(), 'cancelled', $ride->id, [
            'reason' => $request->input('reason'),
            'previous_status' => $ride->getOriginal('status'),
        ]);

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
    ]);

    $ride = $request->user()->rides()->findOrFail($id);
    $this->authorize('rate', $ride);

    $ride->driver_rating = $data['rating'];
    $ride->save();

    // Audit log the rating
    $this->auditService->logRideAction($request->user(), 'rated', $ride->id, [
        'rating' => $data['rating'],
        'driver_id' => $ride->driver_profile_id,
    ]);

    // Update driver average rating
    if ($ride->driver_profile_id) {
        $average = Ride::where('driver_profile_id', $ride->driver_profile_id)
            ->whereNotNull('driver_rating')
            ->avg('driver_rating') ?? 0;

        $ride->driverProfile->update([
            'average_rating' => round($average, 2),
        ]);
    }

    return response()->json($ride);
}
}