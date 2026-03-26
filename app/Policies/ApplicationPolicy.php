<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\User;

class ApplicationPolicy
{
    public function view(User $user, Application $application): bool
    {
        return $application->user_id === $user->id || in_array($user->role, ['admin', 'government_officer'], true);
    }

    public function update(User $user, Application $application): bool
    {
        return $application->user_id === $user->id && $application->status === 'draft';
    }

    public function delete(User $user, Application $application): bool
    {
        return $application->user_id === $user->id && $application->status === 'draft';
    }

    public function process(User $user, Application $application): bool
    {
        return in_array($user->role, ['admin', 'government_officer'], true);
    }
}
