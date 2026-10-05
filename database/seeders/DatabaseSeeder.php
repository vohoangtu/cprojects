<?php

namespace Database\Seeders;

use App\Actions\Agile\CreateTaskAction;
use App\Actions\Defects\LogDefectAction;
use App\Actions\Gates\ApproveQualityGateAction;
use App\Actions\Integrations\CreateWebhookAction;
use App\Actions\Integrations\IngestCIPipelineMetricsAction;
use App\Actions\Operations\LogProductionIncidentAction;
use App\Actions\Projects\CreateProjectAction;
use App\Actions\Release\SignCABAction;
use App\Actions\Release\UpdateRolloutTrafficAction;
use App\Actions\Testing\CreateTestRunAction;
use App\Models\Defect;
use App\Models\Sprint;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with 3 enterprise SDLC projects across different phases.
     */
    public function run(): void
    {
        // 1. Primary Architect User
        User::firstOrCreate(
            ['email' => 'architect@techcorp.vn'],
            ['name' => 'Võ Hoàng Tú', 'password' => bcrypt('password')]
        );

        $createProjectAction = app(CreateProjectAction::class);
        $approveGateAction = app(ApproveQualityGateAction::class);
        $ingestCiAction = app(IngestCIPipelineMetricsAction::class);
        $logDefectAction = app(LogDefectAction::class);
        $logIncidentAction = app(LogProductionIncidentAction::class);

        // -------------------------------------------------------------
        // PROJECT 1: Core Banking NextGen (Phase 4 - Lập trình & CI/CD)
        // -------------------------------------------------------------
        $project1 = $createProjectAction->execute([
            'name' => 'Hệ thống Ngân hàng Số Core Banking NextGen 2026',
            'code' => 'PRJ-BANK-2026',
            'description' => 'Hiện đại hóa hệ thống lõi ngân hàng, hỗ trợ microservices phân tán, bảo mật WebAuthn, và truy vết kiểm toán không thể chối bỏ.',
            'client_name' => 'VietCredit Commercial Bank',
            'project_type' => 'enterprise',
            'budget' => 450000.00,
            'target_delivery_date' => now()->addMonths(5)->toDateString(),
        ], creatorName: 'Võ Hoàng Tú (Lead SA)', creatorRole: 'Lead Solution Architect');

        // Approve Gates 1, 2, 3
        $gates1 = $project1->qualityGates()->orderBy('gate_number')->get();
        if ($gates1->count() >= 3) {
            $approveGateAction->execute($gates1[0]->id, 'Nguyễn Thanh Tùng', 'Product Owner', 'Phê duyệt 100% User Stories và BRD ký kết.');
            $approveGateAction->execute($gates1[1]->id, 'Lê Văn Khải', 'Architecture Review Board', 'C4 Model và DB Partitioning đạt chuẩn an toàn thông tin.');
            $approveGateAction->execute($gates1[2]->id, 'Đỗ Mạnh Hùng', 'Project Manager', 'Kế hoạch phân rã WBS và RACI Sprint 1-6 đã cam kết nguồn lực.');
        }

        // CI Metrics for Project 1 (Coverage 92.5%, Clean SAST)
        $ingestCiAction->execute([
            'project_id' => $project1->id,
            'build_number' => '#108',
            'branch' => 'main',
            'commit_sha' => 'c4b8e21a',
            'unit_test_passed' => 185,
            'unit_test_failed' => 0,
            'coverage_percentage' => 92.5,
            'code_smells_count' => 1,
            'vulnerabilities_count' => 0,
            'sast_status' => 'passed',
            'pipeline_status' => 'success',
        ]);

        // Minor resolved defect
        $trace1 = $project1->rtmTraces()->first();
        $defect1 = $logDefectAction->execute([
            'project_id' => $project1->id,
            'rtm_trace_id' => $trace1?->id,
            'defect_code' => 'DEF-001',
            'title' => 'Chậm cập nhật hạn mức thẻ phụ khi đồng bộ Redis cache',
            'steps_to_reproduce' => '1. Đổi hạn mức qua API. 2. Truy vấn ngay trên mobile app.',
            'severity' => 'minor',
            'assigned_to' => 'Võ Hoàng Tú',
            'logged_by' => 'Phạm Minh Đức (QA)',
        ]);
        $defect1->update([
            'status' => 'resolved',
            'resolution_notes' => 'Đã thêm lệnh invalidate cache key trong Redis pub/sub.',
            'resolved_at' => now(),
        ]);

        // -------------------------------------------------------------
        // ENTERPRISE SDLC SUITE 2026: Sprints, Tasks, Test Runs, CAB & Webhook
        // -------------------------------------------------------------
        $createTaskAction = app(CreateTaskAction::class);
        $createTestRunAction = app(CreateTestRunAction::class);
        $signCabAction = app(SignCABAction::class);
        $updateRolloutAction = app(UpdateRolloutTrafficAction::class);
        $createWebhookAction = app(CreateWebhookAction::class);

        // Sprints for Project 1
        $sprint1 = Sprint::create([
            'project_id' => $project1->id,
            'sprint_number' => 1,
            'name' => 'Sprint 1: Core Transaction & Auth Engine',
            'goal' => 'Hoàn thiện luồng xác thực FIDO2 Passkeys và giao dịch chuyển khoản liên ngân hàng 500tr.',
            'start_date' => now()->subDays(10)->toDateString(),
            'end_date' => now()->addDays(4)->toDateString(),
            'status' => 'active',
        ]);

        Sprint::create([
            'project_id' => $project1->id,
            'sprint_number' => 2,
            'name' => 'Sprint 2: Napas Gateway & Automated Reconciliation',
            'goal' => 'Tích hợp Napas 2.0 và hệ thống đối soát dữ liệu giao dịch thời gian thực.',
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(19)->toDateString(),
            'status' => 'planning',
        ]);

        // Tasks across Kanban columns
        $createTaskAction->execute([
            'project_id' => $project1->id,
            'sprint_id' => $sprint1->id,
            'rtm_trace_id' => $trace1?->id,
            'task_code' => 'TSK-101',
            'title' => 'Xây dựng dịch vụ xác thực WebAuthn FIDO2 Passwordless',
            'description' => 'Tích hợp thư viện WebAuthn server, lưu trữ public key và xác thực challenge không mật khẩu.',
            'status' => 'done',
            'priority' => 'high',
            'story_points' => 5,
            'assigned_to' => 'Võ Hoàng Tú',
            'github_pr_url' => 'https://github.com/techcorp/banking-core/pull/101',
        ], 'Võ Hoàng Tú', 'Lead Solution Architect');

        $createTaskAction->execute([
            'project_id' => $project1->id,
            'sprint_id' => $sprint1->id,
            'rtm_trace_id' => $trace1?->id,
            'task_code' => 'TSK-102',
            'title' => 'Hiện thực hóa luồng ký số giao dịch bằng khóa HMAC-SHA256',
            'description' => 'Mã hóa và chống sửa đổi payload giao dịch chuyển khoản trước khi phát lệnh tới Core Banking.',
            'status' => 'code_review',
            'priority' => 'urgent',
            'story_points' => 8,
            'assigned_to' => 'Võ Hoàng Tú',
            'github_pr_url' => 'https://github.com/techcorp/banking-core/pull/102',
        ], 'Võ Hoàng Tú', 'Lead Solution Architect');

        $createTaskAction->execute([
            'project_id' => $project1->id,
            'sprint_id' => $sprint1->id,
            'task_code' => 'TSK-103',
            'title' => 'Tối ưu hóa Redis Cache cho truy vấn số dư thẻ phụ',
            'description' => 'Thiết lập TTL và sự kiện Redis Pub/Sub invalidate tức thì khi thay đổi số dư.',
            'status' => 'in_progress',
            'priority' => 'medium',
            'story_points' => 3,
            'assigned_to' => 'Lê Văn Khải',
        ], 'Võ Hoàng Tú', 'Lead Solution Architect');

        $createTaskAction->execute([
            'project_id' => $project1->id,
            'sprint_id' => $sprint1->id,
            'task_code' => 'TSK-104',
            'title' => 'Đồng bộ hóa sự kiện Kafka Ledger sang ElasticSearch',
            'description' => 'Consumer lắng nghe transaction event và lập chỉ mục tìm kiếm full-text cho báo soát.',
            'status' => 'todo',
            'priority' => 'medium',
            'story_points' => 5,
            'assigned_to' => 'Phạm Minh Đức',
        ], 'Võ Hoàng Tú', 'Lead Solution Architect');

        // Test Runs for Project 1
        $testRun1 = $createTestRunAction->execute(
            data: [
                'project_id' => $project1->id,
                'name' => 'Test Run STG-01: E2E Transaction Engine & Security Verification',
                'environment' => 'staging',
                'executed_by' => 'Phạm Minh Đức',
            ],
            userName: 'Phạm Minh Đức',
            userRole: 'QA Lead',
        );

        $testRun1->items()->create([
            'test_case_code' => 'TC-SEC-01',
            'title' => 'Kiểm thử xác thực WebAuthn FIDO2 với thiết bị YubiKey',
            'expected_result' => 'Hệ thống sinh assertion hợp lệ và đăng nhập thành công trong < 200ms.',
            'status' => 'passed',
            'actual_result' => 'Xác thực thành công trong 118ms, chữ ký số hợp lệ.',
        ]);

        $testRun1->items()->create([
            'test_case_code' => 'TC-TXN-01',
            'title' => 'Kiểm thử giao dịch chuyển khoản liên ngân hàng hạn mức 500 triệu VNĐ',
            'expected_result' => 'Số dư tài khoản nguồn giảm 500tr, hệ thống đối soát ghi nhận trạng thái SUCCESS.',
            'status' => 'passed',
            'actual_result' => 'Giao dịch chuyển khoản hoàn tất trong 850ms, tuân thủ chuẩn ISO 20022.',
        ]);

        $testRun1->items()->create([
            'test_case_code' => 'TC-PERF-01',
            'title' => 'Stress test 5,000 TPS đồng thời trong 10 phút',
            'expected_result' => 'Không xảy ra deadlock cơ sở dữ liệu, tỷ lệ lỗi < 0.01%.',
            'status' => 'passed',
            'actual_result' => 'Hoàn tất 3,000,000 giao dịch với tỷ lệ lỗi 0.002%, P99 latency 16ms.',
        ]);

        $testRun1->items()->create([
            'test_case_code' => 'TC-SEC-02',
            'title' => 'Kiểm thử chống tấn công lặp lại (Replay Attack) trên API thanh toán',
            'expected_result' => 'API chặn mọi request có cùng nonce hoặc timestamp quá 60 giây.',
            'status' => 'failed',
            'actual_result' => 'Gateway chấp nhận request replay sau 65 giây do cấu hình clock drift lỏng lẻo.',
        ]);

        $testRun1->update([
            'status' => 'failed',
            'completed_at' => now(),
        ]);

        // CAB Multi-Signoffs for v2.4.0
        $signCabAction->execute(
            projectId: $project1->id,
            releaseVersion: 'v2.4.0',
            roleRequired: 'LEAD_ARCHITECT',
            signerName: 'Võ Hoàng Tú',
            decision: 'approved',
            notes: 'Kiến trúc phân tán C4, HA Postgres và Kafka replication đã được rà soát đạt chuẩn SLA 99.99%.'
        );

        $signCabAction->execute(
            projectId: $project1->id,
            releaseVersion: 'v2.4.0',
            roleRequired: 'SECOPS_LEAD',
            signerName: 'Nguyễn Văn An Toàn',
            decision: 'approved',
            notes: 'Báo cáo quét SAST sạch 100% vulnerabilities nghiêm trọng, mã hóa đường truyền TLS 1.3.'
        );

        // Canary Rollout at 25%
        $updateRolloutAction->execute(
            projectId: $project1->id,
            releaseVersion: 'v2.4.0',
            trafficPercentage: 25,
            isRollback: false,
            rollbackReason: null,
            userName: 'Võ Hoàng Tú',
        );

        // External Webhook Integration
        $createWebhookAction->execute(
            data: [
                'project_id' => $project1->id,
                'name' => 'VietCredit Jenkins CI/CD Event Dispatcher',
                'url' => 'https://ci.vietcredit.vn/webhooks/sdlc-sync',
                'events' => ['gate.approved', 'defect.logged', 'release.packaged', 'rollout.updated'],
            ],
            userName: 'Võ Hoàng Tú',
        );

        // -------------------------------------------------------------
        // PROJECT 2: AI Supply Chain Platform (Phase 5 - QA & Gate 5 Enforcer)
        // -------------------------------------------------------------
        $project2 = $createProjectAction->execute([
            'name' => 'Nền tảng Tối ưu Chuỗi Cung ứng AI-SCM',
            'code' => 'PRJ-SCM-2026',
            'description' => 'Ứng dụng AI dự báo nhu cầu kho bãi thời gian thực, tích hợp dữ liệu cảm biến IoT và quy trình SDLC tinh gọn.',
            'client_name' => 'Global Logistics Asia',
            'project_type' => 'product',
            'budget' => 280000.00,
            'target_delivery_date' => now()->addMonths(8)->toDateString(),
        ], creatorName: 'Vũ Thị Ngọc (Lead BA)', creatorRole: 'Business Analyst');

        // Approve Gates 1, 2, 3
        $gates2 = $project2->qualityGates()->orderBy('gate_number')->get();
        if ($gates2->count() >= 3) {
            $approveGateAction->execute($gates2[0]->id, 'Vũ Thị Ngọc', 'Business Analyst', 'Yêu cầu nghiệp vụ BRD đã thống nhất.');
            $approveGateAction->execute($gates2[1]->id, 'Võ Hoàng Tú', 'Solution Architect', 'Kiến trúc Event-Driven Kafka đã được phê duyệt.');
            $approveGateAction->execute($gates2[2]->id, 'Trần Minh Tâm', 'Project Manager', 'Kế hoạch WBS 6 sprints đã phân bổ.');
        }

        // Project 2 CI Metrics (Passes Gate 4)
        $ingestCiAction->execute([
            'project_id' => $project2->id,
            'build_number' => '#214',
            'branch' => 'develop',
            'commit_sha' => 'f8d31a9e',
            'unit_test_passed' => 142,
            'unit_test_failed' => 0,
            'coverage_percentage' => 84.0,
            'code_smells_count' => 3,
            'vulnerabilities_count' => 0,
            'sast_status' => 'passed',
            'pipeline_status' => 'success',
        ]);

        // Approve Gate 4 to advance to Phase 5 (QA/QC)
        if (isset($gates2[3])) {
            $approveGateAction->execute($gates2[3]->id, 'Hoàng Văn Thái', 'Tech Lead', 'Đã review 100% Pull Requests và CI đạt 84% test coverage.');
        }

        // Active BLOCKER defect to demonstrate Gate 5 Enforcer!
        $trace2 = $project2->rtmTraces()->first();
        $logDefectAction->execute([
            'project_id' => $project2->id,
            'rtm_trace_id' => $trace2?->id,
            'defect_code' => 'DEF-001',
            'title' => 'Lỗi tràn bộ nhớ đệm (Buffer Overflow) khi tải 10,000 sự kiện IoT/giây',
            'steps_to_reproduce' => '1. Bắn 10,000 telemetry messages/s từ simulator. 2. Observer consumer bị crash OOMKilled.',
            'severity' => 'blocker',
            'assigned_to' => 'Võ Hoàng Tú',
            'logged_by' => 'Đặng Thu Hằng (QA Lead)',
        ]);

        $logDefectAction->execute([
            'project_id' => $project2->id,
            'defect_code' => 'DEF-002',
            'title' => 'Độ trễ truy vấn tọa độ xe container GPS trên bản đồ số vượt quá 3 giây',
            'steps_to_reproduce' => 'Truy vấn lịch sử di chuyển xe trong 30 ngày.',
            'severity' => 'major',
            'assigned_to' => 'Lê Văn Khải',
            'logged_by' => 'Đặng Thu Hằng (QA Lead)',
        ]);

        // Update Project 2 health status to warning because of blocker
        $project2->update(['health_status' => 'warning']);

        // -------------------------------------------------------------
        // PROJECT 3: Cross-border Payment Gateway (Phase 7 - Operations & SLA)
        // -------------------------------------------------------------
        $project3 = $createProjectAction->execute([
            'name' => 'Cổng Thanh Toán Xuyên Biên Giới PayGlobal 2026',
            'code' => 'PRJ-PAY-2026',
            'description' => 'Nền tảng thanh toán đa tiền tệ, bảo mật mã hóa HSM, đối soát tự động 24/7 đạt chuẩn PCI-DSS Level 1.',
            'client_name' => 'ASEAN Financial Network',
            'project_type' => 'enterprise',
            'budget' => 620000.00,
            'target_delivery_date' => now()->subMonth()->toDateString(),
        ], creatorName: 'Võ Hoàng Tú', creatorRole: 'Lead Solution Architect');

        // Fast-forward through Gates 1 -> 6 to reach Phase 7
        $gates3 = $project3->qualityGates()->orderBy('gate_number')->get();
        $approvers = [
            ['name' => 'Nguyễn Thanh Tùng', 'role' => 'Product Owner', 'note' => 'BRD & SRS hoàn chỉnh.'],
            ['name' => 'Võ Hoàng Tú', 'role' => 'Lead Solution Architect', 'note' => 'Kiến trúc SAD đạt chuẩn PCI-DSS.'],
            ['name' => 'Đỗ Mạnh Hùng', 'role' => 'Project Manager', 'note' => 'WBS & RACI sprint 1-10 ký kết.'],
            ['name' => 'Hoàng Văn Thái', 'role' => 'Tech Lead', 'note' => 'Code quality 95.8% coverage, SAST passed.'],
            ['name' => 'Đặng Thu Hằng', 'role' => 'QA Lead', 'note' => '100% UAT test scenarios passed.'],
            ['name' => 'Phan Nhật Nam', 'role' => 'Release Manager', 'note' => 'CAB phê duyệt deploy Production qua Blue-Green.'],
        ];

        foreach ($gates3 as $index => $gate) {
            if (isset($approvers[$index])) {
                // Ingest high coverage CI before Gate 4
                if ($gate->gate_number === 4) {
                    $ingestCiAction->execute([
                        'project_id' => $project3->id,
                        'build_number' => '#320',
                        'branch' => 'release/v2.0',
                        'commit_sha' => 'e9a17b2d',
                        'unit_test_passed' => 220,
                        'unit_test_failed' => 0,
                        'coverage_percentage' => 95.8,
                        'code_smells_count' => 0,
                        'vulnerabilities_count' => 0,
                        'sast_status' => 'passed',
                        'pipeline_status' => 'success',
                    ]);
                }

                $approveGateAction->execute(
                    $gate->id,
                    $approvers[$index]['name'],
                    $approvers[$index]['role'],
                    $approvers[$index]['note']
                );
            }
        }

        // Production Incidents for Project 3
        $logIncidentAction->execute([
            'project_id' => $project3->id,
            'incident_code' => 'INC-2026-01',
            'title' => 'Nghẽn kết nối đến cổng thanh toán Napas trong đợt flash sale ngày đôi',
            'severity' => 'P1_CRITICAL',
            'downtime_minutes' => 20,
            'root_cause' => 'Timeout kết nối TCP socket do cạn connection pool phía Payment Gateway bên thứ 3.',
            'corrective_actions' => 'Tăng kích thước Connection Pool lên 500 và bổ sung Circuit Breaker với Exponential Backoff.',
            'status' => 'resolved',
            'detected_at' => now()->subDays(12)->toDateTimeString(),
            'resolved_at' => now()->subDays(12)->addMinutes(20)->toDateTimeString(),
        ]);

        $logIncidentAction->execute([
            'project_id' => $project3->id,
            'incident_code' => 'INC-2026-02',
            'title' => 'Chậm truy xuất lịch sử giao dịch quốc tế do lock index bảng ledger',
            'severity' => 'P2_MAJOR',
            'downtime_minutes' => 12,
            'root_cause' => 'Lock index trên bảng transaction_ledger trong lúc chạy báo cáo đối soát tự động.',
            'corrective_actions' => 'Tách riêng Read Replica cho nghiệp vụ đối soát và phân vùng bảng theo tháng (Table Partitioning).',
            'status' => 'resolved',
            'detected_at' => now()->subDays(5)->toDateTimeString(),
            'resolved_at' => now()->subDays(5)->addMinutes(12)->toDateTimeString(),
        ]);
    }
}
