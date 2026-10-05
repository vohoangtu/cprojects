<?php

namespace App\Actions\Audit;

use App\Models\AuditLog;
use App\Repositories\Contracts\AuditLogRepositoryInterface;

class RecordAuditLogAction
{
    public function __construct(
        protected AuditLogRepositoryInterface $auditRepository,
    ) {}

    public function execute(
        ?int $projectId,
        string $userName,
        string $userRole,
        string $actionType,
        string $entityType,
        ?int $entityId,
        array $details = [],
        ?string $ipAddress = null,
    ): AuditLog {
        $timestamp = now()->toIso8601String();
        $payload = json_encode([
            'project_id' => $projectId,
            'user' => $userName,
            'role' => $userRole,
            'action' => $actionType,
            'entity' => "{$entityType}:{$entityId}",
            'time' => $timestamp,
            'details' => $details,
        ]);

        // Cryptographic Non-repudiation Digital Fingerprint (HMAC-SHA256)
        $fingerprint = hash_hmac('sha256', $payload, config('app.key', 'mcms-secret-key-2026'));

        return $this->auditRepository->create([
            'project_id' => $projectId,
            'user_name' => $userName,
            'user_role' => $userRole,
            'action_type' => $actionType,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details,
            'digital_fingerprint' => $fingerprint,
            'ip_address' => $ipAddress ?? request()->ip() ?? '127.0.0.1',
        ]);
    }
}
