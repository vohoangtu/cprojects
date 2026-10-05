import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Bug,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Plus,
    ShieldAlert,
    ExternalLink,
    Filter,
    Check,
    RotateCcw,
    Sparkles,
    Lock
} from 'lucide-react';

interface Defect {
    id: number;
    defect_code: string;
    title: string;
    severity: string;
    status: string;
}

interface TestRunItem {
    id: number;
    test_run_id: number;
    rtm_trace_id?: number;
    defect_id?: number;
    test_case_code: string;
    title: string;
    steps_to_reproduce?: string;
    expected_result?: string;
    actual_result?: string;
    status: 'pending' | 'passed' | 'failed' | 'blocked' | 'skipped';
    tested_by?: string;
    tested_at?: string;
    defect?: Defect;
    rtm_trace?: {
        id: number;
        req_code: string;
        req_title: string;
    };
}

interface TestRun {
    id: number;
    project_id: number;
    name: string;
    environment: 'staging' | 'uat' | 'performance' | 'production';
    release_version?: string;
    status: 'draft' | 'in_progress' | 'completed' | 'aborted';
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    blocked_tests: number;
    created_at: string;
    items?: TestRunItem[];
}

interface TestRunManagerProps {
    projectId: number;
    testRuns: TestRun[];
}

export const TestRunManager: React.FC<TestRunManagerProps> = ({
    projectId,
    testRuns = [],
}) => {
    const [selectedRunId, setSelectedRunId] = useState<number | null>(
        testRuns.length > 0 ? testRuns[0].id : null
    );
    const [isCreateRunModalOpen, setIsCreateRunModalOpen] = useState(false);
    const [defectModalItem, setDefectModalItem] = useState<TestRunItem | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isGeneratingTestSuite, setIsGeneratingTestSuite] = useState(false);

    const handleAiGenerateTestSuite = () => {
        setIsGeneratingTestSuite(true);
        router.post(`/projects/${projectId}/ai-generate-test-run`, {}, {
            preserveScroll: true,
            onFinish: () => setIsGeneratingTestSuite(false),
        });
    };

    const activeRun = testRuns.find((r) => r.id === selectedRunId) || testRuns[0];
    const items = activeRun?.items || [];

    const filteredItems = items.filter((item) => {
        if (filterStatus === 'all') return true;
        return item.status === filterStatus;
    });

    // Form Tạo Test Run
    const { data: runData, setData: setRunData, post: postRun, processing: creatingRun, reset: resetRun } = useForm({
        name: `Test Run Staging v${new Date().toLocaleDateString('vi-VN').replace(/\//g, '.')}`,
        environment: 'staging',
        release_version: 'v2.4.0',
        auto_populate_rtm: true,
    });

    // Form 1-Click Convert Defect
    const { data: defectData, setData: setDefectData, post: postDefect, processing: convertingDefect } = useForm({
        severity: 'critical',
        assigned_to: 'Võ Hoàng Tú',
    });

    const handleExecuteItem = (itemId: number, newStatus: string, actualResult?: string) => {
        router.post(
            `/test-items/${itemId}/execute`,
            {
                status: newStatus,
                actual_result: actualResult || `Thực thi ghi nhận lúc ${new Date().toLocaleTimeString('vi-VN')}`,
            },
            {
                preserveScroll: true,
            }
        );
    };

    const handleCreateRun = (e: React.FormEvent) => {
        e.preventDefault();
        postRun(`/projects/${projectId}/test-runs`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateRunModalOpen(false);
                resetRun();
            },
        });
    };

    const handleConvertDefect = (e: React.FormEvent) => {
        e.preventDefault();
        if (!defectModalItem) return;

        postDefect(`/test-items/${defectModalItem.id}/convert-defect`, {
            preserveScroll: true,
            onSuccess: () => {
                setDefectModalItem(null);
            },
        });
    };

    const totalCount = activeRun?.total_tests || 0;
    const passedCount = activeRun?.passed_tests || 0;
    const failedCount = activeRun?.failed_tests || 0;
    const blockedCount = activeRun?.blocked_tests || 0;
    const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-3.5">
            {/* Header Toolbar (Semantic <header>) */}
            <header className="fluent-compact-card p-3 sm:p-3.5 border border-white/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Bug className="w-4 h-4 text-rose-600" />
                        <h3 className="text-sm font-extrabold text-slate-800">Test Runs & 1-Click Defect Hub</h3>
                    </div>

                    {/* Test Run Picker */}
                    {testRuns.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label className="text-[11px] font-semibold text-slate-500">Đợt kiểm thử:</label>
                            <select
                                value={activeRun?.id}
                                onChange={(e) => setSelectedRunId(Number(e.target.value))}
                                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-rose-500/20 text-slate-700"
                            >
                                {testRuns.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} ({r.environment.toUpperCase()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleAiGenerateTestSuite}
                        disabled={isGeneratingTestSuite}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-rose-600 text-white hover:opacity-95 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="AI tự động phân tích đặc tả SRS và sinh bộ Test Suite hoàn chỉnh"
                    >
                        <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isGeneratingTestSuite ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingTestSuite ? 'Đang Sinh Test Suite...' : '⚡ AI Sinh Test Suite'}</span>
                    </button>

                    <button
                        onClick={() => setIsCreateRunModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-white hover:opacity-95 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Khởi Tạo Test Run Mới
                    </button>
                </div>
            </header>

            {/* Test Run Execution Metrics Bar (Semantic <section>) */}
            {activeRun && (
                <section aria-label="Chỉ số thực thi kiểm thử" className="fluent-compact-card p-3 sm:p-3.5 border border-white/80 shadow-xs space-y-2.5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-slate-100 text-slate-800 uppercase tracking-wide">
                                    {activeRun.environment}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">{activeRun.name}</h4>
                                {activeRun.release_version && (
                                    <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                        {activeRun.release_version}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Trạng thái: <strong className="text-slate-700 capitalize">{activeRun.status}</strong> • Tổng ca kiểm thử: <strong>{totalCount}</strong>
                            </p>
                        </div>

                        {/* Status Count Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {passedCount} Đạt
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold flex items-center gap-1 text-[11px]">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                {failedCount} Lỗi
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1 text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                {blockedCount} Chặn
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-[11px]">
                                Tỷ lệ đạt: {passRate}%
                            </span>
                        </div>
                    </div>

                    {/* Multi-Segment Dynamic Progress Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                        {totalCount > 0 ? (
                            <>
                                <div
                                    className="bg-emerald-500 h-full transition-all duration-500"
                                    style={{ width: `${(passedCount / totalCount) * 100}%` }}
                                    title={`Đạt: ${passedCount}`}
                                />
                                <div
                                    className="bg-rose-500 h-full transition-all duration-500"
                                    style={{ width: `${(failedCount / totalCount) * 100}%` }}
                                    title={`Lỗi: ${failedCount}`}
                                />
                                <div
                                    className="bg-amber-400 h-full transition-all duration-500"
                                    style={{ width: `${(blockedCount / totalCount) * 100}%` }}
                                    title={`Bị chặn: ${blockedCount}`}
                                />
                            </>
                        ) : (
                            <div className="w-full bg-slate-200 h-full" />
                        )}
                    </div>
                </section>
            )}

            {/* Test Items Filter & Table (Semantic <section>) */}
            <section aria-label="Danh sách các ca kiểm thử" className="fluent-compact-card border border-slate-200/80 shadow-xs overflow-hidden">
                <header className="p-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-bold text-slate-700">Lọc:</span>
                        <div className="flex items-center gap-1">
                            {['all', 'passed', 'failed', 'blocked', 'pending'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setFilterStatus(st)}
                                    className={`px-2 py-0.5 text-[11px] rounded-lg font-medium transition-all cursor-pointer ${
                                        filterStatus === st
                                            ? 'bg-rose-600 text-white font-bold shadow-2xs'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {st === 'all' ? 'Tất cả' : st.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                        Hiển thị {filteredItems.length} / {items.length} ca kiểm thử
                    </span>
                </header>

                <div className="divide-y divide-slate-100 overflow-x-auto">
                    {filteredItems.map((item) => (
                        <article
                            key={item.id}
                            className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                            {/* Left: Code, Title, Expected & Linked Trace */}
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        {item.test_case_code}
                                    </span>
                                    <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>

                                    {/* Linked RTM */}
                                    {item.rtm_trace && (
                                        <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                            RTM: {item.rtm_trace.req_code}
                                        </span>
                                    )}

                                    {/* Linked Defect Badge */}
                                    {item.defect && (
                                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Bug className="w-3 h-3 text-rose-600" />
                                            {item.defect.defect_code} ({item.defect.severity.toUpperCase()})
                                        </span>
                                    )}
                                </div>

                                {item.expected_result && (
                                    <div className="text-[11px] text-slate-600 flex items-start gap-1">
                                        <span className="font-semibold text-slate-700 shrink-0">Kỳ vọng:</span>
                                        <span>{item.expected_result}</span>
                                    </div>
                                )}

                                {item.actual_result && (
                                    <div className="text-[11px] text-slate-500 font-mono italic">
                                        Thực tế: {item.actual_result}
                                    </div>
                                )}
                            </div>

                            {/* Right: Actions & Status Switcher */}
                            <div className="flex items-center gap-3 shrink-0">
                                {/* Execution Buttons */}
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => handleExecuteItem(item.id, 'passed')}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                                            item.status === 'passed'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-emerald-700'
                                        }`}
                                    >
                                        <Check className="w-3 h-3" /> Đạt
                                    </button>
                                    <button
                                        onClick={() => handleExecuteItem(item.id, 'failed')}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                                            item.status === 'failed'
                                                ? 'bg-rose-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-rose-700'
                                        }`}
                                    >
                                        <XCircle className="w-3 h-3" /> Lỗi
                                    </button>
                                    <button
                                        onClick={() => handleExecuteItem(item.id, 'blocked')}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                                            item.status === 'blocked'
                                                ? 'bg-amber-500 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-amber-700'
                                        }`}
                                    >
                                        <AlertTriangle className="w-3 h-3" /> Bị Chặn
                                    </button>
                                </div>

                                {/* 1-Click Convert to Defect (Only if failed & defect not yet logged) */}
                                {item.status === 'failed' && !item.defect && (
                                    <button
                                        onClick={() => {
                                            setDefectModalItem(item);
                                            setDefectData('severity', 'critical');
                                        }}
                                        className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-xs flex items-center gap-1"
                                    >
                                        <Bug className="w-3.5 h-3.5" />
                                        1-Click Báo Defect
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}

                    {filteredItems.length === 0 && (
                        <div className="py-12 text-center text-xs text-slate-400">
                            Không có ca kiểm thử nào phù hợp với bộ lọc.
                        </div>
                    )}
                </div>
            </section>

            {/* Modal: Khởi tạo Test Run Mới */}
            {isCreateRunModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-rose-600" />
                                <h3 className="text-base font-bold text-slate-800">Khởi Tạo Đợt Kiểm Thử Mới</h3>
                            </div>
                            <button
                                onClick={() => setIsCreateRunModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateRun} className="space-y-4 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Tên Đợt Kiểm Thử *</label>
                                <input
                                    type="text"
                                    required
                                    value={runData.name}
                                    onChange={(e) => setRunData('name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Môi trường kiểm thử *</label>
                                    <select
                                        value={runData.environment}
                                        onChange={(e) => setRunData('environment', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                    >
                                        <option value="staging">Staging</option>
                                        <option value="uat">UAT</option>
                                        <option value="performance">Performance</option>
                                        <option value="production">Production Smoke</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Phiên bản phát hành</label>
                                    <input
                                        type="text"
                                        placeholder="v2.4.0"
                                        value={runData.release_version}
                                        onChange={(e) => setRunData('release_version', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                    />
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex items-start gap-2.5">
                                <input
                                    type="checkbox"
                                    id="auto_rtm"
                                    checked={runData.auto_populate_rtm}
                                    onChange={(e) => setRunData('auto_populate_rtm', e.target.checked)}
                                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                                />
                                <label htmlFor="auto_rtm" className="text-rose-900 cursor-pointer">
                                    <strong className="block font-bold">Tự động nạp ca kiểm thử từ ma trận RTM</strong>
                                    Hệ thống sẽ quét tất cả các yêu cầu RTM có mã test case và tạo sẵn các bài test tương ứng.
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateRunModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingRun}
                                    className="px-5 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-xs disabled:opacity-50"
                                >
                                    {creatingRun ? 'Đang tạo...' : 'Khởi Tạo Test Run'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: 1-Click Convert Test Item to Defect */}
            {defectModalItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2">
                            <Bug className="w-5 h-5 text-rose-600" />
                            <h4 className="text-base font-bold text-slate-800">1-Click Chuyển Đổi Thành Defect</h4>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <div><strong>Ca kiểm thử:</strong> {defectModalItem.test_case_code}</div>
                            <div><strong>Tiêu đề:</strong> {defectModalItem.title}</div>
                        </div>

                        {/* Critical Gate 5 Warning */}
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-2 text-amber-900">
                            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                                <strong>Chính sách Quality Gate 5:</strong> Nếu chọn mức độ <strong>Blocker</strong> hoặc <strong>Critical</strong>, Cổng chất lượng 5 (QA Gate) sẽ tự động bị <strong>KHÓA</strong> và ngăn chặn đóng gói Release.
                            </span>
                        </div>

                        <form onSubmit={handleConvertDefect} className="space-y-4 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Mức độ nghiêm trọng *</label>
                                <select
                                    value={defectData.severity}
                                    onChange={(e) => setDefectData('severity', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-bold"
                                >
                                    <option value="blocker" className="text-rose-700">BLOCKER (Khóa toàn bộ hệ thống & Gate 5)</option>
                                    <option value="critical" className="text-orange-700">CRITICAL (Lỗi nghiêm trọng, khóa Gate 5)</option>
                                    <option value="major" className="text-amber-700">MAJOR (Ảnh hưởng tính năng chính)</option>
                                    <option value="minor" className="text-blue-700">MINOR (Lỗi nhỏ giao diện)</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Gán trách nhiệm xử lý</label>
                                <input
                                    type="text"
                                    value={defectData.assigned_to}
                                    onChange={(e) => setDefectData('assigned_to', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setDefectModalItem(null)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={convertingDefect}
                                    className="px-5 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Bug className="w-3.5 h-3.5" />
                                    {convertingDefect ? 'Đang tạo lỗi...' : 'Xác Nhận Tạo Defect'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
