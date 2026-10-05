import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
    Activity,
    ServerCrash,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Cpu,
    ArrowUpRight,
    ExternalLink,
    Filter,
    Search
} from 'lucide-react';

interface ProductionIncident {
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
    project?: {
        id: number;
        name: string;
        code: string;
    };
}

interface CorporateOperationsTabProps {
    incidents?: ProductionIncident[];
    projects: Array<{
        id: number;
        name: string;
        code: string;
        current_phase_number: number;
        productionIncidents?: ProductionIncident[];
    }>;
}

const LIVE_SERVICES = [
    { name: 'Core Banking Integration API', endpoint: 'api.enterprise.mcms/v2', uptime: 99.99, latency: '42ms', status: 'operational' },
    { name: 'Payment Gateway Hub (PCI-DSS)', endpoint: 'pay.enterprise.mcms/checkout', uptime: 99.98, latency: '68ms', status: 'operational' },
    { name: 'OAuth2 / HMAC Identity Vault', endpoint: 'auth.enterprise.mcms/tokens', uptime: 100.0, latency: '18ms', status: 'operational' },
    { name: 'Webhook & Event Dispatcher', endpoint: 'events.enterprise.mcms/stream', uptime: 99.95, latency: '95ms', status: 'operational' },
];

export const CorporateOperationsTab: React.FC<CorporateOperationsTabProps> = ({ incidents = [], projects }) => {
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Combine loaded incidents from props and projects
    const allIncidents = useMemo(() => {
        const list: ProductionIncident[] = [...incidents];
        projects.forEach(p => {
            if (p.productionIncidents) {
                p.productionIncidents.forEach(inc => {
                    if (!list.some(existing => existing.id === inc.id)) {
                        list.push({ ...inc, project: { id: p.id, name: p.name, code: p.code } });
                    }
                });
            }
        });
        return list;
    }, [incidents, projects]);

    const filteredIncidents = useMemo(() => {
        return allIncidents.filter(inc => {
            if (severityFilter !== 'all' && inc.severity.toLowerCase() !== severityFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchCode = inc.incident_code.toLowerCase().includes(q);
                const matchTitle = inc.title.toLowerCase().includes(q);
                const matchProj = inc.project?.name.toLowerCase().includes(q) || inc.project?.code.toLowerCase().includes(q);
                if (!matchCode && !matchTitle && !matchProj) return false;
            }
            return true;
        });
    }, [allIncidents, severityFilter, searchQuery]);

    const totalDowntime = allIncidents.reduce((acc, i) => acc + (i.downtime_minutes || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                            Khối Vận Hành & Khả Dụng Hệ Thống (Operations & SRE)
                        </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Trung Tâm Giám Sát Vận Hành & Cam Kết SLA Doanh Nghiệp
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Theo dõi thời gian hoạt động trực tuyến (Uptime), chỉ số MTTR/MTTD và nhật ký sự cố sản xuất toàn công ty.
                    </p>
                </div>
            </div>

            {/* Core Services Uptime Radar */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Hệ Thống Dịch Vụ Cốt Lõi Đang Phục Vụ Sản Xuất
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {LIVE_SERVICES.map((srv, idx) => (
                        <div key={idx} className="fluent-card p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {srv.name}
                                </span>
                            </div>
                            <p className="font-mono text-[10px] text-slate-400 truncate mb-3">{srv.endpoint}</p>
                            <div className="flex items-baseline justify-between">
                                <span className="text-xl font-extrabold text-slate-900 font-mono">{srv.uptime}%</span>
                                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    {srv.latency}
                                </span>
                            </div>
                            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${srv.uptime}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Operational Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="fluent-card p-4.5">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Chỉ Số SLA Toàn Tập Đoàn</span>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">99.98%</span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Mục tiêu: 99.95%
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Tổng downtime lũy kế: {totalDowntime} phút</p>
                </div>

                <div className="fluent-card p-4.5">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Thời Gian Khắc Phục (MTTR)</span>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">24 phút</span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            Dưới chuẩn 30p
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Quy trình ứng cứu sự cố tự động</p>
                </div>

                <div className="fluent-card p-4.5">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">Thời Gian Phát Hiện (MTTD)</span>
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                            <Cpu className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">3.2 phút</span>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            Giám sát thời gian thực
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Tích hợp Webhook & Synthetic Monitoring</p>
                </div>
            </div>

            {/* Production Incidents Log Table */}
            <div className="fluent-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <ServerCrash className="w-4 h-4 text-rose-600" />
                            Nhật Ký Sự Cố Sản Xuất & Hậu Kiểm (Post-Mortem Log)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Ghi nhận minh bạch nguyên nhân gốc rễ và hành động khắc phục phòng ngừa tái diễn
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm mã sự cố, dự án..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                            />
                        </div>

                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            aria-label="Lọc theo mức độ nghiêm trọng"
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả mức độ</option>
                            <option value="p1">P1 - Khẩn cấp / Gián đoạn</option>
                            <option value="p2">P2 - Nghiêm trọng</option>
                            <option value="p3">P3 - Vừa phải</option>
                        </select>
                    </div>
                </div>

                {filteredIncidents.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="py-2.5 px-3">Mã Sự Cố</th>
                                    <th className="py-2.5 px-3">Dự Án</th>
                                    <th className="py-2.5 px-3">Tiêu Đề & Mô Tả</th>
                                    <th className="py-2.5 px-3">Mức Độ</th>
                                    <th className="py-2.5 px-3">Gián Đoạn</th>
                                    <th className="py-2.5 px-3">Trạng Thái</th>
                                    <th className="py-2.5 px-3">Nguyên Nhân & Khắc Phục</th>
                                    <th className="py-2.5 px-3 text-right">Chi Tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredIncidents.map(inc => {
                                    const isP1 = inc.severity.toLowerCase() === 'p1';
                                    const isP2 = inc.severity.toLowerCase() === 'p2';

                                    return (
                                        <tr key={inc.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                                {inc.incident_code}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                {inc.project ? (
                                                    <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                                                        {inc.project.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[220px] truncate" title={inc.title}>
                                                {inc.title}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                    isP1
                                                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                        : isP2
                                                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {inc.severity.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                                                {inc.downtime_minutes}m
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                                    {inc.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[200px] truncate" title={inc.root_cause || inc.corrective_actions}>
                                                {inc.root_cause || inc.corrective_actions || 'Đang thẩm định Post-Mortem'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                {inc.project && (
                                                    <Link
                                                        href={`/projects/${inc.project.id}?tab=defects`}
                                                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 inline-block transition-colors"
                                                        title="Xem tại phân hệ dự án"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-700">Không có sự cố sản xuất nào ghi nhận</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tất cả các dịch vụ đang hoạt động ổn định và đạt chuẩn SLA</p>
                    </div>
                )}
            </div>
        </div>
    );
};
