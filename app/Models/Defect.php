<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Defect extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'rtm_trace_id',
        'defect_code',
        'title',
        'description',
        'steps_to_reproduce',
        'severity',
        'status',
        'assigned_to',
        'logged_by',
        'resolution_notes',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function rtmTrace(): BelongsTo
    {
        return $this->belongsTo(RTMTrace::class);
    }

    /**
     * Scope query to unresolved blocker and critical defects.
     */
    public function scopeUnresolvedBlockers(Builder $query): Builder
    {
        return $query->whereIn('severity', ['blocker', 'critical'])
            ->whereIn('status', ['open', 'in_progress']);
    }
}
