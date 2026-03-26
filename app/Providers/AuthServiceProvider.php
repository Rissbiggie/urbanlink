<?php

namespace App\Providers;

use App\Models\Application;
use App\Models\Ride;
use App\Models\Payment;
use App\Policies\ApplicationPolicy;
use App\Policies\RidePolicy;
use App\Policies\PaymentPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Application::class => ApplicationPolicy::class,
        Ride::class => RidePolicy::class,
        Payment::class => PaymentPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('access-admin', fn ($user) => in_array($user->role, ['admin', 'government_officer'], true));
        Gate::define('access-driver', fn ($user) => $user->role === 'driver');
    }
}
