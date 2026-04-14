<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $pusher;

    public function __construct()
    {
        if (class_exists('Pusher\Pusher')) {
            $this->pusher = new \Pusher\Pusher(
                config('broadcasting.connections.pusher.key'),
                config('broadcasting.connections.pusher.secret'),
                config('broadcasting.connections.pusher.app_id'),
                [
                    'cluster' => config('broadcasting.connections.pusher.options.cluster'),
                    'host' => config('broadcasting.connections.pusher.options.host', '127.0.0.1'),
                    'port' => config('broadcasting.connections.pusher.options.port', 6001),
                    'scheme' => config('broadcasting.connections.pusher.options.scheme', 'http'),
                    'encrypted' => config('broadcasting.connections.pusher.options.encrypted', true),
                    'useTLS' => config('broadcasting.connections.pusher.options.useTLS', false),
                ]
            );
        }
    }

    /**
     * Send real-time notification to user
     */
    public function sendRealTimeNotification(User $user, string $type, string $title, string $message, array $data = []): bool
    {
        try {
            // Store notification in database
            $notification = Notification::create([
                'user_id' => $user->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
                'is_read' => false,
            ]);

            // Send real-time notification via Pusher if configured
            if ($this->pusher) {
                $this->pusher->trigger(
                    "user.{$user->id}",
                    'notification.received',
                    [
                        'id' => $notification->id,
                        'type' => $type,
                        'title' => $title,
                        'message' => $message,
                        'data' => $data,
                        'created_at' => $notification->created_at->toISOString(),
                    ]
                );
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send real-time notification', [
                'user_id' => $user->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send email notification
     */
    public function sendEmailNotification(User $user, string $subject, string $view, array $data = []): bool
    {
        try {
            Mail::send($view, array_merge($data, ['user' => $user]), function ($message) use ($user, $subject) {
                $message->to($user->email, $user->name)
                        ->subject($subject);
            });

            Log::info('Email notification sent', [
                'user_id' => $user->id,
                'subject' => $subject,
                'view' => $view,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send email notification', [
                'user_id' => $user->id,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send SMS notification via Africa's Talking
     */
    public function sendSmsNotification(User $user, string $message): bool
    {
        try {
            if (!$user->phone) {
                Log::warning('User has no phone number for SMS notification', ['user_id' => $user->id]);
                return false;
            }

            $username = config('services.africastalking.username');
            $apiKey = config('services.africastalking.api_key');

            if (!$username || !$apiKey) {
                Log::warning('Africa\'s Talking credentials not configured');
                return false;
            }

            // Format phone number (ensure it starts with +)
            $phone = $this->formatPhoneNumber($user->phone);

            $url = 'https://api.africastalking.com/version1/messaging';

            $data = [
                'username' => $username,
                'to' => $phone,
                'message' => $message,
                'from' => config('services.africastalking.sender_id', 'UrbanLink'),
            ];

            $headers = [
                'Accept: application/json',
                'Content-Type: application/x-www-form-urlencoded',
                'apiKey: ' . $apiKey,
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if (curl_errno($ch)) {
                Log::error('SMS sending failed: ' . curl_error($ch));
                curl_close($ch);
                return false;
            }

            curl_close($ch);

            $result = json_decode($response, true);

            if ($httpCode === 201 && isset($result['SMSMessageData']['Recipients'])) {
                Log::info('SMS sent successfully to ' . $phone);
                return true;
            } else {
                Log::error('SMS sending failed', [
                    'response' => $response,
                    'http_code' => $httpCode
                ]);
                return false;
            }

        } catch (\Exception $e) {
            Log::error('SMS sending exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Format phone number for Africa's Talking
     */
    private function formatPhoneNumber($phone)
    {
        // Remove any non-numeric characters
        $phone = preg_replace('/\D/', '', $phone);

        // If it starts with 0, replace with country code (assuming Kenya +254)
        if (str_starts_with($phone, '0')) {
            $phone = '254' . substr($phone, 1);
        }

        // If it doesn't start with +, add it
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }

        return $phone;
    }

    /**
     * Send multi-channel notification (real-time + email + SMS)
     */
    public function sendMultiChannelNotification(
        User $user,
        string $type,
        string $title,
        string $message,
        array $channels = ['realtime', 'email', 'sms'],
        array $data = []
    ): array {
        $results = [];

        if (in_array('realtime', $channels)) {
            $results['realtime'] = $this->sendRealTimeNotification($user, $type, $title, $message, $data);
        }

        if (in_array('email', $channels)) {
            $results['email'] = $this->sendEmailNotification(
                $user,
                $title,
                'emails.notification',
                array_merge($data, ['message' => $message])
            );
        }

        if (in_array('sms', $channels)) {
            $results['sms'] = $this->sendSmsNotification($user, $message);
        }

        return $results;
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(int $notificationId, User $user): bool
    {
        try {
            $notification = Notification::where('id', $notificationId)
                ->where('user_id', $user->id)
                ->first();

            if ($notification) {
                $notification->update(['is_read' => true]);
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Failed to mark notification as read', [
                'notification_id' => $notificationId,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get user notifications
     */
    public function getUserNotifications(User $user, int $limit = 50, bool $unreadOnly = false): \Illuminate\Database\Eloquent\Collection
    {
        $query = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit);

        if ($unreadOnly) {
            $query->where('is_read', false);
        }

        return $query->get();
    }

    /**
     * Send ride-related notifications
     */
    public function sendRideNotification(User $user, string $type, array $rideData): bool
    {
        $messages = [
            'ride_requested' => [
                'title' => 'New Ride Request',
                'message' => "You have a new ride request from {$rideData['pickup_address']} to {$rideData['dropoff_address']}.",
            ],
            'ride_accepted' => [
                'title' => 'Ride Accepted',
                'message' => "Your ride from {$rideData['pickup_address']} to {$rideData['dropoff_address']} has been accepted.",
            ],
            'ride_started' => [
                'title' => 'Ride Started',
                'message' => "Your ride from {$rideData['pickup_address']} to {$rideData['dropoff_address']} has started.",
            ],
            'ride_completed' => [
                'title' => 'Ride Completed',
                'message' => "Your ride from {$rideData['pickup_address']} to {$rideData['dropoff_address']} has been completed. Final fare: KES {$rideData['final_fare']}.",
            ],
            'ride_cancelled' => [
                'title' => 'Ride Cancelled',
                'message' => "Your ride from {$rideData['pickup_address']} to {$rideData['dropoff_address']} has been cancelled.",
            ],
        ];

        if (!isset($messages[$type])) {
            return false;
        }

        return $this->sendRealTimeNotification(
            $user,
            'ride',
            $messages[$type]['title'],
            $messages[$type]['message'],
            $rideData
        );
    }

    /**
     * Send payment notifications
     */
    public function sendPaymentNotification(User $user, string $type, array $paymentData): bool
    {
        $messages = [
            'payment_successful' => [
                'title' => 'Payment Successful',
                'message' => "Your payment of KES {$paymentData['amount']} has been processed successfully.",
            ],
            'payment_failed' => [
                'title' => 'Payment Failed',
                'message' => "Your payment of KES {$paymentData['amount']} has failed. Please try again.",
            ],
            'payment_refunded' => [
                'title' => 'Payment Refunded',
                'message' => "Your payment of KES {$paymentData['amount']} has been refunded.",
            ],
        ];

        if (!isset($messages[$type])) {
            return false;
        }

        return $this->sendMultiChannelNotification(
            $user,
            'payment',
            $messages[$type]['title'],
            $messages[$type]['message'],
            ['realtime', 'email'],
            $paymentData
        );
    }

    /**
     * Send application status notifications
     */
    public function sendApplicationNotification(User $user, string $type, array $applicationData): bool
    {
        $messages = [
            'application_submitted' => [
                'title' => 'Application Submitted',
                'message' => "Your application for {$applicationData['service_name']} has been submitted successfully. Reference: {$applicationData['reference_number']}.",
            ],
            'application_approved' => [
                'title' => 'Application Approved',
                'message' => "Your application for {$applicationData['service_name']} has been approved. Reference: {$applicationData['reference_number']}.",
            ],
            'application_rejected' => [
                'title' => 'Application Rejected',
                'message' => "Your application for {$applicationData['service_name']} has been rejected. Reference: {$applicationData['reference_number']}.",
            ],
            'application_pending' => [
                'title' => 'Application Under Review',
                'message' => "Your application for {$applicationData['service_name']} is under review. Reference: {$applicationData['reference_number']}.",
            ],
        ];

        if (!isset($messages[$type])) {
            return false;
        }

        return $this->sendMultiChannelNotification(
            $user,
            'application',
            $messages[$type]['title'],
            $messages[$type]['message'],
            ['realtime', 'email'],
            $applicationData
        );
    }
}