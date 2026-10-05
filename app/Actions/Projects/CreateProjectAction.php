<?php

namespace App\Actions\Projects;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Services\AI\AIService;
use Illuminate\Support\Facades\DB;

class CreateProjectAction
{
    public function __construct(
        protected ProjectRepositoryInterface $projectRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
        protected AIService $aiService,
    ) {}

    public function execute(array $data, string $creatorName = 'Lead Architect', string $creatorRole = 'Solution Architect'): Project
    {
        return DB::transaction(function () use ($data, $creatorName, $creatorRole) {
            $project = $this->projectRepository->create([
                'name' => $data['name'],
                'code' => $data['code'] ?? 'PRJ-'.strtoupper(bin2hex(random_bytes(3))),
                'description' => $data['description'] ?? null,
                'client_name' => $data['client_name'] ?? 'Enterprise Client',
                'project_type' => $data['project_type'] ?? 'enterprise',
                'status' => 'active',
                'current_phase_number' => 1,
                'health_status' => 'healthy',
                'budget' => $data['budget'] ?? 100000.00,
                'target_delivery_date' => $data['target_delivery_date'] ?? now()->addMonths(6)->toDateString(),
            ]);

            // 1. Initialize Standard 7 SDLC Phases
            $phasesData = [
                ['number' => 1, 'name' => '1. Yêu cầu & Khởi tạo (Initiation & Requirements)', 'status' => 'active'],
                ['number' => 2, 'name' => '2. Kiến trúc & Thiết kế (Architecture & UI/UX)', 'status' => 'pending'],
                ['number' => 3, 'name' => '3. Lập kế hoạch & Phân bổ (Planning & Estimation)', 'status' => 'pending'],
                ['number' => 4, 'name' => '4. Lập trình & Review (Development & Unit Test)', 'status' => 'pending'],
                ['number' => 5, 'name' => '5. QA/QC & Kiểm thử chấp nhận (Testing & UAT)', 'status' => 'pending'],
                ['number' => 6, 'name' => '6. Triển khai & Phát hành (Deployment & Release)', 'status' => 'pending'],
                ['number' => 7, 'name' => '7. Vận hành & Hậu kiểm (Handover & Retrospective)', 'status' => 'pending'],
            ];

            $createdPhases = [];
            foreach ($phasesData as $phase) {
                $createdPhases[$phase['number']] = $project->phases()->create([
                    'phase_number' => $phase['number'],
                    'name' => $phase['name'],
                    'status' => $phase['status'],
                    'completion_rate' => $phase['number'] === 1 ? 25 : 0,
                    'started_at' => $phase['number'] === 1 ? now() : null,
                ]);
            }

            // 2. Initialize Quality Gates 1 to 6
            $gatesData = [
                1 => [
                    'name' => 'Gate 1: Phê duyệt Yêu cầu & Phạm vi (Scope Acceptance)',
                    'role' => 'Product Owner & Solution Architect',
                    'checklist' => [
                        'BRD hoàn chỉnh và có xác nhận từ khách hàng' => true,
                        'SRS chuẩn IEEE 830 đã được phân rã chi tiết' => true,
                        'User Stories & Acceptance Criteria chuẩn Gherkin đầy đủ' => false,
                        'Đã phân tích tính khả thi kỹ thuật (Technical Feasibility)' => true,
                    ],
                ],
                2 => [
                    'name' => 'Gate 2: Phê duyệt Kiến trúc Hệ thống (ARB Approval)',
                    'role' => 'Architecture Review Board (ARB)',
                    'checklist' => [
                        'SAD theo C4 Model đã được thẩm định' => false,
                        'Database Schema ERD chuẩn hóa 3NF' => false,
                        'Đặc tả OpenAPI / AsyncAPI đã định nghĩa' => false,
                        'Mô hình bảo mật STRIDE Threat Model đã hoàn thành' => false,
                    ],
                ],
                3 => [
                    'name' => 'Gate 3: Cam kết Kế hoạch & Nguồn lực (Commitment Gate)',
                    'role' => 'Project Manager & Resource Director',
                    'checklist' => [
                        'WBS chia nhỏ nhiệm vụ dưới 40 giờ làm việc' => false,
                        'Ma trận RACI đã được phân bổ cho 100% module' => false,
                        'Sổ đăng ký rủi ro (Risk Register) có phương án xử lý' => false,
                    ],
                ],
                4 => [
                    'name' => 'Gate 4: CI/CD Quality Gate & Static Code Analysis',
                    'role' => 'Tech Lead & Automated CI System',
                    'checklist' => [
                        '100% Pull Request có ít nhất 2 Senior Review' => false,
                        'Unit Test Coverage đạt tối thiểu 80%' => false,
                        'SonarQube xếp hạng A (0 lỗi Blocker/Critical)' => false,
                    ],
                ],
                5 => [
                    'name' => 'Gate 5: Nghiệm thu QA/QC & Người dùng (UAT Sign-off)',
                    'role' => 'QA Lead & Client UAT Representative',
                    'checklist' => [
                        'Test Execution Matrix đạt 100% test cases' => false,
                        '0 lỗi còn lại ở mức độ Critical hoặc Major' => false,
                        'Báo cáo kiểm thử bảo mật Pentest đạt chuẩn' => false,
                        'Biên bản nghiệm thu UAT có chữ ký khách hàng' => false,
                    ],
                ],
                6 => [
                    'name' => 'Gate 6: Phê duyệt Phát hành Sản xuất (CAB Go-Live)',
                    'role' => 'Release Manager & Change Advisory Board',
                    'checklist' => [
                        'Deployment Runbook chi tiết theo phút' => false,
                        'Phương án Rollback & Phục hồi thảm họa đã diễn tập' => false,
                        'Release Notes kỹ thuật và người dùng hoàn tất' => false,
                    ],
                ],
            ];

            foreach ($gatesData as $gateNumber => $gate) {
                $project->qualityGates()->create([
                    'phase_id' => $createdPhases[$gateNumber]->id,
                    'gate_number' => $gateNumber,
                    'name' => $gate['name'],
                    'status' => 'pending',
                    'required_role' => $gate['role'],
                    'criteria_checklist' => $gate['checklist'],
                ]);
            }

            // 3. Initialize Complete Standard SDLC Deliverables / Documents (Full Suite 7 Phases)
            $defaultDocs = [
                // Pha 1: Yêu cầu & Khởi tạo
                [
                    'phase' => 1,
                    'type' => 'CHARTER',
                    'title' => 'Hiến chương Dự án (Project Charter)',
                    'status' => 'approved',
                    'content' => "# Hiến Chương Dự Án (Project Charter)\n\n## 1. Tên dự án & Mục tiêu cốt lõi\n- Tên dự án: {$project->name}\n- Khách hàng: {$project->client_name}\n- Mục tiêu: Chuyển đổi số toàn diện và chuẩn hóa quy trình phát triển phần mềm theo chuẩn CMMI Level 3/5.\n\n## 2. Phạm vi cam kết\n- Bàn giao đúng hạn theo mốc mục tiêu.\n- Tuân thủ 100% các cổng kiểm soát chất lượng Quality Gates.",
                ],
                [
                    'phase' => 1,
                    'type' => 'BRD',
                    'title' => 'Tài liệu Yêu cầu Nghiệp vụ (Business Requirements Document - BRD)',
                    'status' => 'approved',
                    'content' => "# Business Requirements Document (BRD)\n\n## 1. Bối cảnh & Bài toán Doanh nghiệp\nDoanh nghiệp cần một giải pháp tập trung quản lý dòng đời dự án IT, loại bỏ đùn đẩy trách nhiệm và quản trị văn bản kỹ thuật đồng bộ.\n\n## 2. Yêu cầu Nghiệp vụ Cốt lõi\n- BRD-01: Quy trình chuyển pha bắt buộc có chữ ký số điện tử non-repudiation.\n- BRD-02: Ma trận RACI minh bạch cho mọi chức năng.\n- BRD-03: RTM liên kết 1:1 từ Business Need đến Git Commit.",
                ],
                [
                    'phase' => 1,
                    'type' => 'SRS',
                    'title' => 'Đặc tả Yêu cầu Phần mềm (Software Requirements Specification - IEEE 830)',
                    'status' => 'under_review',
                    'content' => "# Software Requirements Specification (IEEE 830 Standard)\n\n## 1. Giới thiệu tổng quan\nHệ thống MCMS thiết lập môi trường quản trị SDLC 7 pha.\n\n## 2. Yêu cầu Phi Chức năng (Non-Functional Requirements)\n- **Performance**: Phản hồi API <= 50ms nhờ Laravel 13 Octane + FrankenPHP.\n- **Security**: Xác thực WebAuthn 2FA, mã hóa HMAC-SHA256 cho audit trail.\n- **Availability**: Khả năng chịu lỗi 99.95% với cơ chế failover.",
                ],
                [
                    'phase' => 1,
                    'type' => 'STORIES',
                    'title' => 'Danh sách User Stories & Kịch bản Gherkin',
                    'status' => 'under_review',
                    'content' => "# User Stories & Acceptance Criteria\n\n### Story-101: Phê duyệt Cổng Chất lượng\n- **Là**: Lead Architect / PO\n- **Tôi muốn**: Ký duyệt Quality Gate trực tiếp trên giao diện Fluent 2\n- **Để**: Chuyển pha SDLC hợp lệ và lưu vết chữ ký bảo mật.\n\n**Scenario**: Ký duyệt thành công\n- *Given* Cổng Gate 1 đang ở trạng thái Pending\n- *When* Người dùng nhập tên 'Võ Hoàng Tú' và nhấn Ký số\n- *Then* Hệ thống sinh Token HMAC và chuyển dự án sang Pha 2.",
                ],

                // Pha 2: Kiến trúc & Thiết kế
                [
                    'phase' => 2,
                    'type' => 'SAD',
                    'title' => 'Tài liệu Thiết kế Kiến trúc (System Architecture Document - C4 Model)',
                    'status' => 'under_review',
                    'content' => "# System Architecture Document (C4 Model)\n\n## 1. Context Diagram\n- Client Browser <---> Fluent 2 Mica React 19 Frontend <---> Laravel 13 Core API <---> PostgreSQL 17\n\n## 2. Container Diagram\n- Frontend: React 19, TypeScript, Inertia.js v2, Fluent 2 Design Tokens.\n- Backend: Laravel 13 (PHP 8.5) theo mô hình Repository - Actions Pattern.\n- Persistence: PostgreSQL 17 + Redis 7.4.",
                ],
                [
                    'phase' => 2,
                    'type' => 'ERD',
                    'title' => 'Sơ đồ Thực thể Dữ liệu (Database ERD & Schema Specs)',
                    'status' => 'draft',
                    'content' => "# Database Architecture & Data Dictionary\n\n- `projects`: Lưu trữ thông tin dự án, ngân sách và trạng thái.\n- `sdlc_phases`: 7 Pha chuẩn hóa vòng đời phần mềm.\n- `quality_gates`: 6 Cổng kiểm soát chất lượng liên kết phase.\n- `rtm_traces`: Ma trận truy vết yêu cầu hai chiều.\n- `audit_logs`: Bảng lưu nhật ký bất biến có chữ ký số.",
                ],
                [
                    'phase' => 2,
                    'type' => 'OPENAPI',
                    'title' => 'Đặc tả Giao diện Lập trình RESTful API (OpenAPI 3.1 Specs)',
                    'status' => 'draft',
                    'content' => "# OpenAPI 3.1 Specification\n\n- `GET /projects`: Lấy danh sách dự án SDLC.\n- `POST /quality-gates/{id}/approve`: Ký số phê duyệt cổng chất lượng.\n- `POST /documents/{id}/sign`: Ký duyệt tài liệu kỹ thuật.",
                ],
                [
                    'phase' => 2,
                    'type' => 'STRIDE',
                    'title' => 'Mô hình Hăm dọa An ninh (STRIDE Threat Model)',
                    'status' => 'draft',
                    'content' => "# STRIDE Security Analysis\n\n- **Spoofing**: Ngăn chặn bằng JWT OIDC + WebAuthn FIDO2.\n- **Tampering**: Khóa cứng tính toàn vẹn bằng SHA-256 hash trên từng tài liệu.\n- **Repudiation**: Chống chối bỏ trách nhiệm bằng HMAC token sinh từ Master Secret Key.",
                ],

                // Pha 3: Kế hoạch & Phân bổ
                [
                    'phase' => 3,
                    'type' => 'WBS',
                    'title' => 'Phân rã Công việc & Kế hoạch Sprint (Work Breakdown Structure)',
                    'status' => 'draft',
                    'content' => "# Work Breakdown Structure (WBS)\n\n- 1.1 Khảo sát nghiệp vụ: 40 giờ (BA Lead)\n- 2.1 Thiết kế SAD: 60 giờ (Solution Architect)\n- 3.1 Lập trình Core Engine: 120 giờ (Dev Team)\n- 4.1 Kiểm thử tự động & UAT: 80 giờ (QA Lead)",
                ],
                [
                    'phase' => 3,
                    'type' => 'RISK',
                    'title' => 'Sổ Đăng ký Rủi ro (Risk Register & Contingency Plan)',
                    'status' => 'draft',
                    'content' => "# Risk Register\n\n- **R1: Yêu cầu thay đổi vào cuối kỳ** (Impact: High, Prob: Med) -> *Xử lý*: Áp dụng quy trình Change Request (CR) và tái thẩm tra Gate 1.\n- **R2: Trễ tiến độ kiểm thử UAT** -> *Xử lý*: Tự động hóa kiểm thử hồi quy bằng Playwright.",
                ],

                // Pha 4: Lập trình & Review
                [
                    'phase' => 4,
                    'type' => 'CODE_GUIDELINES',
                    'title' => 'Quy chuẩn Lập trình & Checklist Review Mã Nguồn (PR Guidelines)',
                    'status' => 'draft',
                    'content' => "# Engineering Code Review Guidelines\n\n- Mọi Pull Request bắt buộc có tối thiểu 2 Senior Reviewers phê duyệt.\n- Tuân thủ nghiêm ngặt mô hình Repository - Actions.\n- Định dạng tự động bằng Laravel Pint trước khi merge.\n- Độ bao phủ Unit Test tối thiểu >= 80%.",
                ],

                // Pha 5: QA/QC & Kiểm thử
                [
                    'phase' => 5,
                    'type' => 'STP',
                    'title' => 'Kế hoạch Kiểm thử Phần mềm Tổng thể (Software Test Plan - STP)',
                    'status' => 'draft',
                    'content' => "# Software Test Plan (STP)\n\n## 1. Phạm vi kiểm thử\n- Kiểm thử Chức năng (Functional Testing)\n- Kiểm thử Hiệu năng (Performance / Load Testing)\n- Kiểm thử Bảo mật (DAST & Penetration Testing)\n- Thẩm định Người dùng (User Acceptance Testing - UAT)",
                ],
                [
                    'phase' => 5,
                    'type' => 'UAT_RECORD',
                    'title' => 'Biên bản Nghiệm thu Kiểm thử Chấp nhận (UAT Sign-off Record)',
                    'status' => 'draft',
                    'content' => "# User Acceptance Test (UAT) Sign-off Form\n\n- Xác nhận hệ thống đáp ứng đầy đủ tiêu chí chấp nhận trong BRD.\n- 0 lỗi mức độ Critical/Blocker còn tồn đọng.\n- Đại diện khách hàng và QA Lead ký xác nhận nghiệm thu.",
                ],

                // Pha 6: Triển khai & Release
                [
                    'phase' => 6,
                    'type' => 'RUNBOOK',
                    'title' => 'Kịch bản Triển khai & Phát hành Theo Từng Phút (Deployment Runbook)',
                    'status' => 'draft',
                    'content' => "# Production Deployment Runbook\n\n- **T-30 min**: Khóa schema migration và sao lưu snapshot cơ sở dữ liệu.\n- **T-15 min**: Triển khai Blue-Green container môi trường mới.\n- **T-00 min**: Điều hướng traffic 10% Canary -> 100% Production.\n- **T+15 min**: Thực thi Smoke Test kiểm tra các endpoint trọng yếu.",
                ],
                [
                    'phase' => 6,
                    'type' => 'ROLLBACK_DR',
                    'title' => 'Phương án Phục hồi Thảm họa & Rollback Sự cố (DR Plan)',
                    'status' => 'draft',
                    'content' => "# Rollback & Disaster Recovery Plan\n\n- Thời gian khôi phục tối đa RTO <= 5 phút.\n- Mức độ mất mát dữ liệu RPO <= 0 (Zero data loss nhờ WAL replication).\n- Kịch bản gạt switch lưu lượng về bản build ổn định trước đó.",
                ],
                [
                    'phase' => 6,
                    'type' => 'RELEASE_NOTES',
                    'title' => 'Bản Ghi chú Phát hành (Release Notes v1.0 Enterprise)',
                    'status' => 'draft',
                    'content' => "# Release Notes v1.0 Enterprise\n\n- Tính năng mới: Quản trị quy trình 7 Pha SDLC có cổng kiểm soát.\n- Tính năng mới: Ma trận RACI và RTM hai chiều 5 tầng.\n- Cải tiến: Giao diện Fluent 2 Mica Light Colorful tốc độ phản hồi < 0.6s.",
                ],

                // Pha 7: Vận hành & Hậu kiểm
                [
                    'phase' => 7,
                    'type' => 'SLA_MATRIX',
                    'title' => 'Ma trận Cam kết Mức Dịch vụ & Xử lý Khẩn cấp (SLA Support Matrix)',
                    'status' => 'draft',
                    'content' => "# SLA Support & Escalation Matrix\n\n- **P1 (Critical Outage)**: Thời gian phản hồi 15 phút, giải quyết trong 2 giờ.\n- **P2 (Major Feature Down)**: Thời gian phản hồi 1 giờ, giải quyết trong 8 giờ.\n- **P3 (Minor Issue)**: Xử lý trong bản cập nhật kế tiếp.",
                ],
                [
                    'phase' => 7,
                    'type' => 'RETROSPECTIVE',
                    'title' => 'Báo cáo Tổng kết & Đánh giá Bài học Kinh nghiệm (Sprint Retrospective)',
                    'status' => 'draft',
                    'content' => "# Sprint Retrospective & Post-Mortem Report\n\n## 1. Điểm làm tốt (What Went Well)\n- Kiểm soát cổng chất lượng Gate 1 & 2 giúp giảm 70% lỗi thiết kế.\n- Tích hợp chữ ký số giúp quy trình phê duyệt minh bạch 100%.\n\n## 2. Điểm cần cải tiến (What Can Be Improved)\n- Tăng cường tự động hóa kiểm thử hiệu năng sớm hơn ở Pha 4.",
                ],
            ];

            foreach ($defaultDocs as $doc) {
                $docContent = $this->aiService->synthesizeDocument(
                    project: $project,
                    docType: $doc['type'],
                    topicPrompt: $data['description'] ?? '',
                );
                if (empty(trim($docContent))) {
                    $docContent = $doc['content'];
                }

                $project->documents()->create([
                    'phase_number' => $doc['phase'],
                    'doc_type' => $doc['type'],
                    'title' => $doc['title'],
                    'version' => 'v1.0',
                    'status' => $doc['status'],
                    'content' => $docContent,
                    'signed_off_by' => $doc['status'] === 'approved' ? $creatorName : null,
                    'signed_off_at' => $doc['status'] === 'approved' ? now() : null,
                ]);
            }

            // 4. Default RACI Matrix
            $defaultRaci = [
                ['activity' => '1. Khảo sát & Phân tích yêu cầu', 'phase' => 1, 'r' => 'Trần Văn BA (Senior BA)', 'a' => 'Nguyễn Văn PM (Project Manager)', 'c' => ['Lê Văn TechLead', 'Đại diện Khách hàng'], 'i' => ['Ban Giám Đốc']],
                ['activity' => '2. Thiết kế Kiến trúc & DB Schema', 'phase' => 2, 'r' => 'Lê Văn TechLead (Solution Architect)', 'a' => 'Nguyễn Văn PM', 'c' => ['SecOps Specialist', 'Lead DBA'], 'i' => ['Dev Team']],
                ['activity' => '3. Phân bổ Nguồn lực & Sprint Plan', 'phase' => 3, 'r' => 'Nguyễn Văn PM', 'a' => 'Ban Giám Đốc (Resource Dir)', 'c' => ['Tech Lead', 'QA Lead'], 'i' => ['Toàn thể dự án']],
                ['activity' => '4. Lập trình Core Engine & Unit Test', 'phase' => 4, 'r' => 'Dev Team (Frontend & Backend)', 'a' => 'Lê Văn TechLead', 'c' => ['Senior Reviewers'], 'i' => ['PM', 'QA Team']],
                ['activity' => '5. Kiểm thử Tự động & UAT Client', 'phase' => 5, 'r' => 'Hoàng Thị QA (QA Lead)', 'a' => 'Đại diện Khách hàng (Sponsor)', 'c' => ['Security Auditor', 'Dev Team'], 'i' => ['PM']],
                ['activity' => '6. Triển khai Production & Rollback', 'phase' => 6, 'r' => 'Phạm Văn DevOps (DevOps Lead)', 'a' => 'Vũ Release Manager (CAB)', 'c' => ['Tech Lead', 'Infra Lead'], 'i' => ['Stakeholders']],
                ['activity' => '7. Bàn giao & Đánh giá Retrospective', 'phase' => 7, 'r' => 'Nguyễn Văn PM', 'a' => 'Ban Giám Đốc', 'c' => ['Khách hàng', 'Scrum Master'], 'i' => ['Toàn công ty']],
            ];

            foreach ($defaultRaci as $raci) {
                $project->raciAssignments()->create([
                    'activity_name' => $raci['activity'],
                    'phase_number' => $raci['phase'],
                    'responsible' => $raci['r'],
                    'accountable' => $raci['a'],
                    'consulted' => $raci['c'],
                    'informed' => $raci['i'],
                ]);
            }

            // 5. Tailored RTM (Requirements Traceability Matrix)
            $ideaAnalysis = $this->aiService->analyzeIdea($data['description'] ?? $data['name']);
            $customRtm = $ideaAnalysis['initial_rtm'] ?? [];
            if (! empty($customRtm)) {
                $rtmToCreate = array_map(function ($item) {
                    return [
                        'req_code' => $item['req_code'],
                        'req_title' => $item['req_title'],
                        'story' => $item['story'] ?? 'US-01',
                        'commit' => 'Branch feat/'.strtolower(str_replace(' ', '-', (string) $item['req_code'])),
                        'test' => $item['test'] ?? 'TC-01',
                        'defect' => null,
                        'release' => 'v1.0.0-rc1',
                        'status' => 'in_dev',
                    ];
                }, $customRtm);
            } else {
                $rtmToCreate = [
                    ['req_code' => 'REQ-AUTH-01', 'req_title' => 'Đăng nhập bảo mật WebAuthn & 2FA', 'story' => 'STORY-101', 'commit' => 'PR #12 (feat/auth)', 'test' => 'TC-SEC-01', 'defect' => null, 'release' => 'v1.0.0-rc1', 'status' => 'passed'],
                    ['req_code' => 'REQ-CORE-02', 'req_title' => 'Nghiệp vụ cốt lõi và giao dịch thời gian thực', 'story' => 'STORY-108', 'commit' => 'PR #24 (feat/core)', 'test' => 'TC-CORE-02', 'defect' => null, 'release' => 'v1.0.0-rc1', 'status' => 'passed'],
                    ['req_code' => 'REQ-INT-03', 'req_title' => 'Tích hợp hệ thống và cơ chế đối soát dữ liệu', 'story' => 'STORY-114', 'commit' => 'PR #31 (feat/integration)', 'test' => 'TC-INT-03', 'defect' => null, 'release' => 'v1.0.0-rc1', 'status' => 'passed'],
                    ['req_code' => 'REQ-OPS-04', 'req_title' => 'Giám sát vận hành và cam kết chất lượng SLA', 'story' => 'STORY-120', 'commit' => 'PR #39 (feat/monitoring)', 'test' => 'TC-OPS-04', 'defect' => null, 'release' => 'v1.0.0', 'status' => 'in_dev'],
                ];
            }

            foreach ($rtmToCreate as $rtm) {
                $project->rtmTraces()->create([
                    'req_code' => $rtm['req_code'],
                    'req_title' => $rtm['req_title'],
                    'user_story_code' => $rtm['story'],
                    'commit_or_pr' => $rtm['commit'],
                    'test_case_code' => $rtm['test'],
                    'defect_code' => $rtm['defect'],
                    'release_version' => $rtm['release'],
                    'status' => $rtm['status'],
                ]);
            }

            // 6. Log Initial Audit Record
            $this->recordAuditLogAction->execute(
                projectId: $project->id,
                userName: $creatorName,
                userRole: $creatorRole,
                actionType: 'PROJECT_INITIALIZED',
                entityType: 'Project',
                entityId: $project->id,
                details: [
                    'project_name' => $project->name,
                    'code' => $project->code,
                    'phases_created' => 7,
                    'gates_created' => 6,
                ]
            );

            return $project;
        });
    }
}
