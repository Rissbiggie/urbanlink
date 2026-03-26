<?php

return [
    /**
     * The authentication guard(s) that should be checked when Sanctum is
     * authenticating requests. If this value is empty, Sanctum will use the
     * default guard defined in your auth configuration.
     */
    'guard' => env('SANCTUM_GUARD', null),

    /**
     * The expiration time of access tokens (in minutes). If null, tokens won't
     * expire (unless manually revoked).
     */
    'expiration' => env('SANCTUM_EXPIRATION', null),

    /**
     * This middleware will be assigned to every route that is protected by Sanctum.
     */
    'middleware' => [
        'verify_csrf_token' => Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
    ],

    /**
     * Determines which domains should receive stateful API authentication cookies.
     * Typically, this is your frontend SPA domain.
     */
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost')), 
];
