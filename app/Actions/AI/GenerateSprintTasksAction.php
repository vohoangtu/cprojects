<?php

namespace App\Actions\AI;

use App\Actions\Agile\CreateTaskAction;
use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;
use App\Models\Sprint;
use Illuminate\Support\Collection;

class GenerateSprintTasksAction
{
    public function __construct(
        protected CreateTaskAction $createTaskAction,
        protected RecordAuditLogAction $recordAuditLogAction,
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

        $standardTaskTemplates = [
            [
                'code_suffix' => 'TSK-01',
                'title' => 'Thiết kế Database Schema Migrations & Data Seeders',
                'description' => "Khởi tạo các bảng cơ sở dữ liệu cốt lõi chuẩn 3NF, cấu hình khóa ngoại và indexes theo đặc tả ERD cho dự án {$project->name}.",
                'points' => 5,
                'status' => 'done',
            ],
            [
                'code_suffix' => 'TSK-02',
                'title' => 'Cài đặt Xác thực OIDC / JWT & Middleware RBAC',
                'description' => 'Triển khai luồng xác thực bảo mật đa lớp, phân quyền theo vai trò (Lead SA, Tech Lead, Developer, QA).',
                'points' => 5,
                'status' => 'done',
            ],
            [
                'code_suffix' => 'TSK-03',
                'title' => 'Triển khai Action Classes & Nghiệp vụ Lõi',
                'description' => 'Viết các Action xử lý đơn trách nhiệm (Single Responsibility), validation Form Requests và trả về DTO chuẩn.',
                'points' => 8,
                'status' => 'in_progress',
            ],
            [
                'code_suffix' => 'TSK-04',
                'title' => 'Tích hợp Sổ cái Kiểm toán Bất biến HMAC-SHA256',
                'description' => 'Ghi log toàn vẹn dữ liệu cho mọi hành động tác động tới tài liệu kỹ thuật và chuyển pha SDLC.',
                'points' => 5,
                'status' => 'code_review',
            ],
            [
                'code_suffix' => 'TSK-05',
                'title' => 'Phát triển Giao diện SaaS Fluent 2 Mica Material (React 19)',
                'description' => 'Thiết kế giao diện người dùng tối ưu hóa không gian, hỗ trợ tương tác mượt mà và trực quan hóa tiến độ SDLC.',
                'points' => 8,
                'status' => 'todo',
            ],
            [
                'code_suffix' => 'TSK-06',
                'title' => 'Thiết lập Bộ Kiểm Thử Tự Động Feature Tests (Coverage >= 80%)',
                'description' => 'Viết PHPUnit feature tests kiểm thử toàn bộ luồng nghiệp vụ từ Controller đến Database, tích hợp CI pipeline.',
                'points' => 5,
                'status' => 'todo',
            ],
        ];

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
