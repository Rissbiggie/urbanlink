<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\DriverProfile;
use App\Models\Ride;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\AuthService;

class DriverController extends Controller
{
    public function __construct(protected AuthService $authService)
    {
    }

    /**
     * Convert an existing Citizen into a Driver.
     */
    public function register(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->driverProfile) {
            return response()->json(['status' => 'error', 'message' => 'Driver profile already exists.'], 409);
        }

        $data = $request->validate([
            'license_number' => 'required|string|unique:driver_profiles,license_number',
            'license_class'  => 'required|string',
            'license_expiry' => 'required|date|after:today',
            'vehicle'        => 'required|array',
            'vehicle.make'   => 'required|string',
            'vehicle.model'  => 'required|string',
            'vehicle.plate_number' => 'required|string|unique:vehicles,plate_number',
            'vehicle.vehicle_type' => 'required|string',
            'vehicle.year'         => 'required|integer',
        ]);

        // We use the shared logic from AuthService to avoid repeating code
        $this->authService->createDriverOnboarding($user, $data);

        return response()->json([
            'status' => 'success',
            'message' => 'Citizen successfully upgraded to Driver.',
            'data' => $user->load('driverProfile.vehicle')
        ]);
    }

 public function index(Request $request): JsonResponse
{
    // 1. We use whereHas to filter based on the 'vehicles' table
    $drivers = DriverProfile::with(['user:id,name', 'vehicle'])
        ->where('status', 'approved') // Only show verified drivers
        ->where('is_available', true) // Only show those currently online
        ->when($request->filled('vehicle_type'), function ($query) use ($request) {
            // Filter by vehicle type in the RELATED table
            $query->whereHas('vehicle', function ($q) use ($request) {
                $q->where('vehicle_type', $request->vehicle_type);
            });
        })
        ->latest()
        ->get();

    return response()->json($drivers);
}
    /**
     * Dedicated Reject Function
     * Reverts the user back to 'citizen' and records why they were rejected.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $profile = DriverProfile::with('user')->findOrFail($id);

        $data = $request->validate([
            'rejection_reason' => 'required|string|min:10',
        ]);

        return DB::transaction(function () use ($profile, $data) {
            // Update profile status
            $profile->update([
                'status' => 'rejected',
                'rejection_reason' => $data['rejection_reason'],
                'verified_at' => null,
            ]);

            // Revert role to 'citizen' (or your default user role)
            if ($profile->user) {
                $profile->user->update(['role' => 'citizen']);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Driver rejected and role reverted to citizen.'
            ]);
        });
    }

    /**
     * PHASE 1 - STEP 4: View Profile
     */
    public function profile(Request $request): JsonResponse
    {
        $profile = DriverProfile::with(['user', 'vehicle'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        return response()->json(['status' => 'success', 'data' => $profile]);
    }

    /**
     * Driver Online/Offline Toggle
     * Only allowed if the profile is 'approved'.
     */
    public function toggleAvailability(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (!$profile || $profile->status !== 'approved') {
            return response()->json([
                'message' => 'Your profile must be approved by an admin to go online.',
            ], 403);
        }

        $profile->is_available = !$profile->is_available;
        $profile->save();

        return response()->json(['is_available' => $profile->is_available]);
    }

    /**
     * Update Driver GPS Location
     */
    public function updateLocation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $profile = $request->user()->driverProfile;
        
        if (!$profile) return response()->json(['message' => 'Unauthorized'], 401);

        $profile->update([
            'current_lat' => $data['lat'],
            'current_lng' => $data['lng']
        ]);

        return response()->json(['status' => 'location updated']);
    }


   

    // nside RideController.php or a dedicated DriverController

public function driverRides(Request $request): JsonResponse
{
    $user = $request->user();

    // Ensure the user has a driver profile
    if (!$user->driverProfile) {
        return response()->json(['message' => 'Not a registered driver'], 403);
    }

    // Query rides matching the driver_profile_id
    $rides = Ride::where('driver_profile_id', $user->driverProfile->id)
        ->when($request->filled('status'), function($q) use ($request) {
            $q->where('status', $request->status);
        })
        ->with('passenger') // Eager load passenger info for the dashboard
        ->latest()
        ->paginate(15);

    return response()->json($rides);
}

    /**
     * Ride Lifecycle: Accept
     */
  public function acceptRide(Request $request, int $id): JsonResponse
{
    $profile = $request->user()->driverProfile;
    
    // Use find() instead of findOrFail() to handle the 'empty' case manually
    $ride = Ride::where('status', 'pending')->find($id);

    if (!$ride) {
        return response()->json([
            'status' => 'error',
            'message' => 'Ride not found or already accepted by another driver.'
        ], 404);
    }

    $ride->update([
        'status' => 'accepted',
        'driver_profile_id' => $profile->id
    ]);

    return response()->json(['status' => 'success', 'message' => 'Ride accepted', 'ride' => $ride]);
}

    /**
     * Ride Lifecycle: Start
     */
   public function startRide(Request $request, int $id): JsonResponse
{
    $profile = $request->user()->driverProfile;
    
    // Check if the ride belongs to THIS driver and is in the correct state
    $ride = Ride::where('driver_profile_id', $profile->id)
                ->where('status', 'accepted')
                ->find($id);

    if (!$ride) {
        return response()->json([
            'status' => 'error',
            'message' => 'Active ride not found for this driver.'
        ], 404);
    }

    $ride->update([
        'status' => 'in_progress',
        'started_at' => now()
    ]);

    return response()->json(['status' => 'success', 'message' => 'Ride started', 'ride' => $ride]);
}

    /**
     * Ride Lifecycle: Complete
     */
public function completeRide(Request $request, int $id): JsonResponse
{
    $profile = $request->user()->driverProfile;
    $ride = $profile->rides()->where('status', 'in_progress')->find($id);

    if (!$ride) {
        return response()->json(['status' => 'error', 'message' => 'Active ride not found.'], 404);
    }

    return DB::transaction(function () use ($ride, $profile) {
        // 1. Physically complete the ride
        $ride->update([
            'status' => 'completed',
            'completed_at' => now(),
            // Ensure payment status remains 'unpaid' until STK is successful
        ]);

        // 2. Make the driver available again immediately
        $profile->update(['is_available' => true]);

        return response()->json([
            'status' => 'success',
            'message' => 'Ride finished. Driver is now available for new requests.',
            'payment_status' => $ride->payment_status,
            'ride' => $ride
        ]);
    });
}

    /**
     * Earnings Summary
     */
   public function earnings(Request $request): JsonResponse
{
    $profile = $request->user()->driverProfile;

    if (!$profile) return response()->json(['message' => 'Profile not found'], 404);

    $stats = [
        'today' => (float) $profile->rides()
            ->whereDate('created_at', today())
            ->where('status', 'completed')
            ->sum('final_fare'),
        'month' => (float) $profile->rides()
            ->whereMonth('created_at', now()->month)
            ->where('status', 'completed')
            ->sum('final_fare'),
    ];

    return response()->json($stats);
}
/**
     * Get Map Data (Nearby Rides)
     * This is what the driver sees on their map to find work.
     */
    public function mapData(Request $request): JsonResponse
{
    $user = $request->user();
    
    // 1. Check if the driver profile actually exists
    $profile = $user->driverProfile;

    if (!$profile) {
        return response()->json([
            'status' => 'error',
            'message' => 'Driver profile not found. Please register as a driver first.'
        ], 403); // 403 is better than 500!
    }

    // 2. Wrap in a try-catch to catch database issues
    try {
        $availableRides = Ride::where('status', 'pending')
            ->select(['id', 'pickup_address', 'dropoff_address', 'pickup_lat', 'pickup_lng', 'estimated_fare'])
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'available_rides' => $availableRides,
                'driver_status' => $profile->is_available
            ]
        ]);
    } catch (\Exception $e) {
        // This will tell you exactly what is wrong in your logs
        return response()->json([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * List Driver's Ride History
     */
   public function rides(Request $request): JsonResponse
{
    $user = $request->user();

    // 1. Safety Check: Does the user even have a driver profile?
    $profile = $user->driverProfile;

    if (!$profile) {
        return response()->json([
            'status' => 'error',
            'message' => 'Driver profile not found.'
        ], 404);
    }

    try {
        // 2. Query with Error Handling
        // Note: Make sure 'user' relationship exists on the Ride model
       $rides = $profile->rides()
        // We use 'passenger' here because that's what you named the function in the model!
        ->with(['passenger:id,name']) 
        ->latest()
        ->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $rides
        ]);

    } catch (\Exception $e) {
        // 3. Catch database errors (like missing columns or undefined relationships)
        return response()->json([
            'status' => 'error',
            'message' => 'Could not retrieve rides: ' . $e->getMessage()
        ], 500);
    }
}
    /**
     * Get Driver Vehicle Details
     * Fetches the vehicle associated with the driver's profile.
     */
    public function vehicles(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (!$profile) {
            return response()->json([
                'status' => 'error',
                'message' => 'Driver profile not found.'
            ], 404);
        }

        // Load the vehicle relationship
        $vehicle = $profile->vehicle;

        if (!$vehicle) {
            return response()->json([
                'status' => 'error',
                'message' => 'No vehicle registered for this profile.'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $vehicle
        ]);
    }

    /**
     * Get Driver Payouts
     * Fetches the history of payments made to the driver.
     */
    public function payouts(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (!$profile) {
            return response()->json([
                'status' => 'error',
                'message' => 'Driver profile not found.'
            ], 404);
        }

        // Assuming you have a Payout model/table. 
        // If not, we return an empty array to prevent 500 errors.
        $payouts = []; 
        
        // If you have a payouts relationship, use:
        // $payouts = $profile->payouts()->latest()->get();

        return response()->json([
            'status' => 'success',
            'data' => $payouts
        ]);
    }
}