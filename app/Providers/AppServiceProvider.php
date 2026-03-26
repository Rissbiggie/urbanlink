<?php

namespace App\Providers;

use App\Models\Application;
use App\Models\Ride;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Ensure polymorphic types are mapped consistently.
        Relation::morphMap([
            'ride' => Ride::class,
            'application' => Application::class,
        ]);
    }
}
