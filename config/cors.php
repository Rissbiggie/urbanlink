<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    // 1. Ensure all API paths are covered
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],

    // 2. Allow all methods (POST is critical for your Dispatch request)
    'allowed_methods' => ['*'],

    // 3. Explicitly allow your React dev server
    // Change 3000 to 5173 if you are using Vite
    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [],

    // 4. Accept all headers including Authorization and X-Requested-With
    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // 5. MUST BE TRUE if your axios client uses { withCredentials: true }
    'supports_credentials' => true,

];