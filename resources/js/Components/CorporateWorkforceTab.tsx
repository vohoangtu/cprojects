import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
    Users,
    ShieldCheck,
    Briefcase,
    Search,
    Filter,
    Layers,
    CheckCircle2,
    Clock,
    AlertTriangle,
    BadgeCheck,
    ExternalLink
} from 'lucide-react';

interface Project {
    id: number;
    name: string;
    code: string;
    current_phase_number: number;
    raciAssignments?: Array<{
        id: number;
        activity_name: string;
        phase_number: number;
        responsible: string;
        accountable: string;
        consulted?: string[];
        informed?: string[];
    }>;
}

interface CorporateWorkforceTabProps {
    projects: Project[];
}

interface Personnel {
    id: string;
    name: string;
    role: string;
    dept: string;
    avatar: string;
    projectsCount: number;
    loadPercentage: number;
    skills: string[];
    status: 'optimal' | 'heavy' | 'overloaded';
}

const KEY_PERSONNEL: Personnel[] = [
    {
        id: 'user-1',
        name: 'Võ Hoàng Tú',
        role: 'Lead Solution Architect',
        dept: 'Khối Kiến Trúc & Công Nghệ',
        avatar: 'VT',
        projectsCount: 3,
        loadPercentage: 85,
        skills: ['Enterprise Arch', 'C4 Model', 'HMAC Security', 'Cloud Native'],
        status: 'optimal'
    },
    {
        id: 'user-2',
        name: 'Nguyễn Minh Trí',
        role: 'Senior Tech Lead / Backend',
        dept: 'Trung Tâm Phát Triển Phần Mềm',
        avatar: 'MT',
        projectsCount: 2,
        loadPercentage: 90,
        skills: ['Laravel 12', 'Microservices', 'High-throughput API', 'PostgreSQL'],
        status: 'heavy'
    },
    {
        id: 'user-3',
        name: 'Lê Thanh Hằng',
        role: 'QA Lead & Automation Specialist',
        dept: 'Trung Tâm Đảm Bảo Chất Lượng (QA/QC)',
        avatar: 'TH',
        projectsCount: 3,
        loadPercentage: 75,
        skills: ['Playwright', 'Security SAST', 'ISO 12207 Audit', 'Regression Suite'],
        status: 'optimal'
    },
    {
        id: 'user-4',
        name: 'Trần Quốc Tuấn',
        role: 'DevOps & SRE Lead',
        dept: 'Khối Vận Hành Hệ Thống (Operations)',
        avatar: 'QT',
        projectsCount: 4,
        loadPercentage: 98,
        skills: ['Kubernetes', 'CI/CD Pipelines', 'Canary Rollout', 'SLA 99.95%'],
        status: 'overloaded'
    },
    {
        id: 'user-5',
        name: 'Phạm Hải Nam',
        role: 'Senior Technical Project Manager',
        dept: 'Văn Phòng Quản Trị Dự Án (PMO)',
        avatar: 'HN',
        projectsCount: 2,
        loadPercentage: 70,
        skills: ['Agile / Scrum', 'RACI Matrix', 'Risk Management', 'Stakeholders'],
        status: 'optimal'
    },
];

export const CorporateWorkforceTab: React.FC<CorporateWorkforceTabProps> = ({ projects }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProject, setSelectedProject] = useState<string>('all');

    // Aggregate RACI assignments across all loaded projects
    const allRaci = useMemo(() => {
        const list: Array<{
            id: number;
            projectName: string;
            projectCode: string;
            projectId: number;
            activity: string;
            phaseNum: number;
            responsible: string;
            accountable: string;
            consulted?: string[];
            informed?: string[];
        }> = [];

        projects.forEach(p => {
            if (p.raciAssignments && p.raciAssignments.length > 0) {
                p.raciAssignments.forEach(r => {
                    list.push({
                        id: r.id,
                        projectName: p.name,
                        projectCode: p.code,
                        projectId: p.id,
                        activity: r.activity_name,
                        phaseNum: r.phase_number,
                        responsible: r.responsible,
                        accountable: r.accountable,
                        consulted: r.consulted,
                        informed: r.informed,
                    });
                });
            }
        });

        return list;
    }, [projects]);

    const filteredRaci = useMemo(() => {
        return allRaci.filter(item => {
            if (selectedProject !== 'all' && item.projectCode !== selectedProject) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchAct = item.activity.toLowerCase().includes(q);
                const matchR = item.responsible.toLowerCase().includes(q);
                const matchA = item.accountable.toLowerCase().includes(q);
                const matchP = item.projectName.toLowerCase().includes(q);
                if (!matchAct && !matchR && !matchA && !matchP) return false;
            }
            return true;
        });
    }, [allRaci, selectedProject, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                            Khối Nguồn Lực & Nhân Sự CNTT (Workforce Management)
                        </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Quản Trị Đội Ngũ & Phân Định Trách Nhiệm RACI
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Theo dõi năng lực nhân sự chủ chốt, tỷ lệ tải trọng công việc và ma trận trách nhiệm RACI xuyên suốt danh mục dự án.
                    </p>
                </div>
            </div>

            {/* Personnel Capacity Overview Cards */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Đội Ngũ Nhân Sự Trọng Yếu & Tải Trọng Dự Án
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {KEY_PERSONNEL.map(person => {
                        const isOverloaded = person.status === 'overloaded';
                        const isHeavy = person.status === 'heavy';

                        return (
                            <div key={person.id} className="fluent-card p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                                                {person.avatar}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-slate-900 truncate">{person.name}</h4>
                                                <p className="text-[10px] text-slate-500 truncate">{person.role}</p>
                                            </div>
                                        </div>

                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                            isOverloaded
                                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                : isHeavy
                                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        }`}>
                                            {isOverloaded ? 'Quá Tải' : isHeavy ? 'Tải Cao' : 'Tối Ưu'}
                                        </span>
                                    </div>

                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-500">Tải trọng phân bổ</span>
                                            <span className={`font-mono font-bold ${isOverloaded ? 'text-rose-600' : isHeavy ? 'text-amber-600' : 'text-slate-700'}`}>
                                                {person.loadPercentage}% ({person.projectsCount} dự án)
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    isOverloaded ? 'bg-rose-500' : isHeavy ? 'bg-amber-500' : 'bg-blue-600'
                                                }`}
                                                style={{ width: `${Math.min(person.loadPercentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {person.skills.map((skill, sIdx) => (
                                            <span key={sIdx} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400">
                                    {person.dept}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cross-Project RACI Responsibility Matrix */}
            <div className="fluent-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-indigo-600" />
                            Ma Trận Phân Định Trách Nhiệm RACI Toàn Doanh Nghiệp
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            R (Responsible - Thực hiện), A (Accountable - Chịu trách nhiệm), C (Consulted - Tham vấn), I (Informed - Thông báo)
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm hoạt động, nhân sự..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                            />
                        </div>

                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            aria-label="Lọc theo dự án"
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả dự án ({projects.length})</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.code}>{p.code} - {p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {filteredRaci.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="py-2.5 px-3">Dự Án</th>
                                    <th className="py-2.5 px-3">Pha SDLC</th>
                                    <th className="py-2.5 px-3">Hoạt Động Kỹ Thuật</th>
                                    <th className="py-2.5 px-3">Responsible (R)</th>
                                    <th className="py-2.5 px-3">Accountable (A)</th>
                                    <th className="py-2.5 px-3">Consulted (C)</th>
                                    <th className="py-2.5 px-3">Informed (I)</th>
                                    <th className="py-2.5 px-3 text-right">Chi Tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRaci.map(item => (
                                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                                            <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] mr-1.5">
                                                {item.projectCode}
                                            </span>
                                            <span className="truncate max-w-[140px] inline-block align-middle">{item.projectName}</span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                                                Pha {item.phaseNum}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-medium text-slate-900">
                                            {item.activity}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                                {item.responsible}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                                                {item.accountable}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                            {Array.isArray(item.consulted) ? item.consulted.join(', ') : (item.consulted || '-')}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                            {Array.isArray(item.informed) ? item.informed.join(', ') : (item.informed || '-')}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <Link
                                                href={`/projects/${item.projectId}?tab=raci`}
                                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 inline-block transition-colors"
                                                title="Mở phân hệ RACI dự án"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-600">Không tìm thấy phân công RACI phù hợp</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Thử đổi điều kiện tìm kiếm hoặc chọn dự án khác</p>
                    </div>
                )}
            </div>
        </div>
    );
};
