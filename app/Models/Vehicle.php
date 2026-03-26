<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_profile_id',
        'make',
        'model',
        'color',
        'plate_number',
        'vehicle_type',
        'year',
    ];

    public function driverProfile()
    {
        return $this->belongsTo(DriverProfile::class);
    }
}
