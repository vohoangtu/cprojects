<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CABSignoff extends Model
{
    use HasFactory;

    protected $table = 'cab_signoffs';

    protected $fillable = [
        'project_id',
        'release_version',
        'role_required',
        'signer_name',
        'decision',
        'sign_token',
        'notes',
        'signed_at',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    protected $appends = ['signature_token'];

    public function getSignatureTokenAttribute(): ?string
    {
        return $this->sign_token;
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
