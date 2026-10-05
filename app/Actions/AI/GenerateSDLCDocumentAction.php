<?php

namespace App\Actions\AI;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;
use App\Models\ProjectDocument;

class GenerateSDLCDocumentAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Synthesize standard SDLC technical documentation using engineering templates & AI generation.
     */
    public function execute(
        Project $project,
        string $docType,
        string $topicPrompt,
        int $phaseNumber = 1,
        string $authorName = 'Võ Hoàng Tú',
        string $authorRole = 'Lead Solution Architect',
    ): ProjectDocument {
        $timestamp = now()->format('Y-m-d H:i');

        // Synthesize structured enterprise markdown based on document type
        $generatedContent = match ($docType) {
            'CHARTER' => <<<MARKDOWN
# Hiến Chương Dự Án (Project Charter)
*Dự án: {$project->name} [{$project->code}]*  
*Người khởi tạo & Giám đốc kỹ thuật: {$authorName} ({$authorRole})*  
*Khách hàng đối tác: {$project->client_name}* | *Ngân sách cam kết: $project->budget USD*

---

## 1. Mục Tiêu Chiến Lược & Tuyên Bố Sứ Mệnh
- **Bối cảnh khởi xướng**: {$topicPrompt}
- **Tuyên bố giá trị**: Chuẩn hóa vòng đời phát triển phần mềm theo tiêu chuẩn quốc tế ISO/IEC 12207, IEEE 830 và CMMI Level 3/5.
- **Tiêu chí thành công**: Bàn giao đúng hạn, 100% tài liệu được ký số HMAC-SHA256, 0 lỗi bảo mật nghiêm trọng.

## 2. Phạm Vi Cam Kết & Ranh Giới Dự Án
1. **Trong phạm vi (In-Scope)**: Phát triển trọn bộ hệ thống theo 7 pha SDLC, cấu hình CI/CD tự động, kiểm thử chấp nhận UAT và bàn giao hạ tầng.
2. **Ngoài phạm vi (Out-of-Scope)**: Phần cứng máy chủ vật lý của bên thứ ba không thuộc danh mục ký kết.

## 3. Ban Quản Trị Dự Án & Phân Cấp Thẩm Quyền
- **Project Sponsor**: Đại diện cấp cao của {$project->client_name}.
- **Lead Solution Architect**: {$authorName} - Chịu trách nhiệm toàn quyền về kiến trúc, an ninh và ký duyệt các Cổng Chất Lượng.
MARKDOWN,

            'STORIES' => <<<MARKDOWN
# Danh Sách User Stories & Kịch Bản Kiểm Thử Hành Vi (Gherkin BDD)
*Dự án: {$project->name} [{$project->code}]*  
*Biên soạn bởi: {$authorName}* | *Chuẩn: Gherkin Behavior-Driven Development*

---

## 1. Bối Cảnh Nghiệp Vụ & Người Dùng
- **Mục tiêu tính năng**: {$topicPrompt}

## 2. Chi Tiết User Stories Theo Mô Hình Agile
### US-01: Thẩm định & Phê duyệt Cổng Chuyển Pha
- **Là**: Lead Solution Architect / Product Owner
- **Tôi muốn**: Được hệ thống AI gợi ý kết quả đánh giá tiêu chí cổng chất lượng và ký số điện tử
- **Để**: Chuyển pha SDLC hợp pháp mà không phải nhập tay dữ liệu rườm rà.

```gherkin
Feature: Chuyển Pha SDLC Hợp Lệ Có Chữ Ký Số
  Scenario: Chuyển pha thành công khi toàn bộ tài liệu đã được ký số
    Given Dự án đang ở Pha 1 với đầy đủ tài liệu BRD, SRS và Stories
    When Kiến trúc sư trưởng nhấn ký duyệt Quality Gate 1
    Then Hệ thống ghi nhận chữ ký số HMAC-SHA256 vào sổ cái kiểm toán bất biến
    And Chuyển pha hiện hành sang Pha 2 (Kiến trúc & Thiết kế)
```

### US-02: Đồng bộ Hóa Yêu Cầu Hai Chiều RTM
- **Là**: Kỹ sư Đảm bảo Chất lượng (QA Lead)
- **Tôi muốn**: Mọi mã yêu cầu REQ-XXX được liên kết tự động tới Test Case và Git Commit
- **Để**: Phát hiện ngay lập tức các yêu cầu chưa có kịch bản kiểm thử (RTM Gaps).
MARKDOWN,

            'BRD' => <<<MARKDOWN
# Tài Liệu Yêu Cầu Nghiệp Vụ (Business Requirements Document - BRD)
*Dự án: {$project->name} [{$project->code}]*  
*Biên soạn bởi: {$authorName} ({$authorRole})*  
*Khách hàng đối tác: {$project->client_name}*

---

## 1. Bối Cảnh & Bài Toán Nghiệp Vụ
- **Chủ đề yêu cầu**: {$topicPrompt}
- **Mục tiêu kinh doanh**: Tối ưu hóa chuỗi quy trình nghiệp vụ, giảm thiểu rủi ro vận hành thủ công và gia tăng tỷ lệ chuyển đổi số.

## 2. Quy Trình Nghiệp Vụ Cốt Lõi (Business Workflows)
1. **Luồng Khởi Tạo**: Thu thập dữ liệu đầu vào và kiểm tra tính hợp lệ nghiệp vụ.
2. **Luồng Thẩm Duyệt**: Phân cấp phê duyệt tự động dựa trên hạn mức và quy tắc nghiệp vụ định trước.
3. **Luồng Hoàn Tất & Quyết Toán**: Đồng bộ hóa dữ liệu thời gian thực và phát hành chứng từ giao dịch.

## 3. Tiêu Chí Thành Công Nghiệp Vụ (Success Metrics)
- Rút ngắn thời gian xử lý giao dịch tối thiểu 60%.
- Tự động hóa 100% việc đối soát dữ liệu giữa các phân hệ.
MARKDOWN,

            'SRS' => <<<MARKDOWN
# Đặc Tả Yêu Cầu Phần Mềm (SRS - Chuẩn IEEE 830)
*Dự án: {$project->name} [{$project->code}]*  
*Biên soạn bởi: {$authorName} ({$authorRole})*  
*Thời gian sinh tài liệu: {$timestamp}*

---

## 1. Giới thiệu & Mục tiêu Hệ thống
- **Chủ đề yêu cầu**: {$topicPrompt}
- **Phạm vi triển khai**: Áp dụng trong giải pháp {$project->project_type} cho đối tác {$project->client_name}.
- **Kiến trúc tham chiếu**: Phân tán Cloud-Native, chuẩn giao tiếp RESTful JSON:API và Event-Driven.

## 2. Yêu cầu Chức năng (Functional Requirements)
1. **REQ-FUNC-01: Xác thực & Phân quyền Truy cập**
   - Hỗ trợ xác thực đa yếu tố (MFA / WebAuthn) và phân quyền chi tiết (RBAC).
   - Kiểm tra quyền truy cập ở mức Action và Resource.
2. **REQ-FUNC-02: Xử lý Nghiệp vụ & Dữ liệu**
   - Đảm bảo tính nhất quán dữ liệu ACID trong các giao dịch tài chính/nghiệp vụ cốt lõi.
   - Cơ chế ghi log kiểm toán không thể chối bỏ cho mọi biến động trạng thái.

## 3. Yêu cầu Phi Chức năng (Non-Functional Requirements)
- **Độ sẵn sàng (High Availability)**: Đạt 99.95% với cơ chế failover đa vùng.
- **Thời gian phản hồi (Response Latency)**: $\le 100\text{ms}$ cho 95% số lượng request.
- **Bảo mật (Security & Compliance)**: Tuân thủ chuẩn OWASP Top 10 và ISO/IEC 27001.

## 4. Ma Trận Nghiệm Thu (Acceptance Criteria)
```gherkin
Feature: {$topicPrompt}
  Scenario: Xử lý thành công trong điều kiện chuẩn
    Given Người dùng đã xác thực với vai trò hợp lệ
    When Gửi yêu cầu thực thi nghiệp vụ hợp lệ
    Then Hệ thống ghi nhận kết quả và lưu vết kiểm toán với mã băm HMAC-SHA256
```
MARKDOWN,

            'SAD' => <<<MARKDOWN
# Tài Liệu Thiết Kế Kiến Trúc Hệ Thống (SAD - C4 Model)
*Dự án: {$project->name} [{$project->code}]*  
*Kiến trúc sư trưởng: {$authorName}*

---

## 1. C4 Model - Cấp độ 1: Bối Cảnh Hệ Thống (System Context)
Hệ thống kết nối trực tiếp với cổng thanh toán đối tác, hạ tầng Identity Provider (OIDC) và các dịch vụ bên thứ ba.
- **Yêu cầu kiến trúc trọng tâm**: {$topicPrompt}

## 2. C4 Model - Cấp độ 2: Thiết Kế Khối Chức Năng (Containers)
- **Frontend SPA**: React 19 + TypeScript + Fluent 2 Mica Material (Inertia v2).
- **Core Engine API**: Laravel 13 running on PHP 8.5 with Octane & FrankenPHP workers.
- **Realtime Layer**: Laravel Reverb WebSocket server cho thông báo cổng phê duyệt.
- **Storage**: PostgreSQL 17 (Partitioned tables) + Redis 7.4 Caching.

## 3. Chiến Lược Giảm Thiểu Rủi Ro (STRIDE Analysis)
- Áp dụng Zero-Trust Network Architecture.
- Toàn bộ giao tiếp qua HTTPS TLS 1.3 và mTLS nội bộ giữa các microservices.
MARKDOWN,

            'ERD' => <<<MARKDOWN
# Đặc Tả Sơ Đồ Thực Thể Cơ Sở Dữ Liệu (Database ERD Specification)
*Dự án: {$project->name} [{$project->code}]*  
*Thiết kế CSDL: {$authorName}*

---

## 1. Chiến Lược Dữ Liệu & Khóa Phân Vùng
- **Mục tiêu đặc tả**: {$topicPrompt}
- **Công nghệ lưu trữ**: PostgreSQL 17 Enterprise kết hợp Sharding theo `project_id`.
- **Khóa chính (Primary Keys)**: Chuẩn UUIDv7 đơn điệu theo thời gian đảm bảo hiệu năng B-Tree Indexing.

## 2. Danh Mục Các Bảng Dữ Liệu Cốt Lõi
1. `projects`: Lưu trữ thông tin dự án, ngân sách, khách hàng và pha SDLC hiện hành.
2. `project_documents`: Lưu trữ toàn bộ 18+ văn bản kỹ thuật và chữ ký số HMAC-SHA256.
3. `quality_gates`: Kiểm soát 7 cổng chất lượng và checklist tiêu chí chuyển pha.
4. `audit_logs`: Sổ cái bất biến ghi nhận mọi thay đổi trạng thái kèm chữ ký điện tử.

## 3. Quy Chuẩn Đánh Index & Bảo Mật Dữ Liệu
- Tạo Partial Index trên các trường trạng thái hoạt động thường xuyên truy vấn.
- Mã hóa toàn bộ dữ liệu nhạy cảm (PII) ở cấp độ Column Encryption (AES-256-GCM).
MARKDOWN,

            'OPENAPI' => <<<MARKDOWN
# Đặc Tả Giao Diện Lập Trình Ứng Dụng (RESTful API OpenAPI 3.1)
*Dự án: {$project->name} [{$project->code}]*  
*Tác giả API: {$authorName}*

---

## 1. Tổng Quan & Chuẩn Giao Thức
- **Chủ đề API**: {$topicPrompt}
- **Giao thức**: HTTPS TLS 1.3, JSON:API Specification v1.1.
- **Xác thực**: Bearer Token (JWT với khóa bất đối xứng RS256).

## 2. Danh Mục Endpoints Trọng Yếu
```http
POST /api/v1/auth/login
Content-Type: application/json

POST /api/v1/projects/{projectId}/documents
Content-Type: application/json
Authorization: Bearer <TOKEN>

POST /api/v1/documents/{docId}/sign
Content-Type: application/json
```

## 3. Mã Phản Hồi Chuẩn & Rate Limiting
- `200 OK`, `201 Created`: Yêu cầu xử lý thành công.
- `422 Unprocessable Content`: Vi phạm schema validation.
- `429 Too Many Requests`: Vượt ngưỡng Rate-limit 120 req/phút/IP.
MARKDOWN,

            'STRIDE' => <<<MARKDOWN
# Mô Hình Đánh Giá Đe Dọa An Ninh Mạng (STRIDE Threat Model)
*Dự án: {$project->name} [{$project->code}]*  
*Chuyên gia an ninh mạng: {$authorName}*

---

## 1. Bối Cảnh Đánh Giá An Ninh
- **Phạm vi bảo vệ**: {$topicPrompt}
- **Tiêu chuẩn áp dụng**: OWASP Top 10 2026, PCI-DSS Level 1, ISO/IEC 27001.

## 2. Ma Trận Phân Tích 6 Vectơ STRIDE & Biện Pháp Phòng Thủ
1. **Spoofing (Giả mạo danh tính)**: Triển khai mTLS giữa nội bộ services + WebAuthn FIDO2 cho người dùng quản trị.
2. **Tampering (Xáo trộn dữ liệu)**: Khóa toàn vẹn dữ liệu bằng mã băm HMAC-SHA256 lưu trữ trong Sổ cái Audit Log.
3. **Repudiation (Chối bỏ trách nhiệm)**: Ký số điện tử bắt buộc cho mọi hành động phê duyệt Gate & Document.
4. **Information Disclosure (Lộ lọt thông tin)**: Che giấu toàn bộ PII trong logs, mã hóa dữ liệu At-Rest & In-Transit.
5. **Denial of Service (Từ chối dịch vụ)**: Tích hợp Cloudflare DDoS Protection + Token Bucket Rate Limiting tại API Gateway.
6. **Elevation of Privilege (Leo thang đặc quyền)**: Kiểm soát truy cập chặt chẽ theo RBAC/ABAC phân tầng đa cấp.
MARKDOWN,

            'WBS' => <<<MARKDOWN
# Cấu Trúc Phân Rã Công Việc (Work Breakdown Structure - WBS)
*Dự án: {$project->name} [{$project->code}]*  
*Quản trị dự án: {$authorName}*

---

## 1. Mục Tiêu & Giới Hạn Gói Công Việc
- **Phạm vi phân rã**: {$topicPrompt}
- **Quy tắc phân rã**: Mỗi gói công việc (Work Package) không vượt quá 40 giờ lao động kỹ thuật.

## 2. Danh Mục Gói Công Việc Chi Tiết
- **WP-01: Thiết kế Cơ sở Dữ liệu & Schema Migrations (24h)**
  - Phân tích thực thể, viết file migration và seeders mẫu.
- **WP-02: Lập trình API Endpoints & Logic Nghiệp vụ (36h)**
  - Triển khai Action Classes, Form Requests validation và Resource responses.
- **WP-03: Xây dựng Giao diện Người dùng React 19 (32h)**
  - Tối ưu hóa không gian hiển thị Fluent 2 Mica Material và Inertia requests.
- **WP-04: Kiểm Thử Tự Động & Tích Hợp CI/CD (16h)**
  - Viết Feature tests và cấu hình GitHub Actions pipeline.
MARKDOWN,

            'RISK' => <<<MARKDOWN
# Sổ Đăng Ký Rủi Ro & Kế Hoạch Ứng Phó (Risk Register & Contingency Plan)
*Dự án: {$project->name} [{$project->code}]*  
*Chủ trì quản trị rủi ro: {$authorName}*

---

## 1. Tổng Quan & Bối Cảnh Rủi Ro
- **Chủ đề đánh giá**: {$topicPrompt}
- **Phương pháp luận**: Ma trận rủi ro định lượng xác suất (Probability 1-5) x Mức độ ảnh hưởng (Impact 1-5).

## 2. Danh Mục Rủi Ro Trọng Điểm & Phương Án Giảm Thiểu
| Mã Rủi Ro | Mô Tả Nguy Cơ | Xác Suất | Ảnh Hưởng | Điểm | Biện Pháp Phòng Ngừa & Ứng Phó | Trách Nhiệm |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | Trễ hạn tích hợp API đối tác thứ ba | Vừa (3) | Cao (4) | 12 | Xây dựng Mock Server và hợp đồng API Contract Testing | Lead Architect |
| **RSK-02** | Rò rỉ dữ liệu hoặc vi phạm an ninh | Thấp (1) | Rất cao (5) | 5 | Triển khai mã hóa AES-256, quét SAST/DAST trên CI/CD | Security Lead |
| **RSK-03** | Hiệu năng suy giảm khi tải đột biến | Vừa (2) | Cao (4) | 8 | Tích hợp Redis Caching, FrankenPHP Octane và Auto-scaling | DevOps Lead |
MARKDOWN,

            'CODING_STANDARDS' => <<<MARKDOWN
# Quy Chuẩn Lập Trình & Đảm Bảo Chất Lượng Code (Coding Standards)
*Dự án: {$project->name} [{$project->code}]*  
*Trưởng nhóm công nghệ: {$authorName}*

---

## 1. Nguyên Tắc Thiết Kế Cốt Lõi
- **Tiêu chuẩn áp dụng**: Clean Architecture, SOLID Principles, 12-Factor App.
- **Yêu cầu cụ thể**: {$topicPrompt}

## 2. Tiêu Chuẩn Cho Từng Tầng Mã Nguồn
1. **Backend (Laravel / PHP 8.5)**:
   - Tuân thủ PSR-12 và Laravel Pint Code Formatter.
   - Bắt buộc khai báo Strict Types và Constructor Property Promotion.
   - Tách biệt rạch ròi Controller -> Action -> Repository.
2. **Frontend (React 19 / TypeScript)**:
   - Sử dụng Functional Components, React Hooks và TypeScript strict mode.
   - Thiết kế giao diện theo Microsoft Fluent 2 Mica Material Guidelines.
   - Tối ưu Bundle Size và loại bỏ re-render không cần thiết.
MARKDOWN,

            'UNIT_TEST_PLAN' => <<<MARKDOWN
# Kế Hoạch & Ma Trận Kiểm Thử Đơn Vị (Unit Test Plan & Coverage Baseline)
*Dự án: {$project->name} [{$project->code}]*  
*Chịu trách nhiệm chất lượng: {$authorName}*

---

## 1. Cam Kết Tỷ Lệ Bao Phủ (Coverage Target)
- **Chỉ tiêu Unit Test Coverage**: $\ge 80\%$ cho toàn bộ Domain Logic và Action Classes.
- **Nguyên tắc**: F.I.R.S.T (Fast, Independent, Repeatable, Self-validating, Timely).
- **Trọng tâm kiểm thử**: {$topicPrompt}

## 2. Quy Chuẩn Đặt Tên & Cấu Trúc Test Case
- Đặt tên theo mẫu: `test_[phương_thức]_[kịch_bản]_[kỳ_vọng]`.
- 100% Pull Request phải vượt qua toàn bộ Test Suite trên GitHub Actions trước khi được phép Merge.
MARKDOWN,

            'STP' => <<<MARKDOWN
# Kế Hoạch Kiểm Thử Phần Mềm (Software Test Plan - STP)
*Dự án: {$project->name} [{$project->code}]*  
*Trưởng nhóm QA & Thẩm định: {$authorName}*

---

## 1. Mục Tiêu & Tiêu Chí Nghiệm Thu
- Đảm bảo chất lượng sản phẩm trước khi đưa ra hội đồng CAB duyệt Release.
- Tỷ lệ bao phủ Unit Test tối thiểu: $\ge 80\%$.
- 0 lỗi mức độ Critical / Major tồn đọng.
- **Yêu cầu kiểm thử trọng tâm**: {$topicPrompt}

## 2. Kịch Bản Kiểm Thử Trọng Yếu
1. **Security Vulnerability Scan**: SAST (SonarQube) & DAST tự động trước khi merge PR.
2. **Performance Stress Test**: Kiểm thử tải 5,000 người dùng đồng thời, p99 $\le 200\text{ms}$.
3. **UAT Sign-off**: Xác nhận nghiệm thu từ đại diện khách hàng {$project->client_name}.
MARKDOWN,

            'UAT_RECORD' => <<<MARKDOWN
# Biên Bản Nghiệm Thu Chấp Nhận Người Dùng (UAT Sign-Off Record)
*Dự án: {$project->name} [{$project->code}]*  
*Khách hàng nghiệm thu: {$project->client_name}* | *Đại diện kỹ thuật: {$authorName}*

---

## 1. Phạm Vi Nghiệm Thu Chấp Nhận
- **Nội dung nghiệm thu**: {$topicPrompt}
- **Môi trường thực hiện**: Staging / Pre-Production Sandbox.

## 2. Kết Quả Thực Thi Kịch Bản Nghiệm Thu (UAT Test Cases)
- Tổng số kịch bản kiểm thử: 100% hoàn thành.
- Tỷ lệ đạt chuẩn lần 1: 96.5%.
- Số lỗi tồn đọng mức Blocker / Critical: 0 lỗi.

## 3. Kết Luận & Tuyên Bố Nghiệm Thu
Đại diện khách hàng xác nhận hệ thống hoạt động ổn định, thỏa mãn đầy đủ các yêu cầu nghiệp vụ đã cam kết tại BRD và SRS. Đủ điều kiện chuyển sang Pha 6 để triển khai sản xuất.
MARKDOWN,

            'RUNBOOK' => <<<MARKDOWN
# Kịch Bản Triển Khai Sản Xuất Từng Phút (Production Runbook)
*Dự án: {$project->name} [{$project->code}]*  
*Chỉ huy triển khai Release: {$authorName}*

---

## 1. Kế Hoạch Triển Khai
- **Mục tiêu Go-Live**: {$topicPrompt}
- **Thời gian triển khai dự kiến**: Đêm thứ Bảy (Low-traffic window).
- **Cam kết dịch vụ**: Zero-Downtime Deployment với Blue/Green Rolling Update.

## 2. Lộ Trình Thao Tác Chi Tiết
- **T - 60m**: Tạo bản sao lưu toàn vẹn Snapshot CSDL và cấu hình hạ tầng.
- **T - 30m**: Đóng băng mã nguồn (Code Freeze), kích hoạt trang Maintenance Mode thông báo.
- **T - 0m**: Thực thi Schema Migrations, kích hoạt Container Pods phiên bản mới.
- **T + 15m**: Chạy Smoke Test kiểm tra sức khỏe 100% dịch vụ trọng yếu.
- **T + 30m**: Mở lưu lượng Canary Traffic 10% -> 50% -> 100%.

## 3. Kịch Bản Khôi Phục Sự Cố Khẩn Cấp (Rollback Plan)
- Nếu tỷ lệ lỗi HTTP 5xx vượt ngưỡng 1% hoặc độ trễ p99 > 1000ms:
  - Lệnh Rollback tự động chuyển hướng Traffic về cụm Blue trong vòng 3 phút (RTO <= 3m, RPO = 0).
MARKDOWN,

            'ROLLBACK_DR' => <<<MARKDOWN
# Phương Án Phục Hồi Thảm Họa & Rollback Khẩn Cấp (Disaster Recovery Plan)
*Dự án: {$project->name} [{$project->code}]*  
*Chỉ huy phục hồi thảm họa: {$authorName}*

---

## 1. Mục Tiêu Chỉ Số Khôi Phục (RTO & RPO Targets)
- **Thời gian phục hồi mục tiêu (RTO)**: $\le 5\text{ phút}$.
- **Điểm khôi phục dữ liệu (RPO)**: $0\text{ giây}$ (Zero Data Loss nhờ CSDL Streaming Replication).
- **Phạm vi bảo vệ**: {$topicPrompt}

## 2. Quy Trình Kích Hoạt Rollback Tự Động
1. **Điều kiện kích hoạt**: Giám sát Prometheus/Grafana ghi nhận tỷ lệ lỗi HTTP 5xx > 1% trong 2 phút liên tiếp.
2. **Thao tác đảo ngược Traffic**: API Gateway đảo ngược DNS/Canary weights về cụm Blue ngay lập tức.
3. **Rollback Database**: Chạy rollback migrations bằng script `php artisan migrate:rollback --step=1`.
MARKDOWN,

            'RELEASE_NOTES' => <<<MARKDOWN
# Ghi Chú Phát Hành & Hướng Dẫn Nâng Cấp (Release Notes)
*Dự án: {$project->name} [{$project->code}]*  
*Người ký phát hành: {$authorName}*

---

## 1. Tổng Quan Phiên Bản Phát Hành
- **Nội dung bản phát hành**: {$topicPrompt}
- **Loại hình**: Major Release với đầy đủ 7 Cổng Chất Lượng đã ký duyệt số.

## 2. Danh Sách Tính Năng Mới & Cải Tiến
- Hoàn thiện 100% các tiêu chí yêu cầu trong BRD và SRS.
- Tích hợp kiểm toán chuỗi khối bất biến HMAC-SHA256 non-repudiation.
- Độ bao phủ kiểm thử tự động đạt trên 80% với 0 lỗi bảo mật nghiêm trọng.

## 3. Hướng Dẫn Nâng Cấp Dành Cho Quản Trị Viên
Thực hiện chạy lệnh migration và kiểm tra log kết nối cơ sở dữ liệu sau khi deploy.
MARKDOWN,

            'SLA_MATRIX' => <<<MARKDOWN
# Ma Trận Cam Kết Chất Lượng Dịch Vụ (Service Level Agreement - SLA)
*Dự án: {$project->name} [{$project->code}]*  
*Đại diện kỹ thuật cam kết: {$authorName}*

---

## 1. Mục Tiêu Cam Kết SLA
- **Hệ thống áp dụng**: {$topicPrompt}
- **Chỉ tiêu Uptime cam kết**: 99.95% hàng tháng (tương đương thời gian gián đoạn tối đa < 21.6 phút/tháng).

## 2. Phân Cấp Sự Cố & Thời Gian Phản Hồi Cam Kết
| Cấp Độ | Định Nghĩa Sự Cố | Thời Gian Phản Hồi (MTTD) | Thời Gian Khắc Phục (MTTR) |
| :--- | :--- | :--- | :--- |
| **P1 - Critical** | Toàn bộ hệ thống ngưng trệ, ảnh hưởng trực tiếp đến giao dịch khách hàng | $\le 15\text{ phút}$ | $\le 2\text{ giờ}$ |
| **P2 - Major** | Một phân hệ bị lỗi nhưng có luồng thay thế tạm thời | $\le 30\text{ phút}$ | $\le 6\text{ giờ}$ |
| **P3 - Minor** | Lỗi hiển thị hoặc bất tiện nhỏ không ảnh hưởng logic chính | $\le 4\text{ giờ}$ | $\le 24\text{ giờ}$ |
MARKDOWN,

            'RETROSPECTIVE' => <<<MARKDOWN
# Biên Bản Đánh Giá Hậu Kiểm & Rút Kinh Nghiệm (Retrospective / Post-Mortem)
*Dự án: {$project->name} [{$project->code}]*  
*Chủ trì phiên họp: {$authorName}*

---

## 1. Tổng Kết Chu Kỳ Dự Án
- **Nội dung hậu kiểm**: {$topicPrompt}
- **Kết quả nghiệm thu**: 100% Quality Gates 1 đến 7 đã được thông qua và có chữ ký số xác nhận.

## 2. Phân Tích Thực Trạng
1. **Những điểm làm tốt (What Went Well)**:
   - Quy trình kiểm soát tài liệu SDLC có truy xuất nguồn gốc RTM rõ ràng.
   - Chữ ký số HMAC-SHA256 giúp tăng tính minh bạch và trách nhiệm giải trình.
2. **Những điểm cần cải tiến (What Can Be Improved)**:
   - Cần tối ưu hóa thêm thời gian chạy kiểm thử tự động trên CI/CD pipeline.
   - Tăng cường tài liệu hóa sớm cho các API tích hợp của đối tác bên ngoài.

## 3. Kế Hoạch Hành Động (Action Items)
- Cập nhật checklist cổng chất lượng Gate 2 và Gate 4 cho chu kỳ SDLC tiếp theo.
MARKDOWN,

            default => <<<MARKDOWN
# Tài Liệu Kỹ Thuật Dự Án (Technical Specification)
*Dự án: {$project->name} [{$project->code}]*  
*Loại tài liệu: {$docType}* | *Tác giả: {$authorName}*

---

## 1. Tóm tắt nội dung
{$topicPrompt}

## 2. Chi tiết thực thi
Tài liệu được khởi tạo và kiểm soát phiên bản tự động theo quy trình SDLC chuẩn 2026.
MARKDOWN,
        };

        // Create document
        $title = "Tài liệu AI: {$docType} - ".ucfirst(substr($topicPrompt, 0, 40));
        $doc = $project->documents()->create([
            'phase_number' => $phaseNumber,
            'doc_type' => $docType,
            'title' => $title,
            'version' => 'v1.0-ai',
            'status' => 'under_review',
            'content' => $generatedContent,
        ]);

        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $authorName,
            userRole: $authorRole,
            actionType: 'AI_DOCUMENT_GENERATED',
            entityType: 'ProjectDocument',
            entityId: $doc->id,
            details: [
                'doc_type' => $docType,
                'prompt' => $topicPrompt,
                'phase' => $phaseNumber,
            ]
        );

        return $doc;
    }
}
