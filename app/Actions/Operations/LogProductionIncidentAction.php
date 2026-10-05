<?php

namespace App\Actions\Operations;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\ProductionIncident;

class LogProductionIncidentAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Log a production incident, calculate downtime, and update SLA trail.
     *
     * @param array{
     *     project_id: int,
     *     incident_code: string,
     *     title: string,
     *     severity: 'P1_CRITICAL'|'P2_MAJOR'|'P3_MINOR',
     *     downtime_minutes: int,
     *     root_cause?: string|null,
     *     corrective_actions?: string|null,
     *     status: 'investigating'|'mitigated'|'resolved',
     *     detected_at: string,
     *     resolved_at?: string|null
     * } $data
     */
    public function execute(
        array $data,
        string $operatorName = 'Võ Hoàng Tú',
        string $operatorRole = 'Lead Site Reliability Engineer'
    ): ProductionIncident {
        $incident = ProductionIncident::create([
            'project_id' => $data['project_id'],
            'incident_code' => strtoupper($data['incident_code']),
            'title' => $data['title'],
            'severity' => $data['severity'] ?? 'P2_MAJOR',
            'downtime_minutes' => (int) ($data['downtime_minutes'] ?? 0),
            'root_cause' => $data['root_cause'] ?? null,
            'corrective_actions' => $data['corrective_actions'] ?? null,
            'status' => $data['status'] ?? 'investigating',
            'detected_at' => $data['detected_at'] ?? now(),
            'resolved_at' => $data['resolved_at'] ?? ($data['status'] === 'resolved' ? now() : null),
        ]);

        $this->recordAuditLogAction->execute(
            projectId: $data['project_id'],
            userName: $operatorName,
            userRole: $operatorRole,
            actionType: 'INCIDENT_RECORDED',
            entityType: 'ProductionIncident',
            entityId: $incident->id,
            details: [
                'incident_code' => $incident->incident_code,
                'severity' => $incident->severity,
                'downtime_minutes' => $incident->downtime_minutes,
                'status' => $incident->status,
            ]
        );

        return $incident;
    }
}
