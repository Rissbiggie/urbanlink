<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'national_id',
        'kra_pin',
        'role',
        'is_verified',
        'password',
        
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_verified' => 'boolean',
    ];

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function rides()
    {
        return $this->hasMany(Ride::class, 'passenger_id');
    }

    public function driverProfile()
    {
        return $this->hasOne(DriverProfile::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function complianceSnapshot()
    {
        return $this->hasOne(ComplianceSnapshot::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function citizenReports()
    {
        return $this->hasMany(CitizenReport::class);
    }
    
}
