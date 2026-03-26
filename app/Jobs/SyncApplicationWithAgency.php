<?php

namespace App\Jobs;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncApplicationWithAgency implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Application $application)
    {
        $this->onQueue('government');
    }

    public function handle(): void
    {
        $serviceCode = $this->application->governmentService->code;

        $service = match ($serviceCode) {
            'KRA_PIN' => app(\App\Services\Government\KraService::class),
            'NTSA_LICENSE' => app(\App\Services\Government\NtsaService::class),
            'NSSF' => app(\App\Services\Government\NssfService::class),
            'SHA' => app(\App\Services\Government\ShaService::class),
            default => null,
        };

        if (! $service) {
            $this->application->status = 'requires_action';
            $this->application->processing_notes = "No integration configured for service code {$serviceCode}.";
            $this->application->save();
            return;
        }

        $result = $service->submitApplication($this->application);

        $this->application->agency_reference = $result['reference'] ?? null;
        $this->application->status = $result['status'] ?? 'under_review';
        $this->application->processing_notes = $result['notes'] ?? null;
        $this->application->processed_at = now();
        $this->application->save();

        $this->application->statusLogs()->create([
            'status' => $this->application->status,
            'notes' => $this->application->processing_notes,
            'processed_by' => null,
        ]);
    }
}
