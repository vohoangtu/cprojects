<?php

namespace App\Actions\AI;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;
use App\Models\ProjectDocument;
use Illuminate\Support\Collection;

class BatchSynthesizeProjectDocumentsAction
{
    public function __construct(
        protected GenerateSDLCDocumentAction $generateDocAction,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Standard SDLC deliverables catalog mapped by phase.
     *
     * @var array<int, array<int, array{type: string, title: string, prompt: string}>>
     */
    protected array $phaseDeliverableCatalog = [
        1 => [
            ['type' => 'CHARTER', 'title' => 'Hiến Chương Dự Án (Project Charter)', 'prompt' => 'Hiến chương khởi tạo dự án, mục tiêu kinh doanh, phạm vi tài chính và cam kết chuẩn mực SDLC.'],
            ['type' => 'BRD', 'title' => 'Tài Liệu Yêu Cầu Nghiệp Vụ (BRD)', 'prompt' => 'Khảo sát quy trình nghiệp vụ lõi, bài toán người dùng và các quy tắc nghiệp vụ quan trọng.'],
            ['type' => 'SRS', 'title' => 'Đặc Tả Yêu Cầu Phần Mềm (SRS - Chuẩn IEEE 830)', 'prompt' => 'Yêu cầu chức năng, phi chức năng, tiêu chuẩn bảo mật, thời gian đáp ứng API <= 50ms.'],
            ['type' => 'STORIES', 'title' => 'Danh Sách User Stories & Kịch Bản Gherkin BDD', 'prompt' => 'Tập hợp User Stories chi tiết với kịch bản kiểm thử hành vi Given-When-Then.'],
        ],
        2 => [
            ['type' => 'SAD', 'title' => 'Tài Liệu Thiết Kế Kiến Trúc Hệ Thống (SAD - C4 Model)', 'prompt' => 'Kiến trúc C4 Model: Context, Container, Component, Code. Tích hợp Clean Architecture.'],
            ['type' => 'ERD', 'title' => 'Sơ Đồ Thực Thể Dữ Liệu & Từ Điển Dữ Liệu (Database ERD)', 'prompt' => 'Mô hình quan hệ cơ sở dữ liệu chuẩn hóa 3NF, cấu trúc bảng, chỉ mục Indexing và quan hệ khóa.'],
            ['type' => 'OPENAPI', 'title' => 'Đặc Tả Giao Diện Lập Trình RESTful API (OpenAPI 3.1)', 'prompt' => 'Đặc tả chi tiết endpoints HTTP, request body JSON schema, header xác thực và mã lỗi chuẩn.'],
            ['type' => 'STRIDE', 'title' => 'Mô Hình Hăm Dọa An Ninh Thông Tin (STRIDE Threat Model)', 'prompt' => 'Đánh giá 6 nguy cơ bảo mật STRIDE: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, EoP.'],
        ],
        3 => [
            ['type' => 'WBS', 'title' => 'Cơ Cấu Phân Rã Công Việc (Work Breakdown Structure - WBS)', 'prompt' => 'Phân rã các gói công việc thành nhiệm vụ kỹ thuật có độ dài dưới 40 giờ làm việc.'],
            ['type' => 'RISK', 'title' => 'Sổ Đăng Ký Rủi Ro & Kế Hoạch Ứng Phó (Risk Register)', 'prompt' => 'Phân tích ma trận xác suất và tác động của rủi ro kỹ thuật, phương án dự phòng chi tiết.'],
        ],
        4 => [
            ['type' => 'CODING_STANDARDS', 'title' => 'Bộ Quy Chuẩn Lập Trình & Code Review (Clean Code Guideline)', 'prompt' => 'Quy chuẩn lập trình PSR-12, TypeScript ESLint, quy tắc đặt tên, quản lý exception và review code.'],
            ['type' => 'UNIT_TEST_PLAN', 'title' => 'Kế Hoạch & Ma Trận Kiểm Thử Đơn Vị (Unit Test Coverage >= 80%)', 'prompt' => 'Chiến lược bao phủ Unit test cho các service logic, mock ngoại vi và tiêu chuẩn CI/CD pass.'],
        ],
        5 => [
            ['type' => 'STP', 'title' => 'Kế Hoạch Kiểm Thử Tổng Thể (Software Test Plan - STP)', 'prompt' => 'Chiến lược kiểm thử Functional, Non-Functional, Regression, Security SAST/DAST và tiêu chí nghiệm thu.'],
            ['type' => 'UAT_RECORD', 'title' => 'Biên Bản Nghiệm Thu Chấp Nhận Người Dùng (UAT Sign-off Record)', 'prompt' => 'Biên bản nghiệm thu thực tế với sự tham gia của QA Lead và đại diện khách hàng.'],
        ],
        6 => [
            ['type' => 'RUNBOOK', 'title' => 'Kịch Bản Triển Khai Sản Xuất Từng Phút (Deployment Runbook)', 'prompt' => 'Lộ trình thao tác chi tiết theo mốc thời gian T-30m, T-0, T+15m đảm bảo không gián đoạn dịch vụ.'],
            ['type' => 'ROLLBACK_DR', 'title' => 'Phương Án Phục Hồi Thảm Họa & Rollback Khẩn Cấp (Disaster Recovery)', 'prompt' => 'Kịch bản đảo ngược khẩn cấp chuyển traffic về cụm Blue trong 3 phút, RTO <= 5m, RPO = 0.'],
            ['type' => 'RELEASE_NOTES', 'title' => 'Ghi Chú Phát Hành & Hướng Dẫn Nâng Cấp (Release Notes)', 'prompt' => 'Bản mô tả chi tiết tính năng mới, bản vá bảo mật, thay đổi breaking changes và hướng dẫn sử dụng.'],
        ],
        7 => [
            ['type' => 'SLA_MATRIX', 'title' => 'Ma Trận Cam Kết Chất Lượng Dịch Vụ Vận Hành (SLA Matrix)', 'prompt' => 'Chỉ tiêu cam kết Uptime 99.95%, thời gian phản hồi MTTD/MTTR theo các cấp độ sự cố P1/P2/P3.'],
            ['type' => 'RETROSPECTIVE', 'title' => 'Biên Bản Đánh Giá Hậu Kiểm & Rút Kinh Nghiệm (Sprint Retrospective)', 'prompt' => 'Tổng kết những điểm làm tốt, tồn tại cần cải tiến và bài học kinh nghiệm cho chu kỳ SDLC tiếp theo.'],
        ],
    ];

    /**
     * Batch synthesize documents for a specific phase or all 7 phases.
     *
     * @return array{total_synthesized: int, documents: Collection<int, ProjectDocument>}
     */
    public function execute(
        Project $project,
        ?int $targetPhaseNumber = null,
        string $authorName = 'AI SDLC Copilot Engine (Autonomous 99%)',
        string $authorRole = 'Autonomous AI Solution Architect',
    ): array {
        $phasesToProcess = $targetPhaseNumber !== null
            ? [$targetPhaseNumber]
            : [1, 2, 3, 4, 5, 6, 7];

        $synthesizedDocs = collect();

        foreach ($phasesToProcess as $phaseNum) {
            $deliverables = $this->phaseDeliverableCatalog[$phaseNum] ?? [];

            foreach ($deliverables as $deliverable) {
                // Check if document already exists
                $existing = $project->documents()
                    ->where('phase_number', $phaseNum)
                    ->where('doc_type', $deliverable['type'])
                    ->first();

                if (! $existing) {
                    // Generate new document with contextual prompt based on project metadata
                    $contextualPrompt = "{$deliverable['prompt']} Áp dụng chuyên biệt cho dự án '{$project->name}' (Mã: {$project->code}), khách hàng: {$project->client_name}, loại hình: {$project->project_type}, ngân sách: ".number_format($project->budget, 0, ',', '.').' USD.';

                    $doc = $this->generateDocAction->execute(
                        project: $project,
                        docType: $deliverable['type'],
                        topicPrompt: $contextualPrompt,
                        phaseNumber: $phaseNum,
                        authorName: $authorName,
                        authorRole: $authorRole
                    );

                    $synthesizedDocs->push($doc);
                }
            }
        }

        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $authorName,
            userRole: $authorRole,
            actionType: 'AI_BATCH_SYNTHESIS',
            entityType: 'Project',
            entityId: $project->id,
            details: [
                'target_phase' => $targetPhaseNumber ?? 'ALL_7_PHASES',
                'synthesized_count' => $synthesizedDocs->count(),
                'document_types' => $synthesizedDocs->pluck('doc_type')->toArray(),
            ]
        );

        return [
            'total_synthesized' => $synthesizedDocs->count(),
            'documents' => $synthesizedDocs,
        ];
    }
}
