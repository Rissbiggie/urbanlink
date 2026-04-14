<?php

namespace App\Jobs;

use App\Models\DriverProfile;
use App\Models\Notification;
use App\Models\Ride;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class FindDriverForRide implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Ride $ride)
    {
        $this->onQueue('rides');
    }

    public function handle(): void
    {
        // Only attempt matching if the ride is still pending and hasn't been assigned.
        if ($this->ride->driver_profile_id !== null || $this->ride->status !== 'pending') {
            return;
        }

        $pickupLat = $this->ride->pickup_lat;
        $pickupLng = $this->ride->pickup_lng;
        $radiusKm = config('services.rides.match_radius_km', 10);
        $vehicleType = $this->ride->vehicle_type;

        // Advanced driver matching algorithm
        $drivers = DriverProfile::query()
            ->with(['user', 'vehicle'])
            ->where('is_available', true)
            ->where('status', 'active')
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->whereHas('vehicle', function ($query) use ($vehicleType) {
                $query->where('vehicle_type', $vehicleType);
            })
            ->select(['*'])
            ->selectRaw(
                '(6371 * acos(cos(radians(?)) * cos(radians(current_lat)) * cos(radians(current_lng) - radians(?)) + sin(radians(?)) * sin(radians(current_lat)))) as distance',
                [$pickupLat, $pickupLng, $pickupLat]
            )
            ->having('distance', '<=', $radiusKm)
            ->orderBy('distance')
            ->get();

        if ($drivers->isEmpty()) {
            // No available driver found; retry a few times before giving up.
            if ($this->attempts() < 5) {
                $this->release(30);
            }
            return;
        }

        // Score drivers based on multiple factors
        $scoredDrivers = $drivers->map(function ($driver) {
            $score = 0;

            // Distance score (closer is better)
            $distanceScore = max(0, 100 - ($driver->distance * 10));
            $score += $distanceScore * 0.4; // 40% weight

            // Rating score (higher rating is better)
            $ratingScore = ($driver->average_rating ?? 3.0) * 20; // Convert 1-5 to 20-100
            $score += $ratingScore * 0.3; // 30% weight

            // Completion rate score (higher completion rate is better)
            $totalRides = $driver->total_rides ?? 0;
            $completionRate = $totalRides > 0 ? ($driver->completed_rides ?? 0) / $totalRides : 0;
            $completionScore = $completionRate * 100;
            $score += $completionScore * 0.2; // 20% weight

            // Recency score (drivers who completed rides recently are preferred)
            $lastRideHours = $driver->last_ride_at ? now()->diffInHours($driver->last_ride_at) : 24;
            $recencyScore = max(0, 100 - ($lastRideHours * 4)); // Prefer drivers active within last 24 hours
            $score += $recencyScore * 0.1; // 10% weight

            $driver->match_score = $score;
            return $driver;
        })->sortByDesc('match_score');

        $bestDriver = $scoredDrivers->first();

        $this->ride->driver_profile_id = $bestDriver->id;
        $this->ride->save();

        // Notify the driver about the new ride request.
        Notification::create([
            'user_id' => $bestDriver->user_id,
            'type' => 'ride_request',
            'title' => 'New ride request',
            'message' => "You have a new ride request ({$this->ride->ride_reference}). Match score: " . round($bestDriver->match_score, 1),
            'data' => [
                'ride_id' => $this->ride->id,
                'pickup' => [
                    'address' => $this->ride->pickup_address,
                    'lat' => $this->ride->pickup_lat,
                    'lng' => $this->ride->pickup_lng,
                ],
                'dropoff' => [
                    'address' => $this->ride->dropoff_address,
                    'lat' => $this->ride->dropoff_lat,
                    'lng' => $this->ride->dropoff_lng,
                ],
                'match_score' => round($bestDriver->match_score, 1),
            ],
        ]);

        event(new \App\Events\RideRequested($bestDriver->user_id, $this->ride));
    }
}
