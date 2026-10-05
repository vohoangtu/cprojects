<?php

namespace App\Services\AI;

use App\Models\Project;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AIService
{
    /**
     * Call external LLM endpoint if configured, otherwise returns null.
     */
    public function callLLM(string $systemPrompt, string $userPrompt, array $options = []): ?string
    {
        $apiKey = config('services.ai.key');
        if (! $apiKey) {
            return null;
        }

        $baseUrl = rtrim((string) config('services.ai.base_url', 'https://api.openai.com/v1'), '/');
        $model = (string) config('services.ai.model', 'gpt-4o-mini');
        $endpoint = str_ends_with($baseUrl, '/chat/completions') ? $baseUrl : "{$baseUrl}/chat/completions";

        try {
            $response = Http::withToken($apiKey)
                ->timeout($options['timeout'] ?? 45)
                ->post($endpoint, [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'temperature' => $options['temperature'] ?? 0.7,
                    'max_tokens' => $options['max_tokens'] ?? 3000,
                ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                if ($content && is_string($content)) {
                    return trim($content);
                }
            } else {
                Log::warning('AI Service LLM call unsuccessful: '.$response->body());
            }
        } catch (\Throwable $e) {
            Log::warning('AI Service LLM call failed with exception: '.$e->getMessage());
        }

        return null;
    }

    /**
     * Analyze a raw product/project idea into structured SDLC specifications.
     *
     * @return array<string, mixed>
     */
    public function analyzeIdea(string $ideaPrompt, array $context = []): array
    {
        $systemPrompt = <<<'PROMPT'
Bạn là một Lead Solution Architect & Chief Enterprise Architect chuẩn CMMI Level 5 và ISO/IEC 12207.
Nhiệm vụ của bạn là nhận ý tưởng hoặc bài toán nghiệp vụ từ người dùng và phân tích toàn diện thành cấu trúc dự án phần mềm chuyên nghiệp.
Hãy trả về JSON thuần túy (không bọc trong markdown code fence, hoặc bọc ```json) với cấu trúc sau:
{
  "name": "Tên dự án chuyên nghiệp, rõ ràng",
  "code": "Mã dự án (vd: PRJ-BUS-2026)",
  "client_name": "Tên khách hàng / Đối tác phù hợp",
  "project_type": "enterprise | product | outsourcing | rnd",
  "budget": 250000,
  "target_delivery_months": 6,
  "domain": "Lĩnh vực (vd: Smart Mobility & IoT, Fintech, Healthcare, E-Commerce, Logistics)",
  "summary": "Tóm tắt bài toán nghiệp vụ và giá trị cốt lõi giải pháp mang lại",
  "actors": ["Người dùng cuối", "Quản trị viên", "Hệ thống tích hợp..."],
  "functional_requirements": [
    {"code": "REQ-01", "title": "Tiêu đề yêu cầu", "description": "Mô tả chi tiết", "priority": "high | medium | low"}
  ],
  "non_functional_requirements": [
    {"category": "Performance", "spec": "Thời gian phản hồi P95 <= 100ms"},
    {"category": "Security", "spec": "Xác thực MFA, mã hóa AES-256"},
    {"category": "Availability", "spec": "Uptime >= 99.95%"},
    {"category": "Scalability", "spec": "Hỗ trợ 10,000 người dùng đồng thời"}
  ],
  "architecture_recommendation": {
    "frontend": "React 19, TypeScript, Fluent UI",
    "backend": "Laravel 13, Clean Architecture, PHP 8.5",
    "database": "PostgreSQL 17, Redis 8 Cluster",
    "messaging": "Apache Kafka / RabbitMQ",
    "security": "OAuth 2.0, OpenID Connect, HMAC-SHA256"
  },
  "user_stories": [
    {
      "code": "US-01",
      "role": "Đối tượng",
      "action": "Tôi muốn...",
      "benefit": "Để...",
      "gherkin": "Scenario: ...\nGiven ...\nWhen ...\nThen ..."
    }
  ],
  "initial_rtm": [
    {"req_code": "REQ-01", "req_title": "Tiêu đề", "story": "US-01", "test": "TC-01", "status": "in_dev"}
  ],
  "wbs_phases": [
    {"phase": 1, "task": "Khảo sát và lập BRD/SRS chi tiết", "estimated_hours": 40},
    {"phase": 2, "task": "Thiết kế C4 Model và Schema DB", "estimated_hours": 60},
    {"phase": 3, "task": "Lập kế hoạch Sprint & phân bổ RACI", "estimated_hours": 30},
    {"phase": 4, "task": "Lập trình phân hệ cốt lõi & CI/CD", "estimated_hours": 160},
    {"phase": 5, "task": "Kiểm thử tự động & nghiệm thu UAT", "estimated_hours": 80},
    {"phase": 6, "task": "Diễn tập Runbook & triển khai Canary", "estimated_hours": 40},
    {"phase": 7, "task": "Giám sát SLA & bàn giao vận hành", "estimated_hours": 30}
  ]
}
PROMPT;

        $userPrompt = "Ý tưởng dự án cần phân tích:\n{$ideaPrompt}\n";
        if (! empty($context['client_name'])) {
            $userPrompt .= "Khách hàng mong muốn: {$context['client_name']}\n";
        }
        if (! empty($context['project_type'])) {
            $userPrompt .= "Loại hình mong muốn: {$context['project_type']}\n";
        }

        $llmResult = $this->callLLM($systemPrompt, $userPrompt);
        if ($llmResult) {
            $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($llmResult));
            $parsed = json_decode((string) $cleanJson, true);
            if (is_array($parsed) && ! empty($parsed['name']) && ! empty($parsed['functional_requirements'])) {
                return $parsed;
            }
        }

        // Fallback to Intelligent Domain Heuristics Engine
        return $this->analyzeIdeaHeuristics($ideaPrompt, $context);
    }

    /**
     * Synthesize technical document Markdown according to engineering standards.
     */
    public function synthesizeDocument(Project $project, string $docType, string $topicPrompt = '', array $extraContext = []): string
    {
        $systemPrompt = <<<'PROMPT'
Bạn là Lead Solution Architect và Chuyên gia Quản trị SDLC Doanh Nghiệp.
Hãy viết tài liệu kỹ thuật chuẩn quốc tế theo định dạng Markdown phong phú, chi tiết, chuyên nghiệp.
Tài liệu phải bám sát ngữ cảnh dự án được cung cấp (Tên dự án, mô tả, khách hàng, lĩnh vực).
Tuyệt đối KHÔNG viết chung chung, mà phải có các bảng biểu, mã cấu hình, kịch bản, tiêu chuẩn bảo mật thực tế.
PROMPT;

        $userPrompt = "Dự án: {$project->name} [{$project->code}]\n";
        $userPrompt .= "Khách hàng: {$project->client_name} | Loại hình: {$project->project_type} | Ngân sách: {$project->budget} USD\n";
        $userPrompt .= "Mô tả dự án: {$project->description}\n";
        $userPrompt .= "Loại tài liệu cần sinh: {$docType}\n";
        if ($topicPrompt) {
            $userPrompt .= "Chủ đề / Yêu cầu bổ sung: {$topicPrompt}\n";
        }

        $llmResult = $this->callLLM($systemPrompt, $userPrompt, ['max_tokens' => 3500]);
        if ($llmResult && strlen($llmResult) > 150) {
            return $llmResult;
        }

        // Fallback to Semantic Domain Synthesizer
        return $this->synthesizeDocumentSemantic($project, $docType, $topicPrompt, $extraContext);
    }

    /**
     * Synthesize Sprint Tasks for Kanban board based on project reality.
     *
     * @return array<int, array{code_suffix: string, title: string, description: string, points: int, status: string}>
     */
    public function synthesizeSprintTasks(Project $project): array
    {
        $domain = $this->detectDomain($project->name.' '.$project->description);
        $features = $domain['core_features'];

        $tasks = [
            [
                'code_suffix' => 'TSK-01',
                'title' => 'Thiết kế Database Schema & Migration cho '.$features[0],
                'description' => "Đặc tả các bảng dữ liệu cho {$features[0]} trong dự án {$project->name}, cấu hình khóa ngoại, indexes tối ưu và seeders kiểm thử.",
                'points' => 5,
                'status' => 'done',
            ],
            [
                'code_suffix' => 'TSK-02',
                'title' => 'Cài đặt Xác thực OIDC / WebAuthn & Middleware RBAC',
                'description' => "Triển khai phân quyền đa vai trò cho người dùng và quản trị viên của hệ thống {$project->name}.",
                'points' => 5,
                'status' => 'done',
            ],
            [
                'code_suffix' => 'TSK-03',
                'title' => 'Phát triển API Services & Nghiệp vụ: '.$features[1],
                'description' => "Xây dựng các Action classes và Form Requests xử lý {$features[1]} theo mô hình Clean Architecture.",
                'points' => 8,
                'status' => 'in_progress',
            ],
            [
                'code_suffix' => 'TSK-04',
                'title' => 'Tích hợp Module: '.$features[2],
                'description' => "Kết nối phân hệ {$features[2]} với persistence layer, xử lý cache Redis và ghi nhận Audit log.",
                'points' => 8,
                'status' => 'in_progress',
            ],
            [
                'code_suffix' => 'TSK-05',
                'title' => 'Giao diện Quản trị & Tương tác Người dùng (React 19 / Fluent UI)',
                'description' => "Thiết kế màn hình tương tác thời gian thực cho {$features[0]} và {$features[1]}.",
                'points' => 5,
                'status' => 'code_review',
            ],
            [
                'code_suffix' => 'TSK-06',
                'title' => 'Bộ Kiểm Thử Tự Động Feature Tests (Coverage >= 80%)',
                'description' => "Viết PHPUnit feature tests kiểm thử toàn bộ luồng nghiệp vụ từ Controller đến Database cho dự án {$project->name}.",
                'points' => 5,
                'status' => 'todo',
            ],
            [
                'code_suffix' => 'TSK-07',
                'title' => 'Tích hợp SAST Scanner & CI/CD Pipeline Gate 4',
                'description' => 'Cấu hình GitHub Actions / GitLab CI tự động chạy linter, security audit và test coverage.',
                'points' => 3,
                'status' => 'todo',
            ],
        ];

        return $tasks;
    }

    /**
     * Synthesize comprehensive test suite based on project reality.
     *
     * @return array<int, array{test_case_code: string, title: string, steps: string, expected_result: string}>
     */
    public function synthesizeTestSuite(Project $project): array
    {
        $domain = $this->detectDomain($project->name.' '.$project->description);
        $features = $domain['core_features'];

        return [
            [
                'test_case_code' => 'TC-SEC-01',
                'title' => 'Kiểm thử xác thực bảo mật & phân quyền vai trò (RBAC)',
                'steps' => "1. Gửi request xác thực với token hợp lệ.\n2. Kiểm tra quyền truy cập vào endpoint nhạy cảm của {$project->name}.\n3. Thử nghiệm truy cập trái phép với vai trò không đủ quyền.",
                'expected_result' => 'HTTP 200 OK cho vai trò hợp lệ; HTTP 403 Forbidden cho hành vi trái phép; ghi vết audit log đầy đủ.',
            ],
            [
                'test_case_code' => 'TC-FUNC-02',
                'title' => 'Kiểm thử luồng nghiệp vụ cốt lõi: '.$features[0],
                'steps' => "1. Khởi tạo dữ liệu mẫu cho {$features[0]}.\n2. Thực thi luồng xử lý giao dịch qua API.\n3. Kiểm tra tính toàn vẹn của dữ liệu trong cơ sở dữ liệu.",
                'expected_result' => 'Giao dịch thành công, dữ liệu cập nhật chính xác, trạng thái hợp lệ.',
            ],
            [
                'test_case_code' => 'TC-FUNC-03',
                'title' => 'Kiểm thử phân hệ: '.$features[1],
                'steps' => "1. Gửi payload kích hoạt {$features[1]}.\n2. Xác minh cơ chế validation và xử lý ngoại lệ.\n3. Đối soát phản hồi trả về.",
                'expected_result' => 'Xử lý chính xác theo quy tắc nghiệp vụ đã đặc tả trong SRS.',
            ],
            [
                'test_case_code' => 'TC-INT-04',
                'title' => 'Kiểm thử tích hợp hệ thống & Message Queue cho '.$features[2],
                'steps' => "1. Bắn 100 sự kiện đồng thời vào hàng đợi.\n2. Giám sát worker xử lý không làm mất gói tin.\n3. Xác minh tính đồng bộ.',",
                'expected_result' => '100% sự kiện được xử lý an toàn (Zero Data Loss), độ trễ dưới 200ms.',
            ],
            [
                'test_case_code' => 'TC-PERF-05',
                'title' => 'Kiểm thử tải trọng và thời gian phản hồi (P95 <= 100ms)',
                'steps' => "1. Giả lập 500 requests đồng thời tới Core APIs của {$project->name}.\n2. Đo lường chỉ số phản hồi p95 và p99.\n3. Giám sát sử dụng bộ nhớ và CPU.",
                'expected_result' => 'Thời gian phản hồi p95 <= 80ms, không phát sinh lỗi HTTP 5xx, CPU ổn định dưới 70%.',
            ],
            [
                'test_case_code' => 'TC-GATE-06',
                'title' => 'Kiểm thử chuyển pha SDLC & sinh mã băm chữ ký số HMAC-SHA256',
                'steps' => "1. Ký duyệt Quality Gate với token xác thực.\n2. Kiểm tra chuỗi hash Merkle trong Sổ cái Audit Vault.\n3. Xác minh dự án chuyển pha hợp lệ.",
                'expected_result' => 'Chữ ký số hợp lệ được lưu vết không thể chối bỏ, dự án chuyển pha thành công.',
            ],
        ];
    }

    /**
     * Heuristic analysis engine when external LLM is not configured.
     *
     * @return array<string, mixed>
     */
    protected function analyzeIdeaHeuristics(string $ideaPrompt, array $context = []): array
    {
        $domain = $this->detectDomain($ideaPrompt);
        $cleanTitle = $this->generateProjectName($ideaPrompt, $domain);
        $code = 'PRJ-'.$domain['code_prefix'].'-'.date('Y');
        $client = $context['client_name'] ?? $domain['sample_client'];
        $projectType = $context['project_type'] ?? 'enterprise';
        $budget = $context['budget'] ?? 250000.00;

        $features = $domain['core_features'];
        $reqs = [];
        foreach ($features as $idx => $feat) {
            $num = $idx + 1;
            $reqs[] = [
                'code' => sprintf('REQ-%s-%02d', $domain['code_prefix'], $num),
                'title' => $feat,
                'description' => "Cung cấp khả năng {$feat} với độ tin cậy cao, xác thực thời gian thực và ghi nhận vết kiểm toán.",
                'priority' => $num <= 2 ? 'high' : 'medium',
            ];
        }

        $stories = [];
        foreach ($reqs as $idx => $req) {
            $num = $idx + 1;
            $actor = $domain['actors'][$idx % count($domain['actors'])];
            $stories[] = [
                'code' => sprintf('US-%02d', $num),
                'role' => $actor,
                'action' => "thực hiện {$req['title']} một cách trực quan",
                'benefit' => 'tối ưu hóa quy trình, giảm thiểu sai sót và hoàn tất mục tiêu nghiệp vụ',
                'gherkin' => "Scenario: Thực hiện {$req['title']} thành công\n  Given {$actor} đã đăng nhập hợp lệ vào hệ thống\n  When {$actor} gửi yêu cầu thao tác {$req['title']}\n  Then Hệ thống xử lý thành công trong 100ms và ghi nhận lịch sử kiểm toán",
            ];
        }

        $initialRtm = [];
        foreach ($reqs as $idx => $req) {
            $initialRtm[] = [
                'req_code' => $req['code'],
                'req_title' => $req['title'],
                'story' => $stories[$idx]['code'] ?? 'US-01',
                'test' => sprintf('TC-%s-%02d', $domain['code_prefix'], $idx + 1),
                'status' => 'in_dev',
            ];
        }

        return [
            'name' => $cleanTitle,
            'code' => $code,
            'client_name' => $client,
            'project_type' => $projectType,
            'budget' => $budget,
            'target_delivery_months' => 6,
            'domain' => $domain['name'],
            'summary' => "Hệ thống giải pháp {$domain['name']} chuyên biệt, giải quyết triệt để bài toán: {$ideaPrompt}. Xây dựng theo tiêu chuẩn CMMI Level 3/5 và ISO/IEC 12207.",
            'actors' => $domain['actors'],
            'functional_requirements' => $reqs,
            'non_functional_requirements' => [
                ['category' => 'Performance', 'spec' => 'Thời gian phản hồi API P95 <= 80ms; xử lý giao dịch thời gian thực'],
                ['category' => 'Security', 'spec' => 'Xác thực OAuth 2.0 / WebAuthn, mã hóa đường truyền TLS 1.3 và dữ liệu AES-256'],
                ['category' => 'Availability', 'spec' => 'Cam kết độ sẵn sàng hệ thống Uptime >= 99.95%, kiến trúc High Availability'],
                ['category' => 'Compliance', 'spec' => 'Tuân thủ tiêu chuẩn an toàn thông tin ISO/IEC 27001 và kiểm toán chống chối bỏ HMAC-SHA256'],
            ],
            'architecture_recommendation' => [
                'frontend' => 'React 19, TypeScript, Fluent 2 Mica Material Design',
                'backend' => 'Laravel 13, PHP 8.5, Clean Architecture / Repository-Actions Pattern',
                'database' => 'PostgreSQL 17 (Sharding & Partitioning) + Redis 8 Cluster',
                'messaging' => 'Apache Kafka Streams & Redis Pub/Sub',
                'security' => 'HMAC-SHA256 Digital Signature Chain, OIDC, RBAC Middleware',
            ],
            'user_stories' => $stories,
            'initial_rtm' => $initialRtm,
            'wbs_phases' => [
                ['phase' => 1, 'task' => 'Khảo sát nghiệp vụ, phân tích yêu cầu và lập BRD/SRS chuẩn IEEE 830', 'estimated_hours' => 40],
                ['phase' => 2, 'task' => 'Thiết kế kiến trúc C4 Model, Database ERD và mô hình an ninh STRIDE', 'estimated_hours' => 60],
                ['phase' => 3, 'task' => 'Lập kế hoạch phân rã WBS và phân bổ ma trận trách nhiệm RACI', 'estimated_hours' => 30],
                ['phase' => 4, 'task' => 'Lập trình phân hệ cốt lõi, tích hợp CI/CD và Static Code Analysis', 'estimated_hours' => 180],
                ['phase' => 5, 'task' => 'Thực thi bộ kiểm thử tự động, Test Runs và nghiệm thu người dùng UAT', 'estimated_hours' => 80],
                ['phase' => 6, 'task' => 'Diễn tập kịch bản Runbook, duyệt CAB 3 bên và điều phối Canary Rollout', 'estimated_hours' => 40],
                ['phase' => 7, 'task' => 'Bàn giao vận hành, giám sát SLA Uptime và xuất hồ sơ nghiệm thu', 'estimated_hours' => 30],
            ],
        ];
    }

    /**
     * Domain detector based on keyword heuristics.
     *
     * @return array{name: string, code_prefix: string, sample_client: string, actors: string[], core_features: string[]}
     */
    protected function detectDomain(string $text): array
    {
        $lower = mb_strtolower($text, 'UTF-8');

        if (Str::contains($lower, ['nông sản', 'nông nghiệp', 'agri', 'trang trại', 'kho lạnh'])) {
            return [
                'name' => 'Nông Nghiệp Số & Sàn Giao Dịch Nông Sản (AgriTech & Smart Farming)',
                'code_prefix' => 'AGRI',
                'sample_client' => 'Tập Đoàn Nông Nghiệp Số AgriTech Vietnam',
                'actors' => ['Nhà vườn / Hợp tác xã', 'Doanh nghiệp thu mua B2B', 'Chuyên viên kiểm định chất lượng', 'Đơn vị kho vận chuỗi lạnh'],
                'core_features' => [
                    'Sàn giao dịch và đấu giá nông sản B2B trực tiếp',
                    'Giám sát chuỗi kho lạnh IoT và điều kiện bảo quản',
                    'Truy xuất nguồn gốc xuất xứ nông sản qua mã QR / IoT',
                    'Thanh toán bảo chứng ký quỹ ngân hàng an toàn',
                    'Dự báo sản lượng mùa vụ và phân bổ cung cầu AI',
                ],
            ];
        }

        if (Str::contains($lower, ['ngân hàng', 'bank', 'thanh toán', 'tài chính', 'ví điện tử', 'fintech', 'napas', 'thẻ', 'tiền'])) {
            return [
                'name' => 'Tài Chính & Ngân Hàng Số (Fintech & Core Banking)',
                'code_prefix' => 'FIN',
                'sample_client' => 'VietCredit Commercial Bank',
                'actors' => ['Khách hàng cá nhân', 'Giao dịch viên', 'Kiểm soát viên hạn mức', 'Quản trị viên rủi ro'],
                'core_features' => [
                    'Xác thực sinh trắc học FIDO2 và chữ ký số giao dịch',
                    'Cổng thanh toán liên ngân hàng Napas 2.0 thời gian thực',
                    'Động cơ đối soát dữ liệu giao dịch tự động',
                    'Hệ thống phát hiện gian lận và cảnh báo bất thường AI',
                    'Sổ cái kế toán phân tán và sao kê trực tuyến',
                ],
            ];
        }

        if (Str::contains($lower, ['xe buýt', 'vận tải', 'bus', 'vé', 'xe', 'tuyến', 'gps', 'giao thông', 'smart mobility'])) {
            return [
                'name' => 'Giao Thông Thông Minh & Vận Tải Công Cộng (Smart Transit & Mobility)',
                'code_prefix' => 'BUS',
                'sample_client' => 'Tổng Công Ty Vận Tải Đô Thị MetroTrans',
                'actors' => ['Hành khách đi xe', 'Tài xế xe buýt', 'Điều độ viên tuyến', 'Ban quản lý doanh thu'],
                'core_features' => [
                    'Hệ thống vé điện tử QR động và thẻ giao thông thông minh NFC',
                    'Định vị GPS theo dõi lộ trình phương tiện theo thời gian thực',
                    'Phân phối và điều độ biểu đồ chạy xe tự động',
                    'Kiểm soát doanh thu vé và phân bổ trợ giá vận tải',
                    'Cảnh báo quá tải trạm và tối ưu hóa tuyến đường',
                ],
            ];
        }

        if (Str::contains($lower, ['bệnh viện', 'y tế', 'khám', 'bác sĩ', 'bệnh án', 'thuốc', 'sức khỏe', 'healthcare', 'phòng khám'])) {
            return [
                'name' => 'Y Tế Thông Minh & Quản Lý Bệnh Viện (HealthTech & EMR)',
                'code_prefix' => 'MED',
                'sample_client' => 'Tập Đoàn Bệnh Viện Đa Khoa Quốc Tế CarePlus',
                'actors' => ['Bệnh nhân', 'Bác sĩ điều trị', 'Dược sĩ bệnh viện', 'Trưởng khoa lâm sàng'],
                'core_features' => [
                    'Hồ sơ bệnh án điện tử (EMR) bảo mật chuẩn HL7/FHIR',
                    'Đặt lịch khám trực tuyến và phân luồng tiếp đón thông minh',
                    'Kê đơn thuốc điện tử và cảnh báo tương tác thuốc tự động',
                    'Hệ thống lưu trữ và truyền hình ảnh chẩn đoán PACS/DICOM',
                    'Thanh toán viện phí không dùng tiền mặt và đối soát BHYT',
                ],
            ];
        }

        if (Str::contains($lower, ['thương mại', 'bán hàng', 'e-commerce', 'shop', 'mua sắm', 'sàn', 'đơn hàng', 'kho', 'logistics', 'giao hàng'])) {
            return [
                'name' => 'Thương Mại Điện Tử & Chuỗi Cung Ứng (E-Commerce & Supply Chain)',
                'code_prefix' => 'SHOP',
                'sample_client' => 'Tập Đoàn Bán Lẻ Đa Kênh RetailHub',
                'actors' => ['Người mua hàng', 'Chủ gian hàng (Seller)', 'Nhân viên kho vận', 'Đơn vị vận chuyển'],
                'core_features' => [
                    'Quản lý danh mục sản phẩm đa thuộc tính và tồn kho Real-Time',
                    'Giỏ hàng phân tán và quy trình Checkout đa kênh',
                    'Hệ thống định tuyến đơn hàng tự động cho nhà vận chuyển',
                    'Quản lý ví người bán, chiết khấu hoa hồng và đối soát',
                    'Cơ chế khuyến mãi động, Flash Sale và Voucher đa tầng',
                ],
            ];
        }

        if (Str::contains($lower, ['giáo dục', 'học tập', 'trường', 'sinh viên', 'khóa học', 'giảng viên', 'lms', 'edtech', 'thi'])) {
            return [
                'name' => 'Giáo Dục Số & Nền Tảng Học Trực Tuyến (EdTech & Smart Campus)',
                'code_prefix' => 'EDU',
                'sample_client' => 'Học Viện Công Nghệ & Đào Tạo Số EduNext',
                'actors' => ['Học viên', 'Giảng viên', 'Cố vấn học tập', 'Ban đào tạo'],
                'core_features' => [
                    'Hệ thống quản lý khóa học tương tác đa phương tiện (LMS)',
                    'Khảo thí trực tuyến chống gian lận và chấm điểm tự động',
                    'Lộ trình học tập cá nhân hóa được hỗ trợ bởi AI',
                    'Quản lý văn bằng chứng chỉ số với chữ ký số chống giả mạo',
                    'Diễn đàn thảo luận và lớp học ảo tương tác trực tiếp',
                ],
            ];
        }

        // Default General Enterprise Software
        return [
            'name' => 'Nền Tảng Doanh Nghiệp Đám Mây (Enterprise Cloud Platform)',
            'code_prefix' => 'CORP',
            'sample_client' => 'Global Technology Enterprise Inc.',
            'actors' => ['Người dùng nghiệp vụ', 'Chuyên viên xử lý', 'Quản lý bộ phận', 'Quản trị viên hệ thống'],
            'core_features' => [
                'Quản lý phiên xác thực tập trung và kiểm soát truy cập RBAC',
                'Xử lý luồng phê duyệt tự động hóa nghiệp vụ đa cấp độ',
                'Đồng bộ hóa dữ liệu thời gian thực và quản lý tài nguyên',
                'Báo cáo phân tích kinh doanh và bảng điều khiển trực quan',
                'Truy vết kiểm toán bất biến chống chối bỏ HMAC-SHA256',
            ],
        ];
    }

    /**
     * Generate standard project name from raw idea and domain.
     */
    protected function generateProjectName(string $idea, array $domain): string
    {
        $words = preg_split('/[\s,\.\-]+/u', trim($idea), -1, PREG_SPLIT_NO_EMPTY);
        $short = implode(' ', array_slice($words, 0, 7));
        if (mb_strlen($short, 'UTF-8') < 10) {
            return "Hệ thống {$domain['name']} 2026";
        }

        return Str::title($short).' 2026';
    }

    /**
     * Synthesize rich document Markdown based on domain semantics and project metadata.
     */
    protected function synthesizeDocumentSemantic(Project $project, string $docType, string $topicPrompt = '', array $extraContext = []): string
    {
        $domain = $this->detectDomain($project->name.' '.$project->description.' '.$topicPrompt);
        $features = $domain['core_features'];
        $actors = $domain['actors'];
        $timestamp = now()->format('d/m/Y H:i');

        return match ($docType) {
            'CHARTER' => <<<MARKDOWN
# HIẾN CHƯƠNG DỰ ÁN (PROJECT CHARTER)
*Dự án:* **{$project->name}** [{$project->code}]  
*Khách hàng đối tác:* **{$project->client_name}** | *Ngân sách:* **{$project->budget} USD**  
*Thời gian ban hành:* {$timestamp} | *Chuẩn:* ISO/IEC 12207 & CMMI Level 3/5  

---

## 1. MỤC TIÊU CHIẾN LƯỢC & TUYÊN BỐ SỨ MỆNH
- **Bối cảnh khởi tạo:** Xây dựng hệ thống **{$domain['name']}** đáp ứng nhu cầu tăng trưởng nghiệp vụ, giải quyết bài toán cốt lõi: {$project->description}.
- **Tuyên bố giá trị:** Hiện đại hóa toàn diện kiến trúc công nghệ, tối ưu hóa quy trình vận hành và cam kết độ tin cậy đạt chuẩn quốc tế.
- **Tiêu chí thành công chính (KPIs):**
  1. Hoàn thành đầy đủ 7 Pha SDLC và vượt qua 6 Quality Gates có chữ ký số điện tử.
  2. 100% yêu cầu chức năng được liên kết hai chiều trong Ma trận RTM (Zero Gap).
  3. Độ bao phủ kiểm thử tự động (Test Coverage) >= 80%, 0 lỗi an ninh nghiêm trọng (SAST Clean).
  4. Cam kết độ khả dụng hệ thống Uptime >= 99.95%.

## 2. PHẠM VI DỰ ÁN (PROJECT SCOPE)
### 2.1 Trong phạm vi (In-Scope):
- Phát triển các phân hệ cốt lõi:
  - {$features[0]}
  - {$features[1]}
  - {$features[2]}
  - {$features[3]}
- Thiết lập hạ tầng CI/CD tự động, kiểm thử tự động và cơ chế giám sát SLA thời gian thực.
- Bàn giao mã nguồn sạch, tài liệu kiến trúc C4 Model và Sổ tay vận hành Runbook.

### 2.2 Ngoài phạm vi (Out-of-Scope):
- Mua sắm phần cứng máy chủ vật lý on-premise của bên thứ ba không nằm trong hợp đồng.

## 3. BAN QUẢN TRỊ DỰ ÁN & PHÂN CẤP THẨM QUYỀN
| Vai Trò | Đại Diện | Quyền Hạn & Trách Nhiệm |
|---|---|---|
| Project Sponsor | Đại diện cấp cao {$project->client_name} | Phê duyệt ngân sách và nghiệm thu sản phẩm cuối cùng |
| Lead Solution Architect | Võ Hoàng Tú | Chịu trách nhiệm thiết kế kiến trúc, an ninh và ký duyệt Cổng Gatekeeper |
| Project Manager | PM Team | Điều phối tiến độ Sprint, ngân sách và quản trị rủi ro |
| QA Lead | QA Lead | Thẩm tra chất lượng kiểm thử, ký biên bản UAT |
MARKDOWN,

            'BRD' => <<<MARKDOWN
# TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)
*Dự án:* **{$project->name}** [{$project->code}]  
*Đơn vị yêu cầu:* **{$project->client_name}** | *Lĩnh vực:* **{$domain['name']}**  

---

## 1. BÀI TOÁN KINH DOANH & ĐIỂM NGHẼN HIỆN TẠI
- **Hiện trạng:** Các quy trình nghiệp vụ còn phân tán, thiếu tính liên kết thời gian thực và phụ thuộc nhiều vào thao tác thủ công.
- **Động lực chuyển đổi:** Tự động hóa chuỗi xử lý cho các nghiệp vụ trọng yếu: {$features[0]} và {$features[1]}.
- **Mục tiêu định lượng:**
  - Rút ngắn thời gian xử lý giao dịch tối thiểu 70%.
  - Giảm thiểu sai sót vận hành xuống dưới 0.01%.

## 2. ĐỐI TƯỢNG SỬ DỤNG HỆ THỐNG (STAKEHOLDERS & ACTORS)
- **{$actors[0]}:** Người dùng thao tác trực tiếp trên giao diện để thụ hưởng dịch vụ.
- **{$actors[1]}:** Nhân sự nghiệp vụ kiểm tra, xử lý giao dịch và vận hành hệ thống.
- **Quản trị viên hệ thống:** Giám sát phân quyền, cấu hình hạn mức và kiểm tra sổ cái audit log.

## 3. QUY TRÌNH NGHIỆP VỤ CỐT LÕI (CORE BUSINESS PROCESSES)
1. **Luồng Khởi Tạo & Tiếp Nhận:** Thu thập dữ liệu giao dịch từ {$actors[0]}, kiểm tra tính hợp lệ nghiệp vụ.
2. **Luồng Xử Lý & Xác Thực:** Thực thi xử lý {$features[0]} với độ trễ thấp và bảo mật đa lớp.
3. **Luồng Đồng Bộ & Quyết Toán:** Tích hợp {$features[2]}, cập nhật trạng thái cơ sở dữ liệu và phát hành biên nhận.
4. **Luồng Xử Lý Ngoại Lệ & Hồi Phục:** Tự động rollback giao dịch khi phát sinh sự cố, thông báo tức thì cho {$actors[1]}.
MARKDOWN,

            'SRS' => <<<MARKDOWN
# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS - CHUẨN IEEE 830)
*Dự án:* **{$project->name}** [{$project->code}]  
*Phiên bản:* 1.0.0 | *Thời gian:* {$timestamp}  

---

## 1. GIỚI THIỆU & PHẠM VI HỆ THỐNG
Tài liệu đặc tả toàn diện các yêu cầu kỹ thuật chức năng và phi chức năng cho hệ thống **{$project->name}**, phục vụ đội ngũ phát triển, kiểm thử và nghiệm thu.
- **Yêu cầu & Chủ đề trọng tâm:** {$topicPrompt}

## 2. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)
### 2.1 FR-01: Quản lý Định danh & Phân quyền (RBAC)
- Hệ thống hỗ trợ xác thực OAuth 2.0 / OpenID Connect và xác thực 2 bước (MFA).
- Phân tách quyền hạn chặt chẽ giữa {$actors[0]} và {$actors[1]}.

### 2.2 FR-02: Phân hệ Cốt lõi - {$features[0]}
- Tự động hóa xử lý: {$topicPrompt}.
- Cung cấp API endpoint xử lý giao dịch thời gian thực với phản hồi chuẩn JSON.
- Đảm bảo tính toán toàn vẹn ACID trong cơ sở dữ liệu quan hệ.

### 2.3 FR-03: Phân hệ Tích hợp - {$features[1]}
- Đồng bộ hóa dữ liệu với các phân hệ ngoại vi thông qua Message Queue.
- Hỗ trợ cơ chế Idempotency Key ngăn chặn trùng lặp giao dịch.

### 2.4 FR-04: Giám sát & Báo cáo - {$features[2]}
- Dashboard trực quan hiển thị chỉ số vận hành và trạng thái hệ thống.

## 3. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)
| Mã NFR | Phân Loại | Đặc Tả Tiêu Chuẩn | Phương Pháp Đo Lường |
|---|---|---|---|
| NFR-01 | Hiệu năng (Performance) | Thời gian phản hồi API P95 <= 80ms | Giám sát qua APM / Prometheus |
| NFR-02 | Khả năng sẵn sàng (Availability) | Độ sẵn sàng Uptime >= 99.95% | Health Check Uptime Robot |
| NFR-03 | An toàn thông tin (Security) | Mã hóa TLS 1.3, AES-256 at rest, OWASP Top 10 | SonarQube SAST Scanner |
| NFR-04 | Khả năng mở rộng (Scalability) | Chịu tải 5,000 req/s không nghẽn cổ chai | Kiểm thử tải k6 / JMeter |
MARKDOWN,

            'SAD' => <<<MARKDOWN
# THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SAD - C4 MODEL)
*Dự án:* **{$project->name}** [{$project->code}]  

---

## 1. C4 CONTEXT DIAGRAM (NGỮ CẢNH HỆ THỐNG)
- **Người dùng:** {$actors[0]} truy cập qua Web App (HTTPS) và Mobile App (REST/WSS).
- **Hệ thống {$project->name}:** Cung cấp các dịch vụ {$features[0]}, {$features[1]} và xử lý nghiệp vụ.
- **Hệ thống liên kết:** Kết nối cổng dữ liệu đối tác {$project->client_name} và hạ tầng điện toán đám mây.

## 2. C4 CONTAINER DIAGRAM (CẤU TRÚC PHÂN TẦNG)
```mermaid
graph TD
    Client["Client Web SPA (React 19 / TypeScript)"] -->|HTTPS / JSON| Gateway["API Gateway / Core Backend (Laravel 13 PHP 8.5)"]
    Gateway -->|TCP / SSL| DB[("Primary Database (PostgreSQL 17)")]
    Gateway -->|RESP3| Cache[("In-Memory Cache (Redis 8 Cluster)")]
    Gateway -->|Binary Protocol| Queue["Event Stream / Queue (Kafka / RabbitMQ)"]
```

## 3. CHIẾN LƯỢC BẢO MẬT & CHỐNG CHỐI BỎ
- Mã hóa toàn vẹn chữ ký số HMAC-SHA256 lưu vết vào Sổ cái Audit Trail.
- Phân vùng mạng DMZ, thiết lập Rate Limiting bảo vệ chống tấn công DoS/DDoS.
MARKDOWN,

            'ERD' => <<<MARKDOWN
# SƠ ĐỒ THỰC THỂ CƠ SỞ DỮ LIỆU (DATABASE ERD SPECIFICATION)
*Dự án:* **{$project->name}** [{$project->code}]  

---

## 1. DANH MỤC CÁC BẢNG DỮ LIỆU CỐT LÕI
1. `projects`: Thông tin định danh dự án, mã code, ngân sách và trạng thái vòng đời.
2. `users`: Bảng tài khoản người dùng, phân quyền RBAC và token xác thực.
3. `domain_transactions`: Bảng lưu trữ giao dịch cốt lõi cho {$features[0]}.
4. `quality_gates`: Lưu trữ trạng thái 6 cổng kiểm soát chất lượng và chữ ký số.
5. `audit_logs`: Bảng lưu vết kiểm toán bất biến với digital fingerprint.

## 2. CHIẾN LƯỢC TỐI ƯU HÓA TRUY VẤN
- Đánh chỉ mục Indexing composite trên các trường thường xuyên truy vấn.
- Phân vùng bảng (Partitioning) theo thời gian cho các bảng dữ liệu phát sinh lớn.
MARKDOWN,

            'OPENAPI' => <<<MARKDOWN
# ĐẶC TẢ GIAO DIỆN RESTFUL API (OPENAPI 3.1)
*Dự án:* **{$project->name}** [{$project->code}]  

---

## 1. DANH MỤC CÁC ENDPOINTS TRỌNG YẾU
- `POST /api/v1/auth/token`: Xác thực danh tính và phát hành JWT token.
- `GET /api/v1/projects/{id}`: Truy vấn chi tiết dự án và tiến độ 7 pha SDLC.
- `POST /api/v1/operations/execute`: Thực thi luồng xử lý {$features[0]}.
- `POST /api/v1/quality-gates/{id}/sign`: Ký số điện tử HMAC-SHA256 phê duyệt cổng.

## 2. CHUẨN MÃ TRẢ VỀ (STATUS CODES)
- `200 OK`: Thao tác thành công.
- `201 Created`: Khởi tạo bản ghi mới thành công.
- `400 Bad Request`: Payload không hợp lệ.
- `401 Unauthorized`: Chưa xác thực token.
- `403 Forbidden`: Không có thẩm quyền truy cập vai trò.
- `422 Unprocessable Content`: Vi phạm quy tắc xác thực nghiệp vụ.
MARKDOWN,

            'WBS' => <<<MARKDOWN
# PHÂN RÃ CÔNG VIỆC CHI TIẾT (WORK BREAKDOWN STRUCTURE - WBS)
*Dự án:* **{$project->name}** [{$project->code}]  

---

## 1. CẤU TRÚC PHÂN RÃ GÓI CÔNG VIỆC (< 40H)
| Mã WBS | Gói Công Việc | Thời Gian (Giờ) | Vai Trò Chịu Trách Nhiệm | Pha SDLC |
|---|---|---|---|---|
| WBS-1.1 | Khảo sát bài toán và xây dựng BRD/SRS | 40h | Business Analyst | Pha 1 |
| WBS-2.1 | Thiết kế C4 Architecture & Database Schema | 60h | Solution Architect | Pha 2 |
| WBS-3.1 | Phân bổ ma trận RACI và kế hoạch Sprints | 30h | Project Manager | Pha 3 |
| WBS-4.1 | Lập trình module {$features[0]} | 80h | Senior Developer | Pha 4 |
| WBS-4.2 | Lập trình module {$features[1]} | 80h | Backend Team | Pha 4 |
| WBS-5.1 | Xây dựng bộ Feature Test & Chạy Test Runs | 60h | QA Lead | Pha 5 |
| WBS-6.1 | Kịch bản triển khai Runbook & Họp CAB Go-Live | 40h | DevOps / Release Mgr | Pha 6 |
| WBS-7.1 | Giám sát SLA Uptime và bàn giao hệ thống | 30h | SRE / Ops Team | Pha 7 |
MARKDOWN,

            'STP' => <<<MARKDOWN
# KẾ HOẠCH KIỂM THỬ PHẦN MỀM TỔNG THỂ (SOFTWARE TEST PLAN - STP)
*Dự án:* **{$project->name}** [{$project->code}]  

---

## 1. CHIẾN LƯỢC KIỂM THỬ CHẤT LƯỢNG
- **Kiểm thử đơn vị (Unit Tests):** Độ bao phủ tối thiểu đạt >= 80% code coverage.
- **Kiểm thử tích hợp (Integration Tests):** Kiểm thử toàn bộ các API endpoints và luồng xử lý {$features[0]}.
- **Kiểm thử chấp nhận (UAT):** Đại diện khách hàng {$project->client_name} trực tiếp nghiệm thu kịch bản.

## 2. TIÊU CHÍ VƯỢT CỔNG CHẤT LƯỢNG (PASS/FAIL CRITERIA)
- 100% kịch bản kiểm thử Critical Path vượt qua thành công.
- 0 lỗi khiếm khuyết mức độ Blocker hoặc Critical còn tồn đọng.
- Báo cáo quét tĩnh mã nguồn SAST không phát hiện lỗ hổng bảo mật nghiêm trọng.
MARKDOWN,

            'RUNBOOK' => <<<MARKDOWN
# KỊCH BẢN TRIỂN KHAI SẢN XUẤT TỪNG PHÚT (PRODUCTION RUNBOOK)
*Dự án:* **{$project->name}** [{$project->code}]  

---

## 1. LỘ TRÌNH THAO TÁC THEO MỐC THỜI GIAN (GO-LIVE TIMELINE)
- **T - 60 phút:** Họp chốt điều kiện sẵn sàng Go-Live với Hội đồng CAB.
- **T - 30 phút:** Sao lưu snapshot toàn bộ cơ sở dữ liệu PostgreSQL và cấu hình cụm máy chủ.
- **T - 10 phút:** Bật chế độ bảo trì giao diện, kích hoạt trang thông báo nâng cấp.
- **T - 0 phút:** Chạy lệnh migration cơ sở dữ liệu và triển khai mã nguồn mới.
- **T + 15 phút:** Thực hiện Smoke Test xác thực các luồng {$features[0]} trên môi trường Production.
- **T + 30 phút:** Mở lưu lượng truy cập Canary 10% -> 50% -> 100%.

## 2. PHƯƠNG ÁN ĐẢO NGƯỢC KHẨN CẤP (ROLLBACK PROCEDURES)
- Nếu tỷ lệ lỗi HTTP 5xx vượt quá 0.5% trong vòng 10 phút đầu, lập tức kích hoạt quy trình Rollback.
- Chuyển lưu lượng về phiên bản trước đó trong thời gian RTO <= 5 phút, cam kết không mất dữ liệu (RPO = 0).
MARKDOWN,

            default => <<<MARKDOWN
# TÀI LIỆU KỸ THUẬT: {$docType}
*Dự án:* **{$project->name}** [{$project->code}]  
*Khách hàng:* **{$project->client_name}** | *Thời gian:* {$timestamp}  

---

## 1. TỔNG QUAN & MỤC TIÊU
Tài liệu cung cấp đặc tả kỹ thuật chi tiết cho phân hệ **{$docType}** trong hệ thống **{$project->name}**, đảm bảo tuân thủ tiêu chuẩn quản trị chất lượng SDLC.

## 2. NỘI DUNG KỸ THUẬT CHI TIẾT
- Yêu cầu áp dụng: {$topicPrompt}
- Phân hệ liên quan: {$features[0]} và {$features[1]}.
- Kiểm soát chất lượng: Được kiểm toán và ký số xác thực HMAC-SHA256.
MARKDOWN,
        };
    }
}
