<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\DriverProfile;
use App\Models\Ride;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DriverController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'license_number' => 'required|string',
            'license_class' => 'required|string',
            'license_expiry' => 'required|date',
            'vehicle' => 'required|array',
            'vehicle.make' => 'required|string',
            'vehicle.model' => 'required|string',
            'vehicle.color' => 'nullable|string',
            'vehicle.plate_number' => 'required|string',
            'vehicle.vehicle_type' => 'required|string',
            'vehicle.year' => 'required|integer',
        ]);

        $profile = DriverProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'license_number' => $data['license_number'],
                'license_class' => $data['license_class'],
                'license_expiry' => $data['license_expiry'],
                'status' => 'pending_verification',
            ]
        );

        $profile->vehicle()->updateOrCreate([], $data['vehicle']);

        // Ensure the user has driver role after registering as a driver.
        $user = $request->user();
        if ($user->role !== UserRole::DRIVER->value) {
            $user->role = UserRole::DRIVER->value;
            $user->save();
        }

        return response()->json($profile->load('vehicle'));
    }

    public function profile(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile()->with('vehicle')->firstOrFail();

        return response()->json($profile);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'license_number' => 'sometimes|string',
            'license_class' => 'sometimes|string',
            'license_expiry' => 'sometimes|date',
        ]);

        $profile = $request->user()->driverProfile;
        $profile->fill($data);
        $profile->save();

        return response()->json($profile);
    }

    public function toggleAvailability(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;
        $profile->is_available = ! $profile->is_available;
        $profile->save();

        return response()->json(['is_available' => $profile->is_available]);
    }

    public function updateLocation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $profile = $request->user()->driverProfile;
        $profile->current_lat = $data['lat'];
        $profile->current_lng = $data['lng'];
        $profile->save();

        return response()->json($profile);
    }

    public function mapData(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        $drivers = DriverProfile::with('user')
            ->where('is_available', true)
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->get()
            ->map(function ($driver) {
                return [
                    'id' => $driver->id,
                    'user_id' => $driver->user_id,
                    'user_name' => $driver->user->name ?? null,
                    'current_lat' => $driver->current_lat,
                    'current_lng' => $driver->current_lng,
                    'is_available' => $driver->is_available,
                ];
            });

        $activeRides = Ride::with(['driverProfile.user'])
            ->whereIn('status', ['accepted', 'in_progress'])
            ->whereNotNull('driver_profile_id')
            ->get()
            ->map(function ($ride) {
                return [
                    'id' => $ride->id,
                    'ride_reference' => $ride->ride_reference,
                    'status' => $ride->status,
                    'pickup_lat' => $ride->pickup_lat,
                    'pickup_lng' => $ride->pickup_lng,
                    'pickup_address' => $ride->pickup_address,
                    'dropoff_lat' => $ride->dropoff_lat,
                    'dropoff_lng' => $ride->dropoff_lng,
                    'dropoff_address' => $ride->dropoff_address,
                    'driver' => [
                        'id' => $ride->driverProfile?->id,
                        'name' => $ride->driverProfile?->user?->name,
                    ],
                ];
            });

        return response()->json(['drivers' => $drivers, 'active_rides' => $activeRides]);
    }

    public function rides(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;
        $query = $profile->rides();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->boolean('today')) {
            $query->whereDate('created_at', today());
        }

        $rides = $query->latest()->paginate(15);

        return response()->json($rides);
    }

    public function payouts(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        $query = $profile->rides()->where('status', 'completed');

        if ($request->boolean('today')) {
            $query->whereDate('created_at', today());
        }

        $rides = $query->latest()->paginate(20);

        return response()->json($rides);
    }

    public function acceptRide(Request $request, int $id): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        $ride = $profile->rides()->where('status', 'pending')->findOrFail($id);

        $ride->status = 'accepted';
        $ride->save();

        // Notify passenger about acceptance
        \App\Models\Notification::create([
            'user_id' => $ride->passenger_id,
            'type' => 'ride_accepted',
            'title' => 'Ride Accepted',
            'message' => "Your ride ({$ride->ride_reference}) has been accepted.",
            'data' => ['ride_id' => $ride->id, 'driver_id' => $profile->id],
        ]);

        event(new \App\Events\RideStatusUpdated($ride, 'accepted'));

        return response()->json($ride);
    }

    public function startRide(Request $request, int $id): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        $ride = $profile->rides()->where('status', 'accepted')->findOrFail($id);

        $ride->status = 'in_progress';
        $ride->save();

        \App\Models\Notification::create([
            'user_id' => $ride->passenger_id,
            'type' => 'ride_started',
            'title' => 'Ride Started',
            'message' => "Your ride ({$ride->ride_reference}) is now in progress.",
            'data' => ['ride_id' => $ride->id, 'driver_id' => $profile->id],
        ]);

        event(new \App\Events\RideStatusUpdated($ride, 'in_progress'));

        return response()->json($ride);
    }

    public function completeRide(Request $request, int $id): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        $ride = $profile->rides()->where('status', 'in_progress')->findOrFail($id);

        $ride->status = 'completed';
        $ride->save();

        \App\Models\Notification::create([
            'user_id' => $ride->passenger_id,
            'type' => 'ride_completed',
            'title' => 'Ride Completed',
            'message' => "Your ride ({$ride->ride_reference}) is complete.",
            'data' => ['ride_id' => $ride->id, 'driver_id' => $profile->id],
        ]);

        event(new \App\Events\RideStatusUpdated($ride, 'completed'));

        return response()->json($ride);
    }

    public function earnings(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        $today = $profile->rides()->whereDate('created_at', today())->sum('final_fare');
        $week = $profile->rides()->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->sum('final_fare');
        $month = $profile->rides()->whereMonth('created_at', now()->month)->sum('final_fare');

        return response()->json(compact('today', 'week', 'month'));
    }

    public function vehicles(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        return response()->json($profile->vehicle);
    }
}
