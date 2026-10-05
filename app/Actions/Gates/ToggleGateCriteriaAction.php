<?php

namespace App\Actions\Gates;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\QualityGate;
use App\Repositories\Contracts\QualityGateRepositoryInterface;

class ToggleGateCriteriaAction
{
    public function __construct(
        protected QualityGateRepositoryInterface $gateRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    public function execute(
        int $gateId,
        string $criterion,
        bool $passed,
        string $userName = 'Võ Hoàng Tú',
        string $userRole = 'Solution Architect',
    ): QualityGate {
        $gate = $this->gateRepository->findById($gateId);
        if (! $gate) {
            throw new \InvalidArgumentException("Quality Gate with ID {$gateId} not found.");
        }

        $checklist = $gate->criteria_checklist ?? [];
        $checklist[$criterion] = $passed;

        $gate->update(['criteria_checklist' => $checklist]);

        $this->recordAuditLogAction->execute(
            projectId: $gate->project_id,
            userName: $userName,
            userRole: $userRole,
            actionType: 'GATE_CRITERIA_TOGGLED',
            entityType: 'QualityGate',
            entityId: $gate->id,
            details: [
                'gate_number' => $gate->gate_number,
                'criterion' => $criterion,
                'status' => $passed ? 'passed' : 'pending',
            ]
        );

        return $gate->fresh();
    }
}
