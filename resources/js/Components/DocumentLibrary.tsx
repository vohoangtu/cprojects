import React, { useState, useMemo } from 'react';
import {
    FileText,
    Terminal,
    CheckSquare,
    Layers,
    Database,
    Globe,
    ShieldAlert,
    AlertTriangle,
    Cpu,
    CheckCheck,
    BadgeCheck,
    Clock,
    ShieldCheck,
    Package,
    Activity,
    Award,
    Search,
    Filter,
    Edit3,
    Eye,
    ListOrdered,
    LayoutGrid,
    CheckCircle2,
    KeyRound,
    Sparkles,
    Printer,
    ArrowRight,
    Lock,
    GitBranch,
    ChevronDown,
    ChevronUp,
    Download,
    Plus,
    FilePlus,
    ChevronsUpDown
} from 'lucide-react';

export interface ProjectDoc {
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

export interface Gate {
    id: number;
    phase_id: number;
    gate_number: number;
    name: string;
    status: 'pending' | 'in_review' | 'passed' | 'rejected';
    required_role: string;
    sign_off_token?: string;
    sign_off_by?: string;
    sign_off_role?: string;
    signed_at?: string;
}

export interface Phase {
    id: number;
    phase_number: number;
    name: string;
    status: 'pending' | 'active' | 'in_review' | 'completed';
    completion_rate: number;
}

interface DocumentLibraryProps {
    projectId: number;
    documents: ProjectDoc[];
    phases: Phase[];
    qualityGates: Gate[];
    currentPhaseNumber: number;
    selectedPhaseFilter?: number | 'all';
    onSelectPhaseFilter?: (phase: number | 'all') => void;
    onViewDoc: (doc: ProjectDoc) => void;
    onEditDoc: (doc: ProjectDoc) => void;
    onSignDoc: (docId: number) => void;
    onOpenAiModal?: () => void;
    onOpenDossierModal?: () => void;
    onOpenCreateDocModal?: (phaseNum?: number) => void;
    onBatchAiGenerate?: (phaseNum?: number) => void;
    onBatchSignPhase?: (phaseNum: number) => void;
    isGeneratingAi?: boolean;
    isBatchSigning?: boolean;
}

export function downloadDocumentMarkdown(doc: ProjectDoc) {
    const safeTitle = (doc.title || 'Tai_Lieu').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const filename = `${doc.doc_type}_Pha${doc.phase_number}_${doc.version.replace('.', '_')}_${safeTitle}.md`;
    const header = [
        `# ${doc.title}`,
        '',
        `- **Mã hồ sơ (Doc Type):** \`${doc.doc_type}\``,
        `- **Pha SDLC:** Pha ${doc.phase_number}`,
        `- **Phiên bản (Version):** ${doc.version}`,
        `- **Trạng thái:** ${doc.status.toUpperCase()}`,
        `- **Người ký duyệt:** ${doc.signed_off_by || 'Chưa ký số'}`,
        `- **Thời gian ký:** ${doc.signed_off_at || 'Chưa ký'}`,
        `- **Chữ ký số (HMAC-SHA256):** \`${doc.signature_hash || 'CHƯA_CHỨNG_THỰC'}\``,
        '',
        '---',
        '',
        '## NỘI DUNG TÀI LIỆU',
        '',
    ].join('\n');

    const fullContent = header + (doc.content || 'Chưa có nội dung chi tiết.');
    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

interface DocMetadata {
    globalOrder: number;
    phaseOrder: number;
    totalInPhase: number;
    label: string;
    stage: string;
    predecessor?: string;
    successor?: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}

const SDLC_PHASE_INFO: Record<number, {
    code: string;
    title: string;
    sub: string;
    purpose: string;
    accentColor: string;
    badgeBg: string;
    borderColor: string;
}> = {
    1: {
        code: 'PHA 01',
        title: 'Yêu cầu & Khởi tạo',
        sub: 'Initiation & Requirements',
        purpose: 'Khảo sát nhu cầu nghiệp vụ, phân rã User Stories, cam kết phạm vi và phê duyệt BRD/SRS.',
        accentColor: 'from-blue-600 to-indigo-600',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        borderColor: 'border-blue-500',
    },
    2: {
        code: 'PHA 02',
        title: 'Kiến trúc Hệ thống & Thiết kế',
        sub: 'Architecture & UI/UX',
        purpose: 'Thiết kế kiến trúc C4 Model, chuẩn hóa Database ERD, OpenAPI specs và mô hình bảo mật STRIDE.',
        accentColor: 'from-indigo-600 to-purple-600',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        borderColor: 'border-indigo-500',
    },
    3: {
        code: 'PHA 03',
        title: 'Lập kế hoạch & Phân bổ Nguồn lực',
        sub: 'Planning & Estimation',
        purpose: 'Phân rã WBS nhiệm vụ dưới 40 giờ, thiết lập ma trận trách nhiệm RACI và sổ quản trị rủi ro.',
        accentColor: 'from-emerald-600 to-teal-600',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        borderColor: 'border-emerald-500',
    },
    4: {
        code: 'PHA 04',
        title: 'Lập trình & Review Mã nguồn',
        sub: 'Development & Unit Test',
        purpose: 'Thực thi Agile Sprint, code review 2 cấp, kiểm soát Unit Test Coverage >= 80% và quét SAST.',
        accentColor: 'from-amber-600 to-orange-600',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        borderColor: 'border-amber-500',
    },
    5: {
        code: 'PHA 05',
        title: 'QA/QC & Kiểm thử Chấp nhận',
        sub: 'Testing & UAT Sign-off',
        purpose: 'Thực thi kịch bản Test Run, giải quyết lỗi Blocker/Critical và ký biên bản nghiệm thu UAT.',
        accentColor: 'from-rose-600 to-pink-600',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        borderColor: 'border-rose-500',
    },
    6: {
        code: 'PHA 06',
        title: 'Triển khai & Phát hành Sản xuất',
        sub: 'Deployment & Release',
        purpose: 'Thẩm định hội đồng CAB 3 vai trò, kịch bản Runbook từng phút và điều hướng Canary Traffic.',
        accentColor: 'from-purple-600 to-fuchsia-600',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
        borderColor: 'border-purple-500',
    },
    7: {
        code: 'PHA 07',
        title: 'Vận hành, Giám sát & Hậu kiểm',
        sub: 'Handover & Retrospective',
        purpose: 'Giám sát cam kết SLA Uptime 99.95%, xử lý sự cố khẩn cấp và báo cáo rút kinh nghiệm Post-Mortem.',
        accentColor: 'from-cyan-600 to-blue-600',
        badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        borderColor: 'border-cyan-500',
    },
};

const SDLC_DOC_REGISTRY: Record<string, DocMetadata> = {
    // Pha 1
    'CHARTER': {
        globalOrder: 1,
        phaseOrder: 1,
        totalInPhase: 4,
        label: 'Hiến chương Dự án',
        stage: 'Khởi tạo',
        successor: 'BRD',
        icon: FileText,
        description: 'Xác lập tư cách pháp nhân dự án, mục tiêu kinh doanh, ngân sách và cam kết giữa các bên.',
    },
    'BRD': {
        globalOrder: 2,
        phaseOrder: 2,
        totalInPhase: 4,
        label: 'Yêu cầu Nghiệp vụ',
        stage: 'Nghiệp vụ',
        predecessor: 'CHARTER',
        successor: 'SRS',
        icon: FileText,
        description: 'Đặc tả chi tiết các bài toán kinh doanh, quy trình nghiệp vụ cần giải quyết và tiêu chí thành công.',
    },
    'SRS': {
        globalOrder: 3,
        phaseOrder: 3,
        totalInPhase: 4,
        label: 'Đặc tả Phần mềm (IEEE 830)',
        stage: 'Kỹ thuật',
        predecessor: 'BRD',
        successor: 'SAD',
        icon: Terminal,
        description: 'Quy chuẩn kỹ thuật hệ thống, yêu cầu chức năng, phi chức năng và ràng buộc công nghệ.',
    },
    'STORIES': {
        globalOrder: 4,
        phaseOrder: 4,
        totalInPhase: 4,
        label: 'User Stories & Gherkin',
        stage: 'Người dùng',
        predecessor: 'SRS',
        successor: 'Cổng Gate 1',
        icon: CheckSquare,
        description: 'Kịch bản nghiệm thu người dùng theo cấu trúc Given-When-Then, phục vụ tự động hóa BDD.',
    },

    // Pha 2
    'SAD': {
        globalOrder: 5,
        phaseOrder: 1,
        totalInPhase: 4,
        label: 'Thiết kế Kiến trúc (C4 Model)',
        stage: 'Kiến trúc',
        predecessor: 'SRS',
        successor: 'ERD & OpenAPI',
        icon: Layers,
        description: 'Mô hình phân tầng Context, Container, Component, sơ đồ luồng dữ liệu microservices và hạ tầng.',
    },
    'ERD': {
        globalOrder: 6,
        phaseOrder: 2,
        totalInPhase: 4,
        label: 'Sơ đồ Thực thể Dữ liệu (ERD)',
        stage: 'Cơ sở Dữ liệu',
        predecessor: 'SAD',
        successor: 'OPENAPI',
        icon: Database,
        description: 'Đặc tả cấu trúc bảng, khóa ngoại, quan hệ thực thể, phân vùng partitioning và indexing tối ưu.',
    },
    'OPENAPI': {
        globalOrder: 7,
        phaseOrder: 3,
        totalInPhase: 4,
        label: 'Đặc tả RESTful API (OpenAPI 3.1)',
        stage: 'Giao diện API',
        predecessor: 'ERD',
        successor: 'STRIDE',
        icon: Globe,
        description: 'Tập hợp toàn bộ endpoint, payload schema, mã lỗi và authentication headers theo chuẩn OpenAPI.',
    },
    'STRIDE': {
        globalOrder: 8,
        phaseOrder: 4,
        totalInPhase: 4,
        label: 'Mô hình An ninh (STRIDE)',
        stage: 'Bảo mật',
        predecessor: 'OPENAPI',
        successor: 'Cổng Gate 2',
        icon: ShieldAlert,
        description: 'Phân tích các vectơ tấn công Spoofing, Tampering, Repudiation và giải pháp phòng thủ chuyên sâu.',
    },

    // Pha 3
    'WBS': {
        globalOrder: 9,
        phaseOrder: 1,
        totalInPhase: 2,
        label: 'Phân rã Công việc (WBS)',
        stage: 'Lập lịch',
        predecessor: 'SAD',
        successor: 'Sprint Backlog',
        icon: GitBranch,
        description: 'Cấu trúc phân rã công việc chi tiết thành các gói công việc cụ thể dưới 40 giờ lao động.',
    },
    'RISK': {
        globalOrder: 10,
        phaseOrder: 2,
        totalInPhase: 2,
        label: 'Sổ Đăng ký Rủi ro (Risk Register)',
        stage: 'Dự phòng',
        predecessor: 'WBS',
        successor: 'Cổng Gate 3',
        icon: AlertTriangle,
        description: 'Nhận diện rủi ro kỹ thuật, rủi ro tiến độ, ma trận tác động x xác suất và kế hoạch ứng phó.',
    },

    // Pha 4
    'CODE_GUIDELINES': {
        globalOrder: 11,
        phaseOrder: 1,
        totalInPhase: 1,
        label: 'Quy chuẩn Lập trình & Review PR',
        stage: 'Chất lượng Mã',
        predecessor: 'WBS',
        successor: 'CI/CD Pipeline',
        icon: Cpu,
        description: 'Bộ tiêu chuẩn coding convention, mô hình Repository - Actions, checklist review 2 cấp và SAST.',
    },

    // Pha 5
    'STP': {
        globalOrder: 12,
        phaseOrder: 1,
        totalInPhase: 2,
        label: 'Kế hoạch Kiểm thử Tổng thể (STP)',
        stage: 'Chiến lược QA',
        predecessor: 'CODE_GUIDELINES',
        successor: 'Test Runs',
        icon: CheckCheck,
        description: 'Kế hoạch kiểm thử chức năng, tích hợp, hiệu năng tải cao, bảo mật DAST và tiêu chuẩn nghiệm thu.',
    },
    'UAT_RECORD': {
        globalOrder: 13,
        phaseOrder: 2,
        totalInPhase: 2,
        label: 'Biên bản Nghiệm thu UAT',
        stage: 'Nghiệm thu',
        predecessor: 'STP',
        successor: 'Cổng Gate 5',
        icon: BadgeCheck,
        description: 'Xác nhận của đại diện khách hàng và QA Lead về việc hệ thống thỏa mãn 100% tiêu chí nghiệm thu.',
    },

    // Pha 6
    'RUNBOOK': {
        globalOrder: 14,
        phaseOrder: 1,
        totalInPhase: 3,
        label: 'Kịch bản Triển khai Từng Phút',
        stage: 'Go-Live',
        predecessor: 'UAT_RECORD',
        successor: 'Canary Rollout',
        icon: Clock,
        description: 'Lộ trình thao tác chi tiết theo mốc thời gian T-30m, T-0, T+15m đảm bảo không gián đoạn dịch vụ.',
    },
    'ROLLBACK_DR': {
        globalOrder: 15,
        phaseOrder: 2,
        totalInPhase: 3,
        label: 'Phương án Phục hồi Thảm họa (DR)',
        stage: 'Phục hồi',
        predecessor: 'RUNBOOK',
        successor: 'CAB Signoff',
        icon: ShieldCheck,
        description: 'Kịch bản đảo ngược khẩn cấp, thời gian khôi phục tối đa RTO <= 5m và không mất dữ liệu RPO = 0.',
    },
    'RELEASE_NOTES': {
        globalOrder: 16,
        phaseOrder: 3,
        totalInPhase: 3,
        label: 'Ghi chú Phát hành (Release Notes)',
        stage: 'Changelog',
        predecessor: 'RUNBOOK',
        successor: 'Cổng Gate 6 CAB',
        icon: Package,
        description: 'Bản mô tả chi tiết tính năng mới, bản vá bảo mật, hướng dẫn nâng cấp dành cho người dùng.',
    },

    // Pha 7
    'SLA_MATRIX': {
        globalOrder: 17,
        phaseOrder: 1,
        totalInPhase: 2,
        label: 'Ma trận Cam kết Dịch vụ (SLA)',
        stage: 'Vận hành',
        predecessor: 'Release Notes',
        successor: 'Monitoring Alert',
        icon: Activity,
        description: 'Chỉ tiêu cam kết thời gian hoạt động Uptime 99.95%, thời gian phản hồi sự cố và cấp hỗ trợ P1/P2/P3.',
    },
    'RETROSPECTIVE': {
        globalOrder: 18,
        phaseOrder: 2,
        totalInPhase: 2,
        label: 'Đánh giá Hậu kiểm & Kinh nghiệm',
        stage: 'Hậu kiểm',
        predecessor: 'SLA Matrix',
        successor: 'Chu kỳ SDLC tiếp theo',
        icon: Award,
        description: 'Tổng kết những điểm làm tốt, tồn tại cần khắc phục và bài học kinh nghiệm cho các chu kỳ tiếp theo.',
    },
    'POST_MORTEM': {
        globalOrder: 18,
        phaseOrder: 2,
        totalInPhase: 2,
        label: 'Báo cáo Sự cố & Hậu kiểm',
        stage: 'Hậu kiểm',
        predecessor: 'SLA Matrix',
        successor: 'Chu kỳ SDLC tiếp theo',
        icon: Award,
        description: 'Phân tích nguyên nhân gốc rễ (RCA) các sự cố vận hành và giải pháp phòng ngừa tái diễn.',
    },
};

export function DocumentLibrary({
    projectId,
    documents,
    phases,
    qualityGates,
    currentPhaseNumber,
    selectedPhaseFilter: propPhaseFilter,
    onSelectPhaseFilter,
    onViewDoc,
    onEditDoc,
    onSignDoc,
    onOpenAiModal,
    onOpenDossierModal,
    onOpenCreateDocModal,
    onBatchAiGenerate,
    onBatchSignPhase,
    isGeneratingAi = false,
    isBatchSigning = false,
}: DocumentLibraryProps) {
    const [internalPhaseFilter, setInternalPhaseFilter] = useState<number | 'all'>('all');
    const selectedPhaseFilter = propPhaseFilter !== undefined ? propPhaseFilter : internalPhaseFilter;

    const handleSelectPhaseFilter = (phase: number | 'all') => {
        if (onSelectPhaseFilter) {
            onSelectPhaseFilter(phase);
        }
        setInternalPhaseFilter(phase);
    };

    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'review'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
    const [collapsedPhases, setCollapsedPhases] = useState<Record<number, boolean>>({});

    const areAllCollapsed = useMemo(() => {
        return [1, 2, 3, 4, 5, 6, 7].every(p => Boolean(collapsedPhases[p]));
    }, [collapsedPhases]);

    const toggleAllPhases = () => {
        if (areAllCollapsed) {
            setCollapsedPhases({});
        } else {
            const next: Record<number, boolean> = {};
            [1, 2, 3, 4, 5, 6, 7].forEach(p => {
                next[p] = true;
            });
            setCollapsedPhases(next);
        }
    };

    const togglePhaseCollapse = (phaseNum: number) => {
        setCollapsedPhases(prev => ({
            ...prev,
            [phaseNum]: !prev[phaseNum]
        }));
    };

    // 1. Sort all documents strictly by phase_number and SDLC sequence order
    const sortedDocuments = useMemo(() => {
        return [...documents].sort((a, b) => {
            if (a.phase_number !== b.phase_number) {
                return a.phase_number - b.phase_number;
            }
            const orderA = SDLC_DOC_REGISTRY[a.doc_type]?.globalOrder ?? 99;
            const orderB = SDLC_DOC_REGISTRY[b.doc_type]?.globalOrder ?? 99;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return a.id - b.id;
        });
    }, [documents]);

    // 2. Filtered documents based on active filter controls
    const filteredDocuments = useMemo(() => {
        return sortedDocuments.filter(doc => {
            const matchesPhase = selectedPhaseFilter === 'all' || doc.phase_number === selectedPhaseFilter;
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'approved' && doc.status === 'approved') ||
                (statusFilter === 'review' && doc.status !== 'approved');
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = query === '' ||
                doc.title.toLowerCase().includes(query) ||
                doc.doc_type.toLowerCase().includes(query) ||
                (SDLC_DOC_REGISTRY[doc.doc_type]?.label.toLowerCase().includes(query) || false);
            return matchesPhase && matchesStatus && matchesSearch;
        });
    }, [sortedDocuments, selectedPhaseFilter, statusFilter, searchQuery]);

    // 3. Group by Phase
    const phasesGroupData = useMemo(() => {
        const activePhases = selectedPhaseFilter === 'all'
            ? [1, 2, 3, 4, 5, 6, 7]
            : [selectedPhaseFilter];

        return activePhases.map(phaseNum => {
            const info = SDLC_PHASE_INFO[phaseNum];
            const phaseObj = phases.find(p => p.phase_number === phaseNum);
            const gateObj = qualityGates.find(g => g.gate_number === phaseNum);
            const phaseDocs = filteredDocuments.filter(d => d.phase_number === phaseNum);
            const allPhaseDocs = documents.filter(d => d.phase_number === phaseNum);
            const approvedCount = allPhaseDocs.filter(d => d.status === 'approved').length;

            return {
                phaseNum,
                info,
                phaseObj,
                gateObj,
                docs: phaseDocs,
                totalCount: allPhaseDocs.length,
                approvedCount,
                percentApproved: allPhaseDocs.length > 0 ? Math.round((approvedCount / allPhaseDocs.length) * 100) : 0,
            };
        });
    }, [selectedPhaseFilter, filteredDocuments, documents, phases, qualityGates]);

    // High level metrics
    const totalDocs = documents.length;
    const approvedDocs = documents.filter(d => d.status === 'approved').length;
    const underReviewDocs = totalDocs - approvedDocs;

    return (
        <section aria-label="Kho hồ sơ và tài liệu kỹ thuật SDLC" className="space-y-4">
            {/* 1. TOP HEADER & METRIC SUMMARY */}
            <div className="fluent-compact-card p-4 border border-white/80 shadow-xs bg-white/70">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                                <FileText className="w-4 h-4" />
                            </span>
                            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                                Kho Hồ Sơ & Tài Liệu Kỹ Thuật (SDLC Deliverables)
                            </h2>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                7 Pha SDLC Chuẩn Hóa
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                            Các văn bản kỹ thuật được phân tầng tuần tự theo từng pha vòng đời phần mềm từ input yêu cầu đến release, có ký số bất biến HMAC-SHA256 chống chối bỏ trách nhiệm.
                        </p>
                    </div>

                    {/* Quick Metric Pills & Action Toolbar */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/80 border border-slate-200/70 text-xs font-semibold text-slate-700">
                            <span>Tổng:</span>
                            <strong className="text-blue-700 font-bold">{totalDocs}</strong>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200/70 text-xs font-semibold text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã Ký Số:</span>
                            <strong className="font-bold">{approvedDocs}/{totalDocs}</strong>
                            <span className="text-[10px] text-emerald-600">({Math.round((approvedDocs / (totalDocs || 1)) * 100)}%)</span>
                        </div>
                        {underReviewDocs > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200/70 text-xs font-semibold text-amber-800">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Chờ Duyệt:</span>
                                <strong className="font-bold">{underReviewDocs}</strong>
                            </div>
                        )}

                        {onBatchAiGenerate && (
                            <button
                                type="button"
                                onClick={() => onBatchAiGenerate()}
                                disabled={isGeneratingAi}
                                className="px-3 py-1 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-xs font-bold hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="AI tự động tổng hợp trọn bộ 18+ hồ sơ kỹ thuật cho toàn bộ 7 pha SDLC"
                            >
                                <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                                <span>{isGeneratingAi ? 'Đang Tổng Hợp...' : '⚡ AI Sinh Trọn Bộ 7 Pha'}</span>
                            </button>
                        )}

                        {onOpenAiModal && (
                            <button
                                type="button"
                                onClick={onOpenAiModal}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                title="AI Hỗ Trợ Soạn Thảo Tài Liệu SDLC"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI Specs</span>
                            </button>
                        )}

                        {onOpenDossierModal && (
                            <button
                                type="button"
                                onClick={onOpenDossierModal}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Xem và in hồ sơ nghiệm thu hoàn chỉnh"
                            >
                                <Printer className="w-3.5 h-3.5 text-blue-600" />
                                <span>Hồ Sơ PDF</span>
                            </button>
                        )}

                        {onOpenCreateDocModal && (
                            <button
                                type="button"
                                onClick={() => onOpenCreateDocModal()}
                                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Thêm mới tài liệu kỹ thuật vào dự án"
                            >
                                <FilePlus className="w-3.5 h-3.5" />
                                <span>Tạo Hồ Sơ Mới</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. MULTI-DIMENSIONAL CONTROL TOOLBAR */}
            <div className="fluent-compact-card p-3 border border-slate-200/80 bg-white/90 flex flex-col gap-3">
                {/* Row 1: Phase Filter Pills & Collapse Toggle */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5" /> Pha:
                        </span>
                        <button
                            type="button"
                            onClick={() => handleSelectPhaseFilter('all')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                selectedPhaseFilter === 'all'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Tất Cả 7 Pha ({totalDocs})
                        </button>
                        {[1, 2, 3, 4, 5, 6, 7].map(num => {
                            const countInPhase = documents.filter(d => d.phase_number === num).length;
                            const isCurrent = num === currentPhaseNumber;
                            const isSelected = selectedPhaseFilter === num;

                            return (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleSelectPhaseFilter(num)}
                                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                                        isSelected
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : isCurrent
                                            ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>Pha {num}</span>
                                    <span className={`text-[10px] font-mono px-1 rounded-sm ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-white/60 text-slate-500'
                                    }`}>
                                        {countInPhase}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={toggleAllPhases}
                        className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors ml-auto flex items-center gap-1 shrink-0 cursor-pointer"
                        title={areAllCollapsed ? 'Mở rộng toàn bộ 7 pha' : 'Thu gọn toàn bộ 7 pha'}
                    >
                        <ChevronsUpDown className="w-3.5 h-3.5" />
                        <span>{areAllCollapsed ? 'Mở Tất Cả' : 'Thu Gọn Tất Cả'}</span>
                    </button>
                </div>

                {/* Row 2: Status Filter, Search & View Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
                        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200/60 text-xs">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Tất cả ({totalDocs})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('approved')}
                                className={`px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                                    statusFilter === 'approved' ? 'bg-white text-emerald-800 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Đã Ký Số ({approvedDocs})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('review')}
                                className={`px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                                    statusFilter === 'review' ? 'bg-white text-amber-800 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Chờ Thẩm Định ({underReviewDocs})
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo mã, tên tài liệu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        {/* View Mode Toggle: Timeline vs Table */}
                        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200/60 shrink-0">
                            <button
                                type="button"
                                onClick={() => setViewMode('timeline')}
                                className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                                    viewMode === 'timeline'
                                        ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                                title="Chế độ Phân tầng theo Pha (Timeline Grid)"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                                    viewMode === 'table'
                                        ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                                title="Chế độ Bảng danh mục tuần tự (Linear Table)"
                            >
                                <ListOrdered className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. EMPTY STATE */}
            {filteredDocuments.length === 0 && (
                <div className="fluent-compact-card p-12 text-center border border-dashed border-slate-200 bg-white/50">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-700">Không tìm thấy tài liệu phù hợp</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Thử điều chỉnh lại bộ lọc theo pha hoặc từ khóa tìm kiếm để hiển thị tài liệu SDLC.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            handleSelectPhaseFilter('all');
                            setStatusFilter('all');
                            setSearchQuery('');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                        Đặt lại tất cả bộ lọc
                    </button>
                </div>
            )}

            {/* 4A. VIEW MODE 1: PHASE-BY-PHASE TIMELINE (DEFAULT) */}
            {viewMode === 'timeline' && (
                <div className="space-y-6">
                    {phasesGroupData.map(({ phaseNum, info, phaseObj, gateObj, docs, totalCount, approvedCount, percentApproved }) => {
                        if (docs.length === 0 && selectedPhaseFilter === 'all') {
                            return null;
                        }

                        const isCollapsed = Boolean(collapsedPhases[phaseNum]);
                        const isCurrentPhase = phaseNum === currentPhaseNumber;
                        const isGatePassed = gateObj?.status === 'passed';

                        return (
                            <div
                                key={phaseNum}
                                className={`fluent-card overflow-hidden border transition-all ${
                                    isCurrentPhase ? 'border-blue-400/80 shadow-md ring-1 ring-blue-400/30' : 'border-slate-200/80 shadow-xs'
                                }`}
                            >
                                {/* Phase Section Header Banner */}
                                <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start sm:items-center gap-3">
                                        {/* Phase Number Badge */}
                                        <div className={`px-2.5 py-1.5 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase shadow-2xs shrink-0 bg-gradient-to-r ${info.accentColor}`}>
                                            {info.code}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                                    {info.title}
                                                </h3>
                                                <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                                                    ({info.sub})
                                                </span>

                                                {/* Gate Status Pill */}
                                                {gateObj && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                                        isGatePassed
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                    }`}>
                                                        <ShieldCheck className="w-3 h-3" />
                                                        Gate {gateObj.gate_number}: {isGatePassed ? 'ĐÃ PHÊ DUYỆT' : 'CHỜ DUYỆT'}
                                                    </span>
                                                )}

                                                {isCurrentPhase && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                                                        Pha Đang Triển Khai
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                                {info.purpose}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Phase Progress Bar & Collapse Toggle */}
                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                        <div className="text-right">
                                            <div className="text-[11px] font-bold text-slate-700">
                                                {approvedCount}/{totalCount} Tài Liệu Đã Ký
                                            </div>
                                            <div className="w-24 sm:w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                                                <div
                                                    className={`h-full transition-all duration-300 ${
                                                        percentApproved === 100
                                                            ? 'bg-emerald-500'
                                                            : percentApproved > 0
                                                            ? 'bg-blue-600'
                                                            : 'bg-slate-300'
                                                    }`}
                                                    style={{ width: `${percentApproved}%` }}
                                                />
                                            </div>
                                        </div>

                                        {onBatchAiGenerate && (
                                            <button
                                                type="button"
                                                onClick={() => onBatchAiGenerate(phaseNum)}
                                                disabled={isGeneratingAi}
                                                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1 border border-indigo-200/80 bg-white transition-colors cursor-pointer disabled:opacity-50"
                                                title={`AI tự động tổng hợp các tài liệu kỹ thuật còn thiếu cho Pha ${phaseNum}`}
                                            >
                                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                                <span className="hidden sm:inline">⚡ AI Sinh Pha</span>
                                            </button>
                                        )}

                                        {onBatchSignPhase && (totalCount - approvedCount > 0) && (
                                            <button
                                                type="button"
                                                onClick={() => onBatchSignPhase(phaseNum)}
                                                disabled={isBatchSigning}
                                                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100 px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-300 bg-emerald-50/80 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                title={`Ký số HMAC-SHA256 phê duyệt toàn bộ ${totalCount - approvedCount} hồ sơ kỹ thuật trong Pha ${phaseNum}`}
                                            >
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Ký Duyệt Pha ({totalCount - approvedCount})</span>
                                            </button>
                                        )}

                                        {onOpenCreateDocModal && (
                                            <button
                                                type="button"
                                                onClick={() => onOpenCreateDocModal(phaseNum)}
                                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1 border border-blue-200/60 bg-white transition-colors cursor-pointer"
                                                title={`Thêm tài liệu kỹ thuật mới vào Pha ${phaseNum}`}
                                            >
                                                <Plus className="w-3 h-3" />
                                                <span className="hidden sm:inline">Thêm Hồ Sơ</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => togglePhaseCollapse(phaseNum)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                            title={isCollapsed ? 'Mở rộng danh mục' : 'Thu gọn danh mục'}
                                        >
                                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Phase Document Cards Grid */}
                                {!isCollapsed && (
                                    <div className="p-3.5 sm:p-4 bg-slate-50/40">
                                        {docs.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic py-2">
                                                Không có tài liệu nào trong pha này khớp với bộ lọc hiện tại.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                                                {docs.map((doc) => {
                                                    const meta = SDLC_DOC_REGISTRY[doc.doc_type];
                                                    const IconComponent = meta?.icon || FileText;
                                                    const isApproved = doc.status === 'approved';

                                                    return (
                                                        <article
                                                            key={doc.id}
                                                            className={`p-3.5 rounded-xl bg-white border transition-all flex flex-col justify-between hover:shadow-md ${
                                                                isApproved
                                                                    ? 'border-emerald-200/80 shadow-2xs hover:border-emerald-300'
                                                                    : 'border-slate-200 hover:border-blue-300 shadow-2xs'
                                                            }`}
                                                        >
                                                            {/* Card Top: Sequential Index & Type Badge */}
                                                            <div>
                                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                                    <div className="flex items-center gap-1.5">
                                                                        {/* Global Sequential SDLC Order Badge */}
                                                                        <span className="font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-white shadow-2xs">
                                                                            #{String(meta?.globalOrder || doc.id).padStart(2, '0')}
                                                                        </span>

                                                                        {/* Doc Type Badge */}
                                                                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                                                                            {doc.doc_type}
                                                                        </span>

                                                                        {/* Phase Step Index */}
                                                                        {meta && (
                                                                            <span className="text-[10px] font-semibold text-slate-400">
                                                                                Bước {meta.phaseOrder}/{meta.totalInPhase}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Status Badge */}
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                                                        isApproved
                                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                                    }`}>
                                                                        {isApproved ? (
                                                                            <>
                                                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                                Đã Ký Số
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Clock className="w-3 h-3 text-amber-600" />
                                                                                Chờ Duyệt
                                                                            </>
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                {/* Title & Stage */}
                                                                <div className="flex items-start gap-2 mt-1.5">
                                                                    <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                                                                        <IconComponent className="w-3.5 h-3.5 text-blue-600" />
                                                                    </span>
                                                                    <div className="min-w-0 flex-1">
                                                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                                                                            {doc.title}
                                                                        </h4>
                                                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                                                                            <span>Bản: <strong className="text-slate-600 font-mono">{doc.version}</strong></span>
                                                                            {meta?.stage && (
                                                                                <>
                                                                                    <span>•</span>
                                                                                    <span>Giai đoạn: <strong className="text-slate-600">{meta.stage}</strong></span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* SDLC Predecessor / Successor Link Ribbon */}
                                                                {(meta?.predecessor || meta?.successor) && (
                                                                    <div className="mt-2.5 px-2 py-1 rounded bg-slate-50 border border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500">
                                                                        <span className="truncate">
                                                                            Tiền đề: <strong className="text-slate-700">{meta?.predecessor || 'Khởi tạo ban đầu'}</strong>
                                                                        </span>
                                                                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0 mx-1" />
                                                                        <span className="truncate text-right">
                                                                            Kế thừa: <strong className="text-blue-700">{meta?.successor || 'Kế hoạch tiếp'}</strong>
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Cryptographic Signature or Content Snippet */}
                                                                {isApproved && doc.signature_hash ? (
                                                                    <div className="mt-2.5 p-2 bg-emerald-50/60 border border-emerald-100/80 rounded-lg text-[10px] font-mono text-emerald-800 break-all leading-tight">
                                                                        <div className="flex items-center gap-1 font-bold text-emerald-900 mb-0.5">
                                                                            <KeyRound className="w-3 h-3" />
                                                                            HMAC-SHA256: {doc.signed_off_by || 'Võ Hoàng Tú'}
                                                                        </div>
                                                                        Hash: {doc.signature_hash.substring(0, 36)}...
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                                                                        {doc.content ? doc.content.substring(0, 95) + '...' : meta?.description || 'Chưa có nội dung chi tiết.'}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Card Footer Actions */}
                                                            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onViewDoc(doc)}
                                                                        className="px-2 py-1 rounded-md text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer"
                                                                    >
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                        Xem
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onEditDoc(doc)}
                                                                        className="px-2 py-1 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                        Sửa
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => downloadDocumentMarkdown(doc)}
                                                                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                                        title="Tải xuống tệp Markdown (.md)"
                                                                    >
                                                                        <Download className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>

                                                                {!isApproved ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onSignDoc(doc.id)}
                                                                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                                                    >
                                                                        <KeyRound className="w-3 h-3" />
                                                                        Ký Duyệt
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        Đã Chứng Thực
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 4B. VIEW MODE 2: LINEAR SDLC TABLE */}
            {viewMode === 'table' && (
                <div className="fluent-compact-card border border-slate-200/80 shadow-xs overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 text-center w-12">#STT</th>
                                    <th className="py-2.5 px-3">Pha SDLC</th>
                                    <th className="py-2.5 px-3">Mã & Loại</th>
                                    <th className="py-2.5 px-3 min-w-[200px]">Tên Hồ Sơ / Tài Liệu</th>
                                    <th className="py-2.5 px-3">Giai Đoạn</th>
                                    <th className="py-2.5 px-3">Bản</th>
                                    <th className="py-2.5 px-3">Trạng Thái & Chữ Ký</th>
                                    <th className="py-2.5 px-3 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredDocuments.map((doc) => {
                                    const meta = SDLC_DOC_REGISTRY[doc.doc_type];
                                    const isApproved = doc.status === 'approved';
                                    const phaseInfo = SDLC_PHASE_INFO[doc.phase_number];

                                    return (
                                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                                                #{String(meta?.globalOrder || doc.id).padStart(2, '0')}
                                            </td>

                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${phaseInfo.badgeBg}`}>
                                                    Pha {doc.phase_number}
                                                </span>
                                            </td>

                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                                                    {doc.doc_type}
                                                </span>
                                            </td>

                                            <td className="py-2.5 px-3">
                                                <div className="font-bold text-slate-900 line-clamp-1">{doc.title}</div>
                                                <div className="text-[10px] text-slate-400 line-clamp-1">
                                                    Tiền đề: {meta?.predecessor || 'Khởi tạo'} → Kế thừa: {meta?.successor || 'Kế hoạch tiếp'}
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                                                {meta?.stage || 'Kỹ thuật'}
                                            </td>

                                            <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-500">
                                                {doc.version}
                                            </td>

                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                {isApproved ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                            Đã Ký Số: {doc.signed_off_by || 'Võ Hoàng Tú'}
                                                        </span>
                                                        {doc.signature_hash && (
                                                            <span className="text-[9px] font-mono text-slate-400">
                                                                Hash: {doc.signature_hash.substring(0, 16)}...
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-amber-600" />
                                                        Chờ Thẩm Định
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => onViewDoc(doc)}
                                                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                        title="Xem toàn văn tài liệu"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => onEditDoc(doc)}
                                                        className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                                        title="Chỉnh sửa nội dung"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => downloadDocumentMarkdown(doc)}
                                                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                        title="Tải xuống tệp Markdown (.md)"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </button>

                                                    {!isApproved && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onSignDoc(doc.id)}
                                                            className="px-2 py-0.5 rounded bg-blue-600 text-white font-semibold text-[11px] hover:bg-blue-700 transition-colors cursor-pointer"
                                                        >
                                                            Ký Duyệt
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}
