<?php

namespace App\Services;

use App\Jobs\SyncComplianceSnapshot;
use App\Models\ComplianceSnapshot;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class ComplianceService
{
    public function getSnapshot(User $user): ComplianceSnapshot|null
    {
        $cacheKey = "compliance_snapshot:{$user->id}";

        return Cache::remember($cacheKey, 86400, function () use ($user) {
            return ComplianceSnapshot::where('user_id', $user->id)->first();
        });
    }

    public function refresh(User $user): ComplianceSnapshot
    {
        SyncComplianceSnapshot::dispatch($user);

        return $this->getSnapshot($user);
    }
}
