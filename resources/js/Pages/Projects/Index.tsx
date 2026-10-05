import React, { useState, useMemo } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { SaaSLayout } from '@/Layouts/SaaSLayout';
import { 
    Plus, 
    Layers, 
    CheckCircle2, 
    ShieldAlert, 
    Calendar, 
    DollarSign, 
    ArrowRight, 
    Sparkles, 
    Clock, 
    FileSpreadsheet,
    Building2,
    X,
    Filter,
    Search,
    AlertTriangle,
    BarChart3,
    Printer,
    BadgeCheck,
    Cpu,
    Bug,
    ShieldCheck,
    Users,
    Award,
    Activity,
    History
} from 'lucide-react';
import { CorporateOverviewTab } from '@/Components/CorporateOverviewTab';
import { CorporateWorkforceTab } from '@/Components/CorporateWorkforceTab';
import { CorporateComplianceTab } from '@/Components/CorporateComplianceTab';
import { CorporateOperationsTab } from '@/Components/CorporateOperationsTab';
import { CorporateAuditVaultTab } from '@/Components/CorporateAuditVaultTab';

interface Project {
    id: number;
    name: string;
    code: string;
    description?: string;
    client_name: string;
    project_type: 'outsourcing' | 'product' | 'enterprise' | 'rnd';
    status: 'planning' | 'active' | 'on_hold' | 'completed';
    current_phase_number: number;
    health_status: 'healthy' | 'warning' | 'critical';
    budget: number;
    target_delivery_date?: string;
    created_at: string;
    phases?: Array<{
        id: number;
        phase_number: number;
        name: string;
        status: string;
        completion_rate: number;
    }>;
    quality_gates?: Array<{
        id: number;
        gate_number: number;
        status: string;
    }>;
    defects?: Array<{
        id: number;
        severity: string;
        status: string;
    }>;
    raciAssignments?: Array<{
        id: number;
        activity_name: string;
        phase_number: number;
        responsible: string;
        accountable: string;
        consulted?: string[];
        informed?: string[];
    }>;
    productionIncidents?: Array<{
        id: number;
        incident_code: string;
        title: string;
        severity: string;
        downtime_minutes: number;
        root_cause?: string;
        corrective_actions?: string;
        status: string;
        detected_at: string;
        resolved_at?: string;
    }>;
    auditLogs?: Array<{
        id: number;
        user_name: string;
        user_role: string;
        action_type: string;
        entity_type: string;
        entity_id: number;
        digital_fingerprint?: string;
        created_at: string;
    }>;
}

interface PageProps {
    projects: Project[];
    recentAuditLogs?: any[];
    recentIncidents?: any[];
    initialTab?: string;
    flash?: {
        success?: string;
        warning?: string;
        error?: string;
    };
}

const PHASE_NAMES = [
    'Yêu cầu (SRS)',
    'Kiến trúc (SAD)',
    'Kế hoạch (WBS)',
    'Lập trình (Dev)',
    'Kiểm thử (QA)',
    'Release (CAB)',
    'Hậu kiểm (SLA)'
];

export default function ProjectIndex() {
    const { projects, recentAuditLogs = [], recentIncidents = [], initialTab = 'projects', flash } = usePage<any>().props as PageProps;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCorporateDossierOpen, setIsCorporateDossierOpen] = useState(false);

    // Active Enterprise Corporate Subsystem
    const [activeSubsystem, setActiveSubsystem] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam) return tabParam;
        }
        return initialTab || 'projects';
    });

    const handleSelectSubsystem = (tabId: string) => {
        setActiveSubsystem(tabId);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tabId);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const subsystemMeta: Record<string, { title: string; label: string }> = {
        overview: { title: 'Tổng Quan Năng Lực Doanh Nghiệp', label: 'Tổng Quan Doanh Nghiệp' },
        projects: { title: 'Quản Trị Danh Mục Dự Án SDLC', label: 'Quản Trị Dự Án & SDLC' },
        workforce: { title: 'Quản Trị Nguồn Lực & Đội Ngũ RACI', label: 'Nguồn Lực & Đội Ngũ' },
        compliance: { title: 'Chất Lượng & Chuẩn Mực Doanh Nghiệp', label: 'Chất Lượng & Tuân Thủ' },
        operations: { title: 'Trung Tâm Vận Hành & Giám Sát SLA', label: 'Vận Hành & Giám Sát SLA' },
        audit: { title: 'Sổ Cái Kiểm Toán Bất Biến HMAC', label: 'Sổ Cái Kiểm Toán HMAC' },
    };

    const currentMeta = subsystemMeta[activeSubsystem] || subsystemMeta.projects;

    // Multi-faceted Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [healthFilter, setHealthFilter] = useState<string>('all');
    const [phaseFilter, setPhaseFilter] = useState<number | 'all'>('all');

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        client_name: '',
        project_type: 'enterprise',
        budget: 150000,
        target_delivery_date: '',
        description: '',
    });

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        post('/projects', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    // Filtered projects
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = p.name.toLowerCase().includes(q);
                const matchCode = p.code.toLowerCase().includes(q);
                const matchClient = p.client_name.toLowerCase().includes(q);
                if (!matchName && !matchCode && !matchClient) return false;
            }
            if (typeFilter !== 'all' && p.project_type !== typeFilter) return false;
            if (healthFilter !== 'all' && p.health_status !== healthFilter) return false;
            if (phaseFilter !== 'all' && p.current_phase_number !== phaseFilter) return false;
            return true;
        });
    }, [projects, searchQuery, typeFilter, healthFilter, phaseFilter]);

    // Phase distribution statistics
    const phaseDistribution = useMemo(() => {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        projects.forEach(p => {
            if (p.current_phase_number >= 1 && p.current_phase_number <= 7) {
                counts[p.current_phase_number - 1]++;
            }
        });
        return counts;
    }, [projects]);

    // Gate bottlenecks count
    const warningProjects = projects.filter(p => p.health_status !== 'healthy');
    const totalPassedGates = projects.reduce((acc, p) => acc + (p.quality_gates?.filter(g => g.status === 'passed').length || 0), 0);
    const totalBudget = projects.reduce((acc, p) => acc + Number(p.budget), 0);

    return (
        <SaaSLayout
            title={currentMeta.title}
            allProjects={projects}
            activeEnterpriseSubsystem={activeSubsystem}
            onSelectEnterpriseSubsystem={handleSelectSubsystem}
            breadcrumbs={[{ label: currentMeta.label }]}
            flash={flash}
            headerActions={
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCorporateDossierOpen(true)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                        <span className="hidden sm:inline">Hồ Sơ SDLC Cty</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="fluent-button-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Khởi Tạo Dự Án</span>
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Horizontal Enterprise Subsystem Pill Navigation Ribbon */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 backdrop-blur-xs rounded-xl overflow-x-auto scrollbar-none shadow-2xs border border-slate-200/60 shrink-0">
                    {[
                        { id: 'overview', label: 'Tổng Quan Doanh Nghiệp', icon: BarChart3 },
                        { id: 'projects', label: 'Quản Trị Dự Án & SDLC', icon: Layers, badge: projects.length },
                        { id: 'workforce', label: 'Nguồn Lực & RACI', icon: Users },
                        { id: 'compliance', label: 'Chất Lượng & Chuẩn ISO', icon: Award },
                        { id: 'operations', label: 'Vận Hành & SLA', icon: Activity, badge: '99.98%' },
                        { id: 'audit', label: 'Sổ Cái HMAC', icon: History, badge: 'Verified' },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isSelected = activeSubsystem === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleSelectSubsystem(tab.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                    isSelected
                                        ? 'bg-white text-blue-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span>{tab.label}</span>
                                {tab.badge !== undefined && (
                                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                                        isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Subsystem Content Views */}
                {activeSubsystem === 'overview' && (
                    <CorporateOverviewTab
                        projects={projects}
                        onSelectSubsystem={handleSelectSubsystem}
                        onOpenCreateModal={() => setIsCreateModalOpen(true)}
                        onOpenDossier={() => setIsCorporateDossierOpen(true)}
                    />
                )}

                {activeSubsystem === 'workforce' && (
                    <CorporateWorkforceTab projects={projects} />
                )}

                {activeSubsystem === 'compliance' && (
                    <CorporateComplianceTab projects={projects} />
                )}

                {activeSubsystem === 'operations' && (
                    <CorporateOperationsTab incidents={recentIncidents} projects={projects} />
                )}

                {activeSubsystem === 'audit' && (
                    <CorporateAuditVaultTab auditLogs={recentAuditLogs} projects={projects} />
                )}

                {activeSubsystem === 'projects' && (
                    <>

                {/* Hero / Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="fluent-badge bg-blue-100/70 text-blue-700 border-blue-200">
                                <Sparkles className="w-3.5 h-3.5" />
                                Chuẩn SDLC 2026 • Executive Portfolio Dashboard
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Tổng Quan Danh Mục Dự Án Phần Mềm
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Kiểm soát tiến độ 7 Pha kỹ thuật, cơ chế khóa Cổng tự động và giám sát cam kết vận hành SLA.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                            onClick={() => setIsCorporateDossierOpen(true)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/90 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                            Hồ Sơ SDLC Công Ty
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="fluent-button-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            Khởi Tạo Dự Án Mới
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Mica Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <div className="fluent-card p-5">
                        <div className="flex items-center justify-between text-slate-500 mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Dự Án Đang Chạy</span>
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">{projects.length}</span>
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {warningProjects.length === 0 ? '100% On-Track' : `${projects.length - warningProjects.length}/${projects.length} Khỏe mạnh`}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Áp dụng kiến trúc Repository-Actions</p>
                    </div>

                    <div className="fluent-card p-5">
                        <div className="flex items-center justify-between text-slate-500 mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider">Cổng Chất Lượng Đã Ký</span>
                            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">
                                {totalPassedGates}
                            </span>
                            <span className="text-xs text-indigo-600 font-medium">Quality Gates</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Chữ ký số bất biến HMAC-SHA256</p>
                    </div>

                    <div className="fluent-card p-5">
                        <div className="flex items-center justify-between text-slate-500 mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider">Radar Cảnh Báo Rủi Ro</span>
                            <div className={`p-2 rounded-lg ${warningProjects.length > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-extrabold ${warningProjects.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {warningProjects.length}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Cần lưu ý</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            {warningProjects.length > 0 ? 'Phát hiện dự án bị chặn cổng hoặc có bug' : 'Toàn bộ dự án vận hành mượt mà'}
                        </p>
                    </div>

                    <div className="fluent-card p-5">
                        <div className="flex items-center justify-between text-slate-500 mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Ngân Sách Quản Trị</span>
                            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">
                                ${(totalBudget / 1000).toFixed(0)}k
                            </span>
                            <span className="text-xs text-slate-500 font-medium">USD</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Đo lường chi phí và hiệu quả đầu tư</p>
                    </div>
                </div>

                {/* SDLC 7-Phase Distribution Radar */}
                <div className="fluent-card p-6 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-blue-600" />
                                Phân Bổ Dòng Chảy Dự Án Toàn Công Ty (SDLC 7-Phase Pipeline Radar)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Nhấp chọn từng pha để lọc nhanh các dự án đang triển khai tại pha kỹ thuật tương ứng.
                            </p>
                        </div>
                        {phaseFilter !== 'all' && (
                            <button
                                onClick={() => setPhaseFilter('all')}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline self-start cursor-pointer"
                            >
                                Hiển thị tất cả 7 pha
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                        {PHASE_NAMES.map((name, idx) => {
                            const pNum = idx + 1;
                            const count = phaseDistribution[idx];
                            const isSelected = phaseFilter === pNum;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setPhaseFilter(isSelected ? 'all' : pNum)}
                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/30 shadow-xs' 
                                            : count > 0 
                                            ? 'bg-white hover:bg-slate-50/80 border-slate-200/80 shadow-xs' 
                                            : 'bg-slate-50/50 border-slate-200/40 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                        <span>Pha {pNum}</span>
                                        <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                                            count > 0 ? 'bg-blue-100 text-blue-700 font-extrabold' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {count}
                                        </span>
                                    </div>
                                    <div className="text-xs font-bold text-slate-900 truncate">{name.split(' ')[0]}</div>
                                    <div className="text-[10px] text-slate-400 truncate">{name.split(' ')[1] || ''}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="fluent-card p-4 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên dự án, mã dự án hoặc đối tác khách hàng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                            />
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                                <Filter className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold text-slate-600">Loại hình:</span>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="enterprise">Enterprise</option>
                                    <option value="product">Product</option>
                                    <option value="outsourcing">Outsourcing</option>
                                    <option value="rnd">R&D</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                                <span className="font-semibold text-slate-600">Sức khỏe:</span>
                                <select
                                    value={healthFilter}
                                    onChange={(e) => setHealthFilter(e.target.value)}
                                    className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="healthy">Khỏe mạnh</option>
                                    <option value="warning">Cần theo dõi</option>
                                    <option value="critical">Báo động</option>
                                </select>
                            </div>

                            {(searchQuery || typeFilter !== 'all' || healthFilter !== 'all' || phaseFilter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setTypeFilter('all');
                                        setHealthFilter('all');
                                        setPhaseFilter('all');
                                    }}
                                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold cursor-pointer"
                                >
                                    Đặt lại bộ lọc
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span>Danh Sách Dự Án Sản Xuất Phần Mềm</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600">
                                {filteredProjects.length} / {projects.length}
                            </span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredProjects.map((project) => (
                            <div key={project.id} className="fluent-card p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
                                <div>
                                    {/* Header Info */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                                    {project.code}
                                                </span>
                                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    {project.client_name}
                                                </span>
                                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                                    {project.project_type}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors">
                                                <Link href={`/projects/${project.id}`}>{project.name}</Link>
                                            </h3>
                                        </div>

                                        <span className={`fluent-badge ${
                                            project.health_status === 'healthy' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                : project.health_status === 'critical'
                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                            {project.health_status === 'healthy' ? 'Khỏe Mạnh' : project.health_status === 'critical' ? 'Báo Động' : 'Cần Theo Dõi'}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-500 line-clamp-2 mb-6">
                                        {project.description || 'Chưa có mô tả chi tiết cho dự án.'}
                                    </p>

                                    {/* SDLC 7-Phase Mini Stepper */}
                                    <div className="mb-6 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
                                        <div className="flex items-center justify-between text-xs font-semibold mb-2">
                                            <span className="text-slate-600">Tiến Độ Quy Trình 7 Pha</span>
                                            <span className="text-blue-600">
                                                Pha {project.current_phase_number}/7: {PHASE_NAMES[project.current_phase_number - 1]}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1.5">
                                            {PHASE_NAMES.map((name, idx) => {
                                                const phaseNum = idx + 1;
                                                const isCompleted = phaseNum < project.current_phase_number;
                                                const isCurrent = phaseNum === project.current_phase_number;

                                                return (
                                                    <div key={idx} className="group/phase relative">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                                isCompleted
                                                                    ? 'bg-emerald-500'
                                                                    : isCurrent
                                                                    ? 'bg-blue-600 ring-2 ring-blue-300 animate-pulse'
                                                                    : 'bg-slate-200'
                                                            }`}
                                                        ></div>
                                                        <span className="text-[9px] block text-center mt-1 text-slate-400 font-medium truncate">
                                                            P{phaseNum}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1 font-medium">
                                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                            ${Number(project.budget).toLocaleString()}
                                        </span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {project.target_delivery_date || 'Q4/2026'}
                                        </span>
                                    </div>

                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                                    >
                                        Chi tiết SDLC
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {filteredProjects.length === 0 && (
                            <div className="col-span-full fluent-card p-12 text-center text-slate-400">
                                <Search className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                                <h3 className="text-base font-bold text-slate-700">Không tìm thấy dự án phù hợp</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Vui lòng điều chỉnh từ khóa tìm kiếm hoặc bấm "Đặt lại bộ lọc" để xem toàn bộ danh mục.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                </>
            )}
            </div>

            {/* Modal: Corporate Governance SDLC Dossier */}
            {isCorporateDossierOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-8 max-w-4xl w-full rounded-2xl shadow-2xl relative border border-white max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-purple-100 text-purple-700">
                                    <BadgeCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900">
                                        HỒ SƠ QUẢN TRỊ SDLC DOANH NGHIỆP (CORPORATE PORTFOLIO DOSSIER)
                                    </h3>
                                    <p className="text-xs text-slate-500">Báo cáo kiểm toán tuân thủ quy trình phát triển phần mềm toàn công ty năm 2026</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCorporateDossierOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="py-6 space-y-6 text-xs text-slate-700">
                            {/* Summary Numbers */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng Dự Án</span>
                                    <span className="font-extrabold text-lg text-slate-900">{projects.length}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng Giá Trị Quản Lý</span>
                                    <span className="font-extrabold text-lg text-slate-900">${Number(totalBudget).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng Cổng Đã Ký Duyệt</span>
                                    <span className="font-extrabold text-lg text-indigo-700">{totalPassedGates} Cổng</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Lead Solution Architect</span>
                                    <span className="font-bold text-slate-900">Võ Hoàng Tú</span>
                                </div>
                            </div>

                            {/* Portfolio Table */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-2">Tình Trạng Tuân Thủ Từng Dự Án (Compliance Status):</h4>
                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                                                <th className="py-2.5 px-3">Mã Dự Án</th>
                                                <th className="py-2.5 px-3">Tên Dự Án & Đối Tác</th>
                                                <th className="py-2.5 px-3">Pha SDLC</th>
                                                <th className="py-2.5 px-3">Sức Khỏe</th>
                                                <th className="py-2.5 px-3">Cổng Đã Ký</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-sans">
                                            {projects.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50">
                                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.code}</td>
                                                    <td className="py-2.5 px-3">
                                                        <div className="font-semibold text-slate-900">{p.name}</div>
                                                        <div className="text-[11px] text-slate-500">{p.client_name}</div>
                                                    </td>
                                                    <td className="py-2.5 px-3 font-medium text-blue-700">
                                                        Pha {p.current_phase_number}/7
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            p.health_status === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {p.health_status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 font-mono">
                                                        {p.quality_gates?.filter(g => g.status === 'passed').length || 0} / 6
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-mono">
                                MCMS Enterprise Governance Platform • ISO/IEC 12207 Compliant
                            </span>
                            <button
                                onClick={() => window.print()}
                                className="fluent-button-primary px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                            >
                                <Printer className="w-4 h-4" />
                                In / Lưu PDF Hồ Sơ Doanh Nghiệp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="fluent-card bg-white p-6 max-w-lg w-full rounded-2xl shadow-2xl relative border border-white">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Khởi Tạo Dự Án SDLC Mới</h3>
                                <p className="text-xs text-slate-500">Tự động cấu hình 7 Pha, 6 Quality Gates và Ma trận RACI</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Dự Án *</label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="vd: Cổng Thanh Toán Quốc Tế PayNext 2026"
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                {errors.name && <span className="text-[11px] text-rose-500">{errors.name}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Dự Án (Code)</label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="vd: PRJ-PAY-2026"
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Khách Hàng / Đối Tác *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.client_name}
                                        onChange={(e) => setData('client_name', e.target.value)}
                                        placeholder="vd: Fintech Corp"
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Hình</label>
                                    <select
                                        value={data.project_type}
                                        onChange={(e) => setData('project_type', e.target.value as any)}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                    >
                                        <option value="enterprise">Giải Pháp Doanh Nghiệp (Enterprise)</option>
                                        <option value="product">Sản Phẩm Công Nghệ (Product)</option>
                                        <option value="outsourcing">Gia Công Phần Mềm (Outsourcing)</option>
                                        <option value="rnd">Nghiên Cứu Phát Triển (R&D)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ngân Sách (USD)</label>
                                    <input
                                        type="number"
                                        value={data.budget}
                                        onChange={(e) => setData('budget', Number(e.target.value))}
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Mục Tiêu & Mô Tả Dự Án</label>
                                <textarea
                                    rows={2}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Mô tả phạm vi và bài toán kinh doanh..."
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                ></textarea>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                    Hủy Bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="fluent-button-primary px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
                                >
                                    {processing ? 'Đang Khởi Tạo...' : 'Tạo Dự Án (Repository-Action)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SaaSLayout>
    );
}
