<?php

namespace App\Actions\Defects;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Defect;
use App\Repositories\Contracts\DefectRepositoryInterface;

class ResolveDefectAction
{
    public function __construct(
        protected DefectRepositoryInterface $defectRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Resolve or close a defect with resolution notes and audit logging.
     *
     * @param array{
     *     status: 'resolved'|'closed',
     *     resolution_notes: string
     * } $data
     */
    public function execute(
        int $defectId,
        array $data,
        string $resolverName = 'Võ Hoàng Tú',
        string $resolverRole = 'Lead Solution Architect'
    ): Defect {
        $defect = $this->defectRepository->findById($defectId);

        if (! $defect) {
            throw new \InvalidArgumentException("Defect #{$defectId} không tồn tại.");
        }

        $defect->update([
            'status' => $data['status'],
            'resolution_notes' => $data['resolution_notes'],
            'resolved_at' => now(),
        ]);

        $this->recordAuditLogAction->execute(
            projectId: $defect->project_id,
            userName: $resolverName,
            userRole: $resolverRole,
            actionType: 'DEFECT_RESOLVED',
            entityType: 'Defect',
            entityId: $defect->id,
            details: [
                'defect_code' => $defect->defect_code,
                'status' => $defect->status,
                'resolution_notes' => $data['resolution_notes'],
            ]
        );

        return $defect;
    }
}
