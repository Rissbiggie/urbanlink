<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'mpesa' => [
        'consumer_key' => env('MPESA_CONSUMER_KEY'),
        'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
        'shortcode' => env('MPESA_SHORTCODE'),
        'passkey' => env('MPESA_PASSKEY'),
        'callback_url' => env('MPESA_CALLBACK_URL'),
        'sandbox' => env('MPESA_SANDBOX', true),
    ],

    'rides' => [
        // Maximum distance (km) for matching drivers to ride requests.
        'match_radius_km' => env('RIDES_MATCH_RADIUS_KM', 10),
    ],

    'government' => [
        'enabled' => env('GOVERNMENT_API_ENABLED', false),

        // Individual agency configuration. When `enabled` is false, services fall back to stub behavior.
        'kra' => [
            'enabled' => env('KRA_API_ENABLED', false),
            'base_url' => env('KRA_API_BASE_URL'),
            'token' => env('KRA_API_TOKEN'),
        ],
        'ntsa' => [
            'enabled' => env('NTSA_API_ENABLED', false),
            'base_url' => env('NTSA_API_BASE_URL'),
            'token' => env('NTSA_API_TOKEN'),
        ],
        'nssf' => [
            'enabled' => env('NSSF_API_ENABLED', false),
            'base_url' => env('NSSF_API_BASE_URL'),
            'token' => env('NSSF_API_TOKEN'),
        ],
        'sha' => [
            'enabled' => env('SHA_API_ENABLED', false),
            'base_url' => env('SHA_API_BASE_URL'),
            'token' => env('SHA_API_TOKEN'),
        ],
    ],
];
