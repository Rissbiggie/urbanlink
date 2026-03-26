<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class SyncComplianceSnapshot implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public User $user)
    {
        $this->onQueue('compliance');
    }

    public function handle(): void
    {
        $user = $this->user;

        $snapshot = $user->complianceSnapshot()->firstOrNew();

        $kra = app(\App\Services\Government\KraService::class)->checkStatus([
            'kra_pin' => $user->kra_pin,
            'national_id' => $user->national_id,
        ]);

        $ntsa = app(\App\Services\Government\NtsaService::class)->checkStatus([
            'national_id' => $user->national_id,
        ]);

        $nssf = app(\App\Services\Government\NssfService::class)->checkStatus([
            'national_id' => $user->national_id,
        ]);

        $sha = app(\App\Services\Government\ShaService::class)->checkStatus([
            'national_id' => $user->national_id,
        ]);

        $snapshot->kra_status = $kra['status'] ?? 'unknown';
        $snapshot->kra_pin = $user->kra_pin;

        $snapshot->ntsa_license_status = $ntsa['status'] ?? 'unknown';
        $snapshot->nssf_status = $nssf['status'] ?? 'unknown';
        $snapshot->sha_status = $sha['status'] ?? 'unknown';

        $snapshot->last_synced_at = now();
        $snapshot->user_id = $user->id;
        $snapshot->save();

        Cache::put("compliance_snapshot:{$user->id}", $snapshot, now()->addHours(24));
    }
}
