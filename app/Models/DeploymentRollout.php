<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeploymentRollout extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'release_version',
        'strategy',
        'current_traffic_percentage',
        'health_status',
        'rollback_reason',
        'deployed_at',
    ];

    protected $casts = [
        'current_traffic_percentage' => 'integer',
        'deployed_at' => 'datetime',
    ];

    protected $appends = ['traffic_percentage', 'status'];

    public function getTrafficPercentageAttribute(): int
    {
        return $this->current_traffic_percentage;
    }

    public function getStatusAttribute(): string
    {
        return $this->health_status;
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
