<?php

namespace App\Actions\Testing;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\TestRunItem;

class ExecuteTestItemAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Execute and record the status of an individual test case item.
     *
     * @param  'passed'|'failed'|'blocked'|'skipped'  $status
     */
    public function execute(
        int $itemId,
        string $status,
        ?string $actualResult = null,
        string $userName = 'Võ Hoàng Tú',
        string $userRole = 'QA Lead'
    ): TestRunItem {
        $item = TestRunItem::findOrFail($itemId);
        $testRun = $item->testRun;

        $item->status = $status;
        $item->actual_result = $actualResult ?? ($status === 'passed' ? 'Thực thi thành công, kết quả khớp 100% kỳ vọng.' : 'Phát hiện lỗi không khớp kỳ vọng.');
        $item->save();

        // Update TestRun overall status if all items completed
        $pendingCount = $testRun->items()->where('status', 'pending')->count();
        if ($pendingCount === 0) {
            $failedCount = $testRun->items()->whereIn('status', ['failed', 'blocked'])->count();
            $testRun->status = $failedCount > 0 ? 'failed' : 'passed';
            $testRun->completed_at = now();
            $testRun->save();
        }

        // If passed and linked to RTM, advance RTM status to tested or passed
        if ($status === 'passed' && $item->rtm_trace_id) {
            $trace = $item->rtmTrace;
            if ($trace && in_array($trace->status, ['mapped', 'in_dev', 'tested'])) {
                $trace->update(['status' => 'passed']);
            }
        }

        $this->recordAuditLogAction->execute(
            projectId: $testRun->project_id,
            userName: $userName,
            userRole: $userRole,
            actionType: 'EXECUTE_TEST_ITEM',
            entityType: 'TestRunItem',
            entityId: $item->id,
            details: [
                'test_case_code' => $item->test_case_code,
                'status' => $status,
                'test_run_name' => $testRun->name,
            ]
        );

        return $item;
    }
}
