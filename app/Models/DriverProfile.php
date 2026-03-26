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
        'current_lat',
        'current_lng',
        'average_rating',
        'total_rides',
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

    public function vehicle()
    {
        return $this->hasOne(Vehicle::class);
    }

    public function rides()
    {
        return $this->hasMany(Ride::class);
    }
}
