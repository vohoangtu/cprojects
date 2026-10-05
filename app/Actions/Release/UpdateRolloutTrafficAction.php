<?php

namespace App\Actions\Release;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\DeploymentRollout;
use App\Models\Project;

class UpdateRolloutTrafficAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Promote Canary traffic or trigger emergency rollback.
     */
    public function execute(
        int $projectId,
        string $releaseVersion,
        int $trafficPercentage,
        bool $isRollback = false,
        ?string $rollbackReason = null,
        string $userName = 'Võ Hoàng Tú',
        string $userRole = 'Lead Solution Architect'
    ): DeploymentRollout {
        $project = Project::findOrFail($projectId);

        $rollout = DeploymentRollout::firstOrCreate(
            [
                'project_id' => $project->id,
                'release_version' => $releaseVersion,
            ],
            [
                'strategy' => 'canary',
                'current_traffic_percentage' => 10,
                'health_status' => 'healthy',
                'deployed_at' => now(),
            ]
        );

        if ($isRollback) {
            $rollout->update([
                'current_traffic_percentage' => 0,
                'health_status' => 'rolled_back',
                'rollback_reason' => $rollbackReason ?? 'Kích hoạt rollback khẩn cấp do phát hiện suy giảm chất lượng dịch vụ.',
            ]);

            $this->recordAuditLogAction->execute(
                projectId: $project->id,
                userName: $userName,
                userRole: $userRole,
                actionType: 'EMERGENCY_ROLLBACK',
                entityType: 'DeploymentRollout',
                entityId: $rollout->id,
                details: [
                    'release_version' => $releaseVersion,
                    'reason' => $rollout->rollback_reason,
                ]
            );
        } else {
            $rollout->update([
                'current_traffic_percentage' => min(100, max(0, $trafficPercentage)),
                'health_status' => 'healthy',
            ]);

            $this->recordAuditLogAction->execute(
                projectId: $project->id,
                userName: $userName,
                userRole: $userRole,
                actionType: 'PROMOTE_CANARY_TRAFFIC',
                entityType: 'DeploymentRollout',
                entityId: $rollout->id,
                details: [
                    'release_version' => $releaseVersion,
                    'traffic_percentage' => $rollout->current_traffic_percentage,
                ]
            );
        }

        return $rollout;
    }
}
