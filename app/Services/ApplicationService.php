<?php

namespace App\Services;

use App\Jobs\SyncApplicationWithAgency;
use App\Models\Application;
use App\Models\GovernmentService;
use App\Models\User;
use Illuminate\Support\Str;

class ApplicationService
{
    public function listForUser(User $user)
    {
        return Application::where('user_id', $user->id)->latest()->paginate(15);
    }

  // Inside your ApplicationService.php
public function getForUser($user, $id)
{
    return Application::where('user_id', $user->id)
        ->with('service:id,name') // This ensures the service name is always included
        ->findOrFail($id);
}

    public function create(User $user, array $data): Application
    {
        $application = Application::create([
            'user_id' => $user->id,
            'government_service_id' => $data['government_service_id'],
            'application_reference' => $this->generateReference(),
            'status' => 'submitted',
            'form_data' => $data['form_data'] ?? null,
            'documents' => $data['documents'] ?? null,
            'submitted_at' => now(),
        ]);

        SyncApplicationWithAgency::dispatch($application);

        return $application;
    }

    public function updateDraft(User $user, int $id, array $data): Application
    {
        $application = Application::where('user_id', $user->id)->where('status', 'draft')->findOrFail($id);

        $application->fill([
            'government_service_id' => $data['government_service_id'] ?? $application->government_service_id,
            'form_data' => $data['form_data'] ?? $application->form_data,
            'documents' => $data['documents'] ?? $application->documents,
        ]);

        $application->save();

        return $application;
    }

    public function deleteDraft(User $user, int $id): void
    {
        $application = Application::where('user_id', $user->id)->where('status', 'draft')->findOrFail($id);

        $application->delete();
    }

    public function statusHistory(Application $application)
    {
        return $application->statusLogs()->latest()->get();
    }

    protected function generateReference(): string
    {
        return 'APP-'.Str::upper(Str::random(6));
    }
}
