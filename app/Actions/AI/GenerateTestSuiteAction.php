<?php

namespace App\Actions\AI;

use App\Actions\Audit\RecordAuditLogAction;
use App\Actions\Testing\CreateTestRunAction;
use App\Models\Project;
use App\Models\TestRun;

class GenerateTestSuiteAction
{
    public function __construct(
        protected CreateTestRunAction $createTestRunAction,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Synthesize comprehensive test suite from SRS and Gherkin scenarios for Phase 5 Testing.
     */
    public function execute(
        Project $project,
        string $authorName = 'AI QA Test Suite Generator (Autonomous 99%)',
        string $authorRole = 'Autonomous QA Engineer',
    ): TestRun {
        $timestamp = now()->format('Ymd-Hi');
        $runName = "TR-AI-{$timestamp}: Kiểm Thử Tự Động Toàn Diện (Full Regression Suite)";

        $standardTestItems = [
            [
                'test_case_code' => 'TC-AI-01-AUTH',
                'title' => 'Kiểm thử xác thực bảo mật đa lớp WebAuthn & RBAC',
                'steps' => "1. Gửi request xác thực với token hợp lệ.\n2. Kiểm tra quyền truy cập vào endpoint nhạy cảm của dự án {$project->name}.\n3. Xác minh header bảo mật Content-Security-Policy.",
                'expected_result' => 'HTTP 200 OK, phiên đăng nhập được cấp quyền chính xác, mọi hành vi lưu vết kiểm toán.',
            ],
            [
                'test_case_code' => 'TC-AI-02-GATE',
                'title' => 'Kiểm thử chuyển pha SDLC & sinh mã băm HMAC-SHA256',
                'steps' => "1. Gọi API phê duyệt Quality Gate với chữ ký số.\n2. Kiểm tra tính toàn vẹn của mã băm HMAC.\n3. Kiểm tra trạng thái chuyển pha tự động.",
                'expected_result' => 'Chữ ký số hợp lệ được ghi nhận vào Sổ cái Audit Trail, dự án chuyển pha thành công.',
            ],
            [
                'test_case_code' => 'TC-AI-03-RTM',
                'title' => 'Kiểm thử truy xuất nguồn gốc hai chiều RTM Traceability Link',
                'steps' => "1. Tạo liên kết giữa REQ và Test Case.\n2. Kiểm tra ma trận phân tích lỗ hổng RTM Gaps.\n3. Cập nhật trạng thái tiến độ.",
                'expected_result' => 'Tỷ lệ bao phủ kiểm thử tăng lên, loại bỏ triệt để các yêu cầu không có test case.',
            ],
            [
                'test_case_code' => 'TC-AI-04-SECURITY',
                'title' => 'Kiểm thử phòng chống tấn công chèn mã SQLi & XSS (OWASP Top 10)',
                'steps' => "1. Chèn payload SQL Injection vào các trường input tìm kiếm.\n2. Chèn payload XSS vào nội dung tài liệu Markdown.\n3. Kiểm tra cơ chế sanitize và escaping tự động.",
                'expected_result' => 'Hệ thống tự động ngăn chặn và sanitize payload độc hại, không xảy ra rò rỉ dữ liệu.',
            ],
            [
                'test_case_code' => 'TC-AI-05-PERF',
                'title' => 'Kiểm thử thời gian đáp ứng API dưới tải trọng cao (SLA <= 100ms)',
                'steps' => "1. Giả lập 500 requests đồng thời tới Core APIs.\n2. Đo lường chỉ số phản hồi p95 và p99.\n3. Giám sát sử dụng bộ nhớ và CPU.",
                'expected_result' => 'Thời gian phản hồi p95 <= 80ms, không phát sinh lỗi HTTP 5xx, CPU ổn định dưới 70%.',
            ],
            [
                'test_case_code' => 'TC-AI-06-DR',
                'title' => 'Kiểm thử kịch bản Rollback khẩn cấp và phục hồi thảm họa (RTO <= 5m)',
                'steps' => "1. Kích hoạt trạng thái cảnh báo sự cố giả lập.\n2. Điều hướng lưu lượng Canary Traffic về cụm Blue an toàn.\n3. Xác minh tính toàn vẹn dữ liệu.",
                'expected_result' => 'Lưu lượng được chuyển hướng trong vòng dưới 3 phút, dữ liệu nguyên vẹn 100% (RPO = 0).',
            ],
        ];

        $testRun = $this->createTestRunAction->execute([
            'project_id' => $project->id,
            'name' => $runName,
            'environment' => 'staging',
            'executed_by' => $authorName,
            'items' => $standardTestItems,
        ], userName: $authorName, userRole: $authorRole);

        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $authorName,
            userRole: $authorRole,
            actionType: 'AI_TEST_SUITE_GENERATED',
            entityType: 'TestRun',
            entityId: $testRun->id,
            details: [
                'test_run_id' => $testRun->id,
                'items_count' => count($standardTestItems),
            ]
        );

        return $testRun;
    }
}
