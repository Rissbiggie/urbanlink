<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;

class AuditService
{
    public function log(string $action, string $targetType, int $targetId, array $meta = [], ?User $actor = null): AuditLog
    {
        return AuditLog::create([
            'actor_id' => $actor?->id,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'meta' => $meta,
        ]);
    }

    public function logUserAction(User $actor, string $action, string $targetType, int $targetId, array $meta = []): AuditLog
    {
        return $this->log($action, $targetType, $targetId, array_merge($meta, [
            'actor_ip' => request()->ip(),
            'actor_user_agent' => request()->userAgent(),
        ]), $actor);
    }

    public function logRideAction(User $actor, string $action, int $rideId, array $meta = []): AuditLog
    {
        return $this->logUserAction($actor, $action, 'ride', $rideId, $meta);
    }

    public function logPaymentAction(User $actor, string $action, int $paymentId, array $meta = []): AuditLog
    {
        return $this->logUserAction($actor, $action, 'payment', $paymentId, $meta);
    }

    public function logApplicationAction(User $actor, string $action, int $applicationId, array $meta = []): AuditLog
    {
        return $this->logUserAction($actor, $action, 'application', $applicationId, $meta);
    }

    public function logAdminAction(User $actor, string $action, string $targetType, int $targetId, array $meta = []): AuditLog
    {
        return $this->logUserAction($actor, $action, $targetType, $targetId, array_merge($meta, [
            'admin_action' => true,
        ]));
    }
}