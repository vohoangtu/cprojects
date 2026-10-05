<?php

namespace App\Actions\Gates;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\QualityGate;
use App\Repositories\Contracts\QualityGateRepositoryInterface;

class RejectQualityGateAction
{
    public function __construct(
        protected QualityGateRepositoryInterface $gateRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    public function execute(
        int $gateId,
        string $reviewerName,
        string $reviewerRole,
        string $rejectionReason,
    ): QualityGate {
        $gate = $this->gateRepository->findById($gateId);
        if (! $gate) {
            throw new \InvalidArgumentException("Quality Gate with ID {$gateId} not found.");
        }

        $this->gateRepository->updateStatus($gateId, 'rejected', [
            'sign_off_by' => $reviewerName,
            'sign_off_role' => $reviewerRole,
            'sign_off_notes' => $rejectionReason,
            'signed_at' => now(),
        ]);

        $this->recordAuditLogAction->execute(
            projectId: $gate->project_id,
            userName: $reviewerName,
            userRole: $reviewerRole,
            actionType: 'GATE_REJECTED',
            entityType: 'QualityGate',
            entityId: $gate->id,
            details: [
                'gate_number' => $gate->gate_number,
                'gate_name' => $gate->name,
                'reason' => $rejectionReason,
            ]
        );

        return $gate->fresh();
    }
}
