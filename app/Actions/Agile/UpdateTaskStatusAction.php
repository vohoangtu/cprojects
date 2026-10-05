<?php

namespace App\Actions\Agile;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\ProjectTask;

class UpdateTaskStatusAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Update task status on the Kanban board.
     *
     * @param  'todo'|'in_progress'|'code_review'|'done'  $newStatus
     */
    public function execute(
        int $taskId,
        string $newStatus,
        ?string $githubPrUrl = null,
        string $userName = 'Võ Hoàng Tú',
        string $userRole = 'Lead Solution Architect'
    ): ProjectTask {
        $task = ProjectTask::findOrFail($taskId);
        $oldStatus = $task->status;

        $task->status = $newStatus;
        if ($newStatus === 'done') {
            $task->completed_at = now();
        } else {
            $task->completed_at = null;
        }

        if ($githubPrUrl !== null) {
            $task->github_pr_url = $githubPrUrl;
        }

        $task->save();

        // If task has RTM trace and task is done, update RTM trace commit_or_pr if PR provided
        if ($task->rtm_trace_id && $task->github_pr_url) {
            $trace = $task->rtmTrace;
            if ($trace && empty($trace->commit_or_pr)) {
                $trace->update(['commit_or_pr' => $task->github_pr_url]);
            }
        }

        $this->recordAuditLogAction->execute(
            projectId: $task->project_id,
            userName: $userName,
            userRole: $userRole,
            actionType: 'UPDATE_TASK_STATUS',
            entityType: 'ProjectTask',
            entityId: $task->id,
            details: [
                'task_code' => $task->task_code,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]
        );

        return $task;
    }
}
