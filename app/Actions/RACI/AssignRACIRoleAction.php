<?php

namespace App\Actions\RACI;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\RACIAssignment;

class AssignRACIRoleAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    public function execute(
        int $projectId,
        array $data,
        string $assignerName = 'Võ Hoàng Tú',
        string $assignerRole = 'Solution Architect',
    ): RACIAssignment {
        $raci = RACIAssignment::create([
            'project_id' => $projectId,
            'activity_name' => $data['activity_name'],
            'phase_number' => $data['phase_number'],
            'responsible' => $data['responsible'],
            'accountable' => $data['accountable'],
            'consulted' => is_array($data['consulted']) ? $data['consulted'] : explode(',', (string) $data['consulted']),
            'informed' => is_array($data['informed']) ? $data['informed'] : explode(',', (string) $data['informed']),
        ]);

        $this->recordAuditLogAction->execute(
            projectId: $projectId,
            userName: $assignerName,
            userRole: $assignerRole,
            actionType: 'RACI_ASSIGNED',
            entityType: 'RACIAssignment',
            entityId: $raci->id,
            details: [
                'activity' => $raci->activity_name,
                'phase' => $raci->phase_number,
                'responsible' => $raci->responsible,
                'accountable' => $raci->accountable,
            ]
        );

        return $raci;
    }
}
