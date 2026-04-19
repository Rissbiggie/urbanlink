<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GovernmentService extends Model
{
    use HasFactory;

    protected $fillable = [
      //  'service_category_id',
        'name',
        'code',
        'description',
        'required_documents',
        'processing_time',
    ];

    protected $casts = [
        'required_documents' => 'array',
    ];

    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    protected $appends = ['payable_type', 'payable_id'];

public function getPayableTypeAttribute(): string
{
    return 'government_service';
}

public function getPayableIdAttribute(): string
{
    return (string) $this->id;
}
}

