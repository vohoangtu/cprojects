import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Plus,
    Layers,
    GitPullRequest,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    ExternalLink,
    User,
    Calendar,
    Sparkles,
    Filter,
    Check,
    ArrowRight
} from 'lucide-react';

interface ProjectTask {
    id: number;
    project_id: number;
    sprint_id?: number;
    rtm_trace_id?: number;
    task_code: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'code_review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    story_points: number;
    assigned_to?: string;
    github_pr_url?: string;
    completed_at?: string;
    rtm_trace?: {
        id: number;
        req_code: string;
        req_title: string;
    };
}

interface Sprint {
    id: number;
    project_id: number;
    name: string;
    goal?: string;
    start_date?: string;
    end_date?: string;
    status: 'planned' | 'active' | 'completed';
    total_story_points: number;
    completed_story_points: number;
    tasks?: ProjectTask[];
}

interface RTM {
    id: number;
    req_code: string;
    req_title: string;
}

interface KanbanBoardProps {
    projectId: number;
    sprints: Sprint[];
    tasks: ProjectTask[];
    rtmTraces: RTM[];
}

const COLUMNS = [
    { key: 'todo', label: 'Chờ thực hiện', color: 'border-slate-300 text-slate-700 bg-slate-50/70', badge: 'bg-slate-200 text-slate-700' },
    { key: 'in_progress', label: 'Đang lập trình', color: 'border-blue-400 text-blue-700 bg-blue-50/70', badge: 'bg-blue-100 text-blue-800' },
    { key: 'code_review', label: 'Review mã nguồn', color: 'border-amber-400 text-amber-700 bg-amber-50/70', badge: 'bg-amber-100 text-amber-800' },
    { key: 'done', label: 'Đã hoàn thành', color: 'border-emerald-400 text-emerald-700 bg-emerald-50/70', badge: 'bg-emerald-100 text-emerald-800' },
] as const;

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
    projectId,
    sprints,
    tasks = [],
    rtmTraces = [],
}) => {
    const [selectedSprintId, setSelectedSprintId] = useState<number | 'all'>(
        sprints.length > 0 ? sprints[0].id : 'all'
    );
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [prModalTaskId, setPrModalTaskId] = useState<number | null>(null);
    const [prUrlInput, setPrUrlInput] = useState('');
    const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

    const handleAiGenerateTasks = () => {
        setIsGeneratingTasks(true);
        router.post(`/projects/${projectId}/ai-generate-tasks`, {}, {
            preserveScroll: true,
            onFinish: () => setIsGeneratingTasks(false),
        });
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        task_code: `TSK-${tasks.length + 101}`,
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        story_points: 3,
        assigned_to: 'Võ Hoàng Tú',
        sprint_id: typeof selectedSprintId === 'number' ? selectedSprintId : (sprints[0]?.id || ''),
        rtm_trace_id: '',
        github_pr_url: '',
    });

    const filteredTasks = tasks.filter((t) => {
        if (selectedSprintId === 'all') return true;
        return t.sprint_id === selectedSprintId;
    });

    const activeSprint = sprints.find((s) => s.id === selectedSprintId);

    const totalPoints = filteredTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
    const donePoints = filteredTasks
        .filter((t) => t.status === 'done')
        .reduce((acc, t) => acc + (t.story_points || 0), 0);
    const progressPercent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

    const handleStatusChange = (taskId: number, newStatus: string, prUrl?: string) => {
        router.post(
            `/tasks/${taskId}/status`,
            {
                status: newStatus,
                github_pr_url: prUrl,
            },
            {
                preserveScroll: true,
            }
        );
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/projects/${projectId}/tasks`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">Khẩn cấp</span>;
            case 'high':
                return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700 border border-orange-200">Cao</span>;
            case 'medium':
                return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">Vừa</span>;
            default:
                return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Thấp</span>;
        }
    };

    return (
        <div className="space-y-3.5">
            {/* Header Toolbar & Sprint Selector (Semantic <header>) */}
            <header className="fluent-compact-card p-3 sm:p-3.5 border border-white/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-extrabold text-slate-800">Sprint & Kanban Board</h3>
                    </div>
                    {/* Sprint Dropdown */}
                    <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-500">Sprint:</label>
                        <select
                            value={selectedSprintId}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedSprintId(val === 'all' ? 'all' : Number(val));
                            }}
                            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-slate-700"
                        >
                            <option value="all">Tất cả Sprints ({tasks.length} tasks)</option>
                            {sprints.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.status.toUpperCase()})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Velocity & Story Points Progress */}
                    <div className="flex items-center gap-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg px-3 py-1.5">
                        <div className="text-right">
                            <div className="text-xs font-bold text-indigo-900 leading-tight">
                                {donePoints}/{totalPoints} SP
                            </div>
                            <div className="text-[10px] text-indigo-600 font-semibold">{progressPercent}% Velocity</div>
                        </div>
                        <div className="w-16 bg-indigo-200/70 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-indigo-600 to-blue-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAiGenerateTasks}
                        disabled={isGeneratingTasks}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white hover:opacity-95 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="AI tự động phân rã các gói công việc WBS thành Agile Sprint tasks"
                    >
                        <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isGeneratingTasks ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingTasks ? 'Đang Phân Rã...' : '⚡ AI Phân Rã Tasks'}</span>
                    </button>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Tạo Task Mới
                    </button>
                </div>
            </header>

            {/* Sprint Goal Banner if active */}
            {activeSprint && (
                <div className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-white border border-indigo-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-indigo-900 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate"><strong>Mục tiêu:</strong> {activeSprint.goal || 'Tập trung hoàn thành các tính năng lõi và liên kết RTM.'}</span>
                    </div>
                    {activeSprint.start_date && (
                        <div className="text-slate-500 flex items-center gap-1 font-mono text-[11px] shrink-0 ml-2">
                            <Calendar className="w-3 h-3" />
                            {activeSprint.start_date} → {activeSprint.end_date}
                        </div>
                    )}
                </div>
            )}

            {/* 4 Kanban Columns (Semantic <section>) */}
            <section aria-label="Bảng phân phối tác vụ Agile Kanban" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {COLUMNS.map((col) => {
                    const colTasks = filteredTasks.filter((t) => t.status === col.key);
                    const colPoints = colTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);

                    return (
                        <div
                            key={col.key}
                            className="flex flex-col bg-slate-50/70 rounded-xl border border-slate-200/80 p-2.5 min-h-[460px]"
                        >
                            {/* Column Header (Semantic <header>) */}
                            <header className="flex items-center justify-between px-1.5 py-1.5 mb-2 border-b border-slate-200/60">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800">{col.label}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${col.badge}`}>
                                        {colTasks.length}
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                                    {colPoints} SP
                                </span>
                            </header>

                            {/* Task Cards Container */}
                            <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                                {colTasks.map((task) => (
                                    <article
                                        key={task.id}
                                        className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all space-y-2 group"
                                    >
                                        {/* Card Top: Code, Points & Priority (Semantic <header>) */}
                                        <header className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                                    {task.task_code}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                                    {task.story_points} SP
                                                </span>
                                            </div>
                                            {getPriorityBadge(task.priority)}
                                        </header>

                                        {/* Title & Description */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                {task.title}
                                            </h4>
                                            {task.description && (
                                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* RTM Trace Link Chip */}
                                        {task.rtm_trace && (
                                            <div className="text-[10px] font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200/70 px-2 py-0.5 rounded flex items-center justify-between">
                                                <span className="truncate">RTM: {task.rtm_trace.req_code} - {task.rtm_trace.req_title}</span>
                                            </div>
                                        )}

                                        {/* GitHub PR URL */}
                                        {task.github_pr_url && (
                                            <a
                                                href={task.github_pr_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 truncate"
                                            >
                                                <GitPullRequest className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{task.github_pr_url}</span>
                                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                            </a>
                                        )}

                                        {/* Footer: Assignee & Action Buttons (Semantic <footer>) */}
                                        <footer className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                                <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">
                                                    {task.assigned_to ? task.assigned_to.charAt(0) : 'U'}
                                                </div>
                                                <span className="truncate max-w-[85px] text-[11px]">{task.assigned_to || 'Chưa gán'}</span>
                                            </div>

                                            {/* Column Step Shift Buttons */}
                                            <div className="flex items-center gap-1">
                                                {col.key === 'todo' && (
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                                                        className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
                                                        title="Bắt đầu Code"
                                                    >
                                                        Bắt đầu <ArrowRight className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                                {col.key === 'in_progress' && (
                                                    <button
                                                        onClick={() => {
                                                            setPrModalTaskId(task.id);
                                                            setPrUrlInput(task.github_pr_url || '');
                                                        }}
                                                        className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
                                                        title="Gửi PR Review"
                                                    >
                                                        Review <ArrowRight className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                                {col.key === 'code_review' && (
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, 'done')}
                                                        className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
                                                        title="Hoàn thành task"
                                                    >
                                                        <Check className="w-3 h-3" /> Done
                                                    </button>
                                                )}
                                                {col.key === 'done' && (
                                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Xong
                                                    </span>
                                                )}
                                            </div>
                                        </footer>
                                    </article>
                                ))}

                                {colTasks.length === 0 && (
                                    <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
                                        Không có task nào
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* Modal: Gửi PR Link khi chuyển sang Code Review */}
            {prModalTaskId && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2">
                            <GitPullRequest className="w-5 h-5 text-amber-600" />
                            <h4 className="text-base font-bold text-slate-800">Chuyển sang Code Review</h4>
                        </div>
                        <p className="text-xs text-slate-600">
                            Nhập đường dẫn GitHub Pull Request để truy vết mã nguồn vào ma trận RTM:
                        </p>
                        <input
                            type="url"
                            value={prUrlInput}
                            onChange={(e) => setPrUrlInput(e.target.value)}
                            placeholder="https://github.com/techcorp/banking-core/pull/142"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setPrModalTaskId(null)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    handleStatusChange(prModalTaskId, 'code_review', prUrlInput);
                                    setPrModalTaskId(null);
                                }}
                                className="px-4 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-xs"
                            >
                                Xác nhận chuyển
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Tạo Task Mới */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-base font-bold text-slate-800">Tạo Task Agile Mới</h3>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Mã Task *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.task_code}
                                        onChange={(e) => setData('task_code', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    {errors.task_code && <span className="text-rose-600">{errors.task_code}</span>}
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Story Points *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        required
                                        value={data.story_points}
                                        onChange={(e) => setData('story_points', Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Tiêu đề Task *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Hiện thực hóa API chuyển khoản liên ngân hàng..."
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                {errors.title && <span className="text-rose-600">{errors.title}</span>}
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Mô tả chi tiết</label>
                                <textarea
                                    rows={2}
                                    placeholder="Các yêu cầu kỹ thuật, tiêu chí chấp thuận..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Sprint</label>
                                    <select
                                        value={data.sprint_id}
                                        onChange={(e) => setData('sprint_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="">Không gán Sprint</option>
                                        {sprints.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Độ ưu tiên</label>
                                    <select
                                        value={data.priority}
                                        onChange={(e) => setData('priority', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="low">Thấp</option>
                                        <option value="medium">Vừa</option>
                                        <option value="high">Cao</option>
                                        <option value="urgent">Khẩn cấp</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Người thực hiện</label>
                                    <input
                                        type="text"
                                        value={data.assigned_to}
                                        onChange={(e) => setData('assigned_to', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Liên kết RTM</label>
                                    <select
                                        value={data.rtm_trace_id}
                                        onChange={(e) => setData('rtm_trace_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="">-- Chọn yêu cầu RTM --</option>
                                        {rtmTraces.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.req_code}: {r.req_title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xs disabled:opacity-50"
                                >
                                    {processing ? 'Đang tạo...' : 'Tạo Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
