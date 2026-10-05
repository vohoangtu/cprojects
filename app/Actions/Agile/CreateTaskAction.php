<?php

namespace App\Actions\Agile;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\RTMTrace;

class CreateTaskAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Create a new Agile task on the Kanban board and link to RTM.
     *
     * @param array{
     *     project_id: int,
     *     sprint_id?: int|null,
     *     rtm_trace_id?: int|null,
     *     task_code: string,
     *     title: string,
     *     description?: string|null,
     *     story_points?: int,
     *     status?: 'todo'|'in_progress'|'code_review'|'done',
     *     assigned_to?: string|null,
     *     github_pr_url?: string|null
     * } $data
     */
    public function execute(
        array $data,
        string $creatorName = 'Võ Hoàng Tú',
        string $creatorRole = 'Lead Solution Architect'
    ): ProjectTask {
        $project = Project::findOrFail($data['project_id']);

        $task = ProjectTask::create([
            'project_id' => $project->id,
            'sprint_id' => $data['sprint_id'] ?? null,
            'rtm_trace_id' => $data['rtm_trace_id'] ?? null,
            'task_code' => strtoupper($data['task_code']),
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'story_points' => $data['story_points'] ?? 3,
            'status' => $data['status'] ?? 'todo',
            'assigned_to' => $data['assigned_to'] ?? $creatorName,
            'github_pr_url' => $data['github_pr_url'] ?? null,
        ]);

        // If bound to RTM trace and trace is still mapped, advance to in_dev
        if (! empty($data['rtm_trace_id'])) {
            $trace = RTMTrace::find($data['rtm_trace_id']);
            if ($trace && $trace->status === 'mapped') {
                $trace->update(['status' => 'in_dev']);
            }
        }

        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $creatorName,
            userRole: $creatorRole,
            actionType: 'CREATE_AGILE_TASK',
            entityType: 'ProjectTask',
            entityId: $task->id,
            details: [
                'task_code' => $task->task_code,
                'title' => $task->title,
                'story_points' => $task->story_points,
                'rtm_trace_id' => $task->rtm_trace_id,
            ]
        );

        return $task;
    }
}
