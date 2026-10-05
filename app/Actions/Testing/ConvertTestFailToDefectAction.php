<?php

namespace App\Actions\Testing;

use App\Actions\Defects\LogDefectAction;
use App\Models\Defect;
use App\Models\TestRunItem;

class ConvertTestFailToDefectAction
{
    public function __construct(
        protected LogDefectAction $logDefectAction,
    ) {}

    /**
     * Convert a failed test item into a Defect with 1 click.
     *
     * @param  'blocker'|'critical'|'major'|'minor'  $severity
     */
    public function execute(
        int $testRunItemId,
        string $severity = 'blocker',
        ?string $assignedTo = 'Võ Hoàng Tú',
        string $reporter = 'QA Lead (Auto-Converted)'
    ): Defect {
        $item = TestRunItem::findOrFail($testRunItemId);
        $project = $item->testRun->project;

        $defectCount = $project->defects()->count() + 1;
        $defectCode = 'DEF-'.str_pad((string) $defectCount, 3, '0', STR_PAD_LEFT);

        $defect = $this->logDefectAction->execute(
            data: [
                'project_id' => $project->id,
                'rtm_trace_id' => $item->rtm_trace_id,
                'defect_code' => $defectCode,
                'title' => 'Lỗi phát sinh từ Test Case ['.$item->test_case_code.']: '.$item->title,
                'description' => 'Test case thất bại trong đợt kiểm thử "'.$item->testRun->name."\".\nKỳ vọng: ".$item->expected_result."\nThực tế: ".$item->actual_result,
                'steps_to_reproduce' => $item->steps,
                'severity' => $severity,
                'assigned_to' => $assignedTo,
                'logged_by' => $reporter,
            ],
            userName: $reporter,
            userRole: 'QA Testing Automation'
        );

        // Bind defect to test item
        $item->update(['defect_id' => $defect->id]);

        return $defect;
    }
}
