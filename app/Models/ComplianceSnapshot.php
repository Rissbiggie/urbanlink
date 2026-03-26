<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplianceSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'kra_status',
        'kra_pin',
        'kra_last_filing_date',
        'kra_tcc_status',
        'kra_tcc_expiry',
        'ntsa_license_status',
        'ntsa_license_expiry',
        'ntsa_pending_fines',
        'ntsa_fine_amount',
        'nssf_status',
        'nssf_member_number',
        'nssf_balance',
        'nssf_last_contribution_date',
        'sha_status',
        'sha_member_id',
        'sha_next_due_date',
        'sha_premium_paid',
        'last_synced_at',
    ];

    protected $casts = [
        'kra_last_filing_date' => 'datetime',
        'kra_tcc_expiry' => 'datetime',
        'ntsa_license_expiry' => 'date',
        'ntsa_pending_fines' => 'boolean',
        'nssf_balance' => 'decimal:2',
        'nssf_last_contribution_date' => 'date',
        'sha_next_due_date' => 'date',
        'sha_premium_paid' => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
