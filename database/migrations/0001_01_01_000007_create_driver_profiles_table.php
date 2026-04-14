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
    Schema::create('driver_profiles', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('license_number')->nullable();
        $table->string('license_class')->nullable();
        $table->date('license_expiry')->nullable();
        
        // Updated Enum to include 'approved' and 'rejected'
        $table->enum('status', [
            'pending_verification', 
            'approved', 
            'rejected', 
            'active', 
            'suspended', 
            'inactive'
        ])->default('pending_verification');

        $table->boolean('is_available')->default(false);
        $table->decimal('current_lat', 10, 7)->nullable();
        $table->decimal('current_lng', 10, 7)->nullable();
        
        // Added missing columns
        $table->timestamp('verified_at')->nullable();
        $table->text('rejection_reason')->nullable();

        $table->decimal('average_rating', 3, 2)->default(0);
        $table->unsignedInteger('total_rides')->default(0);
        $table->timestamps();
    });

    Schema::create('vehicles', function (Blueprint $table) {
        $table->id();
        $table->foreignId('driver_profile_id')->constrained('driver_profiles')->cascadeOnDelete();
        $table->string('make')->nullable();
        $table->string('model')->nullable();
        $table->string('color')->nullable();
        $table->string('plate_number')->nullable();
        $table->string('vehicle_type')->nullable();
        $table->year('year')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('driver_profiles');
    }
};
