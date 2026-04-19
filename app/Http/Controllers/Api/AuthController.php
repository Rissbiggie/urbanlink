<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function __construct(protected AuthService $authService)
    {
    }

    /**
     * Handle user registration (Citizen or Driver).
     */
   public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role'     => 'required|in:citizen,driver,admin,officer',
            
            // Conditional Validation: Required ONLY if role is driver
            'license_number' => 'required_if:role,driver|nullable|string|unique:driver_profiles,license_number',
            'license_class'  => 'required_if:role,driver|string',
            'license_expiry' => 'required_if:role,driver|date',
            
            // Vehicle nested validation
            'vehicle'              => 'required_if:role,driver|array',
            'vehicle.make'         => 'required_with:vehicle|string',
            'vehicle.model'        => 'required_with:vehicle|string',
            'vehicle.plate_number' => 'required_with:vehicle|string|unique:vehicles,plate_number',
            'vehicle.vehicle_type' => 'required_with:vehicle|string',
            'vehicle.year'         => 'required_with:vehicle|integer',
        ]);

        $result = $this->authService->register($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'User registered successfully.',
            'data'    => $result
        ], 201);
    }
    /**
     * Authenticate user and return token.
     */
   public function login(Request $request): JsonResponse
{
    $data = $request->validate([
        'email' => 'required|email',
        'password' => 'required|string',
    ]);

    try {
        $result = $this->authService->login($data['email'], $data['password']);

        return response()->json([
            'status' => 'success',
            'data' => $result
        ]);
    } catch (\Illuminate\Auth\AuthenticationException $e) {
        // Catch the specific auth failure and return a 401
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 401);
    } catch (\Exception $e) {
        // Catch any other unexpected errors (like DB being down)
        return response()->json([
            'status' => 'error',
            'message' => 'An unexpected error occurred.'
        ], 500);
    }
}

    /**
     * Revoke the current user's token.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get the authenticated user's details + Driver profile if applicable.
     */
    public function me(Request $request): JsonResponse
    {
        // We load driverProfile so the frontend knows the status (pending/approved)
        $user = $request->user()->load(['driverProfile.vehicle']);
        
        return response()->json([
            'status' => 'success',
            'data' => $user
        ]);
    }

    /**
     * Update basic profile information.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'national_id' => 'sometimes|string|max:20',
            'kra_pin' => 'sometimes|string|max:20',
        ]);

        $user = $this->authService->updateProfile($request->user(), $data);

        return response()->json([
            'status' => 'success',
            'data' => $user
        ]);
    }

    /**
     * Handle password changes.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $this->authService->changePassword($request->user(), $data['current_password'], $data['password']);

        return response()->json(['message' => 'Password changed successfully']);
    }
}