<?php

namespace App\Actions\Projects;

use App\Actions\AI\AnalyzeProjectIdeaAction;
use App\Actions\Audit\RecordAuditLogAction;
use App\Actions\Phases\CalculatePhaseProgressAction;
use App\Models\Project;
use App\Models\Sprint;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Services\AI\AIService;
use Illuminate\Support\Facades\DB;

class CreateProjectFromIdeaAction
{
    public function __construct(
        protected ProjectRepositoryInterface $projectRepository,
        protected AnalyzeProjectIdeaAction $analyzeIdeaAction,
        protected AIService $aiService,
        protected CreateProjectAction $createProjectAction,
        protected CalculatePhaseProgressAction $calculatePhaseProgressAction,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Incubate and initialize a complete enterprise SDLC project from an idea prompt.
     */
    public function execute(
        string $ideaPrompt,
        array $overrides = [],
        string $creatorName = 'Võ Hoàng Tú',
        string $creatorRole = 'Lead Solution Architect',
    ): Project {
        return DB::transaction(function () use ($ideaPrompt, $overrides, $creatorName, $creatorRole) {
            // 1. Analyze Idea via AI Service
            $analysis = $this->analyzeIdeaAction->execute($ideaPrompt, $overrides);

            $projectName = $overrides['name'] ?? $analysis['name'];
            $projectCode = $overrides['code'] ?? $analysis['code'];
            $clientName = $overrides['client_name'] ?? $analysis['client_name'];
            $projectType = $overrides['project_type'] ?? $analysis['project_type'] ?? 'enterprise';
            $budget = ! empty($overrides['budget']) ? (float) $overrides['budget'] : (float) ($analysis['budget'] ?? 250000.00);
            $summary = $analysis['summary'] ?? $ideaPrompt;

            // 2. Initialize project using standard action
            $project = $this->createProjectAction->execute([
                'name' => $projectName,
                'code' => $projectCode,
                'description' => $summary,
                'client_name' => $clientName,
                'project_type' => $projectType,
                'budget' => $budget,
                'target_delivery_date' => now()->addMonths((int) ($analysis['target_delivery_months'] ?? 6))->toDateString(),
            ], creatorName: $creatorName, creatorRole: $creatorRole);

            // 3. Clear generic placeholder documents and synthesize domain-specific documents
            $project->documents()->delete();

            $docTypesToGenerate = [
                ['phase' => 1, 'type' => 'CHARTER', 'title' => 'Hiến Chương Dự Án (Project Charter)', 'status' => 'approved'],
                ['phase' => 1, 'type' => 'BRD', 'title' => 'Tài Liệu Yêu Cầu Nghiệp Vụ (BRD)', 'status' => 'approved'],
                ['phase' => 1, 'type' => 'SRS', 'title' => 'Đặc Tả Yêu Cầu Kỹ Thuật (SRS - IEEE 830)', 'status' => 'approved'],
                ['phase' => 1, 'type' => 'STORIES', 'title' => 'User Stories & Kịch Bản Gherkin BDD', 'status' => 'approved'],
                ['phase' => 2, 'type' => 'SAD', 'title' => 'Thiết Kế Kiến Trúc Hệ Thống (SAD - C4 Model)', 'status' => 'under_review'],
                ['phase' => 2, 'type' => 'ERD', 'title' => 'Sơ Đồ Thực Thể CSDL (Database ERD & Data Dictionary)', 'status' => 'under_review'],
                ['phase' => 2, 'type' => 'OPENAPI', 'title' => 'Đặc Tả Giao Diện RESTful API (OpenAPI 3.1)', 'status' => 'under_review'],
                ['phase' => 2, 'type' => 'STRIDE', 'title' => 'Mô Hình Hăm Dọa An Ninh Mạng (STRIDE Threat Model)', 'status' => 'under_review'],
                ['phase' => 3, 'type' => 'WBS', 'title' => 'Cơ Cấu Phân Rã Gói Công Việc (WBS < 40h)', 'status' => 'draft'],
                ['phase' => 3, 'type' => 'RISK', 'title' => 'Sổ Đăng Ký Rủi Ro & Kế Hoạch Ứng Phó (Risk Register)', 'status' => 'draft'],
                ['phase' => 4, 'type' => 'CODING_STANDARDS', 'title' => 'Quy Chuẩn Lập Trình & Code Review Guidelines', 'status' => 'draft'],
                ['phase' => 4, 'type' => 'UNIT_TEST_PLAN', 'title' => 'Kế Hoạch & Ma Trận Kiểm Thử Đơn Vị (Coverage >= 80%)', 'status' => 'draft'],
                ['phase' => 5, 'type' => 'STP', 'title' => 'Kế Hoạch Kiểm Thử Phần Mềm Tổng Thể (STP)', 'status' => 'draft'],
                ['phase' => 6, 'type' => 'RUNBOOK', 'title' => 'Kịch Bản Triển Khai Sản Xuất Từng Phút (Runbook)', 'status' => 'draft'],
                ['phase' => 7, 'type' => 'SLA_MATRIX', 'title' => 'Ma Trận Cam Kết Dịch Vụ Vận Hành (SLA Matrix)', 'status' => 'draft'],
                ['phase' => 7, 'type' => 'RETROSPECTIVE', 'title' => 'Biên Bản Đánh Giá Hậu Kiểm & Rút Kinh Nghiệm (Retrospective)', 'status' => 'draft'],
            ];

            foreach ($docTypesToGenerate as $item) {
                $content = $this->aiService->synthesizeDocument($project, $item['type'], $ideaPrompt);
                $contentHash = hash('sha256', $content);
                $sig = $item['status'] === 'approved'
                    ? 'SIG-'.strtoupper(hash_hmac('sha256', "{$project->id}:{$item['type']}:{$contentHash}", config('app.key', 'mcms-key')))
                    : null;

                $project->documents()->create([
                    'phase_number' => $item['phase'],
                    'doc_type' => $item['type'],
                    'title' => $item['title'],
                    'version' => '1.0.0',
                    'status' => $item['status'],
                    'content' => $content,
                    'signed_off_by' => $item['status'] === 'approved' ? $creatorName : null,
                    'signed_off_at' => $item['status'] === 'approved' ? now() : null,
                    'signature_hash' => $sig,
                ]);
            }

            // 4. Clear generic RTM traces and create AI domain-specific RTM traces
            $project->rtmTraces()->delete();
            $rtmItems = $analysis['initial_rtm'] ?? [];
            if (empty($rtmItems) && ! empty($analysis['functional_requirements'])) {
                foreach ($analysis['functional_requirements'] as $idx => $req) {
                    $rtmItems[] = [
                        'req_code' => $req['code'],
                        'req_title' => $req['title'],
                        'story' => sprintf('US-%02d', $idx + 1),
                        'test' => sprintf('TC-%02d', $idx + 1),
                        'status' => 'in_dev',
                    ];
                }
            }

            foreach ($rtmItems as $rtm) {
                $project->rtmTraces()->create([
                    'req_code' => $rtm['req_code'],
                    'req_title' => $rtm['req_title'],
                    'user_story_code' => $rtm['story'] ?? null,
                    'commit_or_pr' => 'Branch feat/'.strtolower(str_replace(' ', '-', (string) $rtm['req_code'])),
                    'test_case_code' => $rtm['test'] ?? null,
                    'release_version' => 'v1.0.0-rc1',
                    'status' => $rtm['status'] ?? 'in_dev',
                ]);
            }

            // 5. Initialize tailored Sprint 1 & Kanban Tasks
            $sprint = Sprint::create([
                'project_id' => $project->id,
                'sprint_number' => 1,
                'name' => 'Sprint 1: Nền Tảng Kiến Trúc & Nghiệp Vụ Cốt Lõi',
                'goal' => "Hoàn thiện kiến trúc cơ bản, cơ sở dữ liệu và API cho bài toán {$projectName}",
                'start_date' => now()->toDateString(),
                'end_date' => now()->addWeeks(2)->toDateString(),
                'status' => 'active',
            ]);

            $customTasks = $this->aiService->synthesizeSprintTasks($project);
            foreach ($customTasks as $taskData) {
                $project->tasks()->create([
                    'sprint_id' => $sprint->id,
                    'task_code' => "{$project->code}-{$taskData['code_suffix']}",
                    'title' => $taskData['title'],
                    'description' => $taskData['description'],
                    'story_points' => $taskData['points'],
                    'status' => $taskData['status'],
                    'priority' => 'high',
                    'assignee_name' => $creatorName,
                ]);
            }

            // 6. Calculate dynamic phase progress
            $this->calculatePhaseProgressAction->execute($project);

            // 7. Record Immutable Audit Log
            $this->recordAuditLogAction->execute(
                projectId: $project->id,
                userName: $creatorName,
                userRole: $creatorRole,
                actionType: 'PROJECT_AI_INCUBATED',
                entityType: 'Project',
                entityId: $project->id,
                details: [
                    'idea_prompt' => $ideaPrompt,
                    'domain' => $analysis['domain'] ?? 'General',
                    'analyzed_requirements_count' => count($analysis['functional_requirements'] ?? []),
                    'synthesized_documents_count' => count($docTypesToGenerate),
                    'initial_tasks_count' => count($customTasks),
                ]
            );

            return $project->fresh(['phases', 'qualityGates', 'documents', 'rtmTraces', 'tasks', 'sprints']);
        });
    }
}
