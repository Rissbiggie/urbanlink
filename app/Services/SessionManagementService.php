<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class SessionManagementService
{
    /**
     * Check if user has exceeded concurrent session limit
     */
    public function checkConcurrentSessions(User $user): array
    {
        $maxSessions = config('auth.sessions.max_concurrent', 3);
        $currentSessionId = Session::getId();

        // Get all active sessions for this user
        $activeSessions = DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('last_activity', '>', Carbon::now()->subMinutes(config('session.lifetime', 120))->timestamp)
            ->where('id', '!=', $currentSessionId)
            ->get();

        $sessionCount = $activeSessions->count();

        return [
            'within_limit' => $sessionCount < $maxSessions,
            'current_count' => $sessionCount,
            'max_allowed' => $maxSessions,
            'excess_sessions' => $sessionCount >= $maxSessions ? $activeSessions->take($sessionCount - $maxSessions + 1) : collect(),
        ];
    }

    /**
     * Terminate excess sessions for user
     */
    public function terminateExcessSessions(User $user): int
    {
        $sessionCheck = $this->checkConcurrentSessions($user);

        if ($sessionCheck['within_limit']) {
            return 0;
        }

        $terminated = 0;
        foreach ($sessionCheck['excess_sessions'] as $session) {
            DB::table('sessions')->where('id', $session->id)->delete();
            $terminated++;

            Log::info('Terminated excess session', [
                'user_id' => $user->id,
                'session_id' => $session->id,
                'ip_address' => $session->ip_address,
            ]);
        }

        return $terminated;
    }

    /**
     * Terminate all sessions for user except current
     */
    public function terminateAllSessions(User $user, ?string $exceptSessionId = null): int
    {
        $exceptSessionId = $exceptSessionId ?? Session::getId();

        $terminated = DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $exceptSessionId)
            ->delete();

        Log::info('Terminated all user sessions', [
            'user_id' => $user->id,
            'terminated_count' => $terminated,
            'except_session' => $exceptSessionId,
        ]);

        return $terminated;
    }

    /**
     * Get user's active sessions
     */
    public function getActiveSessions(User $user): \Illuminate\Support\Collection
    {
        return DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('last_activity', '>', Carbon::now()->subMinutes(config('session.lifetime', 120))->timestamp)
            ->orderBy('last_activity', 'desc')
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'ip_address' => $session->ip_address,
                    'user_agent' => $session->user_agent,
                    'last_activity' => Carbon::createFromTimestamp($session->last_activity),
                    'is_current' => $session->id === Session::getId(),
                    'location' => $this->getLocationFromIp($session->ip_address),
                ];
            });
    }

    /**
     * Terminate specific session
     */
    public function terminateSession(string $sessionId): bool
    {
        $user = Auth::user();

        $deleted = DB::table('sessions')
            ->where('id', $sessionId)
            ->where('user_id', $user->id)
            ->delete();

        if ($deleted) {
            Log::info('Session terminated', [
                'user_id' => $user->id,
                'session_id' => $sessionId,
            ]);
        }

        return $deleted > 0;
    }

    /**
     * Check for suspicious session activity
     */
    public function checkSuspiciousActivity(User $user): array
    {
        $currentSession = Session::all();
        $currentIp = request()->ip();
        $currentUserAgent = request()->userAgent();

        $suspicious = [];

        // Check for IP address changes
        $recentSessions = DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('last_activity', '>', Carbon::now()->subHours(24)->timestamp)
            ->get();

        $uniqueIps = $recentSessions->pluck('ip_address')->unique();

        if ($uniqueIps->count() > config('auth.sessions.max_unique_ips', 5)) {
            $suspicious[] = 'Multiple IP addresses detected in last 24 hours';
        }

        // Check for unusual locations
        $locations = $uniqueIps->map(function ($ip) {
            return $this->getLocationFromIp($ip);
        })->filter()->unique('country');

        if ($locations->count() > config('auth.sessions.max_unique_countries', 3)) {
            $suspicious[] = 'Login from multiple countries detected';
        }

        // Check for rapid session creation
        $recentSessionCount = $recentSessions->where('last_activity', '>', Carbon::now()->subMinutes(30)->timestamp)->count();

        if ($recentSessionCount > config('auth.sessions.max_sessions_per_hour', 10)) {
            $suspicious[] = 'Unusual number of session creations';
        }

        return [
            'is_suspicious' => !empty($suspicious),
            'warnings' => $suspicious,
            'unique_ips' => $uniqueIps->count(),
            'unique_countries' => $locations->count(),
            'recent_sessions' => $recentSessionCount,
        ];
    }

    /**
     * Get location information from IP address
     */
    private function getLocationFromIp(string $ip): ?array
    {
        // This is a simplified implementation
        // In production, you might want to use a service like MaxMind GeoIP
        // or ip-api.com for more accurate location data

        if ($ip === '127.0.0.1' || $ip === '::1') {
            return [
                'country' => 'Local',
                'city' => 'Localhost',
                'isp' => 'Local Network',
            ];
        }

        // For demo purposes, return mock data
        // Replace with actual IP geolocation service
        return [
            'country' => 'Unknown',
            'city' => 'Unknown',
            'isp' => 'Unknown',
        ];
    }

    /**
     * Force logout user from all devices
     */
    public function forceLogout(User $user): bool
    {
        $terminated = $this->terminateAllSessions($user);

        // Clear any remember tokens
        $user->tokens()->delete();

        Log::info('User force logged out from all devices', [
            'user_id' => $user->id,
            'sessions_terminated' => $terminated,
        ]);

        return true;
    }

    /**
     * Check if session is expired based on custom rules
     */
    public function isSessionExpired(): bool
    {
        $maxIdleTime = config('auth.sessions.max_idle_minutes', 60); // 1 hour default

        if (!$maxIdleTime) return false;

        $lastActivity = Session::get('last_activity');

        if (!$lastActivity) return false;

        return Carbon::createFromTimestamp($lastActivity)
            ->addMinutes($maxIdleTime)
            ->isPast();
    }

    /**
     * Extend session activity
     */
    public function extendSession(): void
    {
        Session::put('last_activity', time());
    }

    /**
     * Get session security status
     */
    public function getSessionSecurityStatus(User $user): array
    {
        $concurrentCheck = $this->checkConcurrentSessions($user);
        $suspiciousCheck = $this->checkSuspiciousActivity($user);
        $sessionExpired = $this->isSessionExpired();

        return [
            'concurrent_sessions_ok' => $concurrentCheck['within_limit'],
            'concurrent_session_count' => $concurrentCheck['current_count'],
            'max_concurrent_allowed' => $concurrentCheck['max_allowed'],
            'suspicious_activity' => $suspiciousCheck['is_suspicious'],
            'suspicious_warnings' => $suspiciousCheck['warnings'],
            'session_expired' => $sessionExpired,
            'security_score' => $this->calculateSecurityScore($concurrentCheck, $suspiciousCheck, $sessionExpired),
        ];
    }

    /**
     * Calculate session security score (0-100)
     */
    private function calculateSecurityScore(array $concurrentCheck, array $suspiciousCheck, bool $sessionExpired): int
    {
        $score = 100;

        // Deduct for concurrent sessions
        if (!$concurrentCheck['within_limit']) {
            $score -= 20;
        }

        // Deduct for suspicious activity
        if ($suspiciousCheck['is_suspicious']) {
            $score -= 30;
        }

        // Deduct for expired session
        if ($sessionExpired) {
            $score -= 50;
        }

        // Bonus for single session
        if ($concurrentCheck['current_count'] === 1) {
            $score += 10;
        }

        return max(0, min(100, $score));
    }
}