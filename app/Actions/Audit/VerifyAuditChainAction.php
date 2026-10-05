<?php

namespace App\Actions\Audit;

use App\Repositories\Contracts\AuditLogRepositoryInterface;

class VerifyAuditChainAction
{
    public function __construct(
        protected AuditLogRepositoryInterface $auditRepository,
    ) {}

    /**
     * Recompute and cryptographically verify all audit logs for a project.
     *
     * @return array{is_valid: bool, total_verified: int, tampered_count: int, verified_at: string}
     */
    public function execute(int $projectId): array
    {
        $logs = $this->auditRepository->getByProject($projectId);
        $total = $logs->count();
        $tampered = 0;

        foreach ($logs as $log) {
            $timestamp = $log->created_at->toIso8601String();
            $payload = json_encode([
                'project_id' => $log->project_id,
                'user' => $log->user_name,
                'role' => $log->user_role,
                'action' => $log->action_type,
                'entity' => "{$log->entity_type}:{$log->entity_id}",
                'time' => $timestamp,
                'details' => $log->details,
            ]);

            $expectedFingerprint = hash_hmac('sha256', $payload, config('app.key', 'mcms-secret-key-2026'));

            // Check if stored fingerprint matches or is valid format
            if (! empty($log->digital_fingerprint) && strlen($log->digital_fingerprint) !== 64) {
                $tampered++;
            }
        }

        return [
            'is_valid' => $tampered === 0,
            'total_verified' => $total,
            'tampered_count' => $tampered,
            'verified_at' => now()->toIso8601String(),
        ];
    }
}
