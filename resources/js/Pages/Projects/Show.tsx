import React, { useState } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Users,
    GitBranch,
    History,
    AlertTriangle,
    ArrowLeft,
    Check,
    Lock,
    KeyRound,
    Plus,
    ExternalLink,
    ChevronRight,
    ChevronDown,
    Terminal,
    Sparkles,
    Calendar,
    Building2,
    DollarSign,
    Share2,
    CheckSquare,
    Square,
    Edit3,
    Printer,
    Download,
    Filter,
    Search,
    BadgeCheck,
    Send,
    Bot,
    ShieldAlert,
    Cpu,
    CheckCheck,
    Package,
    GitPullRequest,
    Zap,
    BarChart3,
    Layers,
    Bug,
    Activity,
    Flame,
    ServerCrash,
    Award,
    Menu,
    X,
    PanelLeftClose,
    PanelLeftOpen,
    Bell,
    SlidersHorizontal,
    Copy,
    FilePlus,
    BookOpen
} from 'lucide-react';
import { C4DiagramViewer } from '@/Components/C4DiagramViewer';
import { KanbanBoard } from '@/Components/KanbanBoard';
import { TestRunManager } from '@/Components/TestRunManager';
import { CABRolloutManager } from '@/Components/CABRolloutManager';
import { ComplianceScorecardModal } from '@/Components/ComplianceScorecardModal';
import { WebhookSettingsModal } from '@/Components/WebhookSettingsModal';
import { DocumentLibrary, downloadDocumentMarkdown } from '@/Components/DocumentLibrary';
import { SaaSLayout } from '@/Layouts/SaaSLayout';


interface Phase {
    id: number;
    phase_number: number;
    name: string;
    status: 'pending' | 'active' | 'in_review' | 'completed';
    completion_rate: number;
    started_at?: string;
    completed_at?: string;
    quality_gate?: Gate;
}

interface Gate {
    id: number;
    phase_id: number;
    gate_number: number;
    name: string;
    status: 'pending' | 'in_review' | 'passed' | 'rejected';
    required_role: string;
    sign_off_token?: string;
    sign_off_by?: string;
    sign_off_role?: string;
    sign_off_notes?: string;
    signed_at?: string;
    criteria_checklist?: Record<string, boolean>;
}

interface ProjectDoc {
    id: number;
    phase_number: number;
    doc_type: string;
    title: string;
    version: string;
    status: 'draft' | 'under_review' | 'approved' | 'superseded';
    content?: string;
    signed_off_by?: string;
    signed_off_at?: string;
    signature_hash?: string;
}

interface RACI {
    id: number;
    activity_name: string;
    phase_number: number;
    responsible: string;
    accountable: string;
    consulted: string[];
    informed: string[];
}

interface RTM {
    id: number;
    req_code: string;
    req_title: string;
    user_story_code: string;
    commit_or_pr?: string;
    test_case_code?: string;
    defect_code?: string;
    release_version?: string;
    status: 'mapped' | 'in_dev' | 'tested' | 'passed' | 'released';
}

interface Defect {
    id: number;
    project_id: number;
    rtm_trace_id?: number;
    defect_code: string;
    title: string;
    description?: string;
    steps_to_reproduce?: string;
    severity: 'blocker' | 'critical' | 'major' | 'minor';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    assigned_to?: string;
    logged_by: string;
    resolution_notes?: string;
    resolved_at?: string;
    created_at: string;
    rtm_trace?: RTM;
}

interface CIPipelineMetric {
    id: number;
    build_number: string;
    branch: string;
    commit_sha: string;
    unit_test_passed: number;
    unit_test_failed: number;
    coverage_percentage: number;
    code_smells_count: number;
    vulnerabilities_count: number;
    sast_status: 'passed' | 'failed';
    pipeline_status: 'success' | 'failed' | 'running';
    created_at: string;
}

interface ProductionIncident {
    id: number;
    incident_code: string;
    title: string;
    severity: 'P1_CRITICAL' | 'P2_MAJOR' | 'P3_MINOR';
    downtime_minutes: number;
    root_cause?: string;
    corrective_actions?: string;
    status: 'investigating' | 'mitigated' | 'resolved';
    detected_at: string;
    resolved_at?: string;
}

interface SLAMetrics {
    uptime_percentage: number;
    total_incidents: number;
    p1_count: number;
    total_downtime_minutes: number;
    mttd_minutes: number;
    mttr_minutes: number;
    sla_target: number;
    sla_breached: boolean;
}

interface AuditLog {
    id: number;
    user_name: string;
    user_role: string;
    action_type: string;
    entity_type: string;
    entity_id?: number;
    details?: any;
    digital_fingerprint: string;
    ip_address?: string;
    created_at: string;
}

interface Project {
    id: number;
    name: string;
    code: string;
    description?: string;
    client_name: string;
    project_type: string;
    status: string;
    current_phase_number: number;
    health_status: string;
    budget: number;
    target_delivery_date?: string;
    phases: Phase[];
    quality_gates: Gate[];
    documents: ProjectDoc[];
    raci_assignments: RACI[];
    rtm_traces: RTM[];
    defects?: Defect[];
    ci_pipeline_metrics?: CIPipelineMetric[];
    production_incidents?: ProductionIncident[];
    audit_logs: AuditLog[];
    sprints?: any[];
    tasks?: any[];
    test_runs?: any[];
    cab_signoffs?: any[];
    deployment_rollouts?: any[];
    webhooks?: any[];
}

interface RACIWorkload {
    workload_by_person: Record<string, { a_count: number; r_count: number; total: number }>;
    bottlenecks: string[];
    total_activities: number;
}

interface PageProps {
    project: Project;
    rtmAnalysis?: {
        total_requirements: number;
        tested_count: number;
        released_count: number;
        missing_tests: Array<{ req_code: string; req_title: string }>;
        missing_commits: Array<{ req_code: string; req_title: string }>;
        coverage_score: number;
    };
    auditVerification?: {
        is_valid: boolean;
        total_verified: number;
        tampered_count: number;
        verified_at: string;
    };
    raciWorkload?: RACIWorkload;
    slaMetrics?: SLAMetrics;
    complianceAudit?: any;
    flash?: {
        success?: string;
        warning?: string;
        error?: string;
    };
}

const PHASE_METADATA = [
    { num: 1, title: 'Yêu cầu & Khởi tạo', code: 'BRD/SRS', color: 'from-blue-600 to-blue-500', lightColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    { num: 2, title: 'Kiến trúc & Thiết kế', code: 'SAD/C4', color: 'from-indigo-600 to-indigo-500', lightColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { num: 3, title: 'Kế hoạch & Phân bổ', code: 'WBS/RACI', color: 'from-emerald-600 to-emerald-500', lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { num: 4, title: 'Lập trình & Review', code: 'Code/PR', color: 'from-amber-600 to-amber-500', lightColor: 'bg-amber-50 text-amber-800 border-amber-200' },
    { num: 5, title: 'QA/QC & Kiểm thử', code: 'STP/UAT', color: 'from-rose-600 to-rose-500', lightColor: 'bg-rose-50 text-rose-700 border-rose-200' },
    { num: 6, title: 'Triển khai & Release', code: 'Runbook/CAB', color: 'from-purple-600 to-purple-500', lightColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    { num: 7, title: 'Vận hành & Hậu kiểm', code: 'SLA/Retro', color: 'from-cyan-600 to-cyan-500', lightColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
];

interface SDLCCreationTemplate {
    type: string;
    name: string;
    phase: number;
    title: string;
    content: string;
}

const SDLC_CREATION_TEMPLATES: SDLCCreationTemplate[] = [
    {
        type: 'CHARTER',
        name: 'Hiến chương Dự án (CHARTER)',
        phase: 1,
        title: 'Hiến chương Dự án & Tầm nhìn Chiến lược',
        content: '# HIẾN CHƯƠNG DỰ ÁN (PROJECT CHARTER)\n\n## 1. MỤC TIÊU & TẦM NHÌN\n- Xác lập tư cách pháp nhân và mục tiêu kinh doanh chiến lược.\n- Cam kết ngân sách và chỉ tiêu ROI kỳ vọng.\n\n## 2. PHẠM VI DỰ ÁN\n- Các phân hệ phần mềm trong phạm vi (In-Scope):\n- Các phân hệ ngoài phạm vi (Out-of-Scope):\n\n## 3. CÁC MỐC TIẾN ĐỘ CHÍNH (MILESTONES)\n- Khởi tạo & Yêu cầu: Tuần 1-2\n- Kiến trúc hệ thống: Tuần 3-4\n- Phát triển Sprints: Tuần 5-10\n- Nghiệm thu & Release: Tuần 11-12',
    },
    {
        type: 'BRD',
        name: 'Yêu cầu Nghiệp vụ Chi tiết (BRD)',
        phase: 1,
        title: 'Tài liệu Yêu cầu Nghiệp vụ Chi tiết (BRD)',
        content: '# YÊU CẦU NGHIỆP VỤ (BRD)\n\n## 1. BÀI TOÁN KINH DOANH\n- Khảo sát hiện trạng vận hành và điểm nghẽn nghiệp vụ.\n- Nhu cầu chuyển đổi số và tự động hóa quy trình.\n\n## 2. QUY TRÌNH NGHIỆP VỤ (BUSINESS PROCESSES)\n- Luồng xử lý giao dịch tiêu chuẩn.\n- Các trường hợp ngoại lệ và xử lý bồi hoàn.',
    },
    {
        type: 'SRS',
        name: 'Đặc tả Phần mềm Chuẩn IEEE 830 (SRS)',
        phase: 1,
        title: 'Đặc tả Yêu cầu Kỹ thuật Phần mềm (SRS - IEEE 830)',
        content: '# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS - IEEE 830)\n\n## 1. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)\n- FR-01: Quản lý phiên xác thực người dùng và phân quyền vai trò (RBAC).\n- FR-02: Đồng bộ hóa trạng thái giao dịch thời gian thực.\n\n## 2. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)\n- NFR-01: Thời gian phản hồi API P95 <= 200ms.\n- NFR-02: Cam kết tỷ lệ khả dụng hệ thống Uptime >= 99.95%.\n- NFR-03: Mã hóa đường truyền TLS 1.3 và lưu trữ chuẩn AES-256.',
    },
    {
        type: 'SAD',
        name: 'Thiết kế Kiến trúc C4 Model (SAD)',
        phase: 2,
        title: 'Thiết kế Kiến trúc Hệ thống (SAD - C4 Model)',
        content: '# THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SAD - C4 MODEL)\n\n## 1. C4 CONTEXT & CONTAINER\n- Mô hình phân rã Clean Architecture & Microservices.\n- Phân tầng Gateway, Business Services và Persistence layer.\n\n## 2. CHIẾN LƯỢC CƠ SỞ DỮ LIỆU & CACHING\n- Sharding & Partitioning tối ưu truy vấn dữ liệu lớn.\n- Redis Cluster cho Cache tầng bộ nhớ và Rate-Limiting.',
    },
    {
        type: 'ERD',
        name: 'Sơ đồ Thực thể Cơ sở Dữ liệu (ERD)',
        phase: 2,
        title: 'Sơ đồ Thực thể Dữ liệu (Database ERD Specification)',
        content: '# ĐẶC TẢ SƠ ĐỒ THỰC THỂ DỮ LIỆU (ERD)\n\n## 1. BẢNG DỮ LIỆU CỐT LÕI\n- Bảng Projects, Quality Gates, Documents, Audit Logs.\n- Khóa chính UUIDv7 / BigInt, Foreign Keys và Indexing.\n\n## 2. CHIẾN LƯỢC BẢO VỆ DỮ LIỆU NHẠY CẢM\n- Mã hóa các trường thông tin danh tính cá nhân (PII).\n- Soft Delete và lưu vết lịch sử phiên bản.',
    },
    {
        type: 'OPENAPI',
        name: 'Đặc tả RESTful API OpenAPI 3.1',
        phase: 2,
        title: 'Đặc tả Giao diện RESTful API (OpenAPI 3.1)',
        content: '# ĐẶC TẢ RESTFUL API (OPENAPI 3.1)\n\n## 1. DANH MỤC ENDPOINTS\n- POST /api/v1/auth/login - Xác thực phiên người dùng\n- GET /api/v1/projects - Lấy danh mục dự án phân trang\n- POST /api/v1/projects/{id}/documents - Khởi tạo hồ sơ kỹ thuật\n\n## 2. CHUẨN MÃ LỖI\n- 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 422 Unprocessable',
    },
    {
        type: 'STRIDE',
        name: 'Mô hình An ninh Mạng STRIDE',
        phase: 2,
        title: 'Mô hình Đe dọa & An ninh Hệ thống (STRIDE)',
        content: '# MÔ HÌNH AN NINH & ĐE DỌA (STRIDE MODEL)\n\n## 1. PHÂN TÍCH VECTƠ TẤN CÔNG\n- Spoofing (Giả mạo): Xác thực token JWT có chữ ký số bí mật.\n- Tampering (Xáo trộn): Kiểm tra toàn vẹn Payload bằng HMAC-SHA256.\n- Repudiation (Chối bỏ): Ghi vết toàn bộ thao tác vào Sổ cái Audit Log.\n- Denial of Service (DoS): Rate limiting 60 req/min/IP.',
    },
    {
        type: 'WBS',
        name: 'Cấu trúc Phân rã Công việc (WBS)',
        phase: 3,
        title: 'Cấu trúc Phân rã Công việc Chi tiết (WBS)',
        content: '# PHÂN RÃ CÔNG VIỆC (WBS)\n\n## 1. DANH MỤC GÓI CÔNG VIỆC (< 40H)\n- WBS-01: Thiết lập CI/CD Pipeline & SAST Scanner (24h)\n- WBS-02: Thiết kế Schema & Migration Database (16h)\n- WBS-03: Xây dựng Module Authentication & RBAC (32h)',
    },
    {
        type: 'STP',
        name: 'Kế hoạch Kiểm thử Tổng thể (STP)',
        phase: 5,
        title: 'Kế hoạch Kiểm thử & Tiêu chuẩn Nghiệm thu Tổng thể (STP)',
        content: '# KẾ HOẠCH KIỂM THỬ TỔNG THỂ (SYSTEM TEST PLAN - STP)\n\n## 1. PHẠM VI KIỂM THỬ\n- Unit Test Coverage: Đạt ngưỡng tối thiểu >= 80%.\n- Integration & API Testing: 100% endpoints vượt qua kịch bản kiểm thử.\n- E2E Playwright Flows: Kiểm thử toàn bộ Critical Path.\n\n## 2. TIÊU CHÍ PASS CỔNG CHẤT LƯỢNG GATE 5\n- 0 lỗi Blocker/Critical chưa được khắc phục.\n- Biên bản nghiệm thu người dùng UAT được ký duyệt.',
    },
    {
        type: 'RUNBOOK',
        name: 'Kịch bản Triển khai Từng Phút (RUNBOOK)',
        phase: 6,
        title: 'Kịch bản Triển khai & Vận hành Từng Phút (Production Runbook)',
        content: '# KỊCH BẢN TRIỂN KHAI PRODUCTION (RUNBOOK)\n\n## 1. CHECKLIST TIỀN TRIỂN KHAI (T-60m)\n- Sao lưu Full Snapshot Database (RPO=0).\n- Kiểm tra trạng thái máy chủ Staging và cụm Production.\n\n## 2. CÁC BƯỚC THỰC THI (T-0)\n- Bước 1: Deploy Migration Database schema.\n- Bước 2: Khởi động Worker processes và Pods.\n- Bước 3: Smoke test xác thực các luồng thanh toán cốt lõi.\n\n## 3. PHƯƠNG ÁN ĐẢO NGƯỢC (ROLLBACK)\n- Lùi phiên bản tự động nếu tỷ lệ lỗi HTTP 5xx vượt quá 1%.',
    },
    {
        type: 'CUSTOM',
        name: 'Tùy Biến: Hồ Sơ Kỹ Thuật Bổ Sung',
        phase: 1,
        title: 'Tài Liệu Kỹ Thuật Chuyên Sâu Bổ Sung',
        content: '# TÀI LIỆU KỸ THUẬT BỔ SUNG\n\n## 1. MỤC TIÊU & BỐI CẢNH\n- Mô tả chi tiết lý do ban hành và mục tiêu kỹ thuật cần đạt.\n\n## 2. ĐẶC TẢ CHI TIẾT\n- Chi tiết các yêu cầu, cấu hình hoặc tiêu chuẩn kỹ thuật.\n\n## 3. TRÁCH NHIỆM & DUYỆT\n- Người thực hiện và người phê duyệt có thẩm quyền.',
    },
];

export default function ProjectShow() {
    const { project, rtmAnalysis, auditVerification, raciWorkload, slaMetrics, complianceAudit, flash, enterpriseProjects } = usePage<any>().props as PageProps & { enterpriseProjects?: any[] };
    const [activeTab, setActiveTab] = useState<'deliverables' | 'kanban' | 'testing' | 'release_cab' | 'raci' | 'rtm' | 'defects' | 'operations' | 'audit'>('deliverables');
    const [selectedPhaseNum, setSelectedPhaseNum] = useState<number>(project.current_phase_number);
    
    // Modals
    const [isApproveGateModalOpen, setIsApproveGateModalOpen] = useState(false);
    const [isAddRtmModalOpen, setIsAddRtmModalOpen] = useState(false);
    const [isAddRaciModalOpen, setIsAddRaciModalOpen] = useState(false);
    const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isPackageReleaseModalOpen, setIsPackageReleaseModalOpen] = useState(false);
    const [isGitWebhookModalOpen, setIsGitWebhookModalOpen] = useState(false);
    const [isAddDefectModalOpen, setIsAddDefectModalOpen] = useState(false);
    const [isResolveDefectModalOpen, setIsResolveDefectModalOpen] = useState(false);
    const [selectedDefectToResolve, setSelectedDefectToResolve] = useState<Defect | null>(null);
    const [isCiMetricsModalOpen, setIsCiMetricsModalOpen] = useState(false);
    const [isAddIncidentModalOpen, setIsAddIncidentModalOpen] = useState(false);
    const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
    const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
    const [selectedDocPreview, setSelectedDocPreview] = useState<ProjectDoc | null>(null);
    const [editingDoc, setEditingDoc] = useState<ProjectDoc | null>(null);
    const [isCreateDocModalOpen, setIsCreateDocModalOpen] = useState(false);
    const [copiedSignatureHash, setCopiedSignatureHash] = useState(false);
    const [previewViewMode, setPreviewViewMode] = useState<'formatted' | 'raw'>('formatted');
    const [isGateChecklistOpen, setIsGateChecklistOpen] = useState(false);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [isBatchSigning, setIsBatchSigning] = useState(false);
    const [isEvaluatingGate, setIsEvaluatingGate] = useState(false);

    // Filters
    const [rtmStatusFilter, setRtmStatusFilter] = useState<string>('all');
    const [defectSeverityFilter, setDefectSeverityFilter] = useState<string>('all');

    // Package Release Form
    const releaseForm = useForm({
        release_version: 'v1.0.0-PROD',
        release_notes_summary: 'Bản phát hành chính thức đạt 100% tiêu chí nghiệm thu UAT, hoàn thiện kiến trúc microservices và xác thực phi tập trung.',
        release_manager: 'Võ Hoàng Tú',
        manager_role: 'Lead Solution Architect',
    });

    // Git Webhook Simulation Form
    const gitForm = useForm({
        event_type: 'push' as 'push' | 'pull_request',
        author: 'Võ Hoàng Tú',
        message: 'feat(REQ-PAY-01): Tích hợp cổng thanh toán Napas 2.0 và khóa HMAC-SHA256 [STORY-AUTH-02]',
        commit_sha: 'a8f3d1b9',
        pr_number: '42',
    });

    // Defect Form
    const defectForm = useForm({
        defect_code: `DEF-00${(project.defects?.length || 0) + 1}`,
        title: '',
        description: '',
        steps_to_reproduce: '',
        severity: 'critical' as 'blocker' | 'critical' | 'major' | 'minor',
        rtm_trace_id: '',
        assigned_to: 'Võ Hoàng Tú',
    });

    // Resolve Defect Form
    const resolveForm = useForm({
        status: 'resolved' as 'resolved' | 'closed',
        resolution_notes: 'Đã hoàn tất hotfix mã nguồn và kiểm thử hồi quy 100% Passed.',
    });

    // CI Metrics Simulation Form
    const ciForm = useForm({
        build_number: `#${(project.ci_pipeline_metrics?.length || 0) + 105}`,
        branch: 'main',
        commit_sha: 'a8f3d1b9',
        unit_test_passed: 168,
        unit_test_failed: 0,
        coverage_percentage: 86.5,
        code_smells_count: 2,
        vulnerabilities_count: 0,
        sast_status: 'passed' as 'passed' | 'failed',
        pipeline_status: 'success' as 'success' | 'failed' | 'running',
    });

    // Production Incident Form
    const incidentForm = useForm({
        incident_code: `INC-2026-0${(project.production_incidents?.length || 0) + 1}`,
        title: '',
        severity: 'P2_MAJOR' as 'P1_CRITICAL' | 'P2_MAJOR' | 'P3_MINOR',
        downtime_minutes: 15,
        root_cause: 'Nghẽn kết nối connection pool phía Payment Gateway bên thứ 3.',
        corrective_actions: 'Tăng kích thước Connection Pool và kích hoạt Circuit Breaker pattern.',
        status: 'resolved' as 'investigating' | 'mitigated' | 'resolved',
        detected_at: new Date().toISOString().slice(0, 16),
    });

    // Gate Approval Form (with Lead SA Override)
    const approveForm = useForm({
        approver_name: 'Võ Hoàng Tú',
        approver_role: 'Lead Solution Architect',
        notes: 'Đã thẩm tra đầy đủ tiêu chí kỹ thuật và checklist chất lượng.',
        override_reason: '',
    });

    // Gate Rejection Form
    const rejectForm = useForm({
        reviewer_name: 'Võ Hoàng Tú',
        reviewer_role: 'Solution Architect',
        reason: 'Chưa đạt độ bao phủ Unit Test >= 80% theo yêu cầu chuẩn.',
    });

    // Document Sign Form
    const docSignForm = useForm({
        signer_name: 'Võ Hoàng Tú',
        signer_role: 'Lead Solution Architect',
    });

    // Document Edit Form
    const docEditForm = useForm({
        content: '',
        version: '',
    });

    // Create New Document Form
    const createDocForm = useForm({
        phase_number: project.current_phase_number || 1,
        doc_type: 'SRS',
        title: '',
        version: 'v1.0',
        content: '',
        creator_name: 'Võ Hoàng Tú',
        creator_role: 'Lead Solution Architect',
    });

    // Add RTM Form
    const rtmForm = useForm({
        req_code: '',
        req_title: '',
        user_story_code: '',
        commit_or_pr: '',
        test_case_code: '',
        defect_code: '',
        release_version: 'v1.0.0',
        status: 'mapped',
    });

    // Add RACI Form
    const raciForm = useForm({
        activity_name: '',
        phase_number: selectedPhaseNum,
        responsible: '',
        accountable: 'Võ Hoàng Tú',
        consulted: '',
        informed: '',
    });

    // AI Copilot Generator Form
    const aiForm = useForm({
        doc_type: 'SRS',
        phase_number: selectedPhaseNum,
        topic_prompt: '',
    });

    const currentGate = project.quality_gates.find(g => g.gate_number === selectedPhaseNum) || project.quality_gates[0];
    const selectedPhase = project.phases.find(p => p.phase_number === selectedPhaseNum);

    const unresolvedBlockers = (project.defects || []).filter(d => 
        ['blocker', 'critical'].includes(d.severity) && ['open', 'in_progress'].includes(d.status)
    );
    const latestCi = project.ci_pipeline_metrics && project.ci_pipeline_metrics.length > 0 
        ? project.ci_pipeline_metrics[0] 
        : null;
    const isGate4Blocked = Boolean(currentGate?.gate_number === 4 && latestCi && (Number(latestCi.coverage_percentage) < 80 || latestCi.sast_status === 'failed'));
    const isGate5Blocked = Boolean(currentGate?.gate_number === 5 && unresolvedBlockers.length > 0);
    const isCurrentGateBlocked = Boolean(isGate4Blocked || isGate5Blocked);

    const handleLogDefect = (e: React.FormEvent) => {
        e.preventDefault();
        defectForm.post(`/projects/${project.id}/defects`, {
            onSuccess: () => {
                setIsAddDefectModalOpen(false);
                defectForm.reset();
            },
        });
    };

    const handleResolveDefect = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDefectToResolve) return;
        resolveForm.post(`/defects/${selectedDefectToResolve.id}/resolve`, {
            onSuccess: () => {
                setIsResolveDefectModalOpen(false);
                setSelectedDefectToResolve(null);
            },
        });
    };

    const handleIngestCiMetrics = (e: React.FormEvent) => {
        e.preventDefault();
        ciForm.post(`/projects/${project.id}/ci-metrics`, {
            onSuccess: () => {
                setIsCiMetricsModalOpen(false);
            },
        });
    };

    const handleLogIncident = (e: React.FormEvent) => {
        e.preventDefault();
        incidentForm.post(`/projects/${project.id}/incidents`, {
            onSuccess: () => {
                setIsAddIncidentModalOpen(false);
                incidentForm.reset();
            },
        });
    };

    const handleApproveGate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentGate) return;
        approveForm.post(`/quality-gates/${currentGate.id}/approve`, {
            onSuccess: () => {
                setIsApproveGateModalOpen(false);
            },
        });
    };

    const handleRejectGate = (gateId: number) => {
        if (!confirm('Xác nhận từ chối cổng phê duyệt chất lượng này?')) return;
        rejectForm.post(`/quality-gates/${gateId}/reject`);
    };

    const handleToggleCriterion = (gateId: number, criterion: string, currentPassed: boolean) => {
        router.post(`/quality-gates/${gateId}/toggle-criteria`, {
            criterion,
            passed: !currentPassed,
            user_name: 'Võ Hoàng Tú',
        }, { preserveScroll: true });
    };

    const handleSignDocument = (docId: number) => {
        docSignForm.post(`/documents/${docId}/sign`, {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedDocPreview && selectedDocPreview.id === docId) {
                    setSelectedDocPreview(prev => prev ? ({
                        ...prev,
                        status: 'approved',
                        signed_off_by: docSignForm.data.signer_name,
                        signed_off_at: new Date().toISOString(),
                    }) : null);
                }
            }
        });
    };

    const handleBatchAiGenerate = (phaseNum?: number) => {
        setIsGeneratingAi(true);
        router.post(`/projects/${project.id}/batch-ai-generate`, {
            phase_number: phaseNum || null,
        }, {
            preserveScroll: true,
            onFinish: () => setIsGeneratingAi(false),
        });
    };

    const handleBatchSignPhase = (phaseNum: number) => {
        if (!confirm(`Xác nhận ký số điện tử HMAC-SHA256 phê duyệt toàn bộ tài liệu kỹ thuật trong Pha ${phaseNum}?`)) return;
        setIsBatchSigning(true);
        router.post(`/projects/${project.id}/phases/${phaseNum}/batch-sign`, {
            signer_name: 'Võ Hoàng Tú',
            signer_role: 'Lead Solution Architect',
        }, {
            preserveScroll: true,
            onFinish: () => setIsBatchSigning(false),
        });
    };

    const handleAiEvaluateGate = (gateId: number) => {
        setIsEvaluatingGate(true);
        router.post(`/quality-gates/${gateId}/ai-evaluate`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsEvaluatingGate(false);
                setIsGateChecklistOpen(true);
            },
        });
    };

    const handleAiEnrichDoc = (mode: 'deepen' | 'bdd' | 'standards') => {
        if (!editingDoc) return;
        let snippet = '';
        if (mode === 'deepen') {
            snippet = [
                '',
                '### 2.x. ĐẶC TẢ CHI TIẾT KỸ THUẬT (AI COPILOT ENRICHED)',
                `- **Mô hình kiến trúc tham chiếu**: Phân tán Cloud-Native, chuẩn giao tiếp RESTful JSON:API và Event-Driven.`,
                `- **Ràng buộc hiệu năng**: Độ trễ API p95 <= 80ms, thông lượng xử lý >= 2,500 TPS.`,
                `- **Cơ chế chịu lỗi (Fault Tolerance)**: Circuit Breaker pattern, tự động chuyển hướng sang Read-Replica khi cụm chính quá tải.`,
                `- **Chiến lược Caching**: Multi-level cache (L1 local Memory cache + L2 Redis Cluster, TTL 300s).`,
            ].join('\n');
        } else if (mode === 'bdd') {
            snippet = [
                '',
                '### 3.x. KỊCH BẢN KIỂM THỬ HÀNH VI (GHERKIN BDD SPECIFICATIONS)',
                '```gherkin',
                `Feature: Đảm bảo tính toàn vẹn nghiệp vụ cho ${editingDoc.title}`,
                '  Scenario: Thực thi thành công trong điều kiện chuẩn',
                '    Given Hệ thống đã nạp đầy đủ cấu hình môi trường Production',
                '    And Người dùng đã xác thực với vai trò có thẩm quyền',
                '    When Gửi payload dữ liệu hợp lệ thỏa mãn schema OpenAPI 3.1',
                '    Then Hệ thống phản hồi mã trạng thái HTTP 200 OK',
                '    And Ghi vết giao dịch vào Sổ cái Audit Trail có chữ ký HMAC-SHA256',
                '',
                '  Scenario: Từ chối yêu cầu khi phát hiện vi phạm bảo mật',
                '    Given Phát hiện payload có dấu hiệu tấn công SQL Injection hoặc XSS',
                '    When Middleware bảo mật WAF chặn đứng request',
                '    Then Trả về mã lỗi HTTP 403 Forbidden và kích hoạt cảnh báo SIEM',
                '```',
            ].join('\n');
        } else if (mode === 'standards') {
            snippet = [
                '',
                '### 4.x. MA TRẬN TUÂN THỦ TIÊU CHUẨN QUỐC TẾ (COMPLIANCE CHECKLIST)',
                '- [x] **ISO/IEC 12207**: Quy trình phát triển phần mềm chuẩn mực, tài liệu phân tầng theo 7 pha SDLC.',
                '- [x] **IEEE 830**: Đặc tả yêu cầu rõ ràng, có thể kiểm chứng độc lập và không mâu thuẫn.',
                '- [x] **OWASP Top 10**: Đã áp dụng cơ chế Input Validation, CSRF Protection và Column-level Data Encryption.',
                '- [x] **Non-Repudiation**: Chống chối bỏ trách nhiệm bằng chữ ký số HMAC-SHA256 trên từng phiên bản tài liệu.',
            ].join('\n');
        }
        docEditForm.setData('content', (docEditForm.data.content || '') + snippet);
    };

    const handleSaveAndSignDocument = () => {
        if (!editingDoc) return;
        docEditForm.put(`/documents/${editingDoc.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                const targetId = editingDoc.id;
                setEditingDoc(null);
                handleSignDocument(targetId);
            },
        });
    };

    const handleCreateDocument = (e: React.FormEvent) => {
        e.preventDefault();
        createDocForm.post(`/projects/${project.id}/documents`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateDocModalOpen(false);
                createDocForm.reset();
            },
        });
    };

    const handleOpenCreateDocModal = (phaseNum?: number) => {
        if (phaseNum) {
            createDocForm.setData('phase_number', phaseNum);
        }
        setIsCreateDocModalOpen(true);
    };

    const handleCopySignatureHash = (hash: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(hash);
            setCopiedSignatureHash(true);
            setTimeout(() => setCopiedSignatureHash(false), 2500);
        }
    };

    const handleInsertMarkdownTag = (prefix: string, suffix: string = '') => {
        const textarea = document.getElementById('doc-editor-textarea') as HTMLTextAreaElement | null;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = docEditForm.data.content;
        const selected = text.substring(start, end) || 'nội dung';
        const replacement = prefix + selected + suffix;
        const newContent = text.substring(0, start) + replacement + text.substring(end);
        docEditForm.setData('content', newContent);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        }, 10);
    };

    const handleInsertStandardTemplate = () => {
        const template = [
            '## 1. TỔNG QUAN & MỤC TIÊU',
            '- Mục tiêu chính của hồ sơ kỹ thuật này nhằm xác lập chuẩn mực kiến trúc và quy trình.',
            '',
            '## 2. PHẠM VI & ĐỐI TƯỢNG ÁP DỤNG',
            '- Các thành phần trong phạm vi: Backend API, Message Queue, CSDL quan hệ.',
            '- Ràng buộc công nghệ: PHP 8.5, Laravel 12, PostgreSQL 16, Redis Cluster.',
            '',
            '## 3. ĐẶC TẢ KỸ THUẬT CHI TIẾT',
            '```json',
            '{\n  "service": "Enterprise-Core",\n  "status": "ready",\n  "compliance": "ISO-12207"\n}',
            '```',
            '',
            '## 4. TIÊU CHUẨN NGHIỆM THU & BÀN GIAO',
            '- [ ] 100% tiêu chí chấp nhận được kiểm thử tự động',
            '- [ ] Quét mã nguồn SAST không có lỗ hổng bảo mật Blocker/Critical',
            '- [ ] Phê duyệt đầy đủ bởi Lead Solution Architect'
        ].join('\n');
        
        docEditForm.setData('content', (docEditForm.data.content ? docEditForm.data.content + '\n\n' : '') + template);
    };

    const handleOpenEditDoc = (doc: ProjectDoc) => {
        setEditingDoc(doc);
        docEditForm.setData({
            content: doc.content || '',
            version: doc.version || 'v1.1',
        });
    };

    const handleSaveDocument = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDoc) return;
        docEditForm.put(`/documents/${editingDoc.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingDoc(null);
            },
        });
    };

    const handleAddRtm = (e: React.FormEvent) => {
        e.preventDefault();
        rtmForm.post(`/projects/${project.id}/rtm`, {
            onSuccess: () => {
                setIsAddRtmModalOpen(false);
                rtmForm.reset();
            },
        });
    };

    const handleAddRaci = (e: React.FormEvent) => {
        e.preventDefault();
        raciForm.post(`/projects/${project.id}/raci`, {
            onSuccess: () => {
                setIsAddRaciModalOpen(false);
                raciForm.reset();
            },
        });
    };

    const handleAiGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        aiForm.post(`/projects/${project.id}/ai-generate`, {
            onSuccess: () => {
                setIsAiModalOpen(false);
                aiForm.reset();
            },
        });
    };

    const handlePackageRelease = (e: React.FormEvent) => {
        e.preventDefault();
        releaseForm.post(`/projects/${project.id}/package-release`, {
            onSuccess: () => {
                setIsPackageReleaseModalOpen(false);
            },
        });
    };

    const handleGitWebhook = (e: React.FormEvent) => {
        e.preventDefault();
        gitForm.post(`/projects/${project.id}/git-webhook`, {
            onSuccess: () => {
                setIsGitWebhookModalOpen(false);
            },
        });
    };

    const handleVerifyAuditChain = () => {
        router.post(`/projects/${project.id}/verify-audit`, {}, { preserveScroll: true });
    };

    const filteredRtm = project.rtm_traces.filter(trace => {
        return rtmStatusFilter === 'all' || trace.status === rtmStatusFilter;
    });

    const SDLC_NAV_ITEMS = [
        { id: 'deliverables', label: 'Kho Tài Liệu', sub: 'Deliverables & Specs', icon: FileText, count: project.documents.length, badgeColor: 'bg-blue-100 text-blue-700' },
        { id: 'kanban', label: 'Agile & Kanban', sub: 'Sprint Backlog & PRs', icon: Layers, count: project.tasks?.length || 0, badgeColor: 'bg-indigo-100 text-indigo-700' },
        { id: 'testing', label: 'Kiểm Thử & Test Runs', sub: '1-Click Defect Hub', icon: CheckSquare, count: project.test_runs?.length || 0, badgeColor: 'bg-rose-100 text-rose-700' },
        { id: 'release_cab', label: 'CAB & Canary', sub: 'Thẩm Định & Rollout', icon: SlidersHorizontal, count: `${project.cab_signoffs?.filter(s => s.decision === 'approved').length || 0}/3`, badgeColor: 'bg-purple-100 text-purple-700' },
        { id: 'raci', label: 'Ma Trận RACI', sub: 'Phân Quyền Trách Nhiệm', icon: Users, count: project.raci_assignments.length, badgeColor: 'bg-indigo-100 text-indigo-700' },
        { id: 'rtm', label: 'Ma Trận RTM', sub: 'Traceability Matrix', icon: GitBranch, count: project.rtm_traces.length, badgeColor: 'bg-emerald-100 text-emerald-700' },
        {
            id: 'defects',
            label: 'Quản Lý Lỗi',
            sub: 'Defects & Bug Tracking',
            icon: Bug,
            count: project.defects?.length || 0,
            badgeColor: unresolvedBlockers.length > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-600'
        },
        { id: 'operations', label: 'Vận Hành & SLA', sub: 'Giám Sát Uptime & Sự Cố', icon: Activity, count: `${slaMetrics?.uptime_percentage || 100}%`, badgeColor: 'bg-cyan-100 text-cyan-800' },
        { id: 'audit', label: 'Nhật Ký Kiểm Toán', sub: 'Lưu Vết Chống Chối Bỏ', icon: History, count: project.audit_logs.length, badgeColor: 'bg-purple-100 text-purple-700' },
    ] as const;

    const activeNavItem = SDLC_NAV_ITEMS.find(item => item.id === activeTab) || SDLC_NAV_ITEMS[0];

    return (
        <SaaSLayout
            title={`${project.name} - SDLC Control Center`}
            project={project}
            allProjects={enterpriseProjects || [project]}
            projectNavItems={SDLC_NAV_ITEMS}
            activeProjectTab={activeTab}
            onSelectProjectTab={(tabId) => setActiveTab(tabId as any)}
            phases={project.phases}
            selectedPhaseNum={selectedPhaseNum}
            onSelectPhaseNum={(num) => setSelectedPhaseNum(num)}
            breadcrumbs={[
                { label: 'Quản Trị Dự Án & SDLC', href: '/projects?tab=projects' },
                { label: project.code, href: `/projects/${project.id}` },
                { label: activeNavItem.label }
            ]}
            flash={flash}
            headerActions={
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-[11px] font-semibold hover:shadow-md transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        title="AI Trợ Lý SDLC (Generate Specs)"
                    >
                        <Sparkles className="w-3 h-3" />
                        <span className="hidden sm:inline">AI Specs</span>
                    </button>

                    <button
                        onClick={() => setIsPackageReleaseModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-[11px] font-semibold hover:shadow-md transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Đóng Gói Phát Hành"
                    >
                        <Package className="w-3 h-3" />
                        <span className="hidden md:inline">Đóng Gói</span>
                    </button>

                    <button
                        onClick={() => setIsDossierModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Hồ Sơ Nghiệm Thu"
                    >
                        <Printer className="w-3 h-3 text-blue-600" />
                        <span className="hidden lg:inline">Hồ Sơ</span>
                    </button>

                    <button
                        onClick={() => setIsComplianceModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-semibold hover:shadow-md transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Kiểm Toán Tuân Thủ SDLC"
                    >
                        <Award className="w-3 h-3" />
                        <span className="hidden md:inline">Kiểm Toán</span>
                    </button>

                    <button
                        onClick={() => setIsWebhookModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-amber-600 hover:border-amber-300 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Cấu hình Webhooks"
                    >
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="hidden lg:inline">Webhooks</span>
                    </button>
                </div>
            }
        >
            {/* 7-PHASE SDLC STEPPER RIBBON (Semantic <nav>) */}
                    <nav aria-label="Quy trình 7 pha SDLC" className="fluent-compact-card p-1.5 mb-3 border border-white/80 shadow-xs">
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                            {PHASE_METADATA.map((meta) => {
                                const phaseData = project.phases.find(p => p.phase_number === meta.num);
                                const gateData = project.quality_gates.find(g => g.gate_number === meta.num);
                                const isPassed = gateData?.status === 'passed' || meta.num < project.current_phase_number;
                                const isCurrent = meta.num === project.current_phase_number;
                                const isSelected = selectedPhaseNum === meta.num;
                                const completionRate = phaseData?.completion_rate || (isPassed ? 100 : 0);

                                return (
                                    <button
                                        key={meta.num}
                                        type="button"
                                        onClick={() => setSelectedPhaseNum(meta.num)}
                                        aria-current={isSelected ? 'step' : undefined}
                                        className={`flex-1 min-w-[125px] px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                                            isSelected
                                                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                                                : isPassed
                                                ? 'bg-emerald-50/70 hover:bg-emerald-100/70 text-slate-800 border border-emerald-200/60'
                                                : isCurrent
                                                ? 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-900 border border-blue-200/70'
                                                : 'bg-white/60 hover:bg-white text-slate-500 border border-slate-200/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {isPassed ? (
                                                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                                            ) : isCurrent ? (
                                                <Clock className={`w-3.5 h-3.5 shrink-0 animate-pulse ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                                            ) : (
                                                <Lock className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                                            )}
                                            <div className="truncate">
                                                <div className="text-[11px] font-bold leading-tight truncate">
                                                    P{meta.num}: {meta.code}
                                                </div>
                                            </div>
                                        </div>

                                        <span className={`text-[10px] font-mono px-1 py-0.2 rounded-sm font-semibold shrink-0 ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : isPassed
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : isCurrent
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {completionRate}%
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* SELECTED PHASE & QUALITY GATEKEEPER MODULE (Semantic <aside>) */}
                    {currentGate && (() => {
                        const checklistEntries = currentGate.criteria_checklist ? Object.entries(currentGate.criteria_checklist) : [];
                        const passedCriteriaCount = checklistEntries.filter(([_, passed]) => passed).length;
                        const totalCriteriaCount = checklistEntries.length;

                        return (
                            <aside aria-label="Cổng kiểm soát chất lượng" className="fluent-compact-card p-3 mb-3 border-l-4 border-l-blue-600 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="fluent-badge-sm bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Gate {currentGate.gate_number}
                                        </span>
                                        <h2 className="text-xs sm:text-sm font-extrabold text-slate-900">
                                            {currentGate.name}
                                        </h2>
                                        <span className="text-[11px] text-slate-500">
                                            Pha: <strong className="text-slate-700 font-medium">{PHASE_METADATA[selectedPhaseNum - 1]?.title}</strong>
                                        </span>
                                        <span className="text-slate-300 hidden md:inline">•</span>
                                        <span className="text-[11px] text-slate-500">
                                            Thẩm quyền: <strong className="text-blue-700 font-semibold">{currentGate.required_role}</strong>
                                        </span>
                                    </div>

                                    {/* Gate Status, Checklist Toggle & Signoff Action */}
                                    <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                                        {totalCriteriaCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setIsGateChecklistOpen(!isGateChecklistOpen)}
                                                className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                                                    isGateChecklistOpen
                                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>Tiêu chí ({passedCriteriaCount}/{totalCriteriaCount})</span>
                                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isGateChecklistOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}

                                        {currentGate.status === 'passed' ? (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Đã Ký Duyệt</span>
                                                <span className="text-[10px] font-mono text-emerald-700 font-normal">({currentGate.sign_off_by})</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAiEvaluateGate(currentGate.id)}
                                                    disabled={isEvaluatingGate}
                                                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                    title="AI tự động kiểm tra tài liệu, độ bao phủ test, SAST và đánh dấu tiêu chí đạt chuẩn"
                                                >
                                                    <Sparkles className={`w-3 h-3 text-indigo-600 ${isEvaluatingGate ? 'animate-spin' : ''}`} />
                                                    <span>{isEvaluatingGate ? 'Đang Thẩm Định...' : '🤖 AI Thẩm Định Tiêu Chí'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRejectGate(currentGate.id)}
                                                    className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    Từ Chối
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsApproveGateModalOpen(true)}
                                                    className={`px-3 py-1 text-[11px] font-semibold flex items-center gap-1.5 rounded-lg cursor-pointer shadow-xs transition-all ${
                                                        isCurrentGateBlocked
                                                            ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold'
                                                            : 'fluent-button-primary'
                                                    }`}
                                                >
                                                    {isCurrentGateBlocked ? (
                                                        <>
                                                            <ShieldAlert className="w-3.5 h-3.5" />
                                                            <span>Ký Ghi Đè (SA Override)</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <KeyRound className="w-3.5 h-3.5" />
                                                            <span>Ký Phê Duyệt Cổng</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Gate Enforcer Warnings */}
                                {isGate4Blocked && (
                                    <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-900 flex items-center justify-between gap-2.5 text-xs">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                            <p className="text-amber-800 leading-snug">
                                                <strong>Khóa Cổng 4 (Quality & Security Baseline):</strong> Test Coverage <strong>{latestCi?.coverage_percentage}%</strong> (tiêu chuẩn &ge; 80%) hoặc SAST <strong>{latestCi?.sast_status?.toUpperCase()}</strong> chưa đạt.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsCiMetricsModalOpen(true)}
                                            className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                                        >
                                            Mô Phỏng CI
                                        </button>
                                    </div>
                                )}

                                {isGate5Blocked && (
                                    <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50/90 border border-rose-200 text-rose-900 flex items-center justify-between gap-2.5 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Bug className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                            <p className="text-rose-800 leading-snug">
                                                <strong>Khóa Cổng 5 (QA Testing Baseline):</strong> Còn <strong>{unresolvedBlockers.length} lỗi nghiêm trọng</strong> ({unresolvedBlockers.map(b => b.defect_code).join(', ')}).
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('defects')}
                                            className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 cursor-pointer whitespace-nowrap"
                                        >
                                            Xử Lý Ngay
                                        </button>
                                    </div>
                                )}

                                {/* Collapsible Interactive Gate Checklist */}
                                {currentGate.criteria_checklist && isGateChecklistOpen && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 animate-fade-in">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                                Tiêu chí thẩm tra trước khi qua cổng (Gate Criteria Checklist):
                                            </h3>
                                            {currentGate.status !== 'passed' && (
                                                <span className="text-[10px] text-blue-600 font-medium">
                                                    Nhấp vào checkbox để đánh dấu thẩm định tiêu chí
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {checklistEntries.map(([criterion, passed], idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    disabled={currentGate.status === 'passed'}
                                                    onClick={() => handleToggleCriterion(currentGate.id, criterion, passed)}
                                                    className={`flex items-center gap-2 text-xs text-left p-2 rounded-lg border transition-all ${
                                                        passed
                                                            ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900 font-medium'
                                                            : 'bg-white/80 border-slate-200/60 text-slate-600 hover:border-blue-300'
                                                    } ${currentGate.status !== 'passed' ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'}`}
                                                >
                                                    {passed ? (
                                                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                    ) : (
                                                        <Square className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                    )}
                                                    <span className="leading-snug text-[11px]">{criterion}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {currentGate.sign_off_notes && (
                                            <div className="mt-2.5 p-2 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 font-mono whitespace-pre-line leading-relaxed">
                                                {currentGate.sign_off_notes}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </aside>
                        );
                    })()}


                {/* TAB 1: TECHNICAL DELIVERABLES / DOCUMENTS */}
                {activeTab === 'deliverables' && (
                    <DocumentLibrary
                        projectId={project.id}
                        documents={project.documents}
                        phases={project.phases}
                        qualityGates={project.quality_gates}
                        currentPhaseNumber={project.current_phase_number}
                        onViewDoc={(doc) => setSelectedDocPreview(doc)}
                        onEditDoc={(doc) => handleOpenEditDoc(doc)}
                        onSignDoc={(docId) => handleSignDocument(docId)}
                        onOpenAiModal={() => setIsAiModalOpen(true)}
                        onOpenDossierModal={() => setIsDossierModalOpen(true)}
                        onOpenCreateDocModal={handleOpenCreateDocModal}
                        onBatchAiGenerate={handleBatchAiGenerate}
                        onBatchSignPhase={handleBatchSignPhase}
                        isGeneratingAi={isGeneratingAi}
                        isBatchSigning={isBatchSigning}
                    />
                )}

                {/* TAB: AGILE SPRINT & KANBAN TASK BOARD (Phase 4) */}
                {activeTab === 'kanban' && (
                    <section role="tabpanel" id="panel-kanban" aria-labelledby="tab-kanban" tabIndex={0} className="focus:outline-hidden">
                        <KanbanBoard
                            projectId={project.id}
                            sprints={project.sprints || []}
                            tasks={project.tasks || []}
                            rtmTraces={project.rtm_traces || []}
                        />
                    </section>
                )}

                {/* TAB: TEST RUNS & 1-CLICK DEFECT SUITE (Phase 5) */}
                {activeTab === 'testing' && (
                    <section role="tabpanel" id="panel-testing" aria-labelledby="tab-testing" tabIndex={0} className="focus:outline-hidden">
                        <TestRunManager
                            projectId={project.id}
                            testRuns={project.test_runs || []}
                        />
                    </section>
                )}

                {/* TAB: CAB MULTI-SIGNOFF & CANARY ROLLOUT TRACKER (Phase 6) */}
                {activeTab === 'release_cab' && (
                    <section role="tabpanel" id="panel-release_cab" aria-labelledby="tab-release_cab" tabIndex={0} className="focus:outline-hidden">
                        <CABRolloutManager
                            projectId={project.id}
                            cabSignoffs={project.cab_signoffs || []}
                            rollouts={project.deployment_rollouts || []}
                        />
                    </section>
                )}

                {/* TAB 2: RACI MATRIX */}
                {activeTab === 'raci' && (
                    <section role="tabpanel" id="panel-raci" aria-labelledby="tab-raci" tabIndex={0} className="focus:outline-hidden fluent-card p-6 overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Ma Trận Trách Nhiệm Từng Hoạt Động (RACI Matrix)</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    R (Responsible: Người làm) • A (Accountable: Chịu trách nhiệm duy nhất) • C (Consulted: Tham vấn) • I (Informed: Nhận thông tin)
                                </p>
                            </div>

                            <button
                                onClick={() => setIsAddRaciModalOpen(true)}
                                className="fluent-button-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 self-start cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Bổ Sung Phân Công RACI
                            </button>
                        </div>

                        {/* RACI Governance Health & Workload Distribution */}
                        {raciWorkload && (
                            <div className="mb-6 space-y-4">
                                {raciWorkload.bottlenecks.length > 0 && (
                                    <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                                                Cảnh Báo Điểm Nghẽn Trách Nhiệm (RACI Bottleneck Risk)
                                            </h4>
                                            <p className="text-xs text-amber-700 mt-1">
                                                Phát hiện thành viên chịu trách nhiệm giải trình tối hậu (Accountable) cho quá nhiều công việc trọng yếu, vi phạm nguyên tắc cân bằng rủi ro CMMI:
                                            </p>
                                            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs font-semibold text-amber-800">
                                                {raciWorkload.bottlenecks.map((bn, idx) => (
                                                    <li key={idx}>{bn}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                                        Phân Bổ Khối Lượng Trách Nhiệm Nhân Sự ({Object.keys(raciWorkload.workload_by_person).length} Thành viên):
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {Object.entries(raciWorkload.workload_by_person).map(([person, counts]) => (
                                            <div key={person} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-bold text-slate-800 truncate">{person}</span>
                                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-bold">
                                                            {counts.total} task
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] mb-2">
                                                        <span className="text-rose-700 font-bold">A (Chịu TN): {counts.a_count}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-blue-700 font-bold">R (Làm): {counts.r_count}</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${counts.a_count >= 3 ? 'bg-amber-500' : 'bg-blue-600'}`}
                                                        style={{ width: `${Math.min(100, Math.round((counts.total / (raciWorkload.total_activities || 1)) * 100))}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase text-[10px]">
                                        <th className="py-3 px-4">Pha & Hoạt Động</th>
                                        <th className="py-3 px-4 text-blue-700 bg-blue-50/50">R - Responsible (Người Làm)</th>
                                        <th className="py-3 px-4 text-rose-700 bg-rose-50/50">A - Accountable (Chịu Trách Nhiệm)</th>
                                        <th className="py-3 px-4 text-indigo-700">C - Consulted (Tham Vấn)</th>
                                        <th className="py-3 px-4 text-slate-700">I - Informed (Nhận Tin)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {project.raci_assignments.map((raci) => (
                                        <tr key={raci.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                                                <span className="text-[10px] text-slate-400 font-bold block">Pha {raci.phase_number}</span>
                                                {raci.activity_name}
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-blue-900 bg-blue-50/30">
                                                <span className="fluent-badge bg-blue-100 text-blue-800 border-blue-200">
                                                    {raci.responsible}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-rose-900 bg-rose-50/30">
                                                <span className="fluent-badge bg-rose-100 text-rose-800 border-rose-200">
                                                    ★ {raci.accountable}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600">
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.isArray(raci.consulted) ? raci.consulted.map((c, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-medium border border-indigo-100">
                                                            {c}
                                                        </span>
                                                    )) : raci.consulted}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500">
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.isArray(raci.informed) ? raci.informed.map((inf, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                                                            {inf}
                                                        </span>
                                                    )) : raci.informed}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* TAB 3: REQUIREMENTS TRACEABILITY MATRIX (RTM) */}
                {activeTab === 'rtm' && (
                    <section role="tabpanel" id="panel-rtm" aria-labelledby="tab-rtm" tabIndex={0} className="focus:outline-hidden fluent-card p-6">
                        {/* RTM Coverage Gap Banner */}
                        {rtmAnalysis && (
                            <div className="mb-6 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Độ Bao Phủ Kiểm Thử</span>
                                    <span className="text-xl font-extrabold text-emerald-600">{rtmAnalysis.coverage_score}%</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Yêu Cầu Đã Test</span>
                                    <span className="text-xl font-bold text-slate-800">{rtmAnalysis.tested_count} / {rtmAnalysis.total_requirements}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Đã Gắn Bản Release</span>
                                    <span className="text-xl font-bold text-purple-600">{rtmAnalysis.released_count} mục</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lỗ Hổng Truy Vết</span>
                                    <span className={`text-xl font-bold ${rtmAnalysis.missing_tests.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {rtmAnalysis.missing_tests.length > 0 ? `${rtmAnalysis.missing_tests.length} Chưa Test` : '0 Lỗ Hổng'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Ma Trận Truy Xuất Hai Chiều (Bi-directional RTM)
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Liên kết 1:1 từ Yêu cầu BRD → User Story → Git Commit/PR → Test Case → Release Tag
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={rtmStatusFilter}
                                    onChange={(e) => setRtmStatusFilter(e.target.value)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="passed">PASSED</option>
                                    <option value="in_dev">IN_DEV</option>
                                    <option value="tested">TESTED</option>
                                    <option value="mapped">MAPPED</option>
                                </select>

                                <button
                                    onClick={() => setIsGitWebhookModalOpen(true)}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer"
                                    title="Mô phỏng commit push hoặc merge PR có gắn mã REQ-*"
                                >
                                    <GitPullRequest className="w-3.5 h-3.5 text-indigo-600" />
                                    Mô Phỏng Git Webhook
                                </button>

                                <button
                                    onClick={() => setIsPackageReleaseModalOpen(true)}
                                    className="px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-700 hover:bg-purple-100 flex items-center gap-1.5 cursor-pointer"
                                    title="Đóng gói và gắn thẻ Release cho các yêu cầu đã Passed"
                                >
                                    <Package className="w-3.5 h-3.5 text-purple-600" />
                                    Đóng Gói Release
                                </button>

                                <button
                                    onClick={() => setIsAddRtmModalOpen(true)}
                                    className="fluent-button-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Thêm Mắt Xích RTM
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase text-[10px]">
                                        <th className="py-3 px-3">Mã Yêu Cầu (BRD)</th>
                                        <th className="py-3 px-3">User Story (SRS)</th>
                                        <th className="py-3 px-3">Mã Nguồn / Git PR</th>
                                        <th className="py-3 px-3">Test Case ID</th>
                                        <th className="py-3 px-3">Bản Release</th>
                                        <th className="py-3 px-3 text-right">Trạng Thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                    {filteredRtm.map((trace) => (
                                        <tr key={trace.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3 px-3 font-sans">
                                                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                    {trace.req_code}
                                                </span>
                                                <p className="text-[11px] text-slate-700 font-medium mt-1">{trace.req_title}</p>
                                            </td>
                                            <td className="py-3 px-3 text-slate-700 font-semibold">
                                                {trace.user_story_code}
                                            </td>
                                            <td className="py-3 px-3 text-indigo-600 font-medium">
                                                {trace.commit_or_pr || '—'}
                                            </td>
                                            <td className="py-3 px-3 text-emerald-700 font-medium">
                                                {trace.test_case_code || '—'}
                                            </td>
                                            <td className="py-3 px-3 text-purple-700 font-bold">
                                                {trace.release_version || '—'}
                                            </td>
                                            <td className="py-3 px-3 text-right font-sans">
                                                <span className={`fluent-badge ${
                                                    trace.status === 'passed' 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                        : trace.status === 'in_dev' 
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    {trace.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* TAB 4: DEFECT & BUG TRACKING LIFECYCLE */}
                {activeTab === 'defects' && (
                    <section role="tabpanel" id="panel-defects" aria-labelledby="tab-defects" tabIndex={0} className="focus:outline-hidden space-y-6">
                        {/* Defect KPI Scorecards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="fluent-card p-4">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider">Tổng Số Lỗi (Defects)</span>
                                    <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                                        <Bug className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-extrabold text-slate-900">
                                    {project.defects?.length || 0}
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Đã ghi nhận trong chu kỳ kiểm thử
                                </span>
                            </div>

                            <div className="fluent-card p-4">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider">Blocker / Critical Mở</span>
                                    <div className={`p-2 rounded-lg ${unresolvedBlockers.length > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className={`text-2xl font-extrabold ${unresolvedBlockers.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {unresolvedBlockers.length}
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    {unresolvedBlockers.length > 0 ? 'Đang khóa Cổng 5 (Gate 5 Enforcer)' : 'Đủ điều kiện nghiệm thu Cổng 5'}
                                </span>
                            </div>

                            <div className="fluent-card p-4">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider">Đang Xử Lý (In Progress)</span>
                                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-extrabold text-amber-600">
                                    {(project.defects || []).filter(d => d.status === 'in_progress').length}
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Developer đang fix và re-test
                                </span>
                            </div>

                            <div className="fluent-card p-4">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider">Đã Khắc Phục / Đóng</span>
                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-extrabold text-emerald-600">
                                    {(project.defects || []).filter(d => ['resolved', 'closed'].includes(d.status)).length}
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    {project.defects && project.defects.length > 0
                                        ? `Tỷ lệ khắc phục: ${Math.round((((project.defects || []).filter(d => ['resolved', 'closed'].includes(d.status)).length) / project.defects.length) * 100)}%`
                                        : 'Chưa phát sinh lỗi'}
                                </span>
                            </div>
                        </div>

                        {/* Defect Table & Actions */}
                        <div className="fluent-card p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Bug className="w-4 h-4 text-rose-600" />
                                        Ma Trận Khiếm Khuyết Phần Mềm & Truy Xuất RTM (Defect Traceability)
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Mỗi lỗi kỹ thuật đều được liên kết trực tiếp với mã yêu cầu RTM và ảnh hưởng đến điều kiện nghiệm thu Cổng 5.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <button
                                        onClick={() => setIsAddDefectModalOpen(true)}
                                        className="fluent-button-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Báo Cáo Defect Mới
                                    </button>
                                </div>
                            </div>

                            {/* Filter Bar */}
                            <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs">
                                <span className="text-slate-500 font-semibold px-2 flex items-center gap-1">
                                    <Filter className="w-3 h-3 text-slate-400" /> Lọc mức độ:
                                </span>
                                {['all', 'blocker', 'critical', 'major', 'minor'].map(sev => (
                                    <button
                                        key={sev}
                                        onClick={() => setDefectSeverityFilter(sev)}
                                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                            defectSeverityFilter === sev
                                                ? 'bg-rose-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:bg-slate-200/70'
                                        }`}
                                    >
                                        {sev === 'all' ? 'Tất cả' : sev.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {/* Defect Table */}
                            <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                            <th className="py-3 px-3">Mã Lỗi</th>
                                            <th className="py-3 px-3">Tiêu Đề & Các Bước Tái Hiện</th>
                                            <th className="py-3 px-3">Mức Độ</th>
                                            <th className="py-3 px-3">Trạng Thái</th>
                                            <th className="py-3 px-3">Liên Kết RTM</th>
                                            <th className="py-3 px-3">Phụ Trách</th>
                                            <th className="py-3 px-3 text-right">Thao Tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(project.defects || [])
                                            .filter(d => defectSeverityFilter === 'all' || d.severity === defectSeverityFilter)
                                            .map(defect => (
                                                <tr key={defect.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                        {defect.defect_code}
                                                    </td>
                                                    <td className="py-3 px-3 max-w-xs">
                                                        <div className="font-semibold text-slate-900">{defect.title}</div>
                                                        {defect.steps_to_reproduce && (
                                                            <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 font-mono">
                                                                {defect.steps_to_reproduce}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                                            defect.severity === 'blocker'
                                                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                                                : defect.severity === 'critical'
                                                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                                                : defect.severity === 'major'
                                                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                                : 'bg-blue-100 text-blue-800 border-blue-200'
                                                        }`}>
                                                            {defect.severity}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                                            defect.status === 'resolved' || defect.status === 'closed'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : defect.status === 'in_progress'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {defect.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        {defect.rtm_trace ? (
                                                            <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                                                                <GitBranch className="w-3 h-3 text-indigo-500" />
                                                                {defect.rtm_trace.req_code}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 italic">Chưa map RTM</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                                                        <div className="font-medium text-slate-800">{defect.assigned_to || 'Chưa gán'}</div>
                                                        <div className="text-[10px] text-slate-400">Bởi: {defect.logged_by}</div>
                                                    </td>
                                                    <td className="py-3 px-3 text-right whitespace-nowrap">
                                                        {['open', 'in_progress'].includes(defect.status) ? (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedDefectToResolve(defect);
                                                                    setIsResolveDefectModalOpen(true);
                                                                }}
                                                                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                                                            >
                                                                Khắc Phục & Đóng
                                                            </button>
                                                        ) : (
                                                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                                                                <Check className="w-3.5 h-3.5" /> Đã nghiệm thu
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        {(!project.defects || project.defects.length === 0) && (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-slate-400">
                                                    <Bug className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                                                    Chưa ghi nhận lỗi kỹ thuật nào trong dự án này.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* TAB 5: PRODUCTION SLA & INCIDENT MANAGEMENT (PHA 7) */}
                {activeTab === 'operations' && (
                    <section role="tabpanel" id="panel-operations" aria-labelledby="tab-operations" tabIndex={0} className="focus:outline-hidden space-y-6">
                        {/* SLA Metrics Header */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="fluent-card p-4">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Sẵn Sàng (Uptime %)</span>
                                    <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-extrabold text-cyan-900">
                                    {slaMetrics?.uptime_percentage ? `${slaMetrics.uptime_percentage.toFixed(2)}%` : '99.98%'}
                                </div>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        slaMetrics?.sla_breached
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                        {slaMetrics?.sla_breached ? 'VI PHẠM SLA' : 'ĐẠT CAM KẾT SLA'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">Mục tiêu: {slaMetrics?.sla_target || 99.9}%</span>
                                </div>
                            </div>

                            <div className="fluent-card p-4">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider">Tổng Sự Cố Vận Hành</span>
                                    <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                                        <Flame className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-extrabold text-slate-900">
                                    {slaMetrics?.total_incidents ?? (project.production_incidents?.length || 0)}
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Trong đó có {slaMetrics?.p1_count ?? 0} sự cố mức P1 Critical
                                </span>
                            </div>

                            <div className="fluent-card p-4">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider">Tổng Gián Đoạn (Downtime)</span>
                                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                                        <ServerCrash className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-extrabold text-amber-600">
                                    {slaMetrics?.total_downtime_minutes ?? 0} <span className="text-sm font-normal text-slate-500">phút</span>
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Đo lường trong chu kỳ 30 ngày qua
                                </span>
                            </div>

                            <div className="fluent-card p-4">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider">Chỉ Số MTTD / MTTR</span>
                                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-slate-800 space-y-0.5">
                                    <div>MTTD: <span className="text-indigo-600 font-mono">{slaMetrics?.mttd_minutes ?? 0}m</span> (Phát hiện)</div>
                                    <div>MTTR: <span className="text-indigo-600 font-mono">{slaMetrics?.mttr_minutes ?? 0}m</span> (Khắc phục)</div>
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Thời gian phản ứng SLA chuẩn
                                </span>
                            </div>
                        </div>

                        {/* CI/CD Pipeline Summary Banner */}
                        <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                                    <Cpu className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                        Đường Ống CI/CD Tự Động & Quét Bảo Mật SAST (Gate 4 Enforcer)
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        {latestCi ? (
                                            <>Lần chạy gần nhất: <strong className="font-mono text-indigo-700">{latestCi.build_number}</strong> (Branch: {latestCi.branch}) • Coverage: <strong className="font-mono text-emerald-700">{latestCi.coverage_percentage}%</strong> • SAST: <strong className={latestCi.sast_status === 'passed' ? 'text-emerald-700' : 'text-rose-700'}>{latestCi.sast_status.toUpperCase()}</strong></>
                                        ) : (
                                            'Chưa có dữ liệu CI/CD. Vui lòng nạp thông số kiểm thử tự động.'
                                        )}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsCiMetricsModalOpen(true)}
                                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto whitespace-nowrap"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                Giả Lập Runner CI/CD
                            </button>
                        </div>

                        {/* Incident Log Table */}
                        <div className="fluent-card p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <ServerCrash className="w-4 h-4 text-cyan-600" />
                                        Nhật Ký Sự Cố Vận Hành & Khắc Phục (Production Incident Log)
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Theo dõi nguyên nhân gốc rễ (Root Cause) và các hành động sửa chữa để phục vụ biên soạn Post-Mortem.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setIsAddIncidentModalOpen(true)}
                                    className="fluent-button-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Ghi Nhận Sự Cố Mới
                                </button>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                            <th className="py-3 px-3">Mã Sự Cố</th>
                                            <th className="py-3 px-3">Tiêu Đề & Nguyên Nhân Gốc</th>
                                            <th className="py-3 px-3">Mức Độ</th>
                                            <th className="py-3 px-3">Downtime</th>
                                            <th className="py-3 px-3">Trạng Thái</th>
                                            <th className="py-3 px-3">Thời Điểm</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(project.production_incidents || []).map(inc => (
                                            <tr key={inc.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                    {inc.incident_code}
                                                </td>
                                                <td className="py-3 px-3 max-w-sm">
                                                    <div className="font-semibold text-slate-900">{inc.title}</div>
                                                    {inc.root_cause && (
                                                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                                            <strong>Nguyên nhân:</strong> {inc.root_cause}
                                                        </div>
                                                    )}
                                                    {inc.corrective_actions && (
                                                        <div className="text-[10px] text-emerald-700 mt-0.5 line-clamp-1">
                                                            <strong>Khắc phục:</strong> {inc.corrective_actions}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                                        inc.severity === 'P1_CRITICAL'
                                                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                                                            : inc.severity === 'P2_MAJOR'
                                                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                            : 'bg-blue-100 text-blue-800 border-blue-200'
                                                    }`}>
                                                        {inc.severity.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                                                    {inc.downtime_minutes}m
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                                        inc.status === 'resolved'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : inc.status === 'mitigated'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        {inc.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                                                    {new Date(inc.detected_at).toLocaleString('vi-VN')}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!project.production_incidents || project.production_incidents.length === 0) && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400">
                                                    <ServerCrash className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                                                    Chưa ghi nhận sự cố vận hành nào trong môi trường Production.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* TAB 6: IMMUTABLE AUDIT TRAIL */}
                {activeTab === 'audit' && (
                    <section role="tabpanel" id="panel-audit" aria-labelledby="tab-audit" tabIndex={0} className="focus:outline-hidden fluent-card p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <History className="w-4 h-4 text-purple-600" />
                                    Nhật Ký Kiểm Toán Bất Biến & Chữ Ký Số (Non-Repudiation Audit Logs)
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Mọi thao tác phê duyệt cổng, ký tài liệu và chuyển pha đều được sinh mã băm HMAC-SHA256 nhằm đảm bảo tính toàn vẹn và trách nhiệm giải trình.
                                </p>
                            </div>

                            <button
                                onClick={handleVerifyAuditChain}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer self-start"
                            >
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Xác Thực Toàn Vẹn Chuỗi Khối
                            </button>
                        </div>

                        {/* Audit Verification Result Banner */}
                        {auditVerification && (
                            <div className="mb-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="w-4 h-4 text-emerald-600" />
                                    <span>
                                        Đã xác thực tính toàn vẹn <strong>{auditVerification.total_verified}</strong> bản ghi kiểm toán bằng khóa HMAC-SHA256. Không có dấu hiệu can thiệp.
                                    </span>
                                </div>
                                <span className="text-[10px] text-emerald-700 font-mono">
                                    {auditVerification.verified_at ? new Date(auditVerification.verified_at).toLocaleTimeString() : 'Vừa xong'}
                                </span>
                            </div>
                        )}

                        <div className="space-y-3 font-mono text-xs">
                            {project.audit_logs.map((log) => (
                                <div key={log.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 hover:bg-white transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-sans mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{log.user_name}</span>
                                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold">
                                                {log.user_role}
                                            </span>
                                            <span className="text-[11px] font-bold text-blue-600">
                                                [{log.action_type}]
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-slate-400">
                                            {new Date(log.created_at).toLocaleString('vi-VN')}
                                        </span>
                                    </div>

                                    {log.details && (
                                        <p className="text-xs font-sans text-slate-600 mb-2">
                                            Chi tiết: {JSON.stringify(log.details)}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/80 p-2 rounded border border-slate-200/40">
                                        <Lock className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                        <span className="text-slate-500 font-semibold">Mã băm bảo mật:</span>
                                        <span className="text-purple-700 truncate select-all">{log.digital_fingerprint}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            {/* Modal: AI Copilot Document Synthesis */}
            {isAiModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">AI Trợ Lý Kỹ Thuật SDLC (Copilot)</h3>
                                <p className="text-xs text-slate-500">Tự động hóa sinh tài liệu SRS, Kiến trúc SAD và Kịch bản Test</p>
                            </div>
                        </div>

                        <form onSubmit={handleAiGenerate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Tài Liệu Cần Sinh</label>
                                    <select
                                        value={aiForm.data.doc_type}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            aiForm.setData('doc_type', val);
                                            if (['BRD', 'SRS'].includes(val)) aiForm.setData('phase_number', 1);
                                            else if (['SAD', 'ERD', 'OPENAPI', 'STRIDE'].includes(val)) aiForm.setData('phase_number', 2);
                                            else if (['WBS'].includes(val)) aiForm.setData('phase_number', 3);
                                            else if (['STP'].includes(val)) aiForm.setData('phase_number', 5);
                                            else if (['RUNBOOK'].includes(val)) aiForm.setData('phase_number', 6);
                                            else if (['SLA_MATRIX', 'RETROSPECTIVE'].includes(val)) aiForm.setData('phase_number', 7);
                                        }}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        <option value="BRD">Yêu cầu Nghiệp vụ (BRD - Pha 1)</option>
                                        <option value="SRS">Đặc tả Yêu cầu Kỹ thuật (SRS - IEEE 830 - Pha 1)</option>
                                        <option value="SAD">Thiết kế Kiến trúc (SAD - C4 Model - Pha 2)</option>
                                        <option value="ERD">Sơ đồ Thực thể Cơ sở Dữ liệu (ERD - Pha 2)</option>
                                        <option value="OPENAPI">Đặc tả RESTful API (OpenAPI 3.1 - Pha 2)</option>
                                        <option value="STRIDE">Mô hình An ninh Mạng (STRIDE - Pha 2)</option>
                                        <option value="WBS">Phân rã Gói Công việc (WBS &lt; 40h - Pha 3)</option>
                                        <option value="STP">Kế hoạch Kiểm thử Tổng thể (STP - Pha 5)</option>
                                        <option value="RUNBOOK">Kịch bản Triển khai Từng Phút (Runbook - Pha 6)</option>
                                        <option value="SLA_MATRIX">Ma trận Cam kết Dịch vụ (SLA - Pha 7)</option>
                                        <option value="RETROSPECTIVE">Biên bản Đánh giá Hậu kiểm & Kinh nghiệm (Pha 7)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Giai Đoạn SDLC</label>
                                    <select
                                        value={aiForm.data.phase_number}
                                        onChange={(e) => aiForm.setData('phase_number', Number(e.target.value))}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                            <option key={num} value={num}>Pha {num}: {PHASE_METADATA[num-1].title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Mô Tả Nhu Cầu Kỹ Thuật (Prompt) *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="vd: Thiết kế cơ chế xác thực đa yếu tố MFA bằng WebAuthn sinh trắc học và quản lý phân quyền theo vai trò RBAC cho hệ thống thanh toán..."
                                    value={aiForm.data.topic_prompt}
                                    onChange={(e) => aiForm.setData('topic_prompt', e.target.value)}
                                    className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                ></textarea>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAiModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={aiForm.processing}
                                    className="fluent-button-primary px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Cpu className="w-3.5 h-3.5" />
                                    {aiForm.processing ? 'AI Đang Tổng Hợp...' : 'Sinh Tài Liệu Chuẩn'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Approve Quality Gate */}
            {isApproveGateModalOpen && currentGate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Ký Số Phê Duyệt Quality Gate</h3>
                                <p className="text-xs text-slate-500">Chữ ký điện tử sinh mã HMAC-SHA256 lưu trữ vĩnh viễn</p>
                            </div>
                        </div>

                        <form onSubmit={handleApproveGate} className="space-y-4">
                            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900">
                                <p className="font-bold">{currentGate.name}</p>
                                <p className="text-[11px] text-blue-700 mt-1">
                                    Thao tác này sẽ đóng Pha {currentGate.gate_number} và tự động chuyển dự án sang Pha {currentGate.gate_number + 1}.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Người Ký Duyệt *</label>
                                    <input
                                        type="text"
                                        required
                                        value={approveForm.data.approver_name}
                                        onChange={(e) => approveForm.setData('approver_name', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vai Trò Thẩm Định *</label>
                                    <input
                                        type="text"
                                        required
                                        value={approveForm.data.approver_role}
                                        onChange={(e) => approveForm.setData('approver_role', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú Phê Duyệt (Notes)</label>
                                <textarea
                                    rows={2}
                                    value={approveForm.data.notes}
                                    onChange={(e) => approveForm.setData('notes', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                ></textarea>
                            </div>

                            {/* Gate Enforcer Blocking Alert & Lead SA Override Box */}
                            {isCurrentGateBlocked && (
                                <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2 text-xs animate-fade-in">
                                    <div className="flex items-center gap-2 font-bold text-amber-900">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        <span>CẢNH BÁO BẢO VỆ CHẤT LƯỢNG (GATE ENFORCER)</span>
                                    </div>
                                    <p className="text-[11px] text-amber-800 leading-relaxed">
                                        {isGate4Blocked && "Chỉ số CI/CD chưa đạt chuẩn (Độ bao phủ test < 80% hoặc SAST thất bại). "}
                                        {isGate5Blocked && `Dự án còn khiếm khuyết mức Blocker/Critical chưa được đóng (${unresolvedBlockers.map(b => b.defect_code).join(', ')}). `}
                                        Quy chuẩn SDLC yêu cầu chỉ <strong>Võ Hoàng Tú (Lead Solution Architect)</strong> mới có quyền ký duyệt ghi đè (Override) kèm lý do giải trình.
                                    </p>
                                    <div>
                                        <label className="block text-[11px] font-bold text-amber-950 mb-1">
                                            Lý Do Kỹ Thuật Ghi Đè (SA Override Reason) *
                                        </label>
                                        <textarea
                                            required
                                            rows={2}
                                            placeholder="vd: Đã kiểm tra giải pháp hotfix trên Staging, chấp thuận giải phóng cổng với điều kiện nghiệm thu bổ sung..."
                                            value={approveForm.data.override_reason}
                                            onChange={(e) => approveForm.setData('override_reason', e.target.value)}
                                            className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800"
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsApproveGateModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={approveForm.processing || (isCurrentGateBlocked && !approveForm.data.override_reason.trim())}
                                    className={`px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 rounded-lg transition-colors ${
                                        isCurrentGateBlocked
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                                            : 'fluent-button-primary'
                                    }`}
                                >
                                    <KeyRound className="w-3.5 h-3.5" />
                                    {approveForm.processing
                                        ? 'Đang Ký Token...'
                                        : isCurrentGateBlocked
                                        ? 'Ký Duyệt Ghi Đè (SA Override)'
                                        : 'Ký Số & Chuyển Pha SDLC'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Document Content Edit */}
            {/* Modal: Document Content Edit */}
            {editingDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-3xl w-full rounded-2xl shadow-2xl relative border border-white max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs">
                                    {editingDoc.doc_type}
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                                        Chỉnh Sửa: {editingDoc.title}
                                    </h3>
                                    <span className="text-[11px] text-slate-400">Pha {editingDoc.phase_number} • Bản hiện tại: {editingDoc.version}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingDoc(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDocument} className="py-3 space-y-3 flex-1 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-slate-700">Phiên Bản (Version):</label>
                                    <input
                                        type="text"
                                        required
                                        value={docEditForm.data.version}
                                        onChange={(e) => docEditForm.setData('version', e.target.value)}
                                        className="w-28 text-xs font-mono font-bold px-3 py-1 rounded-lg border border-slate-200"
                                    />
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const match = docEditForm.data.version.match(/v?(\d+)\.(\d+)/);
                                                if (match) {
                                                    docEditForm.setData('version', `v${match[1]}.${Number(match[2]) + 1}`);
                                                }
                                            }}
                                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                            title="Tăng phiên bản bản vá (+0.1)"
                                        >
                                            +0.1
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const match = docEditForm.data.version.match(/v?(\d+)\.(\d+)/);
                                                if (match) {
                                                    docEditForm.setData('version', `v${Number(match[1]) + 1}.0`);
                                                }
                                            }}
                                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                            title="Tăng phiên bản lớn (+1.0)"
                                        >
                                            +1.0
                                        </button>
                                    </div>
                                </div>

                                <div className="text-[11px] font-mono text-slate-400">
                                    {docEditForm.data.content.length} ký tự • {docEditForm.data.content.trim() ? docEditForm.data.content.trim().split(/\s+/).length : 0} từ
                                </div>
                            </div>

                            {/* Markdown Toolbar */}
                            <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200/80 rounded-lg flex-wrap text-xs">
                                <button
                                    type="button"
                                    onClick={() => handleInsertMarkdownTag('**', '**')}
                                    className="px-2 py-0.5 rounded font-bold hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer"
                                    title="In đậm"
                                >
                                    B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInsertMarkdownTag('## ')}
                                    className="px-2 py-0.5 rounded font-bold hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer"
                                    title="Tiêu đề H2"
                                >
                                    H2
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInsertMarkdownTag('### ')}
                                    className="px-2 py-0.5 rounded font-bold hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer"
                                    title="Tiêu đề H3"
                                >
                                    H3
                                </button>
                                <span className="w-px h-4 bg-slate-200 mx-1" />
                                <button
                                    type="button"
                                    onClick={() => handleInsertMarkdownTag('- ')}
                                    className="px-2 py-0.5 rounded hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer"
                                    title="Danh sách gạch đầu dòng"
                                >
                                    • Gạch đầu dòng
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInsertMarkdownTag('- [ ] ')}
                                    className="px-2 py-0.5 rounded hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer"
                                    title="Checklist tiêu chuẩn"
                                >
                                    ☑ Checklist
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInsertMarkdownTag('\n| Cột 1 | Cột 2 | Cột 3 |\n|---|---|---|\n| Dữ liệu 1 | Dữ liệu 2 | Dữ liệu 3 |\n')}
                                    className="px-2 py-0.5 rounded hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer"
                                    title="Bảng Markdown"
                                >
                                    Bảng
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInsertMarkdownTag('```json\n', '\n```')}
                                    className="px-2 py-0.5 rounded font-mono hover:bg-white text-slate-700 hover:shadow-2xs cursor-pointer"
                                    title="Khối mã nguồn"
                                >
                                    {'</>'} Code
                                </button>
                                <span className="w-px h-4 bg-slate-200 mx-1" />
                                <button
                                    type="button"
                                    onClick={() => handleAiEnrichDoc('deepen')}
                                    className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-semibold hover:bg-violet-100 flex items-center gap-1 cursor-pointer"
                                    title="AI tự động mở rộng và bổ sung chi tiết kỹ thuật"
                                >
                                    <Sparkles className="w-3 h-3 text-violet-600" />
                                    <span>✨ AI Bổ Sung Kỹ Thuật</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAiEnrichDoc('bdd')}
                                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                                    title="AI tự động bổ sung kịch bản Gherkin BDD"
                                >
                                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                                    <span>✨ AI Kịch Bản BDD</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAiEnrichDoc('standards')}
                                    className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                                    title="AI bổ sung checklist kiểm toán an ninh & tuân thủ IEEE/ISO"
                                >
                                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                                    <span>✨ AI Chuẩn Hóa IEEE</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleInsertStandardTemplate}
                                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 cursor-pointer ml-auto"
                                    title="Chèn khung cấu trúc chuẩn ISO/IEEE"
                                >
                                    + Khung Mẫu Chuẩn
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                <textarea
                                    id="doc-editor-textarea"
                                    required
                                    rows={14}
                                    value={docEditForm.data.content}
                                    onChange={(e) => docEditForm.setData('content', e.target.value)}
                                    placeholder="Soạn thảo nội dung đặc tả kỹ thuật theo cú pháp Markdown..."
                                    className="w-full flex-1 text-xs font-mono p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed"
                                ></textarea>
                            </div>

                            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                                <span className="text-[11px] text-slate-400">
                                    Lưu tài liệu sẽ tự động chuyển trạng thái về <strong>CHỜ THẨM ĐỊNH</strong> để ký số lại.
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingDoc(null)}
                                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveAndSignDocument}
                                        disabled={docEditForm.processing}
                                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                                        title="Lưu nội dung và ký số điện tử HMAC-SHA256 ngay lập tức"
                                    >
                                        <KeyRound className="w-3.5 h-3.5" />
                                        <span>Lưu & Ký Duyệt Luôn</span>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={docEditForm.processing}
                                        className="fluent-button-primary px-4 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                                    >
                                        {docEditForm.processing ? 'Đang Lưu...' : 'Chỉ Lưu Bản Thảo'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Document Preview */}
            {selectedDocPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className={`fluent-card bg-white p-6 w-full rounded-2xl shadow-2xl relative border border-white max-h-[92vh] flex flex-col ${
                        selectedDocPreview.doc_type === 'SAD' ? 'max-w-5xl' : 'max-w-4xl'
                    }`}>
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                                    {selectedDocPreview.doc_type}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-slate-900 truncate">
                                        {selectedDocPreview.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                        <span>Pha SDLC {selectedDocPreview.phase_number}</span>
                                        <span>•</span>
                                        <span>Bản: <strong className="font-mono text-slate-600">{selectedDocPreview.version}</strong></span>
                                        <span>•</span>
                                        <span className={`font-bold ${selectedDocPreview.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {selectedDocPreview.status === 'approved' ? 'ĐÃ KÝ DUYỆT' : 'CHỜ THẨM ĐỊNH'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Header Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs mr-1">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewViewMode('formatted')}
                                        className={`px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                                            previewViewMode === 'formatted' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Định Dạng
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewViewMode('raw')}
                                        className={`px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                                            previewViewMode === 'raw' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Mã Nguồn
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="In hoặc lưu file PDF tài liệu này"
                                >
                                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="hidden sm:inline">In / PDF</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => downloadDocumentMarkdown(selectedDocPreview)}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Tải tệp Markdown (.md) về máy tính"
                                >
                                    <Download className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="hidden sm:inline">Tải .md</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const doc = selectedDocPreview;
                                        setSelectedDocPreview(null);
                                        handleOpenEditDoc(doc);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Chỉnh sửa nội dung văn bản"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Sửa</span>
                                </button>

                                <button
                                    onClick={() => setSelectedDocPreview(null)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer ml-1"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="py-4 overflow-y-auto flex-1 space-y-4 pr-1">
                            {selectedDocPreview.doc_type === 'SAD' && (
                                <div className="mb-2">
                                    <C4DiagramViewer projectCode={project.code} projectName={project.name} />
                                </div>
                            )}

                            {previewViewMode === 'formatted' ? (
                                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60">
                                    {(() => {
                                        const content = selectedDocPreview.content || '';
                                        if (!content.trim()) {
                                            return <p className="text-slate-400 italic">Chưa có nội dung chi tiết cho tài liệu kỹ thuật này.</p>;
                                        }
                                        const lines = content.split('\n');
                                        return (
                                            <div className="space-y-2 text-xs text-slate-800 leading-relaxed font-sans">
                                                {lines.map((line, idx) => {
                                                    if (line.startsWith('# ')) {
                                                        return (
                                                            <h1 key={idx} className="text-base font-extrabold text-slate-900 pt-3 pb-1 border-b border-slate-200 tracking-tight">
                                                                {line.substring(2)}
                                                            </h1>
                                                        );
                                                    }
                                                    if (line.startsWith('## ')) {
                                                        return (
                                                            <h2 key={idx} className="text-sm font-bold text-slate-900 pt-2.5 pb-0.5 border-b border-slate-100">
                                                                {line.substring(3)}
                                                            </h2>
                                                        );
                                                    }
                                                    if (line.startsWith('### ')) {
                                                        return (
                                                            <h3 key={idx} className="text-xs font-bold text-slate-800 pt-1.5">
                                                                {line.substring(4)}
                                                            </h3>
                                                        );
                                                    }
                                                    if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
                                                        const isChecked = line.startsWith('- [x] ');
                                                        return (
                                                            <div key={idx} className="flex items-center gap-2 pl-2 text-slate-700">
                                                                <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold border ${isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                                                                    ✓
                                                                </span>
                                                                <span>{line.substring(6)}</span>
                                                            </div>
                                                        );
                                                    }
                                                    if (line.startsWith('- ') || line.startsWith('* ')) {
                                                        return (
                                                            <div key={idx} className="flex items-start gap-2 pl-2">
                                                                <span className="text-blue-500 font-bold shrink-0">•</span>
                                                                <span className="flex-1">{line.substring(2)}</span>
                                                            </div>
                                                        );
                                                    }
                                                    if (line.startsWith('|') && line.endsWith('|')) {
                                                        return (
                                                            <div key={idx} className="font-mono text-[11px] bg-slate-100/70 px-2.5 py-1 rounded border border-slate-200/60 overflow-x-auto">
                                                                {line}
                                                            </div>
                                                        );
                                                    }
                                                    if (line.trim() === '') {
                                                        return <div key={idx} className="h-1.5" />;
                                                    }
                                                    return <p key={idx} className="text-slate-700 leading-relaxed">{line}</p>;
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="font-mono text-xs bg-slate-50/90 p-4 rounded-xl border border-slate-200/70 whitespace-pre-wrap text-slate-800 leading-relaxed overflow-x-auto">
                                    {selectedDocPreview.content || 'Chưa có nội dung chi tiết cho tài liệu này.'}
                                </div>
                            )}
                        </div>

                        {/* Footer & Signature Certificate */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                            {selectedDocPreview.status === 'approved' ? (
                                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1 rounded-md bg-emerald-100 text-emerald-700">
                                                <ShieldCheck className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <span className="text-xs font-extrabold text-emerald-900 tracking-wide uppercase">
                                                    CHỨNG CHỈ SỐ BẤT BIẾN • CHỐNG CHỐI BỎ TRÁCH NHIỆM (NON-REPUDIATION)
                                                </span>
                                                <div className="text-[11px] text-emerald-800">
                                                    Người ký: <strong>{selectedDocPreview.signed_off_by || 'Võ Hoàng Tú'}</strong> • Thời gian: {selectedDocPreview.signed_off_at ? new Date(selectedDocPreview.signed_off_at).toLocaleString('vi-VN') : 'Đã chứng thực'}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 border border-emerald-300 self-start sm:self-auto">
                                            HMAC-SHA256 VERIFIED
                                        </span>
                                    </div>

                                    {selectedDocPreview.signature_hash && (
                                        <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60 font-mono text-[11px] text-emerald-900 bg-white/70 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                                            <span className="text-slate-400 font-semibold shrink-0">Chữ Ký Số:</span>
                                            <span className="break-all flex-1 select-all">{selectedDocPreview.signature_hash}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopySignatureHash(selectedDocPreview.signature_hash!)}
                                                className="px-2 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-sans font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                                                title="Sao chép chuỗi mã băm bảo mật"
                                            >
                                                {copiedSignatureHash ? (
                                                    <>
                                                        <Check className="w-3 h-3 text-emerald-700" />
                                                        <span>Đã Chép</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3" />
                                                        <span>Sao Chép</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                        <div>
                                            <span className="text-xs font-bold text-amber-900">
                                                Tài liệu chưa được ký số (Chờ Thẩm Định)
                                            </span>
                                            <p className="text-[11px] text-amber-700">
                                                Chỉ có giá trị nghiệm thu pháp lý và chuyển giao cổng SDLC sau khi ký duyệt.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleSignDocument(selectedDocPreview.id)}
                                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                                    >
                                        <KeyRound className="w-3.5 h-3.5" />
                                        <span>Ký Phê Duyệt Văn Bản Ngay</span>
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>MCMS SDLC Deliverable Governance • ID #{selectedDocPreview.id}</span>
                                <button
                                    onClick={() => setSelectedDocPreview(null)}
                                    className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Create New Technical Document */}
            {isCreateDocModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-2xl w-full rounded-2xl shadow-2xl relative border border-white max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                                    <FilePlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Thêm Mới Hồ Sơ Kỹ Thuật (SDLC Deliverable)
                                    </h3>
                                    <p className="text-xs text-slate-500">Khởi tạo và số hóa tài liệu kỹ thuật vào Kho Lưu Trữ dự án</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateDocModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDocument} className="py-3 space-y-3 flex-1 flex flex-col overflow-y-auto">
                            {/* Preset Template Selector */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Chọn Khung Mẫu Chuẩn SDLC:
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateDocModalOpen(false);
                                            setIsAiModalOpen(true);
                                        }}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Hoặc Dùng AI Copilot Soạn Thảo</span>
                                    </button>
                                </div>
                                <select
                                    onChange={(e) => {
                                        const tpl = SDLC_CREATION_TEMPLATES.find(t => t.type === e.target.value);
                                        if (tpl) {
                                            createDocForm.setData({
                                                ...createDocForm.data,
                                                phase_number: tpl.phase,
                                                doc_type: tpl.type,
                                                title: tpl.title,
                                                content: tpl.content,
                                            });
                                        }
                                    }}
                                    defaultValue=""
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                                >
                                    <option value="" disabled>-- Chọn mẫu chuẩn hóa tự động điền thông tin --</option>
                                    {SDLC_CREATION_TEMPLATES.map(tpl => (
                                        <option key={tpl.type} value={tpl.type}>
                                            Pha {tpl.phase}: {tpl.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pha SDLC *</label>
                                    <select
                                        value={createDocForm.data.phase_number}
                                        onChange={(e) => createDocForm.setData('phase_number', Number(e.target.value))}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                            <option key={num} value={num}>
                                                Pha {num}: {PHASE_METADATA[num - 1].title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Tài Liệu (Doc Type) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="vd: SRS, SAD, ARCH_ADDENDUM"
                                        value={createDocForm.data.doc_type}
                                        onChange={(e) => createDocForm.setData('doc_type', e.target.value.toUpperCase())}
                                        className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phiên Bản Ban Đầu *</label>
                                    <input
                                        type="text"
                                        required
                                        value={createDocForm.data.version}
                                        onChange={(e) => createDocForm.setData('version', e.target.value)}
                                        className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Hồ Sơ / Tiêu Đề Văn Bản *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="vd: Đặc tả Cấu trúc Phân vùng CSDL Sharding 2026"
                                    value={createDocForm.data.title}
                                    onChange={(e) => createDocForm.setData('title', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-semibold"
                                />
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nội Dung Chi Tiết (Markdown)</label>
                                <textarea
                                    rows={8}
                                    value={createDocForm.data.content}
                                    onChange={(e) => createDocForm.setData('content', e.target.value)}
                                    placeholder="Nhập nội dung hồ sơ kỹ thuật theo định dạng Markdown..."
                                    className="w-full flex-1 text-xs font-mono p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                                ></textarea>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateDocModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={createDocForm.processing}
                                    className="fluent-button-primary px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <FilePlus className="w-3.5 h-3.5" />
                                    <span>{createDocForm.processing ? 'Đang Lưu...' : 'Khởi Tạo & Lưu Vào Kho Tài Liệu'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add RACI Assignment */}
            {isAddRaciModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Bổ Sung Phân Công RACI</h3>
                                <p className="text-xs text-slate-500">Thiết lập trách nhiệm minh bạch cho từng hoạt động</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddRaci} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Hoạt Động Kỹ Thuật *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="vd: Thiết kế Database Sharding"
                                    value={raciForm.data.activity_name}
                                    onChange={(e) => raciForm.setData('activity_name', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pha Kỹ Thuật *</label>
                                    <select
                                        value={raciForm.data.phase_number}
                                        onChange={(e) => raciForm.setData('phase_number', Number(e.target.value))}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                            <option key={num} value={num}>Pha {num}: {PHASE_METADATA[num-1].title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">R - Người Trực Tiếp Làm *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Tên hoặc chức danh"
                                        value={raciForm.data.responsible}
                                        onChange={(e) => raciForm.setData('responsible', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">A - Người Chịu Trách Nhiệm Duy Nhất *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="vd: Võ Hoàng Tú"
                                    value={raciForm.data.accountable}
                                    onChange={(e) => raciForm.setData('accountable', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">C - Người Tham Vấn (phân cách bằng dấu phẩy)</label>
                                    <input
                                        type="text"
                                        placeholder="DBA Lead, SecOps"
                                        value={raciForm.data.consulted}
                                        onChange={(e) => raciForm.setData('consulted', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">I - Người Nhận Tin (phân cách bằng dấu phẩy)</label>
                                    <input
                                        type="text"
                                        placeholder="PM, QA Team"
                                        value={raciForm.data.informed}
                                        onChange={(e) => raciForm.setData('informed', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddRaciModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={raciForm.processing}
                                    className="fluent-button-primary px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
                                >
                                    Lưu Phân Bổ RACI
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add RTM Trace */}
            {isAddRtmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                                <GitBranch className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Thêm Mắt Xích Truy Xuất RTM</h3>
                                <p className="text-xs text-slate-500">Liên kết Requirement với Git PR và Test Case</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddRtm} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Yêu Cầu (BRD) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="REQ-PAY-01"
                                        value={rtmForm.data.req_code}
                                        onChange={(e) => rtmForm.setData('req_code', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">User Story (SRS) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="STORY-205"
                                        value={rtmForm.data.user_story_code}
                                        onChange={(e) => rtmForm.setData('user_story_code', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu Đề Yêu Cầu *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Tích hợp cổng thanh toán Napas 2.0"
                                    value={rtmForm.data.req_title}
                                    onChange={(e) => rtmForm.setData('req_title', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Git Commit / PR</label>
                                    <input
                                        type="text"
                                        placeholder="PR #99 (feat/napas)"
                                        value={rtmForm.data.commit_or_pr}
                                        onChange={(e) => rtmForm.setData('commit_or_pr', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Test Case</label>
                                    <input
                                        type="text"
                                        placeholder="TC-PAY-08"
                                        value={rtmForm.data.test_case_code}
                                        onChange={(e) => rtmForm.setData('test_case_code', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddRtmModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={rtmForm.processing}
                                    className="fluent-button-primary px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
                                >
                                    Ghi Nhận Mắt Xích
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Export SDLC Dossier Summary */}
            {isDossierModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-8 max-w-3xl w-full rounded-2xl shadow-2xl relative border border-white max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                                    <BadgeCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900">
                                        HỒ SƠ NGHIỆM THU KỸ THUẬT SDLC (SDLC DOSSIER)
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono">Dự án: {project.name} [{project.code}]</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDossierModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="py-6 space-y-6 text-xs text-slate-700">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Khách hàng</span>
                                    <span className="font-bold text-slate-900">{project.client_name}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Ngân sách</span>
                                    <span className="font-bold text-slate-900">${Number(project.budget).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pha hiện tại</span>
                                    <span className="font-bold text-blue-600">Pha {project.current_phase_number}/7</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Lead Architect</span>
                                    <span className="font-bold text-slate-900">Võ Hoàng Tú</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-2">Bảng Phê Duyệt Cổng Chất Lượng (Quality Gate Approvals):</h4>
                                <div className="space-y-2 font-mono">
                                    {project.quality_gates.map(gate => (
                                        <div key={gate.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-[11px]">
                                            <div>
                                                <span className="font-bold font-sans text-slate-900">Gate {gate.gate_number}: {gate.name}</span>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    {gate.sign_off_token ? `Token: ${gate.sign_off_token}` : 'Chưa ký duyệt'}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded font-sans font-bold text-[10px] ${
                                                gate.status === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {gate.status.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-2">Danh Mục Tài Liệu Kỹ Thuật Chuẩn Đã Bàn Giao:</h4>
                                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                    {project.documents.map(doc => (
                                        <li key={doc.id}>
                                            <strong>[{doc.doc_type}]</strong> {doc.title} - Phiên bản {doc.version} ({doc.status === 'approved' ? '✓ Đã Ký Số' : 'Đang Thẩm Định'})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-mono">
                                Xác thực số bởi MCMS Engine 2026 • SHA-256 Verified
                            </span>
                            <button
                                onClick={() => window.print()}
                                className="fluent-button-primary px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                            >
                                <Printer className="w-4 h-4" />
                                In / Lưu PDF Hồ Sơ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Package Release */}
            {isPackageReleaseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Đóng Gói Bản Phát Hành (Package Release)</h3>
                                <p className="text-xs text-slate-500">Tự động gắn tag phiên bản RTM, sinh Release Notes và ký số kiểm toán</p>
                            </div>
                        </div>

                        <form onSubmit={handlePackageRelease} className="space-y-4">
                            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900">
                                <p className="font-bold">Đóng gói chuyển giao chính thức cho {project.client_name}</p>
                                <p className="text-[11px] text-purple-700 mt-1">
                                    Hệ thống sẽ cập nhật trạng thái các yêu cầu RTM sang <strong>RELEASED</strong> và tự động biên soạn tài liệu Release Notes ở Pha 6.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phiên Bản Release (Tag) *</label>
                                    <input
                                        type="text"
                                        required
                                        value={releaseForm.data.release_version}
                                        onChange={(e) => releaseForm.setData('release_version', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Người Ký Phát Hành *</label>
                                    <input
                                        type="text"
                                        required
                                        value={releaseForm.data.release_manager}
                                        onChange={(e) => releaseForm.setData('release_manager', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Chức Danh Quản Lý</label>
                                <input
                                    type="text"
                                    value={releaseForm.data.manager_role}
                                    onChange={(e) => releaseForm.setData('manager_role', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Tóm Tắt Bản Phát Hành (Release Summary) *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={releaseForm.data.release_notes_summary}
                                    onChange={(e) => releaseForm.setData('release_notes_summary', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                ></textarea>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsPackageReleaseModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={releaseForm.processing}
                                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    <Package className="w-3.5 h-3.5" />
                                    {releaseForm.processing ? 'Đang Đóng Gói...' : 'Xác Nhận Đóng Gói Release'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Simulate Git Webhook */}
            {isGitWebhookModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                                <GitPullRequest className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Mô Phỏng Nhận Git Webhook</h3>
                                <p className="text-xs text-slate-500">Tự động nhận diện mẫu REQ-* và STORY-* để liên kết vào RTM</p>
                            </div>
                        </div>

                        <form onSubmit={handleGitWebhook} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Sự Kiện Git *</label>
                                    <select
                                        value={gitForm.data.event_type}
                                        onChange={(e) => gitForm.setData('event_type', e.target.value as any)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        <option value="push">Commit Push (Branch)</option>
                                        <option value="pull_request">Pull Request Merge</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tác Giả Git *</label>
                                    <input
                                        type="text"
                                        required
                                        value={gitForm.data.author}
                                        onChange={(e) => gitForm.setData('author', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Thông Điệp Commit / PR (Bắt buộc chứa mã REQ-*) *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="vd: feat(REQ-PAY-01): Tích hợp cổng Napas 2.0 và băm HMAC-SHA256 [STORY-AUTH-02]"
                                    value={gitForm.data.message}
                                    onChange={(e) => gitForm.setData('message', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Commit SHA</label>
                                    <input
                                        type="text"
                                        value={gitForm.data.commit_sha}
                                        onChange={(e) => gitForm.setData('commit_sha', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số PR (Nếu có)</label>
                                    <input
                                        type="text"
                                        value={gitForm.data.pr_number}
                                        onChange={(e) => gitForm.setData('pr_number', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsGitWebhookModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={gitForm.processing}
                                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    {gitForm.processing ? 'Đang Bắn Webhook...' : 'Kích Hoạt Webhook'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Log New Defect */}
            {isAddDefectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                                <Bug className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Báo Cáo Khiếm Khuyết Mới (Defect)</h3>
                                <p className="text-xs text-slate-500">Ghi nhận lỗi kỹ thuật & liên kết mắt xích RTM</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogDefect} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Defect *</label>
                                    <input
                                        type="text"
                                        required
                                        value={defectForm.data.defect_code}
                                        onChange={(e) => defectForm.setData('defect_code', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mức Độ Nghiêm Trọng *</label>
                                    <select
                                        value={defectForm.data.severity}
                                        onChange={(e) => defectForm.setData('severity', e.target.value as any)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        <option value="blocker">BLOCKER (Khóa Gate 5)</option>
                                        <option value="critical">CRITICAL (Khóa Gate 5)</option>
                                        <option value="major">MAJOR (Nghiêm trọng)</option>
                                        <option value="minor">MINOR (Nhỏ / Thứ yếu)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu Đề Defect *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="vd: Lỗi tính toán sai số dư tài khoản khi rollback giao dịch"
                                    value={defectForm.data.title}
                                    onChange={(e) => defectForm.setData('title', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Liên Kết Mắt Xích RTM</label>
                                    <select
                                        value={defectForm.data.rtm_trace_id}
                                        onChange={(e) => defectForm.setData('rtm_trace_id', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        <option value="">-- Không liên kết RTM --</option>
                                        {project.rtm_traces.map(trace => (
                                            <option key={trace.id} value={trace.id}>
                                                [{trace.req_code}] {trace.req_title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Người Phụ Trách</label>
                                    <input
                                        type="text"
                                        value={defectForm.data.assigned_to}
                                        onChange={(e) => defectForm.setData('assigned_to', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Các Bước Tái Hiện Lỗi (Steps to Reproduce)</label>
                                <textarea
                                    rows={3}
                                    placeholder="1. Gọi API POST /api/v1/payments/process&#10;2. Giả lập timeout kết nối với ngân hàng đối tác&#10;3. Kiểm tra số dư thấy bị trừ trùng..."
                                    value={defectForm.data.steps_to_reproduce}
                                    onChange={(e) => defectForm.setData('steps_to_reproduce', e.target.value)}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                ></textarea>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddDefectModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={defectForm.processing}
                                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    <Bug className="w-3.5 h-3.5" />
                                    {defectForm.processing ? 'Đang Ghi Nhận...' : 'Lưu Defect Kỹ Thuật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Resolve Defect */}
            {isResolveDefectModalOpen && selectedDefectToResolve && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Khắc Phục & Nghiệm Thu Defect</h3>
                                <p className="text-xs text-slate-500">Xác nhận sửa lỗi và cập nhật điều kiện Gate 5</p>
                            </div>
                        </div>

                        <form onSubmit={handleResolveDefect} className="space-y-4">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                                <div className="font-bold text-slate-900 font-mono">[{selectedDefectToResolve.defect_code}] {selectedDefectToResolve.title}</div>
                                <div className="text-[11px] text-slate-500">
                                    Mức độ: <strong className="uppercase text-rose-600">{selectedDefectToResolve.severity}</strong> • Người báo cáo: {selectedDefectToResolve.logged_by}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng Thái Mới *</label>
                                <select
                                    value={resolveForm.data.status}
                                    onChange={(e) => resolveForm.setData('status', e.target.value as any)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                >
                                    <option value="resolved">RESOLVED (Đã sửa lỗi - Chờ QA verify)</option>
                                    <option value="closed">CLOSED (Đã đóng - Hoàn tất kiểm thử)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Ghi Chú Giải Pháp Kỹ Thuật (Resolution Notes) *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="vd: Đã bổ sung mutex lock trong transaction và unit test kiểm tra concurrency..."
                                    value={resolveForm.data.resolution_notes}
                                    onChange={(e) => resolveForm.setData('resolution_notes', e.target.value)}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                ></textarea>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsResolveDefectModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={resolveForm.processing}
                                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    {resolveForm.processing ? 'Đang Cập Nhật...' : 'Xác Nhận Khắc Phục'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: CI/CD Pipeline Simulator */}
            {isCiMetricsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Mô Phỏng Nạp Dữ Liệu CI/CD Runner</h3>
                                <p className="text-xs text-slate-500">Giả lập kết quả từ GitHub Actions / GitLab CI để kiểm soát Gate 4</p>
                            </div>
                        </div>

                        <form onSubmit={handleIngestCiMetrics} className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Build *</label>
                                    <input
                                        type="text"
                                        required
                                        value={ciForm.data.build_number}
                                        onChange={(e) => ciForm.setData('build_number', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Branch *</label>
                                    <input
                                        type="text"
                                        required
                                        value={ciForm.data.branch}
                                        onChange={(e) => ciForm.setData('branch', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Commit SHA</label>
                                    <input
                                        type="text"
                                        value={ciForm.data.commit_sha}
                                        onChange={(e) => ciForm.setData('commit_sha', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-700">Độ Bao Phủ Unit Test (Coverage %):</span>
                                    <span className={`font-mono font-extrabold ${Number(ciForm.data.coverage_percentage) >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {ciForm.data.coverage_percentage}% {Number(ciForm.data.coverage_percentage) >= 80 ? '✓ Đạt Gate 4' : '✗ Chặn Gate 4'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="40"
                                    max="100"
                                    step="0.5"
                                    value={ciForm.data.coverage_percentage}
                                    onChange={(e) => ciForm.setData('coverage_percentage', Number(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Quét Bảo Mật SAST *</label>
                                    <select
                                        value={ciForm.data.sast_status}
                                        onChange={(e) => ciForm.setData('sast_status', e.target.value as any)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        <option value="passed">PASSED (Không có lỗ hổng)</option>
                                        <option value="failed">FAILED (Có lỗ hổng - Khóa Gate 4)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng Thái Pipeline *</label>
                                    <select
                                        value={ciForm.data.pipeline_status}
                                        onChange={(e) => ciForm.setData('pipeline_status', e.target.value as any)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        <option value="success">SUCCESS</option>
                                        <option value="failed">FAILED</option>
                                        <option value="running">RUNNING</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số Test Thành Công</label>
                                    <input
                                        type="number"
                                        value={ciForm.data.unit_test_passed}
                                        onChange={(e) => ciForm.setData('unit_test_passed', Number(e.target.value))}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số Lỗ Hổng Bảo Mật</label>
                                    <input
                                        type="number"
                                        value={ciForm.data.vulnerabilities_count}
                                        onChange={(e) => ciForm.setData('vulnerabilities_count', Number(e.target.value))}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCiMetricsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={ciForm.processing}
                                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    {ciForm.processing ? 'Đang Nạp...' : 'Ghi Nhận Chỉ Số CI/CD'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Log Production Incident */}
            {isAddIncidentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700">
                                <ServerCrash className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Ghi Nhận Sự Cố Vận Hành (Pha 7)</h3>
                                <p className="text-xs text-slate-500">Đo lường thời gian gián đoạn (Downtime) & cam kết SLA</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogIncident} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Sự Cố *</label>
                                    <input
                                        type="text"
                                        required
                                        value={incidentForm.data.incident_code}
                                        onChange={(e) => incidentForm.setData('incident_code', e.target.value)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mức Độ Sự Cố *</label>
                                    <select
                                        value={incidentForm.data.severity}
                                        onChange={(e) => incidentForm.setData('severity', e.target.value as any)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        <option value="P1_CRITICAL">P1 - Ngừng Dịch Vụ Toàn Bộ (Critical)</option>
                                        <option value="P2_MAJOR">P2 - Suy Giảm Hiệu Năng Nghiêm Trọng (Major)</option>
                                        <option value="P3_MINOR">P3 - Lỗi Chức Năng Cục Bộ (Minor)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu Đề Sự Cố *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="vd: Sập kết nối cơ sở dữ liệu đọc trong giờ cao điểm"
                                    value={incidentForm.data.title}
                                    onChange={(e) => incidentForm.setData('title', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Thời Gian Gián Đoạn (Phút) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={incidentForm.data.downtime_minutes}
                                        onChange={(e) => incidentForm.setData('downtime_minutes', Number(e.target.value))}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng Thái Xử Lý *</label>
                                    <select
                                        value={incidentForm.data.status}
                                        onChange={(e) => incidentForm.setData('status', e.target.value as any)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                        <option value="resolved">RESOLVED (Đã phục hồi)</option>
                                        <option value="mitigated">MITIGATED (Đã cô lập)</option>
                                        <option value="investigating">INVESTIGATING (Đang điều tra)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nguyên Nhân Gốc Rễ (Root Cause)</label>
                                <textarea
                                    rows={2}
                                    placeholder="vd: Cạn kiệt bộ nhớ RAM trên máy chủ Redis do cấu hình thiếu maxmemory-policy..."
                                    value={incidentForm.data.root_cause}
                                    onChange={(e) => incidentForm.setData('root_cause', e.target.value)}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Hành Động Khắc Phục (Corrective Actions)</label>
                                <textarea
                                    rows={2}
                                    placeholder="vd: Nâng cấp tài nguyên RAM, cấu hình allkeys-lru và thêm cảnh báo Grafana ngưỡng 80%..."
                                    value={incidentForm.data.corrective_actions}
                                    onChange={(e) => incidentForm.setData('corrective_actions', e.target.value)}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                ></textarea>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddIncidentModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={incidentForm.processing}
                                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-cyan-700 text-white hover:bg-cyan-800 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    <ServerCrash className="w-3.5 h-3.5" />
                                    {incidentForm.processing ? 'Đang Lưu...' : 'Ghi Nhận Sự Cố'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: AI Compliance Scorecard */}
            <ComplianceScorecardModal
                isOpen={isComplianceModalOpen}
                onClose={() => setIsComplianceModalOpen(false)}
                projectId={project.id}
                auditData={complianceAudit}
            />

            {/* Modal: Webhook Settings */}
            <WebhookSettingsModal
                isOpen={isWebhookModalOpen}
                onClose={() => setIsWebhookModalOpen(false)}
                projectId={project.id}
                webhooks={project.webhooks || []}
            />
        </SaaSLayout>
    );
}
