<?php

namespace App\Actions\Gates;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\QualityGate;
use App\Repositories\Contracts\DefectRepositoryInterface;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\QualityGateRepositoryInterface;
use Illuminate\Support\Facades\DB;

class ApproveQualityGateAction
{
    public function __construct(
        protected QualityGateRepositoryInterface $gateRepository,
        protected ProjectRepositoryInterface $projectRepository,
        protected DefectRepositoryInterface $defectRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    public function execute(
        int $gateId,
        string $approverName,
        string $approverRole,
        ?string $notes = null,
        ?string $overrideReason = null,
    ): QualityGate {
        return DB::transaction(function () use ($gateId, $approverName, $approverRole, $notes, $overrideReason) {
            $gate = $this->gateRepository->findById($gateId);
            if (! $gate) {
                throw new \InvalidArgumentException("Quality Gate with ID {$gateId} not found.");
            }

            $project = $gate->project;
            $currentPhase = $gate->phase;

            // Gate 4 Enforcer: Code Quality & Security Baseline
            if ($gate->gate_number === 4) {
                $latestCi = $project->ciPipelineMetrics()->latest()->first();
                if ($latestCi && ($latestCi->coverage_percentage < 80.0 || $latestCi->sast_status === 'failed')) {
                    if (empty($overrideReason)) {
                        throw new \DomainException("Cổng 4 (Code Quality Gate) bị khóa: Độ bao phủ Unit Test ({$latestCi->coverage_percentage}%) chưa đạt chuẩn >= 80% hoặc quét bảo mật SAST chưa đạt chuẩn. Chỉ Lead Solution Architect (Võ Hoàng Tú) mới có quyền phê duyệt ghi đè (Override) kèm lý do kỹ thuật.");
                    }
                    $notes = "[SA OVERRIDE - LÝ DO: {$overrideReason}] ".($notes ?? '');
                }
            }

            // Gate 5 Enforcer: QA Testing & Zero Blocker Bugs Baseline
            if ($gate->gate_number === 5) {
                $blockerCount = $this->defectRepository->countUnresolvedBlockers($project->id);
                if ($blockerCount > 0) {
                    if (empty($overrideReason)) {
                        throw new \DomainException("Cổng 5 (QA Testing Gate) bị khóa: Dự án còn {$blockerCount} lỗi kỹ thuật mức Blocker/Critical chưa được giải quyết. Yêu cầu khắc phục triệt để hoặc cần sự phê chuẩn ghi đè (Override) từ Lead Solution Architect.");
                    }
                    $notes = "[SA OVERRIDE - LÝ DO: {$overrideReason}] ".($notes ?? '');
                }
            }

            // Generate cryptographic non-repudiation digital token
            $signPayload = json_encode([
                'gate_id' => $gate->id,
                'project_id' => $project->id,
                'gate_number' => $gate->gate_number,
                'approver' => $approverName,
                'role' => $approverRole,
                'timestamp' => now()->toIso8601String(),
                'checklist' => $gate->criteria_checklist,
            ]);

            $token = 'QG-SIG-'.strtoupper(hash_hmac('sha256', $signPayload, config('app.key', 'mcms-secret-key-2026')));

            // Update Gate
            $this->gateRepository->updateStatus($gateId, 'passed', [
                'sign_off_token' => $token,
                'sign_off_by' => $approverName,
                'sign_off_role' => $approverRole,
                'sign_off_notes' => $notes,
                'signed_at' => now(),
            ]);

            // Complete current phase
            $currentPhase->update([
                'status' => 'completed',
                'completion_rate' => 100,
                'completed_at' => now(),
            ]);

            // Advance project to next phase
            $nextPhaseNumber = $gate->gate_number + 1;
            if ($nextPhaseNumber <= 7) {
                $this->projectRepository->advancePhase($project->id, $nextPhaseNumber);

                $nextPhase = $project->phases()->where('phase_number', $nextPhaseNumber)->first();
                if ($nextPhase) {
                    $nextPhase->update([
                        'status' => 'active',
                        'started_at' => now(),
                        'completion_rate' => 15,
                    ]);
                }
            } else {
                $project->update(['status' => 'completed']);
            }

            // Record Immutable Audit Log
            $this->recordAuditLogAction->execute(
                projectId: $project->id,
                userName: $approverName,
                userRole: $approverRole,
                actionType: 'GATE_APPROVED',
                entityType: 'QualityGate',
                entityId: $gate->id,
                details: [
                    'gate_number' => $gate->gate_number,
                    'gate_name' => $gate->name,
                    'signature_token' => $token,
                    'advanced_to_phase' => $nextPhaseNumber,
                    'notes' => $notes,
                    'override_reason' => $overrideReason,
                ]
            );

            return $gate->fresh(['phase', 'project']);
        });
    }
}
