<?php

namespace App\Services;

use App\Jobs\FindDriverForRide;
use App\Models\Ride;
use App\Models\User;

class RideService
{
    public function createRide(User $passenger, array $data): Ride
    {
        $distanceKm = $data['distance_km'] ?? null;
        $durationMinutes = $data['duration_minutes'] ?? null;

        $estimatedFare = $this->calculateFare(
            $distanceKm ?? 0,
            $durationMinutes ?? 0,
            $data['vehicle_type']
        );

        $ride = Ride::create([
            'ride_reference' => $this->generateReference(),
            'passenger_id' => $passenger->id,
            'status' => 'pending',
            'pickup_lat' => $data['pickup_lat'],
            'pickup_lng' => $data['pickup_lng'],
            'pickup_address' => $data['pickup_address'],
            'dropoff_lat' => $data['dropoff_lat'],
            'dropoff_lng' => $data['dropoff_lng'],
            'dropoff_address' => $data['dropoff_address'],
            'vehicle_type' => $data['vehicle_type'],
            'payment_method' => $data['payment_method'],
            'estimated_fare' => $estimatedFare,
            'distance_km' => $distanceKm,
            'duration_minutes' => $durationMinutes,
        ]);

        FindDriverForRide::dispatch($ride);

        return $ride;
    }

    public function calculateFare(float $distanceKm, int $durationMin, string $vehicleType): float
    {
        $rates = [
            'economy' => ['base' => 50, 'per_km' => 25, 'per_min' => 3, 'minimum' => 150],
            'comfort' => ['base' => 80, 'per_km' => 35, 'per_min' => 4, 'minimum' => 220],
            'xl' => ['base' => 100, 'per_km' => 45, 'per_min' => 5, 'minimum' => 300],
        ];

        $type = $vehicleType;
        $rate = $rates[$type] ?? $rates['economy'];

        $fare = $rate['base'] + ($distanceKm * $rate['per_km']) + ($durationMin * $rate['per_min']);

        return max($fare, $rate['minimum']);
    }

    protected function generateReference(): string
    {
        return 'RD-'.strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
    }
}
