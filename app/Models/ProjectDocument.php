<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'phase_number',
        'doc_type',
        'title',
        'version',
        'status',
        'content',
        'signed_off_by',
        'signed_off_at',
        'signature_hash',
    ];

    protected function casts(): array
    {
        return [
            'phase_number' => 'integer',
            'signed_off_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
