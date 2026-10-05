<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sprint extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'sprint_number',
        'name',
        'goal',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected $appends = ['total_story_points', 'completed_story_points'];

    public function getTotalStoryPointsAttribute(): int
    {
        return (int) $this->tasks()->sum('story_points');
    }

    public function getCompletedStoryPointsAttribute(): int
    {
        return (int) $this->tasks()->where('status', 'done')->sum('story_points');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class);
    }
}
