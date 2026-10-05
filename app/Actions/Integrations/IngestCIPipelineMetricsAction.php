<?php

namespace App\Actions\Integrations;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\CIPipelineMetric;
use App\Models\Project;

class IngestCIPipelineMetricsAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Ingest automated CI/CD pipeline build & code quality metrics.
     *
     * @param array{
     *     project_id: int,
     *     build_number: string,
     *     branch?: string,
     *     commit_sha: string,
     *     unit_test_passed: int,
     *     unit_test_failed: int,
     *     coverage_percentage: float|int,
     *     code_smells_count?: int,
     *     vulnerabilities_count?: int,
     *     sast_status?: 'passed'|'failed',
     *     pipeline_status?: 'success'|'failed'|'running'
     * } $payload
     */
    public function execute(array $payload, string $reporter = 'CI/CD Automation Runner'): CIPipelineMetric
    {
        $project = Project::findOrFail($payload['project_id']);

        $metric = CIPipelineMetric::create([
            'project_id' => $project->id,
            'build_number' => $payload['build_number'],
            'branch' => $payload['branch'] ?? 'main',
            'commit_sha' => $payload['commit_sha'],
            'unit_test_passed' => $payload['unit_test_passed'],
            'unit_test_failed' => $payload['unit_test_failed'],
            'coverage_percentage' => (float) $payload['coverage_percentage'],
            'code_smells_count' => $payload['code_smells_count'] ?? 0,
            'vulnerabilities_count' => $payload['vulnerabilities_count'] ?? 0,
            'sast_status' => $payload['sast_status'] ?? 'passed',
            'pipeline_status' => $payload['pipeline_status'] ?? 'success',
        ]);

        // Update Project Health Status if build failed or vulnerabilities detected
        if ($metric->pipeline_status === 'failed' || $metric->sast_status === 'failed' || $metric->coverage_percentage < 70) {
            $project->update(['health_status' => 'warning']);
        } elseif ($metric->pipeline_status === 'success' && $metric->coverage_percentage >= 80) {
            $project->update(['health_status' => 'healthy']);
        }

        // Record Audit Trail
        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $reporter,
            userRole: 'DevOps CI/CD Agent',
            actionType: 'CI_METRICS_INGESTED',
            entityType: 'CIPipelineMetric',
            entityId: $metric->id,
            details: [
                'build_number' => $metric->build_number,
                'coverage' => "{$metric->coverage_percentage}%",
                'unit_test_summary' => "{$metric->unit_test_passed} passed, {$metric->unit_test_failed} failed",
                'sast_status' => $metric->sast_status,
                'vulnerabilities' => $metric->vulnerabilities_count,
            ]
        );

        return $metric;
    }
}
