<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Ride;
use Exception;
use Illuminate\Support\Facades\Log;
class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        // User statistics
        $totalUsers = User::count();
        $verifiedUsers = User::where('is_verified', true)->count();
        $drivers = User::where('role', 'driver')->count();
        $citizens = User::where('role', 'citizen')->count();
        $admins = User::where('role', 'admin')->count();
        $officers = User::where('role','officer')->count();
        // Ride statistics
        $totalRides = \App\Models\Ride::count();
        $completedRides = \App\Models\Ride::where('status', 'completed')->count();
        $cancelledRides = \App\Models\Ride::where('status', 'cancelled')->count();
        $activeRides = \App\Models\Ride::whereIn('status', ['accepted', 'in_progress'])->count();

        // Revenue statistics
        $totalRevenue = \App\Models\Payment::where('status', 'completed')->sum('amount');
        $monthlyRevenue = \App\Models\Payment::where('status', 'completed')
            ->whereMonth('created_at', now()->month)
            ->sum('amount');
        $todayRevenue = \App\Models\Payment::where('status', 'completed')
            ->whereDate('created_at', today())
            ->sum('amount');

        // Application statistics
        $totalApplications = Application::count();
        $pendingApplications = Application::where('status', 'submitted')->count();
        $approvedApplications = Application::where('status', 'approved')->count();
        $rejectedApplications = Application::where('status', 'rejected')->count();

        // Growth trends (last 30 days vs previous 30 days)
        $last30Days = now()->subDays(30);
        $previous30Days = now()->subDays(60);

        $usersLast30 = User::where('created_at', '>=', $last30Days)->count();
        $usersPrevious30 = User::whereBetween('created_at', [$previous30Days, $last30Days])->count();
        $userGrowth = $usersPrevious30 > 0 ? (($usersLast30 - $usersPrevious30) / $usersPrevious30) * 100 : 0;

        $ridesLast30 = \App\Models\Ride::where('created_at', '>=', $last30Days)->count();
        $ridesPrevious30 = \App\Models\Ride::whereBetween('created_at', [$previous30Days, $last30Days])->count();
        $rideGrowth = $ridesPrevious30 > 0 ? (($ridesLast30 - $ridesPrevious30) / $ridesPrevious30) * 100 : 0;

        $revenueLast30 = \App\Models\Payment::where('status', 'completed')
            ->where('created_at', '>=', $last30Days)
            ->sum('amount');
        $revenuePrevious30 = \App\Models\Payment::where('status', 'completed')
            ->whereBetween('created_at', [$previous30Days, $last30Days])
            ->sum('amount');
        $revenueGrowth = $revenuePrevious30 > 0 ? (($revenueLast30 - $revenuePrevious30) / $revenuePrevious30) * 100 : 0;

        return response()->json([
            'overview' => [
                'total_users' => $totalUsers,
                'verified_users' => $verifiedUsers,
                'drivers' => $drivers,
                'citizens' => $citizens,
                'admins'=> $admins,
                'officers'=>$officers,
                'total_rides' => $totalRides,
                'completed_rides' => $completedRides,
                'cancelled_rides' => $cancelledRides,
                'active_rides' => $activeRides,
                'total_revenue' => $totalRevenue,
                'monthly_revenue' => $monthlyRevenue,
                'today_revenue' => $todayRevenue,
                'total_applications' => $totalApplications,
                'pending_applications' => $pendingApplications,
                'approved_applications' => $approvedApplications,
                'rejected_applications' => $rejectedApplications,
            ],
            'growth' => [
                'user_growth_percent' => round($userGrowth, 2),
                'ride_growth_percent' => round($rideGrowth, 2),
                'revenue_growth_percent' => round($revenueGrowth, 2),
            ],
            'completion_rate' => $totalRides > 0 ? round(($completedRides / $totalRides) * 100, 2) : 0,
            'verification_rate' => $totalUsers > 0 ? round(($verifiedUsers / $totalUsers) * 100, 2) : 0,
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        return response()->json($query->paginate(15));
    }

    public function applications(Request $request): JsonResponse
    {
        $query = Application::query();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function process(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'action' => 'required|string|in:approved,rejected,requires_action',
            'notes' => 'nullable|string',
        ]);

        $application = Application::findOrFail($id);
        $application->status = $data['action'];
        $application->processing_notes = $data['notes'] ?? null;
        $application->processed_at = now();
        $application->save();

        return response()->json($application);
    }

    public function updateUser(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,'.$id,
            'phone' => 'sometimes|string|max:20',
            'role' => 'sometimes|string|in:citizen,driver,admin,government_officer',
            'is_verified' => 'sometimes|boolean',
        ]);

        $user = User::findOrFail($id);
        $user->fill($data);
        $user->save();

        return response()->json($user);
    }

    public function updateUserStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'is_verified' => 'required|boolean',
        ]);

        $user = User::findOrFail($id);
        $user->is_verified = $data['is_verified'];
        $user->save();

        return response()->json($user);
    }

public function getAllRides()
{
    try {
        $rides = Ride::with([
            // Use the exact names of the methods in your Ride.php model
            'passenger', // Usually linked to passenger_id
            'driverProfile.user' // Usually linked to driver_profile_id
        ])
        ->latest()
        ->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $rides
        ]);
        
    } catch (Exception $e) {
        Log::error("Ride Retrieval Error: " . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Internal Server Error'
        ], 500);
    }
}

/**
 * Fetch all government service applications with relationships.
 * * @return \Illuminate\Http\JsonResponse
 */
public function getAllApplications()
{
    try {
        // We eager load the 'user' (citizen) and the 'service' itself
        // Ensure your Application model has these relationship methods defined
        $applications = Application::with([
            'user:id,name,email,phone', 
            'service:id,name,code'
        ])
        ->latest()
        ->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $applications
        ]);
        
    } catch (\Exception $e) {
        // Log error for debugging (found in storage/logs/laravel.log)
        Log::error("Application Retrieval Error: " . $e->getMessage());

        return response()->json([
            'status' => 'error',
            'message' => 'Internal Server Error',
            'debug' => $e->getMessage() // Consider removing 'debug' in production
        ], 500);
    }
}

}