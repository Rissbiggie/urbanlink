<?php

namespace App\Services;

use App\Jobs\SyncComplianceSnapshot;
use App\Models\ComplianceSnapshot;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class ComplianceService
{
    /**
     * Get the snapshot for a user, cached for 24 hours.
     */
    public function getSnapshot(?User $user): ?ComplianceSnapshot
    {
        if (!$user) {
            return null;
        }

        $cacheKey = "compliance_snapshot:{$user->id}";

        return Cache::remember($cacheKey, 86400, function () use ($user) {
            return ComplianceSnapshot::where('user_id', $user->id)->first();
        });
    }

    /**
     * Trigger a background sync and return the current (possibly stale) snapshot.
     */
    public function refresh(User $user): ?ComplianceSnapshot
    {
        // Clear cache so the next call gets fresh data from DB
        Cache::forget("compliance_snapshot:{$user->id}");
        
        SyncComplianceSnapshot::dispatch($user);

        return $this->getSnapshot($user);
    }
}