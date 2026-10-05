<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QualityGate extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'phase_id',
        'gate_number',
        'name',
        'status',
        'required_role',
        'sign_off_token',
        'sign_off_by',
        'sign_off_role',
        'sign_off_notes',
        'signed_at',
        'criteria_checklist',
    ];

    protected function casts(): array
    {
        return [
            'gate_number' => 'integer',
            'signed_at' => 'datetime',
            'criteria_checklist' => 'array',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function phase(): BelongsTo
    {
        return $this->belongsTo(SDLCPhase::class, 'phase_id');
    }
}
