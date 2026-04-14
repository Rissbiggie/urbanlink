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

    'africastalking' => [
        'username' => env('AFRICASTALKING_USERNAME'),
        'api_key' => env('AFRICASTALKING_API_KEY'),
        'sender_id' => env('AFRICASTALKING_SENDER_ID', 'UrbanLink'),
    ],

    'grok' => [
        'api_key' => env('GROK_API_KEY'),
        'base_url' => env('GROK_BASE_URL', 'https://api.x.ai/v1'),
        'max_retries' => env('GROK_MAX_RETRIES', 3),
        'timeout' => env('GROK_TIMEOUT', 30),
        'cache_responses' => env('GROK_CACHE_RESPONSES', true),
        'cache_ttl' => env('GROK_CACHE_TTL', 60), // minutes
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
    
    'mpesa' => [
    'sandbox'         => env('MPESA_ENVIRONMENT', 'sandbox'),
    'consumer_key'    => env('MPESA_CONSUMER_KEY'),
    'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
    'shortcode'       => env('MPESA_SHORTCODE'),
    'passkey'         => env('MPESA_PASSKEY'),
    'callback_url'    => env('MPESA_CALLBACK_URL'),
    ],
];
