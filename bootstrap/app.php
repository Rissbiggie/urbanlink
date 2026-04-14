<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'auth' => Illuminate\Auth\Middleware\Authenticate::class,
            'auth.basic' => Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
            'role' => App\Http\Middleware\RoleMiddleware::class,
        ]);

        // --- ADD THESE TWO PARTS BELOW ---

        // 1. Trust Ngrok Proxies (Crucial for HTTPS detection over the tunnel)
        $middleware->trustProxies(at: '*');

        // 2. Exempt the M-Pesa Callback from CSRF protection
        $middleware->validateCsrfTokens(except: [
            'api/payments/callback'
        ]);

        // ---------------------------------
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return null;
                }
                
                return response()->json([
                    'message' => 'Server Error',
                    'error' => config('app.debug') 
                        ? $e->getMessage() 
                        : 'Internal Server Error',
                ], 500);
            }
        });
    })->create();