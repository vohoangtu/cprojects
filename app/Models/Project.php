<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'client_name',
        'project_type',
        'status',
        'current_phase_number',
        'health_status',
        'budget',
        'target_delivery_date',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'target_delivery_date' => 'date',
            'current_phase_number' => 'integer',
        ];
    }

    public function phases(): HasMany
    {
        return $this->hasMany(SDLCPhase::class)->orderBy('phase_number');
    }

    public function qualityGates(): HasMany
    {
        return $this->hasMany(QualityGate::class)->orderBy('gate_number');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProjectDocument::class)->orderBy('phase_number')->orderBy('id');
    }

    public function raciAssignments(): HasMany
    {
        return $this->hasMany(RACIAssignment::class);
    }

    public function rtmTraces(): HasMany
    {
        return $this->hasMany(RTMTrace::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class)->latest();
    }

    public function defects(): HasMany
    {
        return $this->hasMany(Defect::class)->latest();
    }

    public function ciPipelineMetrics(): HasMany
    {
        return $this->hasMany(CIPipelineMetric::class)->latest();
    }

    public function productionIncidents(): HasMany
    {
        return $this->hasMany(ProductionIncident::class)->latest();
    }

    public function sprints(): HasMany
    {
        return $this->hasMany(Sprint::class)->orderBy('sprint_number');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class)->latest();
    }

    public function testRuns(): HasMany
    {
        return $this->hasMany(TestRun::class)->latest();
    }

    public function cabSignoffs(): HasMany
    {
        return $this->hasMany(CABSignoff::class)->latest();
    }

    public function deploymentRollouts(): HasMany
    {
        return $this->hasMany(DeploymentRollout::class)->latest();
    }

    public function webhooks(): HasMany
    {
        return $this->hasMany(ProjectWebhook::class)->latest();
    }
}
