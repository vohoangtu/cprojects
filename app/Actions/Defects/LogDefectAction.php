<?php

namespace App\Actions\Defects;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Defect;
use App\Models\RTMTrace;
use App\Repositories\Contracts\DefectRepositoryInterface;

class LogDefectAction
{
    public function __construct(
        protected DefectRepositoryInterface $defectRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Log a new technical defect, associate with RTM trace if provided, and record audit trail.
     *
     * @param array{
     *     project_id: int,
     *     rtm_trace_id?: int|null,
     *     defect_code: string,
     *     title: string,
     *     description?: string|null,
     *     steps_to_reproduce?: string|null,
     *     severity: 'blocker'|'critical'|'major'|'minor',
     *     assigned_to?: string|null,
     *     logged_by?: string
     * } $data
     */
    public function execute(array $data, string $userName = 'Võ Hoàng Tú', string $userRole = 'Lead QA/Architect'): Defect
    {
        $defect = $this->defectRepository->create([
            'project_id' => $data['project_id'],
            'rtm_trace_id' => $data['rtm_trace_id'] ?? null,
            'defect_code' => strtoupper($data['defect_code']),
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'steps_to_reproduce' => $data['steps_to_reproduce'] ?? null,
            'severity' => $data['severity'] ?? 'major',
            'status' => 'open',
            'assigned_to' => $data['assigned_to'] ?? null,
            'logged_by' => $data['logged_by'] ?? $userName,
        ]);

        // If bound to RTM trace, update RTM defect_code
        if (! empty($data['rtm_trace_id'])) {
            $trace = RTMTrace::find($data['rtm_trace_id']);
            if ($trace) {
                $existingCodes = $trace->defect_code ? explode(', ', $trace->defect_code) : [];
                if (! in_array($defect->defect_code, $existingCodes)) {
                    $existingCodes[] = $defect->defect_code;
                    $trace->update(['defect_code' => implode(', ', $existingCodes)]);
                }
            }
        }

        // Record Audit Log with digital non-repudiation signature
        $this->recordAuditLogAction->execute(
            projectId: $data['project_id'],
            userName: $userName,
            userRole: $userRole,
            actionType: 'DEFECT_LOGGED',
            entityType: 'Defect',
            entityId: $defect->id,
            details: [
                'defect_code' => $defect->defect_code,
                'severity' => $defect->severity,
                'title' => $defect->title,
                'rtm_trace_id' => $defect->rtm_trace_id,
            ]
        );

        return $defect;
    }
}
