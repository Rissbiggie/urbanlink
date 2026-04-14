<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ComplianceController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\GrokController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RideController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PaymentController;

Route::get('/', fn () => response()->json(['status' => 'ok']));

// Authentication
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
});

Route::middleware(['throttle:3,1'])->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
});

Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::put('/auth/profile', [AuthController::class, 'updateProfile'])->middleware('auth:sanctum');
Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->middleware('auth:sanctum');

// Public services
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{code}', [ServiceController::class, 'show']);

// Authenticated routes
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Compliance
    Route::middleware(['throttle:compliance'])->group(function () {
        Route::get('/compliance/snapshot', [ComplianceController::class, 'snapshot']);
        Route::get('/compliance/kra', [ComplianceController::class, 'kra']);
        Route::get('/compliance/ntsa', [ComplianceController::class, 'ntsa']);
        Route::get('/compliance/nssf', [ComplianceController::class, 'nssf']);
        Route::get('/compliance/sha', [ComplianceController::class, 'sha']);
        Route::post('/compliance/sha/dependants', [ComplianceController::class, 'addDependant']);
        Route::post('/compliance/refresh', [ComplianceController::class, 'refresh']);
    });

    // Applications
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::get('/applications/{id}', [ApplicationController::class, 'show']);
    Route::put('/applications/{id}', [ApplicationController::class, 'update']);
    Route::delete('/applications/{id}', [ApplicationController::class, 'destroy']);
    Route::get('/applications/{id}/status-history', [ApplicationController::class, 'statusHistory']);

    // Rides
    Route::post('/rides/quote', [RideController::class, 'quote']);
    Route::post('/rides', [RideController::class, 'store']);
    Route::get('/rides', [RideController::class, 'index']);
    Route::get('/rides/{id}', [RideController::class, 'show']);
    Route::post('/rides/{id}/cancel', [RideController::class, 'cancel']);
    Route::post('/rides/{id}/rate', [RideController::class, 'rate']);

    // Driver routes
    Route::post('/driver/register', [DriverController::class, 'register'])->middleware('auth:sanctum');
    Route::get('/driver/profile', [DriverController::class, 'profile'])->middleware('auth:sanctum,role:driver');
    Route::put('/driver/profile', [DriverController::class, 'updateProfile'])->middleware('auth:sanctum,role:driver');
    Route::post('/driver/toggle-availability', [DriverController::class, 'toggleAvailability'])->middleware('auth:sanctum,role:driver');
    Route::post('/driver/location', [DriverController::class, 'updateLocation'])->middleware('auth:sanctum,role:driver');
    Route::get('/driver/map', [DriverController::class, 'mapData'])->middleware('auth:sanctum,role:driver');
    Route::get('/driver/rides', [DriverController::class, 'rides'])->middleware('auth:sanctum,role:driver');
    Route::post('/driver/rides/{id}/accept', [DriverController::class, 'acceptRide'])->middleware('auth:sanctum,role:driver');
    Route::post('/driver/rides/{id}/start', [DriverController::class, 'startRide'])->middleware('auth:sanctum,role:driver');
    Route::post('/driver/rides/{id}/complete', [DriverController::class, 'completeRide'])->middleware('auth:sanctum,role:driver');
    Route::get('/driver/earnings', [DriverController::class, 'earnings'])->middleware('auth:sanctum,role:driver');
    Route::get('/driver/payouts', [DriverController::class, 'payouts'])->middleware('auth:sanctum,role:driver');
    Route::get('/driver/vehicles', [DriverController::class, 'vehicles'])->middleware('auth:sanctum,role:driver');

    // Payments
    Route::middleware(['throttle:payments'])->group(function () {
        Route::post('/payments/initiate', [PaymentController::class, 'initiate']);
    });
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    Route::get('/payments/{id}/status', [PaymentController::class, 'status']);

    // Grok AI Services
    Route::prefix('grok')->group(function () {
        Route::get('/health', [GrokController::class, 'health']);
        Route::post('/analyze-ride', [GrokController::class, 'analyzeRide']);
        Route::post('/suggest-pricing', [GrokController::class, 'suggestPricing']);
        Route::post('/support-response', [GrokController::class, 'generateSupportResponse']);
        Route::post('/analyze-driver', [GrokController::class, 'analyzeDriver']);
        Route::post('/predict-demand', [GrokController::class, 'predictDemand']);
        Route::post('/chat', [GrokController::class, 'chat']);
        Route::post('/ask', [GrokController::class, 'ask']);
    });

    // Admin
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard'])->middleware('role:admin,government_officer');
    Route::get('/admin/users', [AdminController::class, 'users'])->middleware('role:admin,government_officer');
    Route::put('/admin/users/{id}', [AdminController::class, 'updateUser'])->middleware('role:admin,government_officer');
    Route::patch('/admin/users/{id}/status', [AdminController::class, 'updateUserStatus'])->middleware('role:admin,government_officer');
    Route::get('/admin/applications', [AdminController::class, 'applications'])->middleware('role:admin,government_officer');
    Route::post('/admin/applications/{id}/process', [AdminController::class, 'process'])->middleware('role:admin,government_officer');
    Route::post('/admin/drivers/{id}/reject', [DriverController::class, 'reject'])->middleware('role:admin');
    Route::patch('/admin/drivers/{id}/verify', [DriverController::class, 'verify'])->middleware( 'role:admin');
    

    // Reports
    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports', [ReportController::class, 'store']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/count', [NotificationController::class, 'count']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::post('/notifications/test', [NotificationController::class, 'sendTest']);

    // Broadcasting auth (private channels)
    Broadcast::routes(['middleware' => ['auth:sanctum']]);
});

// Public webhooks
Route::post('/payments/mpesa/callback', [PaymentController::class, 'callback']);
