<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    use HasFactory;

    protected $fillable = [
    'user_id',
    'license_number',
    'license_class',
    'license_expiry',
    'status',
    'is_available',
    'verified_at',
    'rejection_reason',
    'current_lat',
    'current_lng',
    'total_rides',
    'average_rating',
];

    protected $casts = [
        'license_expiry' => 'date',
        'is_available' => 'boolean',
        'current_lat' => 'decimal:7',
        'current_lng' => 'decimal:7',
        'average_rating' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rides()
{
    // Ensure the foreign key in the rides table is 'driver_profile_id'
    return $this->hasMany(Ride::class, 'driver_profile_id');
}
public function vehicle()
{
    // Ensure the foreign key in the vehicles table is 'driver_profile_id'
    return $this->hasOne(\App\Models\Vehicle::class, 'driver_profile_id');
}


}
