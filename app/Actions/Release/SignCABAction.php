<?php

namespace App\Actions\Release;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\CABSignoff;
use App\Models\Project;

class SignCABAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Sign off on CAB release approval for a specific governance role.
     *
     * @param  'LEAD_ARCHITECT'|'SECOPS_LEAD'|'PRODUCT_OWNER'  $roleRequired
     * @param  'approved'|'rejected'  $decision
     */
    public function execute(
        int $projectId,
        string $releaseVersion,
        string $roleRequired,
        string $signerName,
        string $decision,
        ?string $notes = null
    ): CABSignoff {
        $project = Project::findOrFail($projectId);

        // Compute HMAC signature token
        $secret = config('app.key', 'mcms_sdlc_hmac_secret_key_2026');
        $signaturePayload = "CAB|{$project->id}|{$releaseVersion}|{$roleRequired}|{$signerName}|{$decision}|".now()->timestamp;
        $token = 'CAB-SIG-'.strtoupper(substr(hash_hmac('sha256', $signaturePayload, $secret), 0, 16));

        $signoff = CABSignoff::updateOrCreate(
            [
                'project_id' => $project->id,
                'release_version' => $releaseVersion,
                'role_required' => $roleRequired,
            ],
            [
                'signer_name' => $signerName,
                'decision' => $decision,
                'sign_token' => $token,
                'notes' => $notes,
                'signed_at' => now(),
            ]
        );

        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $signerName,
            userRole: $roleRequired,
            actionType: 'CAB_SIGNOFF',
            entityType: 'CABSignoff',
            entityId: $signoff->id,
            details: [
                'release_version' => $releaseVersion,
                'role' => $roleRequired,
                'decision' => $decision,
                'token' => $token,
            ]
        );

        return $signoff;
    }

    /**
     * Check if all 3 required CAB roles have approved the release version.
     */
    public function isFullyApproved(int $projectId, string $releaseVersion): bool
    {
        $requiredRoles = ['LEAD_ARCHITECT', 'SECOPS_LEAD', 'PRODUCT_OWNER'];

        $approvedRoles = CABSignoff::where('project_id', $projectId)
            ->where('release_version', $releaseVersion)
            ->where('decision', 'approved')
            ->pluck('role_required')
            ->toArray();

        foreach ($requiredRoles as $role) {
            if (! in_array($role, $approvedRoles)) {
                return false;
            }
        }

        return true;
    }
}
