<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RTMTrace extends Model
{
    use HasFactory;

    protected $table = 'rtm_traces';

    protected $fillable = [
        'project_id',
        'req_code',
        'req_title',
        'user_story_code',
        'commit_or_pr',
        'test_case_code',
        'defect_code',
        'release_version',
        'status',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function defects(): HasMany
    {
        return $this->hasMany(Defect::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class);
    }

    public function testRunItems(): HasMany
    {
        return $this->hasMany(TestRunItem::class);
    }
}
