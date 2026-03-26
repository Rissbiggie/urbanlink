<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Load the channel authorization routes.
        if (file_exists(base_path('routes/channels.php'))) {
            $this->loadRoutesFrom(base_path('routes/channels.php'));
        }
    }
}
