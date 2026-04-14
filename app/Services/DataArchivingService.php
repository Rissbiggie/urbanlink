<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CitizenReport;
use App\Models\Notification;
use App\Models\Ride;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class DataArchivingService
{
    /**
     * Archive old data based on retention policies
     */
    public function archiveOldData(): array
    {
        $results = [
            'audit_logs' => $this->archiveAuditLogs(),
            'notifications' => $this->archiveNotifications(),
            'old_rides' => $this->archiveOldRides(),
            'old_payments' => $this->archiveOldPayments(),
            'citizen_reports' => $this->archiveCitizenReports(),
        ];

        Log::info('Data archiving completed', $results);

        return $results;
    }

    /**
     * Archive audit logs older than retention period
     */
    private function archiveAuditLogs(): int
    {
        $retentionDays = config('archiving.audit_logs_retention_days', 365);
        $cutoffDate = Carbon::now()->subDays($retentionDays);

        $oldLogs = AuditLog::where('created_at', '<', $cutoffDate)->get();

        if ($oldLogs->isEmpty()) {
            return 0;
        }

        $archiveData = $oldLogs->map(function ($log) {
            return [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'action' => $log->action,
                'model_type' => $log->model_type,
                'model_id' => $log->model_id,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'created_at' => $log->created_at,
                'archived_at' => now(),
            ];
        });

        $filename = 'audit_logs_' . date('Y_m_d_H_i_s') . '.json';
        Storage::put('archives/audit_logs/' . $filename, json_encode($archiveData, JSON_PRETTY_PRINT));

        // Delete archived records
        $deletedCount = AuditLog::where('created_at', '<', $cutoffDate)->delete();

        Log::info('Archived audit logs', [
            'count' => $deletedCount,
            'filename' => $filename,
            'cutoff_date' => $cutoffDate,
        ]);

        return $deletedCount;
    }

    /**
     * Archive old notifications
     */
    private function archiveNotifications(): int
    {
        $retentionDays = config('archiving.notifications_retention_days', 180);
        $cutoffDate = Carbon::now()->subDays($retentionDays);

        // Only archive read notifications older than retention period
        $oldNotifications = Notification::where('is_read', true)
            ->where('created_at', '<', $cutoffDate)
            ->get();

        if ($oldNotifications->isEmpty()) {
            return 0;
        }

        $archiveData = $oldNotifications->map(function ($notification) {
            return [
                'id' => $notification->id,
                'user_id' => $notification->user_id,
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'data' => $notification->data,
                'is_read' => $notification->is_read,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
                'archived_at' => now(),
            ];
        });

        $filename = 'notifications_' . date('Y_m_d_H_i_s') . '.json';
        Storage::put('archives/notifications/' . $filename, json_encode($archiveData, JSON_PRETTY_PRINT));

        $deletedCount = Notification::where('is_read', true)
            ->where('created_at', '<', $cutoffDate)
            ->delete();

        Log::info('Archived notifications', [
            'count' => $deletedCount,
            'filename' => $filename,
            'cutoff_date' => $cutoffDate,
        ]);

        return $deletedCount;
    }

    /**
     * Archive old completed rides
     */
    private function archiveOldRides(): int
    {
        $retentionDays = config('archiving.rides_retention_days', 730); // 2 years
        $cutoffDate = Carbon::now()->subDays($retentionDays);

        $oldRides = Ride::where('status', 'completed')
            ->where('created_at', '<', $cutoffDate)
            ->get();

        if ($oldRides->isEmpty()) {
            return 0;
        }

        $archiveData = $oldRides->map(function ($ride) {
            return [
                'id' => $ride->id,
                'user_id' => $ride->user_id,
                'driver_profile_id' => $ride->driver_profile_id,
                'vehicle_id' => $ride->vehicle_id,
                'pickup_location' => $ride->pickup_location,
                'dropoff_location' => $ride->dropoff_location,
                'scheduled_time' => $ride->scheduled_time,
                'status' => $ride->status,
                'estimated_fare' => $ride->estimated_fare,
                'actual_fare' => $ride->actual_fare,
                'distance_km' => $ride->distance_km,
                'duration_minutes' => $ride->duration_minutes,
                'created_at' => $ride->created_at,
                'completed_at' => $ride->completed_at,
                'archived_at' => now(),
            ];
        });

        $filename = 'rides_' . date('Y_m_d_H_i_s') . '.json';
        Storage::put('archives/rides/' . $filename, json_encode($archiveData, JSON_PRETTY_PRINT));

        $deletedCount = Ride::where('status', 'completed')
            ->where('created_at', '<', $cutoffDate)
            ->delete();

        Log::info('Archived old rides', [
            'count' => $deletedCount,
            'filename' => $filename,
            'cutoff_date' => $cutoffDate,
        ]);

        return $deletedCount;
    }

    /**
     * Archive old payment records
     */
    private function archiveOldPayments(): int
    {
        $retentionDays = config('archiving.payments_retention_days', 1095); // 3 years
        $cutoffDate = Carbon::now()->subDays($retentionDays);

        $oldPayments = Payment::where('status', 'completed')
            ->where('created_at', '<', $cutoffDate)
            ->get();

        if ($oldPayments->isEmpty()) {
            return 0;
        }

        $archiveData = $oldPayments->map(function ($payment) {
            return [
                'id' => $payment->id,
                'user_id' => $payment->user_id,
                'ride_id' => $payment->ride_id,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'payment_method' => $payment->payment_method,
                'reference' => $payment->reference,
                'status' => $payment->status,
                'processed_at' => $payment->processed_at,
                'created_at' => $payment->created_at,
                'archived_at' => now(),
            ];
        });

        $filename = 'payments_' . date('Y_m_d_H_i_s') . '.json';
        Storage::put('archives/payments/' . $filename, json_encode($archiveData, JSON_PRETTY_PRINT));

        $deletedCount = Payment::where('status', 'completed')
            ->where('created_at', '<', $cutoffDate)
            ->delete();

        Log::info('Archived old payments', [
            'count' => $deletedCount,
            'filename' => $filename,
            'cutoff_date' => $cutoffDate,
        ]);

        return $deletedCount;
    }

    /**
     * Archive old citizen reports
     */
    private function archiveCitizenReports(): int
    {
        $retentionDays = config('archiving.citizen_reports_retention_days', 365);
        $cutoffDate = Carbon::now()->subDays($retentionDays);

        $oldReports = CitizenReport::where('status', 'resolved')
            ->where('created_at', '<', $cutoffDate)
            ->get();

        if ($oldReports->isEmpty()) {
            return 0;
        }

        $archiveData = $oldReports->map(function ($report) {
            return [
                'id' => $report->id,
                'user_id' => $report->user_id,
                'service_category_id' => $report->service_category_id,
                'title' => $report->title,
                'description' => $report->description,
                'location' => $report->location,
                'status' => $report->status,
                'priority' => $report->priority,
                'attachments' => $report->attachments,
                'resolved_at' => $report->resolved_at,
                'created_at' => $report->created_at,
                'archived_at' => now(),
            ];
        });

        $filename = 'citizen_reports_' . date('Y_m_d_H_i_s') . '.json';
        Storage::put('archives/citizen_reports/' . $filename, json_encode($archiveData, JSON_PRETTY_PRINT));

        $deletedCount = CitizenReport::where('status', 'resolved')
            ->where('created_at', '<', $cutoffDate)
            ->delete();

        Log::info('Archived citizen reports', [
            'count' => $deletedCount,
            'filename' => $filename,
            'cutoff_date' => $cutoffDate,
        ]);

        return $deletedCount;
    }

    /**
     * Create database backup before archiving
     */
    public function createBackupBeforeArchiving(): string
    {
        $backupPath = 'backups/pre_archiving_' . date('Y_m_d_H_i_s') . '.sql';

        // This is a simplified backup command
        // In production, you might want to use a more robust backup solution
        $command = sprintf(
            'mysqldump -u%s -p%s %s > %s',
            config('database.connections.mysql.username'),
            config('database.connections.mysql.password'),
            config('database.connections.mysql.database'),
            storage_path('app/' . $backupPath)
        );

        exec($command, $output, $returnCode);

        if ($returnCode === 0) {
            Log::info('Database backup created before archiving', ['path' => $backupPath]);
            return $backupPath;
        } else {
            Log::error('Failed to create database backup', ['output' => $output]);
            throw new \Exception('Database backup failed');
        }
    }

    /**
     * Get archiving statistics
     */
    public function getArchivingStats(): array
    {
        return [
            'audit_logs' => [
                'total' => AuditLog::count(),
                'archivable' => AuditLog::where('created_at', '<', Carbon::now()->subDays(config('archiving.audit_logs_retention_days', 365)))->count(),
            ],
            'notifications' => [
                'total' => Notification::count(),
                'archivable' => Notification::where('is_read', true)->where('created_at', '<', Carbon::now()->subDays(config('archiving.notifications_retention_days', 180)))->count(),
            ],
            'rides' => [
                'total' => Ride::count(),
                'archivable' => Ride::where('status', 'completed')->where('created_at', '<', Carbon::now()->subDays(config('archiving.rides_retention_days', 730)))->count(),
            ],
            'payments' => [
                'total' => Payment::count(),
                'archivable' => Payment::where('status', 'completed')->where('created_at', '<', Carbon::now()->subDays(config('archiving.payments_retention_days', 1095)))->count(),
            ],
            'citizen_reports' => [
                'total' => CitizenReport::count(),
                'archivable' => CitizenReport::where('status', 'resolved')->where('created_at', '<', Carbon::now()->subDays(config('archiving.citizen_reports_retention_days', 365)))->count(),
            ],
        ];
    }

    /**
     * Clean up old archive files
     */
    public function cleanupOldArchives(int $retentionDays = 2555): int // 7 years
    {
        $cutoffDate = Carbon::now()->subDays($retentionDays);
        $deletedCount = 0;

        $directories = ['archives/audit_logs', 'archives/notifications', 'archives/rides', 'archives/payments', 'archives/citizen_reports'];

        foreach ($directories as $directory) {
            if (Storage::exists($directory)) {
                $files = Storage::files($directory);

                foreach ($files as $file) {
                    $timestamp = Storage::lastModified($file);
                    $fileDate = Carbon::createFromTimestamp($timestamp);

                    if ($fileDate->lt($cutoffDate)) {
                        Storage::delete($file);
                        $deletedCount++;
                    }
                }
            }
        }

        Log::info('Cleaned up old archive files', [
            'deleted_count' => $deletedCount,
            'retention_days' => $retentionDays,
        ]);

        return $deletedCount;
    }

    /**
     * Restore data from archive
     */
    public function restoreFromArchive(string $archivePath): bool
    {
        if (!Storage::exists($archivePath)) {
            Log::error('Archive file not found', ['path' => $archivePath]);
            return false;
        }

        $data = json_decode(Storage::get($archivePath), true);

        if (!$data) {
            Log::error('Invalid archive file format', ['path' => $archivePath]);
            return false;
        }

        // Determine the type of data from the filename
        $filename = basename($archivePath);
        $type = explode('_', $filename)[0];

        try {
            DB::beginTransaction();

            switch ($type) {
                case 'audit':
                    foreach ($data as $item) {
                        AuditLog::create([
                            'user_id' => $item['user_id'],
                            'action' => $item['action'],
                            'model_type' => $item['model_type'],
                            'model_id' => $item['model_id'],
                            'old_values' => $item['old_values'],
                            'new_values' => $item['new_values'],
                            'ip_address' => $item['ip_address'],
                            'user_agent' => $item['user_agent'],
                            'created_at' => $item['created_at'],
                        ]);
                    }
                    break;

                case 'notifications':
                    foreach ($data as $item) {
                        Notification::create([
                            'user_id' => $item['user_id'],
                            'type' => $item['type'],
                            'title' => $item['title'],
                            'message' => $item['message'],
                            'data' => $item['data'],
                            'is_read' => $item['is_read'],
                            'read_at' => $item['read_at'],
                            'created_at' => $item['created_at'],
                        ]);
                    }
                    break;

                // Add other types as needed

                default:
                    throw new \Exception('Unknown archive type: ' . $type);
            }

            DB::commit();

            Log::info('Data restored from archive', [
                'path' => $archivePath,
                'type' => $type,
                'count' => count($data),
            ]);

            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to restore from archive', [
                'path' => $archivePath,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}