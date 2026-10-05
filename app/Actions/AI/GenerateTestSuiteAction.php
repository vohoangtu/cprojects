<?php

namespace App\Actions\AI;

use App\Actions\Audit\RecordAuditLogAction;
use App\Actions\Testing\CreateTestRunAction;
use App\Models\Project;
use App\Models\TestRun;
use App\Services\AI\AIService;

class GenerateTestSuiteAction
{
    public function __construct(
        protected CreateTestRunAction $createTestRunAction,
        protected RecordAuditLogAction $recordAuditLogAction,
        protected AIService $aiService,
    ) {}

    /**
     * Synthesize comprehensive test suite from SRS and Gherkin scenarios for Phase 5 Testing.
     */
    public function execute(
        Project $project,
        string $authorName = 'AI QA Test Suite Generator (Autonomous 99%)',
        string $authorRole = 'Autonomous QA Engineer',
    ): TestRun {
        $timestamp = now()->format('Ymd-Hi');
        $runName = "TR-AI-{$timestamp}: Kiểm Thử Tự Động Toàn Diện (Full Regression Suite)";

        $standardTestItems = $this->aiService->synthesizeTestSuite($project);

        $testRun = $this->createTestRunAction->execute([
            'project_id' => $project->id,
            'name' => $runName,
            'environment' => 'staging',
            'executed_by' => $authorName,
            'items' => $standardTestItems,
        ], userName: $authorName, userRole: $authorRole);

        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $authorName,
            userRole: $authorRole,
            actionType: 'AI_TEST_SUITE_GENERATED',
            entityType: 'TestRun',
            entityId: $testRun->id,
            details: [
                'test_run_id' => $testRun->id,
                'items_count' => count($standardTestItems),
            ]
        );

        return $testRun;
    }
}
