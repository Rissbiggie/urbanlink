<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default users
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => 'admin',
            'password' => bcrypt('password'), // Default password for testing
        ]);

        User::factory()->create([
            'name' => 'Driver User',
            'email' => 'driver@example.com',
            'role' => 'driver',
            'password' => bcrypt('password'), // Default password for testing
        ]);

        User::factory()->create([
            'name' => 'Officer User',
            'email' => 'officer@example.com',
            'role' => 'government_officer',
            'password' => bcrypt('password'), // Default password for testing
        ]);

         User::factory()->create([
            'name' => 'Citizen User',
            'email' => 'citizen@example.com',
            'role' => 'citizen',
            'password' => bcrypt('password'), // Default password for testing
        ]);

        // Seed government service categories and services
        $taxCategory = \App\Models\ServiceCategory::create(['name' => 'Tax & Revenue', 'slug' => 'tax']);
        \App\Models\GovernmentService::create([
            'service_category_id' => $taxCategory->id,
            'name' => 'KRA PIN Registration',   
            'code' => 'KRA_PIN',
            'description' => 'Register for a KRA PIN to file taxes.',
            'required_documents' => ['national_id'],
            'processing_time' => '2-3 business days',
        ]);

        $transportCategory = \App\Models\ServiceCategory::create(['name' => 'Transport', 'slug' => 'transport']);
        \App\Models\GovernmentService::create([
            'service_category_id' => $transportCategory->id,
            'name' => 'NTSA Driving License Renewal',
            'code' => 'NTSA_LICENSE',
            'description' => 'Renew your driving license with NTSA.',
            'required_documents' => ['license', 'passport_photo'],
            'processing_time' => '5-7 business days',
        ]);
    }
}
