<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'government_service_id',
        'application_reference',
        'status',
        'form_data',
        'documents',
        'agency_reference',
        'processing_notes',
        'submitted_at',
        'processed_at',
    ];

    protected $casts = [
        'form_data' => 'array',
        'documents' => 'array',
        'submitted_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function governmentService()
    {
        return $this->belongsTo(GovernmentService::class);
    }

    public function statusLogs()
    {
        return $this->hasMany(ApplicationStatusLog::class);
    }

    public function payments()
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    // app/Models/Application.php


public function service()
{
    // You must specify 'government_service_id' because it doesn't follow 
    // the standard 'service_id' naming convention.
    return $this->belongsTo(GovernmentService::class, 'government_service_id');
}

}

