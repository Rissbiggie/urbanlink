<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Data Archiving Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration for data archiving policies.
    | All retention periods are in days.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Retention Periods (in days)
    |--------------------------------------------------------------------------
    |
    | Define how long different types of data should be retained before archiving.
    | Archived data is moved to storage/archives/ and removed from active database.
    |
    */

    'audit_logs_retention_days' => env('ARCHIVING_AUDIT_LOGS_RETENTION_DAYS', 365), // 1 year

    'notifications_retention_days' => env('ARCHIVING_NOTIFICATIONS_RETENTION_DAYS', 180), // 6 months

    'rides_retention_days' => env('ARCHIVING_RIDES_RETENTION_DAYS', 730), // 2 years

    'payments_retention_days' => env('ARCHIVING_PAYMENTS_RETENTION_DAYS', 1095), // 3 years

    'citizen_reports_retention_days' => env('ARCHIVING_CITIZEN_REPORTS_RETENTION_DAYS', 365), // 1 year

    /*
    |--------------------------------------------------------------------------
    | Archive Storage Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for where archived data is stored and how long archives are kept.
    |
    */

    'storage_disk' => env('ARCHIVING_STORAGE_DISK', 'local'),

    'archive_retention_days' => env('ARCHIVING_ARCHIVE_RETENTION_DAYS', 2555), // 7 years

    /*
    |--------------------------------------------------------------------------
    | Archiving Schedule
    |--------------------------------------------------------------------------
    |
    | When to run automatic archiving. Set to null to disable automatic archiving.
    |
    */

    'auto_archive_enabled' => env('ARCHIVING_AUTO_ENABLED', true),

    'auto_archive_schedule' => env('ARCHIVING_AUTO_SCHEDULE', '0 2 * * 0'), // Every Sunday at 2 AM

    /*
    |--------------------------------------------------------------------------
    | Backup Configuration
    |--------------------------------------------------------------------------
    |
    | Whether to create backups before archiving and backup retention.
    |
    */

    'backup_before_archiving' => env('ARCHIVING_BACKUP_ENABLED', true),

    'backup_retention_days' => env('ARCHIVING_BACKUP_RETENTION_DAYS', 365), // 1 year

    /*
    |--------------------------------------------------------------------------
    | Compression and Encryption
    |--------------------------------------------------------------------------
    |
    | Archive file compression and encryption settings.
    |
    */

    'compress_archives' => env('ARCHIVING_COMPRESS', true),

    'encrypt_archives' => env('ARCHIVING_ENCRYPT', false),

    'encryption_key' => env('ARCHIVING_ENCRYPTION_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    |
    | Notify administrators when archiving runs.
    |
    */

    'notify_on_completion' => env('ARCHIVING_NOTIFY_COMPLETION', true),

    'notification_email' => env('ARCHIVING_NOTIFICATION_EMAIL', 'admin@urbanlink.com'),

    /*
    |--------------------------------------------------------------------------
    | Data Types to Archive
    |--------------------------------------------------------------------------
    |
    | Which data types should be archived. Set to false to skip archiving for that type.
    |
    */

    'archive_audit_logs' => env('ARCHIVING_AUDIT_LOGS_ENABLED', true),

    'archive_notifications' => env('ARCHIVING_NOTIFICATIONS_ENABLED', true),

    'archive_rides' => env('ARCHIVING_RIDES_ENABLED', true),

    'archive_payments' => env('ARCHIVING_PAYMENTS_ENABLED', true),

    'archive_citizen_reports' => env('ARCHIVING_CITIZEN_REPORTS_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Batch Processing
    |--------------------------------------------------------------------------
    |
    | Process data in batches to avoid memory issues.
    |
    */

    'batch_size' => env('ARCHIVING_BATCH_SIZE', 1000),

    /*
    |--------------------------------------------------------------------------
    | Data Validation
    |--------------------------------------------------------------------------
    |
    | Validate data integrity before and after archiving.
    |
    */

    'validate_before_archive' => env('ARCHIVING_VALIDATE_BEFORE', true),

    'validate_after_archive' => env('ARCHIVING_VALIDATE_AFTER', true),

];