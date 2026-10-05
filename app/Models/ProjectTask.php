<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'sprint_id',
        'rtm_trace_id',
        'task_code',
        'title',
        'description',
        'story_points',
        'status',
        'assigned_to',
        'github_pr_url',
        'completed_at',
    ];

    protected $casts = [
        'story_points' => 'integer',
        'completed_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function sprint(): BelongsTo
    {
        return $this->belongsTo(Sprint::class);
    }

    public function rtmTrace(): BelongsTo
    {
        return $this->belongsTo(RTMTrace::class);
    }
}
