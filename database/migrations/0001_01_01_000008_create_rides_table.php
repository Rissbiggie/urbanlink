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
        Schema::create('rides', function (Blueprint $table) {
            $table->id();
            $table->string('ride_reference')->unique();
            $table->foreignId('passenger_id')->constrained('users')->cascadeOnDelete();
           // We link to driver_profiles, not just users, to access specific driver data
            $table->foreignId('driver_profile_id')->nullable()->constrained('driver_profiles')->onDelete('set null');
            $table->enum('status', ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->enum('payment_status', ['unpaid', 'pending', 'paid', 'refunded'])->default('unpaid')->after('status');
            $table->timestamp('completed_at')->nullable()->after('updated_at');
            $table->decimal('pickup_lat', 10, 7);
            $table->decimal('pickup_lng', 10, 7);
            $table->string('pickup_address');
            $table->decimal('dropoff_lat', 10, 7);
            $table->decimal('dropoff_lng', 10, 7);
            $table->string('dropoff_address');
            $table->enum('vehicle_type', ['economy', 'comfort', 'xl']);
            $table->enum('payment_method', ['mpesa', 'cash']);
            $table->decimal('estimated_fare', 10, 2);
            $table->decimal('final_fare', 10, 2)->nullable();
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->tinyInteger('passenger_rating')->nullable();
            $table->tinyInteger('driver_rating')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rides');
    }
};
