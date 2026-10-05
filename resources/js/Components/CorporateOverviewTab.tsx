import React from 'react';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    Layers,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ShieldCheck,
    DollarSign,
    Zap,
    TrendingUp,
    Building2,
    Calendar,
    ArrowRight,
    Award,
    Activity,
    FileSpreadsheet,
    Plus
} from 'lucide-react';

interface Project {
    id: number;
    name: string;
    code: string;
    client_name: string;
    project_type: string;
    status: string;
    current_phase_number: number;
    health_status: string;
    budget: number;
    target_delivery_date?: string;
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
}

interface CorporateOverviewTabProps {
    projects: Project[];
    onSelectSubsystem: (subsystem: string) => void;
    onOpenCreateModal: () => void;
    onOpenDossier: () => void;
}

const PHASE_NAMES = [
    'P1: Yêu cầu (SRS)',
    'P2: Kiến trúc (SAD)',
    'P3: Kế hoạch (WBS)',
    'P4: Lập trình (Dev)',
    'P5: Kiểm thử (QA)',
    'P6: Phát hành (CAB)',
    'P7: Hậu kiểm (SLA)'
];

export const CorporateOverviewTab: React.FC<CorporateOverviewTabProps> = ({
    projects,
    onSelectSubsystem,
    onOpenCreateModal,
    onOpenDossier,
}) => {
    const totalBudget = projects.reduce((acc, p) => acc + Number(p.budget), 0);
    const healthyProjects = projects.filter(p => p.health_status === 'healthy');
    const warningProjects = projects.filter(p => p.health_status !== 'healthy');
    const totalGates = projects.reduce((acc, p) => acc + (p.quality_gates?.length || 0), 0);
    const passedGates = projects.reduce((acc, p) => acc + (p.quality_gates?.filter(g => g.status === 'passed').length || 0), 0);
    const gatePassRate = totalGates > 0 ? Math.round((passedGates / totalGates) * 100) : 100;

    // Phase distribution counts
    const phaseDistribution = [0, 0, 0, 0, 0, 0, 0];
    projects.forEach(p => {
        if (p.current_phase_number >= 1 && p.current_phase_number <= 7) {
            phaseDistribution[p.current_phase_number - 1]++;
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Executive Hero */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white relative overflow-hidden shadow-md">
                <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" />
                                MCMS 2026 • Ban Điều Hành CNTT Tập Đoàn
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Tổng Quan Năng Lực & Hoạt Động Doanh Nghiệp
                        </h1>
                        <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                            Báo cáo hợp nhất danh mục dự án phần mềm, tiến độ 7 pha SDLC chuẩn mực, chỉ số tuân thủ ISO/IEC 12207 và cam kết SLA vận hành toàn công ty.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={onOpenDossier}
                            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/10 flex items-center gap-2 cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-purple-300" />
                            Xuất Hồ Sơ SDLC Cty
                        </button>
                        <button
                            type="button"
                            onClick={onOpenCreateModal}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Khởi Tạo Dự Án Mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Top Corporate KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="fluent-card p-4.5">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Tổng Ngân Sách Phân Bổ</span>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(totalBudget)}</span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {projects.length} Dự án
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Đầu tư chuyển đổi số & FinTech Core</p>
                </div>

                <div className="fluent-card p-4.5">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Tốc Độ Giao Hàng (Velocity)</span>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">94.8%</span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            On-Time
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Dựa trên cam kết bàn giao Sprint & CAB</p>
                </div>

                <div className="fluent-card p-4.5">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Đạt Cổng Chất Lượng</span>
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                            <Award className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">{gatePassRate}%</span>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {passedGates}/{totalGates} Cổng
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Chữ ký số bất biến HMAC-SHA256</p>
                </div>

                <div className="fluent-card p-4.5">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">SLA Sẵn Sàng Hệ Thống</span>
                        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">99.98%</span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Target: 99.95%
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">MTTR trung bình: 24 phút</p>
                </div>
            </div>

            {/* 7-Phase Enterprise Funnel & Risk Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SDLC 7-Phase Delivery Funnel */}
                <div className="lg:col-span-2 fluent-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-600" />
                                Phân Bố 7 Pha Kỹ Thuật Toàn Doanh Nghiệp
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Trạng thái các dự án phân bổ theo các giai đoạn vòng đời phần mềm SDLC
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onSelectSubsystem('projects')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                            Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {PHASE_NAMES.map((name, idx) => {
                            const count = phaseDistribution[idx];
                            const pct = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0;
                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700">{name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-slate-900">{count} dự án</span>
                                            <span className="text-slate-400 text-[10px]">({pct}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                                        <div
                                            className={`h-full transition-all duration-500 rounded-full ${
                                                idx === 0 ? 'bg-amber-500' :
                                                idx === 1 ? 'bg-indigo-500' :
                                                idx === 2 ? 'bg-cyan-500' :
                                                idx === 3 ? 'bg-blue-600' :
                                                idx === 4 ? 'bg-purple-600' :
                                                idx === 5 ? 'bg-rose-500' : 'bg-emerald-600'
                                            }`}
                                            style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Corporate Risk Radar & Health Status */}
                <div className="fluent-card p-5 flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Sức Khỏe Danh Mục & Điểm Nghẽn
                        </h2>
                        <p className="text-xs text-slate-500 mb-4">
                            Đánh giá rủi ro định kỳ theo chuẩn ISO 12207
                        </p>

                        <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <div>
                                        <div className="text-xs font-bold text-slate-800">Dự án Khỏe Mạnh</div>
                                        <div className="text-[10px] text-slate-500">Tiến độ và chất lượng đạt chuẩn</div>
                                    </div>
                                </div>
                                <span className="text-base font-extrabold text-emerald-700 font-mono">
                                    {healthyProjects.length}
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <div>
                                        <div className="text-xs font-bold text-slate-800">Cần Lưu Ý / Cảnh Báo</div>
                                        <div className="text-[10px] text-slate-500">Có điểm nghẽn tại Cổng hoặc Defect</div>
                                    </div>
                                </div>
                                <span className="text-base font-extrabold text-amber-700 font-mono">
                                    {warningProjects.length}
                                </span>
                            </div>
                        </div>

                        {warningProjects.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Dự án cần can thiệp điều hành:
                                </p>
                                <div className="space-y-1.5">
                                    {warningProjects.slice(0, 3).map(p => (
                                        <Link
                                            key={p.id}
                                            href={`/projects/${p.id}`}
                                            className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors flex items-center justify-between text-xs text-slate-700 hover:text-blue-700 font-semibold"
                                        >
                                            <span className="truncate">{p.name} ({p.code})</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                                                Pha {p.current_phase_number}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => onSelectSubsystem('compliance')}
                            className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            Mở Trung Tâm Tuân Thủ Doanh Nghiệp
                        </button>
                    </div>
                </div>
            </div>

            {/* Strategic Corporate OKRs */}
            <div className="fluent-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            Mục Tiêu Chiến Lược CNTT & OKR 2026
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Các cam kết trọng yếu của Khối Công nghệ thông tin đối với Hội đồng Quản trị
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                OKR 1 • Chất Lượng
                            </span>
                            <span className="text-xs font-bold text-emerald-600">96%</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            100% Cổng Chất Lượng Ký Số Bất Biến
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Mọi pha kỹ thuật phải có chữ ký HMAC-SHA256 trước khi kích hoạt pha tiếp theo.
                        </p>
                        <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '96%' }} />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                OKR 2 • Phát Hành
                            </span>
                            <span className="text-xs font-bold text-blue-600">88%</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            Zero-Downtime Rollout qua Hội Đồng CAB
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Triển khai chiến lược Canary 10% - 100% không ảnh hưởng khách hàng giao dịch.
                        </p>
                        <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '88%' }} />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                OKR 3 • Tuân Thủ
                            </span>
                            <span className="text-xs font-bold text-purple-600">100%</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            Chứng Nhận ISO/IEC 12207 & PCI-DSS
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Kiểm tra tuân thủ tự động toàn chuỗi từ tài liệu BRD đến mã nguồn triển khai.
                        </p>
                        <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5">
                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '100%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
