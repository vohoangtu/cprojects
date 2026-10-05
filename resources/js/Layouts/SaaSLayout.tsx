import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ShieldCheck,
    Layers,
    FileText,
    CheckSquare,
    SlidersHorizontal,
    Users,
    GitBranch,
    Bug,
    Activity,
    History,
    PanelLeftClose,
    PanelLeftOpen,
    Menu,
    X,
    Search,
    Bell,
    Sparkles,
    CheckCircle2,
    Clock,
    Lock,
    Building2,
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    Cpu,
    Award,
    Zap,
    FolderKanban,
    Briefcase,
    Package,
    ShieldAlert,
    ExternalLink,
    BarChart3
} from 'lucide-react';

export interface ProjectContext {
    id: number;
    name: string;
    code: string;
    current_phase_number: number;
    status: string;
    health_status?: string;
    client_name?: string;
}

export interface ProjectNavItem {
    id: string;
    label: string;
    sub?: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number | string;
    badgeColor?: string;
}

interface PhaseMiniData {
    phase_number: number;
    completion_rate?: number;
    status?: string;
}

interface SaaSLayoutProps {
    children: React.ReactNode;
    title: string;
    // Enterprise Corporate Subsystem Mode
    activeEnterpriseSubsystem?: string;
    onSelectEnterpriseSubsystem?: (subsystemId: string) => void;
    // Contextual Project Mode
    project?: ProjectContext;
    allProjects?: Array<{ id: number; name: string; code: string; current_phase_number: number }>;
    projectNavItems?: readonly ProjectNavItem[];
    activeProjectTab?: string;
    onSelectProjectTab?: (tabId: string) => void;
    // Stepper / Phase Tracker
    phases?: PhaseMiniData[];
    selectedPhaseNum?: number;
    onSelectPhaseNum?: (num: number) => void;
    // Header customization
    breadcrumbs?: Array<{ label: string; href?: string }>;
    headerActions?: React.ReactNode;
    flash?: {
        success?: string;
        warning?: string;
        error?: string;
    };
}

const PHASE_CODES = [
    { num: 1, code: 'REQ', title: 'Yêu cầu (BRD/SRS)' },
    { num: 2, code: 'ARCH', title: 'Kiến trúc (SAD/C4)' },
    { num: 3, code: 'PLAN', title: 'Kế hoạch (WBS/RACI)' },
    { num: 4, code: 'DEV', title: 'Lập trình (Sprint/PR)' },
    { num: 5, code: 'QA', title: 'Kiểm thử (STP/UAT)' },
    { num: 6, code: 'REL', title: 'Phát hành (CAB/Canary)' },
    { num: 7, code: 'OPS', title: 'Vận hành (SLA/Retro)' },
];

export function SaaSLayout({
    children,
    title,
    activeEnterpriseSubsystem = 'projects',
    onSelectEnterpriseSubsystem,
    project,
    allProjects = [],
    projectNavItems = [],
    activeProjectTab,
    onSelectProjectTab,
    phases = [],
    selectedPhaseNum,
    onSelectPhaseNum,
    breadcrumbs,
    headerActions,
    flash
}: SaaSLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

    // Enterprise Subsystems Menu for MCMS Platform
    const ENTERPRISE_MODULES = [
        {
            id: 'overview',
            label: 'Tổng Quan Doanh Nghiệp',
            sub: 'Executive Dashboard & OKR',
            href: '/projects?tab=overview',
            icon: BarChart3,
            badge: 'Executive',
            badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
            id: 'projects',
            label: 'Quản Trị Dự Án & SDLC',
            sub: 'Software Delivery Lifecycle',
            href: '/projects?tab=projects',
            icon: FolderKanban,
            badge: allProjects.length > 0 ? `${allProjects.length}` : undefined,
            badgeColor: 'bg-blue-100 text-blue-700',
        },
        {
            id: 'workforce',
            label: 'Nguồn Lực & Đội Ngũ',
            sub: 'IT Talent & RACI Capacity',
            href: '/projects?tab=workforce',
            icon: Users,
            badge: 'Lead SA',
            badgeColor: 'bg-indigo-100 text-indigo-700',
        },
        {
            id: 'compliance',
            label: 'Chất Lượng & Tuân Thủ',
            sub: 'ISO 12207, IEEE 830, PCI',
            href: '/projects?tab=compliance',
            icon: Award,
            badge: 'Grade A',
            badgeColor: 'bg-amber-100 text-amber-800',
        },
        {
            id: 'operations',
            label: 'Vận Hành & Giám Sát SLA',
            sub: 'Uptime 99.95% & Incidents',
            href: '/projects?tab=operations',
            icon: Activity,
            badge: '99.95%',
            badgeColor: 'bg-cyan-100 text-cyan-800',
        },
        {
            id: 'audit',
            label: 'Sổ Cái Kiểm Toán HMAC',
            sub: 'Non-repudiation Audit Ledger',
            href: '/projects?tab=audit',
            icon: History,
            badge: 'Immutable',
            badgeColor: 'bg-purple-100 text-purple-700',
        },
    ];

    const isProjectContext = Boolean(project);

    return (
        <div className="min-h-screen bg-slate-50/70 flex overflow-hidden font-sans">
            <Head title={`${title} - MCMS Enterprise Platform`} />

            {/* MOBILE BACKDROP */}
            {isMobileSidebarOpen && (
                <div
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden animate-fade-in"
                />
            )}

            {/* PERSISTENT LEFT SAAS SIDEBAR */}
            <aside
                className={`fixed lg:sticky top-0 h-screen z-50 lg:z-30 bg-white/95 border-r border-slate-200/80 backdrop-blur-md flex flex-col justify-between transition-all duration-200 shadow-sm shrink-0 ${
                    isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                } ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
            >
                <div className="flex flex-col min-h-0 flex-1">
                    {/* 1. Global Brand Header */}
                    <div className="h-14 border-b border-slate-200/80 flex items-center justify-between px-3.5 shrink-0">
                        <Link href="/projects" className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xs shrink-0 flex items-center justify-center text-white">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            {!isSidebarCollapsed && (
                                <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold text-sm tracking-tight text-slate-900">
                                            MCMS
                                        </span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                            Enterprise
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium truncate">
                                        IT Corporate Management
                                    </p>
                                </div>
                            )}
                        </Link>

                        {/* Mobile close drawer button */}
                        <button
                            type="button"
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 lg:hidden cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* 2. Mode-Dependent Sidebar Body */}
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-3.5 scrollbar-thin">
                        {/* A. If viewing a specific Project: Show Project Context Header */}
                        {isProjectContext && project ? (
                            <div className="space-y-3">
                                {/* Back to Corporate Overview */}
                                {!isSidebarCollapsed && (
                                    <Link
                                        href="/projects"
                                        className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 px-1 transition-colors"
                                    >
                                        <ArrowLeft className="w-3 h-3" />
                                        <span>Danh Mục Dự Án Toàn Cty</span>
                                    </Link>
                                )}

                                {/* Project Context Card & Switcher */}
                                <div className={`relative rounded-xl border transition-all ${
                                    isSidebarCollapsed
                                        ? 'p-1.5 text-center bg-blue-50/80 border-blue-200'
                                        : 'p-2.5 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border-blue-200/80 shadow-2xs'
                                }`}>
                                    {!isSidebarCollapsed ? (
                                        <div>
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">
                                                        {project.code}
                                                    </span>
                                                    {allProjects.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                                                            className="p-0.5 rounded hover:bg-blue-200/60 text-blue-700 transition-colors cursor-pointer"
                                                            title="Đổi dự án nhanh"
                                                        >
                                                            <ChevronDown className={`w-3 h-3 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    Pha {project.current_phase_number}/7
                                                </span>
                                            </div>
                                            <h3 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
                                                {project.name}
                                            </h3>
                                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                Khách hàng: {project.client_name || 'Doanh Nghiệp'}
                                            </p>

                                            {/* Floating Project Switcher Dropdown */}
                                            {isProjectDropdownOpen && allProjects.length > 1 && (
                                                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 space-y-1 animate-fade-in">
                                                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Chuyển sang dự án khác:
                                                    </div>
                                                    {allProjects.map(p => (
                                                        <Link
                                                            key={p.id}
                                                            href={`/projects/${p.id}`}
                                                            onClick={() => setIsProjectDropdownOpen(false)}
                                                            className={`w-full px-2 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                                                                p.id === project.id
                                                                    ? 'bg-blue-50 text-blue-700 font-bold'
                                                                    : 'text-slate-700 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <div className="truncate">
                                                                <span className="font-mono text-[10px] font-bold mr-1.5 text-blue-600">{p.code}</span>
                                                                <span className="truncate">{p.name}</span>
                                                            </div>
                                                            <span className="font-mono text-[9px] text-slate-400 shrink-0">P{p.current_phase_number}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="font-mono font-bold text-[10px] text-blue-700 truncate" title={project.name}>
                                            {project.code.slice(0, 4)}
                                        </div>
                                    )}
                                </div>

                                {/* Project Inner SDLC Modules Navigation */}
                                <div>
                                    {!isSidebarCollapsed && (
                                        <p className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Phân Hệ Kỹ Thuật Dự Án
                                        </p>
                                    )}
                                    <nav className="space-y-0.5">
                                        {projectNavItems.map((item) => {
                                            const Icon = item.icon;
                                            const isSelected = activeProjectTab === item.id;

                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (onSelectProjectTab) onSelectProjectTab(item.id);
                                                        setIsMobileSidebarOpen(false);
                                                    }}
                                                    title={isSidebarCollapsed ? item.label : undefined}
                                                    className={`w-full rounded-lg text-xs font-semibold transition-all flex items-center cursor-pointer ${
                                                        isSidebarCollapsed
                                                            ? 'w-10 h-9 mx-auto justify-center'
                                                            : 'px-2.5 py-1.5 justify-between gap-2 text-left'
                                                    } ${
                                                        isSelected
                                                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                                        {!isSidebarCollapsed && (
                                                            <div className="truncate">
                                                                <div className="truncate text-xs leading-tight">{item.label}</div>
                                                                {item.sub && (
                                                                    <div className={`text-[9px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                                                        {item.sub}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!isSidebarCollapsed && item.count !== undefined && (
                                                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                                                            isSelected ? 'bg-white/20 text-white' : (item.badgeColor || 'bg-slate-100 text-slate-600')
                                                        }`}>
                                                            {item.count}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>

                                {/* Mini 7-Phase Pipeline Navigator */}
                                {phases.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100">
                                        {!isSidebarCollapsed && (
                                            <p className="px-2 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Tiến Độ 7 Pha SDLC
                                            </p>
                                        )}
                                        <div className="space-y-0.5">
                                            {PHASE_CODES.map((meta) => {
                                                const phaseData = phases.find(p => p.phase_number === meta.num);
                                                const isPassed = meta.num < project.current_phase_number || phaseData?.status === 'completed';
                                                const isCurrent = meta.num === project.current_phase_number;
                                                const isPhaseSelected = selectedPhaseNum === meta.num;

                                                return (
                                                    <button
                                                        key={meta.num}
                                                        type="button"
                                                        onClick={() => onSelectPhaseNum && onSelectPhaseNum(meta.num)}
                                                        title={isSidebarCollapsed ? `Pha ${meta.num}: ${meta.title}` : undefined}
                                                        className={`w-full rounded-md text-xs transition-all flex items-center cursor-pointer ${
                                                            isSidebarCollapsed
                                                                ? 'w-10 h-7 mx-auto justify-center'
                                                                : 'px-2 py-1 justify-between gap-1.5 text-left text-[11px]'
                                                        } ${
                                                            isPhaseSelected
                                                                ? 'bg-slate-100 text-blue-700 font-bold border-l-2 border-blue-600'
                                                                : 'text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            {isPassed ? (
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                                            ) : isCurrent ? (
                                                                <Clock className="w-3 h-3 text-blue-600 shrink-0 animate-pulse" />
                                                            ) : (
                                                                <Lock className="w-3 h-3 text-slate-300 shrink-0" />
                                                            )}
                                                            {!isSidebarCollapsed && (
                                                                <span className="truncate">P{meta.num}: {meta.code}</span>
                                                            )}
                                                        </div>
                                                        {!isSidebarCollapsed && (
                                                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                                                {phaseData?.completion_rate || (isPassed ? 100 : 0)}%
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* B. Enterprise Global Context (Portfolio / Index Level) */
                            <div className="space-y-4">
                                <div>
                                    {!isSidebarCollapsed && (
                                        <p className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Hệ Thống Doanh Nghiệp (MCMS)
                                        </p>
                                    )}
                                    <nav className="space-y-1">
                                        {ENTERPRISE_MODULES.map((item) => {
                                            const Icon = item.icon;
                                            const isActive = (activeEnterpriseSubsystem || 'projects') === item.id;

                                            if (onSelectEnterpriseSubsystem) {
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => {
                                                            onSelectEnterpriseSubsystem(item.id);
                                                            setIsMobileSidebarOpen(false);
                                                        }}
                                                        title={isSidebarCollapsed ? item.label : undefined}
                                                        className={`w-full rounded-lg text-xs font-semibold transition-all flex items-center cursor-pointer ${
                                                            isSidebarCollapsed
                                                                ? 'w-10 h-10 mx-auto justify-center'
                                                                : 'px-2.5 py-2 justify-between gap-2 text-left'
                                                        } ${
                                                            isActive
                                                                ? 'bg-blue-600 text-white shadow-xs font-bold'
                                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 truncate">
                                                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                                            {!isSidebarCollapsed && (
                                                                <div className="truncate">
                                                                    <div className="truncate text-xs leading-tight">{item.label}</div>
                                                                    <div className={`text-[9px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                                                        {item.sub}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {!isSidebarCollapsed && item.badge && (
                                                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                                                                isActive ? 'bg-white/20 text-white' : item.badgeColor
                                                            }`}>
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={item.href}
                                                    title={isSidebarCollapsed ? item.label : undefined}
                                                    className={`w-full rounded-lg text-xs font-semibold transition-all flex items-center ${
                                                        isSidebarCollapsed
                                                            ? 'w-10 h-10 mx-auto justify-center'
                                                            : 'px-2.5 py-2 justify-between gap-2'
                                                    } ${
                                                        isActive
                                                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                                        {!isSidebarCollapsed && (
                                                            <div className="truncate">
                                                                <div className="truncate text-xs leading-tight">{item.label}</div>
                                                                <div className={`text-[9px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                                                    {item.sub}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!isSidebarCollapsed && item.badge && (
                                                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                                                            isActive ? 'bg-white/20 text-white' : item.badgeColor
                                                        }`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </nav>
                                </div>

                                {/* Active Enterprise Projects Quick Access List */}
                                {allProjects.length > 0 && !isSidebarCollapsed && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between px-2 mb-1.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Dự Án Đang Chạy
                                            </p>
                                            <span className="text-[10px] text-blue-600 font-semibold">
                                                {allProjects.length}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {allProjects.slice(0, 5).map(p => (
                                                <Link
                                                    key={p.id}
                                                    href={`/projects/${p.id}`}
                                                    className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 transition-colors flex items-center justify-between gap-1 text-slate-700 hover:text-blue-700 group"
                                                >
                                                    <div className="truncate flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                        <span className="truncate text-xs font-medium">{p.name}</span>
                                                    </div>
                                                    <span className="font-mono text-[9px] text-slate-400 group-hover:text-blue-600 shrink-0">
                                                        P{p.current_phase_number}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. Global User Profile Footer */}
                    <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                                VT
                            </div>
                            {!isSidebarCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 truncate">Võ Hoàng Tú</p>
                                    <p className="text-[10px] text-slate-500 truncate">Lead Solution Architect</p>
                                </div>
                            )}
                            {!isSidebarCollapsed && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Trực tuyến • HMAC-SHA256 Active" />
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN APP WRAPPER */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* STICKY TOP SAAS APP HEADER */}
                <header className="sticky top-0 z-20 h-14 bg-white/80 border-b border-slate-200/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Mobile drawer toggle */}
                        <button
                            type="button"
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
                            aria-label="Mở Menu Điều Hướng"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Desktop sidebar collapse toggle */}
                        <button
                            type="button"
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                            title={isSidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
                        >
                            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                        </button>

                        {/* Unified Breadcrumbs */}
                        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                            <Link href="/projects" className="hover:text-blue-600 transition-colors font-medium hidden sm:inline shrink-0">
                                MCMS Enterprise
                            </Link>

                            {breadcrumbs && breadcrumbs.map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    <span className="text-slate-300">/</span>
                                    {crumb.href ? (
                                        <Link href={crumb.href} className="hover:text-blue-600 transition-colors font-medium truncate">
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="font-bold text-slate-900 truncate">
                                            {crumb.label}
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}

                            {!breadcrumbs && !isProjectContext && (
                                <>
                                    <span className="text-slate-300">/</span>
                                    <span className="font-bold text-slate-900 truncate">
                                        {ENTERPRISE_MODULES.find(m => m.id === activeEnterpriseSubsystem)?.label || 'Quản Trị Dự Án & SDLC'}
                                    </span>
                                </>
                            )}

                            {!breadcrumbs && isProjectContext && project && (
                                <>
                                    <span className="text-slate-300 hidden sm:inline">/</span>
                                    <Link href="/projects?tab=projects" className="hover:text-blue-600 transition-colors font-medium hidden sm:inline truncate">
                                        Quản Trị Dự Án & SDLC
                                    </Link>
                                    <span className="text-slate-300">/</span>
                                    <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[11px] border border-blue-200/60 shrink-0">
                                        {project.code}
                                    </span>
                                </>
                            )}
                        </nav>
                    </div>

                    {/* Right Header Actions & Global Controls */}
                    <div className="flex items-center gap-2">
                        {headerActions}
                    </div>
                </header>

                {/* SCROLLABLE WORKSPACE CANVAS */}
                <main id="main-content" className="flex-1 min-w-0 p-3 sm:p-5 overflow-y-auto">
                    {/* Flash Notifications */}
                    {flash?.success && (
                        <div className="mb-3 p-3 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-2xs animate-fade-in text-xs">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <p className="font-semibold">{flash.success}</p>
                            </div>
                        </div>
                    )}

                    {flash?.warning && (
                        <div className="mb-3 p-3 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-800 flex items-center justify-between shadow-2xs text-xs">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                                <p className="font-semibold">{flash.warning}</p>
                            </div>
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}
