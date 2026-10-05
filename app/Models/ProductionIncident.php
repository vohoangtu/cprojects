<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionIncident extends Model
{
    use HasFactory;

    protected $table = 'production_incidents';

    protected $fillable = [
        'project_id',
        'incident_code',
        'title',
        'severity',
        'downtime_minutes',
        'root_cause',
        'corrective_actions',
        'status',
        'detected_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'downtime_minutes' => 'integer',
            'detected_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
