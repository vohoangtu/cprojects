<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TestRun extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'environment',
        'status',
        'executed_by',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $appends = ['total_tests', 'passed_tests', 'failed_tests', 'blocked_tests'];

    public function getTotalTestsAttribute(): int
    {
        return $this->items()->count();
    }

    public function getPassedTestsAttribute(): int
    {
        return $this->items()->where('status', 'passed')->count();
    }

    public function getFailedTestsAttribute(): int
    {
        return $this->items()->where('status', 'failed')->count();
    }

    public function getBlockedTestsAttribute(): int
    {
        return $this->items()->where('status', 'blocked')->count();
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TestRunItem::class);
    }
}
