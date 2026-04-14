<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\DB;

class AuthService
{/**
     * Handle initial registration for both Citizens and Drivers.
     */
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // 1. Create the base User
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'] ?? 'citizen',
            ]);

            // 2. If registering as a driver, complete the onboarding
            if ($user->role === 'driver') {
                $this->createDriverOnboarding($user, $data);
            }

            return [
                'user' => $user->load('driverProfile.vehicle'), 
                'token' => $user->createToken('api-token')->plainTextToken,
            ];
        });
    }

    /**
     * Centralized logic to attach a Driver Profile and Vehicle.
     * Shared by AuthService (New Users) and DriverController (Upgrading Users).
     */
    public function createDriverOnboarding(User $user, array $data): void
    {
        // Create or update the profile
        $profile = $user->driverProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'license_number' => $data['license_number'],
                'license_class'  => $data['license_class'] ?? 'B',
                'license_expiry' => $data['license_expiry'] ?? null,
                'status'         => 'approved',
                'verified_at'    => now(),
            ]
        );

        // Link the vehicle if data is provided
        if (isset($data['vehicle'])) {
            $profile->vehicle()->updateOrCreate(
                ['driver_profile_id' => $profile->id],
                $data['vehicle']
            );
        }

        // Ensure user role is updated if they were previously a citizen
        if ($user->role !== 'driver') {
            $user->update(['role' => 'driver']);
        }
    }
public function login(string $email, string $password): array
{
    $user = User::where('email', $email)->first();

    // If user doesn't exist OR password doesn't match
    if (! $user || ! Hash::check($password, $user->password)) {
        throw new \Illuminate\Auth\AuthenticationException('Invalid email or password.');
    }

    return [
        'user' => $user->load('driverProfile.vehicle'),
        'token' => $user->createToken('api-token')->plainTextToken,
    ];
}

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
            $token->delete();
        }
    }

    public function updateProfile(User $user, array $data): User
    {
        $user->fill($data);
        $user->save();

        return $user;
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw new AuthenticationException('Current password does not match our records.');
        }

        $user->password = Hash::make($newPassword);
        $user->save();
    }
}
