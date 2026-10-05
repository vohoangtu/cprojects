<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectWebhook extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'url',
        'events',
        'secret_token',
        'is_active',
        'last_triggered_at',
        'last_status_code',
    ];

    protected $casts = [
        'events' => 'array',
        'is_active' => 'boolean',
        'last_triggered_at' => 'datetime',
        'last_status_code' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
