<?php

namespace App\Actions\Testing;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;
use App\Models\TestRun;
use App\Models\TestRunItem;

class CreateTestRunAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Create a new Test Run and populate test items from RTM traces or manual inputs.
     *
     * @param array{
     *     project_id: int,
     *     name: string,
     *     environment?: 'staging'|'uat'|'performance'|'production',
     *     executed_by?: string,
     *     items?: array<int, array{
     *         rtm_trace_id?: int|null,
     *         test_case_code: string,
     *         title: string,
     *         steps?: string|null,
     *         expected_result?: string|null
     *     }>
     * } $data
     */
    public function execute(
        array $data,
        string $userName = 'Võ Hoàng Tú',
        string $userRole = 'Lead QA/Architect'
    ): TestRun {
        $project = Project::findOrFail($data['project_id']);

        $testRun = TestRun::create([
            'project_id' => $project->id,
            'name' => $data['name'],
            'environment' => $data['environment'] ?? 'staging',
            'status' => 'running',
            'executed_by' => $data['executed_by'] ?? $userName,
            'started_at' => now(),
        ]);

        // If items are explicitly provided
        if (! empty($data['items'])) {
            foreach ($data['items'] as $item) {
                TestRunItem::create([
                    'test_run_id' => $testRun->id,
                    'rtm_trace_id' => $item['rtm_trace_id'] ?? null,
                    'test_case_code' => strtoupper($item['test_case_code']),
                    'title' => $item['title'],
                    'steps' => $item['steps'] ?? null,
                    'expected_result' => $item['expected_result'] ?? null,
                    'status' => 'pending',
                ]);
            }
        } else {
            // Auto-populate from project's RTM traces
            foreach ($project->rtmTraces as $trace) {
                TestRunItem::create([
                    'test_run_id' => $testRun->id,
                    'rtm_trace_id' => $trace->id,
                    'test_case_code' => $trace->test_case_code ?: 'TC-'.substr(md5($trace->req_code), 0, 6),
                    'title' => 'Kiểm thử nghiệm thu chức năng: '.$trace->req_title,
                    'steps' => '1. Mở giao diện tương ứng với '.$trace->req_code."\n2. Thực hiện các thao tác theo User Story ".$trace->user_story_code."\n3. Kiểm tra kết quả phản hồi",
                    'expected_result' => 'Hệ thống phản hồi thành công mã HTTP 200, dữ liệu chính xác và không có exception.',
                    'status' => 'pending',
                ]);
            }
        }

        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $userName,
            userRole: $userRole,
            actionType: 'CREATE_TEST_RUN',
            entityType: 'TestRun',
            entityId: $testRun->id,
            details: [
                'name' => $testRun->name,
                'environment' => $testRun->environment,
                'items_count' => $testRun->items()->count(),
            ]
        );

        return $testRun;
    }
}
