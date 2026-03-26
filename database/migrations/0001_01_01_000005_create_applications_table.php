<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('government_service_id')->constrained('government_services')->cascadeOnDelete();
            $table->string('application_reference')->unique();
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'requires_action'])->default('draft');
            $table->jsonb('form_data')->nullable();
            $table->json('documents')->nullable();
            $table->string('agency_reference')->nullable();
            $table->text('processing_notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('application_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'requires_action']);
            $table->text('notes')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_status_logs');
        Schema::dropIfExists('applications');
    }
};
