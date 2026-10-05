<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SDLCPhase extends Model
{
    use HasFactory;

    protected $table = 'sdlc_phases';

    protected $fillable = [
        'project_id',
        'phase_number',
        'name',
        'status',
        'completion_rate',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'phase_number' => 'integer',
            'completion_rate' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function qualityGate(): HasOne
    {
        return $this->hasOne(QualityGate::class, 'phase_id');
    }
}
