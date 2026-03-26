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
        Schema::create('compliance_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // KRA
            $table->enum('kra_status', ['compliant', 'non_compliant', 'pending', 'unknown'])->default('unknown');
            $table->string('kra_pin')->nullable();
            $table->timestamp('kra_last_filing_date')->nullable();
            $table->enum('kra_tcc_status', ['valid', 'expired', 'unknown'])->nullable();
            $table->timestamp('kra_tcc_expiry')->nullable();

            // NTSA
            $table->enum('ntsa_license_status', ['valid', 'expired', 'suspended', 'unknown'])->default('unknown');
            $table->date('ntsa_license_expiry')->nullable();
            $table->boolean('ntsa_pending_fines')->default(false);
            $table->decimal('ntsa_fine_amount', 10, 2)->nullable();

            // NSSF
            $table->enum('nssf_status', ['active', 'inactive', 'unknown'])->default('unknown');
            $table->string('nssf_member_number')->nullable();
            $table->decimal('nssf_balance', 12, 2)->nullable();
            $table->date('nssf_last_contribution_date')->nullable();

            // SHA
            $table->enum('sha_status', ['active', 'inactive', 'suspended', 'unknown'])->default('unknown');
            $table->string('sha_member_id')->nullable();
            $table->date('sha_next_due_date')->nullable();
            $table->boolean('sha_premium_paid')->default(false);

            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique('user_id');
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('title')->nullable();
            $table->text('message');
            $table->json('data')->nullable();
            $table->boolean('read')->default(false);
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->constrained('users')->cascadeOnDelete();
            $table->string('action');
            $table->string('target_type')->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('compliance_snapshots');
    }
};
