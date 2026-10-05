<?php

namespace App\Actions\AI;

use App\Actions\Agile\CreateTaskAction;
use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;
use App\Models\Sprint;
use App\Services\AI\AIService;
use Illuminate\Support\Collection;

class GenerateSprintTasksAction
{
    public function __construct(
        protected CreateTaskAction $createTaskAction,
        protected RecordAuditLogAction $recordAuditLogAction,
        protected AIService $aiService,
    ) {}

    /**
     * Synthesize standard Agile tasks from WBS and SRS for Kanban sprint board.
     *
     * @return array{total_tasks: int, tasks: Collection}
     */
    public function execute(
        Project $project,
        string $authorName = 'AI Agile Coach (Autonomous 99%)',
        string $authorRole = 'Autonomous Scrum Master',
    ): array {
        // Ensure at least one active sprint exists
        $sprint = $project->sprints()->where('status', 'active')->first();
        if (! $sprint) {
            $sprint = $project->sprints()->create([
                'sprint_number' => 1,
                'name' => 'Sprint 1: MVP Core Architecture & Critical Workflows',
                'goal' => "Thiết lập nền tảng kiến trúc, cơ sở dữ liệu và các API trọng yếu cho dự án {$project->name}",
                'start_date' => now()->toDateString(),
                'end_date' => now()->addWeeks(2)->toDateString(),
                'status' => 'active',
            ]);
        }

        $standardTaskTemplates = $this->aiService->synthesizeSprintTasks($project);

        $createdTasks = collect();
        $existingCodes = $project->tasks()->pluck('task_code')->toArray();

        foreach ($standardTaskTemplates as $tpl) {
            $taskCode = "{$project->code}-{$tpl['code_suffix']}";
            if (in_array($taskCode, $existingCodes)) {
                continue;
            }

            $task = $this->createTaskAction->execute([
                'project_id' => $project->id,
                'sprint_id' => $sprint->id,
                'task_code' => $taskCode,
                'title' => $tpl['title'],
                'description' => $tpl['description'],
                'story_points' => $tpl['points'],
                'status' => $tpl['status'],
                'assigned_to' => 'Võ Hoàng Tú',
            ], creatorName: $authorName, creatorRole: $authorRole);

            $createdTasks->push($task);
        }

        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $authorName,
            userRole: $authorRole,
            actionType: 'AI_SPRINT_TASKS_GENERATED',
            entityType: 'Sprint',
            entityId: $sprint->id,
            details: [
                'sprint_id' => $sprint->id,
                'tasks_count' => $createdTasks->count(),
            ]
        );

        return [
            'total_tasks' => $createdTasks->count(),
            'tasks' => $createdTasks,
        ];
    }
}
