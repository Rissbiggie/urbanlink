<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(protected NotificationService $notificationService)
    {
    }

    /**
     * Get user's notifications
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = $request->get('limit', 50);
        $unreadOnly = $request->boolean('unread_only', false);

        $notifications = $this->notificationService->getUserNotifications($user, $limit, $unreadOnly);

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'meta' => [
                'total' => $notifications->count(),
                'unread_count' => $user->notifications()->unread()->count(),
            ],
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $success = $this->notificationService->markAsRead($id, $user);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Notification marked as read' : 'Notification not found or already read',
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        $updated = $user->notifications()
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => "{$updated} notifications marked as read",
        ]);
    }

    /**
     * Get notification count
     */
    public function count(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $user->notifications()->count(),
                'unread' => $user->notifications()->unread()->count(),
            ],
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $notification = $user->notifications()->find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted successfully',
        ]);
    }

    /**
     * Send test notification (for development/testing)
     */
    public function sendTest(Request $request): JsonResponse
    {
        $user = $request->user();
        $type = $request->get('type', 'test');

        $testNotifications = [
            'test' => [
                'title' => 'Test Notification',
                'message' => 'This is a test notification to verify the system is working correctly.',
            ],
            'ride' => [
                'title' => 'Test Ride Notification',
                'message' => 'Your test ride from Nairobi CBD to Westlands has been requested.',
            ],
            'payment' => [
                'title' => 'Test Payment Notification',
                'message' => 'Your test payment of KES 500 has been processed successfully.',
            ],
        ];

        $notification = $testNotifications[$type] ?? $testNotifications['test'];

        $success = $this->notificationService->sendRealTimeNotification(
            $user,
            $type,
            $notification['title'],
            $notification['message'],
            ['test' => true, 'timestamp' => now()->toISOString()]
        );

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Test notification sent' : 'Failed to send test notification',
        ]);
    }
}