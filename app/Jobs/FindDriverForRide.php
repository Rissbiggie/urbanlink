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

        // Simple geospatial match using Haversine formula
        $driver = DriverProfile::query()
            ->where('is_available', true)
            ->where('status', 'active')
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->select(['*'])
            ->selectRaw(
                '(6371 * acos(cos(radians(?)) * cos(radians(current_lat)) * cos(radians(current_lng) - radians(?)) + sin(radians(?)) * sin(radians(current_lat)))) as distance',
                [$pickupLat, $pickupLng, $pickupLat]
            )
            ->having('distance', '<=', $radiusKm)
            ->orderBy('distance')
            ->first();

        if (! $driver) {
            // No available driver found; retry a few times before giving up.
            if ($this->attempts() < 5) {
                $this->release(30);
            }

            return;
        }

        $this->ride->driver_profile_id = $driver->id;
        $this->ride->save();

        // Notify the driver about the new ride request.
        Notification::create([
            'user_id' => $driver->user_id,
            'type' => 'ride_request',
            'title' => 'New ride request',
            'message' => "You have a new ride request ({$this->ride->ride_reference}).",
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
            ],
        ]);

        event(new \App\Events\RideRequested($driver->user_id, $this->ride));
    }
}
