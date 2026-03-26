<?php

namespace App\Policies;

use App\Models\Ride;
use App\Models\User;

class RidePolicy
{
    public function view(User $user, Ride $ride): bool
    {
        return $ride->passenger_id === $user->id || ($user->driverProfile && $ride->driver_profile_id === $user->driverProfile->id);
    }

    public function cancel(User $user, Ride $ride): bool
    {
        return $ride->passenger_id === $user->id && in_array($ride->status, ['pending', 'accepted'], true);
    }

    public function rate(User $user, Ride $ride): bool
    {
        return $ride->passenger_id === $user->id && $ride->status === 'completed';
    }
}
