<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ride extends Model
{
    use HasFactory;

    protected $fillable = [
        'ride_reference',
        'passenger_id',
        'driver_profile_id',
        'status',
        'pickup_lat',
        'payment_status',  // Tracks: unpaid, pending, paid
        'completed_at',
        'pickup_lng',
        'pickup_address',
        'dropoff_lat',
        'dropoff_lng',
        'dropoff_address',
        'vehicle_type',
        'payment_method',
        'estimated_fare',
        'final_fare',
        'distance_km',
        'duration_minutes',
        'passenger_rating',
        'driver_rating',
    ];

    protected $casts = [
        'pickup_lat' => 'decimal:7',
        'pickup_lng' => 'decimal:7',
        'dropoff_lat' => 'decimal:7',
        'dropoff_lng' => 'decimal:7',
        'estimated_fare' => 'decimal:2',
        'final_fare' => 'decimal:2',
        'distance_km' => 'decimal:2',
    ];

    public function passenger()
{
    // Links to the 'users' table via 'passenger_id'
    return $this->belongsTo(User::class, 'passenger_id');
}

   public function driverProfile()
{
    // Links to the 'driver_profiles' table via 'driver_profile_id'
    return $this->belongsTo(DriverProfile::class, 'driver_profile_id');
}
    public function payment()
    {
        return $this->morphOne(Payment::class, 'payable');
    }
    /**
 * Check if the ride is physically done and financially cleared.
 */
public function isFullyCleared(): bool
{
    return $this->status === 'completed' && $this->payment_status === 'paid';
}
}

