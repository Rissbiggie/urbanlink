<?php

namespace App\Console\Commands;

use App\Services\DataArchivingService;
use Illuminate\Console\Command;

class ArchiveOldData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data:archive
                            {--dry-run : Show what would be archived without actually archiving}
                            {--backup : Create database backup before archiving}
                            {--cleanup : Clean up old archive files after archiving}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive old data based on retention policies';

    protected DataArchivingService $archivingService;

    public function __construct(DataArchivingService $archivingService)
    {
        parent::__construct();
        $this->archivingService = $archivingService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting data archiving process...');

        // Show archiving statistics
        $stats = $this->archivingService->getArchivingStats();
        $this->displayStats($stats);

        if ($this->option('dry-run')) {
            $this->warn('DRY RUN MODE - No data will be archived');
            return;
        }

        // Create backup if requested
        if ($this->option('backup')) {
            $this->info('Creating database backup...');
            try {
                $backupPath = $this->archivingService->createBackupBeforeArchiving();
                $this->info("Backup created: {$backupPath}");
            } catch (\Exception $e) {
                $this->error("Backup failed: {$e->getMessage()}");
                return 1;
            }
        }

        // Confirm archiving
        if (!$this->confirm('Do you want to proceed with archiving?', true)) {
            $this->info('Archiving cancelled.');
            return;
        }

        // Perform archiving
        $this->info('Archiving data...');
        $results = $this->archivingService->archiveOldData();

        // Display results
        $this->displayResults($results);

        // Clean up old archives if requested
        if ($this->option('cleanup')) {
            $this->info('Cleaning up old archive files...');
            $cleanedCount = $this->archivingService->cleanupOldArchives();
            $this->info("Cleaned up {$cleanedCount} old archive files");
        }

        $this->info('Data archiving completed successfully!');
        return 0;
    }

    /**
     * Display archiving statistics
     */
    private function displayStats(array $stats): void
    {
        $this->info('Current Data Statistics:');
        $this->table(
            ['Data Type', 'Total Records', 'Archivable Records'],
            array_map(function ($type, $data) {
                return [$type, $data['total'], $data['archivable']];
            }, array_keys($stats), $stats)
        );
        $this->newLine();
    }

    /**
     * Display archiving results
     */
    private function displayResults(array $results): void
    {
        $this->info('Archiving Results:');
        $this->table(
            ['Data Type', 'Records Archived'],
            array_map(function ($type, $count) {
                return [str_replace('_', ' ', ucfirst($type)), $count];
            }, array_keys($results), $results)
        );

        $totalArchived = array_sum($results);
        $this->info("Total records archived: {$totalArchived}");
        $this->newLine();
    }
}
