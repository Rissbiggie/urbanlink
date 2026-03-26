<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CitizenReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category',
        'subject',
        'description',
        'status',
        'attachments',
    ];

    protected $casts = [
        'attachments' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
