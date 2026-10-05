import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    ShieldCheck,
    SlidersHorizontal,
    AlertOctagon,
    CheckCircle2,
    Clock,
    KeyRound,
    RotateCcw,
    Sparkles,
    ShieldAlert,
    Cpu,
    ExternalLink,
    Lock,
    Users
} from 'lucide-react';

interface CABSignoff {
    id: number;
    project_id: number;
    release_version: string;
    role_required: 'LEAD_ARCHITECT' | 'SECOPS_LEAD' | 'PRODUCT_OWNER';
    signer_name: string;
    decision: 'pending' | 'approved' | 'rejected';
    signature_token?: string;
    signed_at?: string;
    notes?: string;
}

interface DeploymentRollout {
    id: number;
    project_id: number;
    release_version: string;
    traffic_percentage: number;
    status: 'canary_active' | 'promoted' | 'rolled_back';
    rollback_reason?: string;
    rolled_back_at?: string;
    last_operator_name?: string;
    updated_at: string;
}

interface CABRolloutManagerProps {
    projectId: number;
    cabSignoffs: CABSignoff[];
    rollouts: DeploymentRollout[];
}

const CAB_ROLES = [
    {
        key: 'LEAD_ARCHITECT',
        label: 'Kiến Trúc Sư Trưởng Giải Pháp',
        description: 'Xác thực kiến trúc phi chức năng, tính toàn vẹn hệ thống C4 và độ trễ SLA.',
        color: 'from-blue-600 to-indigo-600',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
        key: 'SECOPS_LEAD',
        label: 'Trưởng Nhóm An Toàn Thông Tin (SecOps)',
        description: 'Xác thực kiểm toán bảo mật SAST, không còn lỗ hổng nghiêm trọng OWASP/PCI.',
        color: 'from-indigo-600 to-purple-600',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    {
        key: 'PRODUCT_OWNER',
        label: 'Đại Diện Chủ Quản Sản Phẩm (PO)',
        description: 'Xác nhận toàn bộ tiêu chí nghiệm thu UAT người dùng cuối đã đáp ứng.',
        color: 'from-purple-600 to-rose-600',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
] as const;

export const CABRolloutManager: React.FC<CABRolloutManagerProps> = ({
    projectId,
    cabSignoffs = [],
    rollouts = [],
}) => {
    const activeRollout = rollouts[0];
    const releaseVersion = activeRollout?.release_version || 'v2.4.0';

    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [selectedRoleToSign, setSelectedRoleToSign] = useState<string>('LEAD_ARCHITECT');
    const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
    const [rollbackReason, setRollbackReason] = useState('');
    const [sliderTraffic, setSliderTraffic] = useState<number>(activeRollout?.traffic_percentage || 10);
    const [isBatchSigningCAB, setIsBatchSigningCAB] = useState(false);

    const handleBatchSignCAB = () => {
        if (!confirm(`Xác nhận ký số điện tử HMAC-SHA256 phê chuẩn trọn bộ 3/3 vai trò Hội đồng CAB cho phiên bản ${releaseVersion}?`)) return;
        setIsBatchSigningCAB(true);
        router.post(`/projects/${projectId}/cab/batch-sign`, {
            release_version: releaseVersion,
            signer_name: 'Võ Hoàng Tú',
        }, {
            preserveScroll: true,
            onFinish: () => setIsBatchSigningCAB(false),
        });
    };

    // Sign Form
    const { data: signData, setData: setSignData, post: postSign, processing: signing } = useForm({
        release_version: releaseVersion,
        role_required: 'LEAD_ARCHITECT',
        signer_name: 'Võ Hoàng Tú',
        decision: 'approved',
        notes: 'Đã hoàn thành rà soát toàn diện, phê duyệt đóng gói và phát hành.',
    });

    // Check if fully approved
    const approvedCount = cabSignoffs.filter(
        (s) => s.release_version === releaseVersion && s.decision === 'approved'
    ).length;
    const isFullyApproved = approvedCount >= 3;

    const handleSign = (e: React.FormEvent) => {
        e.preventDefault();
        postSign(`/projects/${projectId}/cab/sign`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSignModalOpen(false);
            },
        });
    };

    const handleUpdateTraffic = (percentage: number) => {
        router.post(
            `/projects/${projectId}/rollout/traffic`,
            {
                release_version: releaseVersion,
                traffic_percentage: percentage,
            },
            {
                preserveScroll: true,
            }
        );
    };

    const handleTriggerRollback = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            `/projects/${projectId}/rollout/traffic`,
            {
                release_version: releaseVersion,
                traffic_percentage: 0,
                is_rollback: true,
                rollback_reason: rollbackReason || 'Kích hoạt Emergency Rollback thu hồi khẩn cấp tại Production.',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsRollbackModalOpen(false);
                    setRollbackReason('');
                },
            }
        );
    };

    return (
        <div className="space-y-3.5">
            {/* CAB Header & Approval Status Banner (Semantic <header>) */}
            <header className="fluent-compact-card p-3 sm:p-3.5 border border-white/80 shadow-xs space-y-2.5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-extrabold text-slate-800">
                                    Hội Đồng Thẩm Định Thay Đổi (CAB Multi-Signoff)
                                </h3>
                                <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                    {releaseVersion}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Quy định: Cần đủ 3 chữ ký số độc lập từ 3 vai trò trước khi chuyển lưu lượng 100%.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isFullyApproved && (
                            <button
                                type="button"
                                onClick={handleBatchSignCAB}
                                disabled={isBatchSigningCAB}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white hover:opacity-95 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                title="Ký số HMAC-SHA256 phê chuẩn cả 3 vai trò trong Hội đồng CAB chỉ với 1 click"
                            >
                                <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isBatchSigningCAB ? 'animate-spin' : ''}`} />
                                <span>{isBatchSigningCAB ? 'Đang Ký Duyệt...' : '⚡ Ký Trọn Bộ CAB (3/3)'}</span>
                            </button>
                        )}

                        <button
                            onClick={() => {
                                setSignData('role_required', 'LEAD_ARCHITECT');
                                setIsSignModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <KeyRound className="w-3.5 h-3.5" />
                            Ký Duyệt Phát Hành
                        </button>
                    </div>
                </div>

                {/* Status Callout Banner */}
                {isFullyApproved ? (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-900 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                            <strong className="font-bold">CAB Phê Duyệt Toàn Diện (3/3 Chữ Ký Đã Ký)</strong> — Bản phát hành {releaseVersion} đủ điều kiện nâng tỷ lệ Canary lên 100%.
                        </div>
                    </div>
                ) : (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-900 text-xs">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                            <strong className="font-bold">Đang Chờ Hoàn Tất Ký Duyệt CAB ({approvedCount}/3)</strong> — Yêu cầu xác thực chữ ký của tất cả các bên có thẩm quyền trước khi triển khai toàn diện.
                        </div>
                    </div>
                )}
            </header>

            {/* 3 CAB Role Cards (Semantic <section>) */}
            <section aria-label="Chữ ký 3 vai trò thẩm định CAB" className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CAB_ROLES.map((role) => {
                    const signoff = cabSignoffs.find(
                        (s) => s.release_version === releaseVersion && s.role_required === role.key
                    );
                    const isSigned = signoff?.decision === 'approved';

                    return (
                        <article
                            key={role.key}
                            className={`p-3.5 rounded-xl bg-white border transition-all shadow-2xs flex flex-col justify-between ${
                                isSigned ? 'border-emerald-200 ring-1 ring-emerald-500/10' : 'border-slate-200'
                            }`}
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                        Vai trò bắt buộc
                                    </span>
                                    {isSigned ? (
                                        <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã Ký
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-amber-600" /> Chờ Ký
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{role.label}</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                        {role.description}
                                    </p>
                                </div>

                                {isSigned && signoff && (
                                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
                                        <div className="flex items-center gap-1 text-slate-700 text-[11px]">
                                            <span className="text-slate-500">Người ký:</span>
                                            <strong>{signoff.signer_name}</strong>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                            Ký lúc: {signoff.signed_at || 'Vừa xong'}
                                        </div>
                                        {signoff.signature_token && (
                                            <div className="text-[9px] font-mono text-purple-700 bg-purple-50 p-1 rounded border border-purple-100 break-all select-all">
                                                {signoff.signature_token}
                                            </div>
                                        )}
                                        {signoff.notes && (
                                            <p className="text-[10px] text-slate-600 italic border-t border-slate-200/60 pt-1">
                                                "{signoff.notes}"
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <footer className="pt-2.5 border-t border-slate-100 mt-2.5">
                                {!isSigned ? (
                                    <button
                                        onClick={() => {
                                            setSignData('role_required', role.key as any);
                                            setIsSignModalOpen(true);
                                        }}
                                        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <KeyRound className="w-3 h-3 text-slate-300" />
                                        Thực Hiện Ký Số
                                    </button>
                                ) : (
                                    <div className="text-center text-[10px] text-emerald-700 font-semibold">
                                        ✓ Chữ ký số mã hóa hợp lệ
                                    </div>
                                )}
                            </footer>
                        </article>
                    );
                })}
            </section>

            {/* Section 2: Canary Rollout & Emergency Rollback Controller (Semantic <section>) */}
            <section aria-label="Bộ điều khiển lưu lượng Canary Rollout" className="fluent-compact-card p-3 sm:p-4 border border-white/80 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                            <SlidersHorizontal className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-800">
                                    Bộ Điều Khiển Lưu Lượng Canary Rollout (Canary Traffic Engine)
                                </h3>
                                {activeRollout?.status === 'rolled_back' ? (
                                    <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                        ROLLED BACK
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                        CANARY ACTIVE
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">
                                Điều tiết tỷ lệ lưu lượng người dùng chuyển sang phiên bản mới {releaseVersion} theo từng chặng an toàn.
                            </p>
                        </div>
                    </div>

                    {/* Instant Emergency Rollback Button */}
                    <button
                        onClick={() => setIsRollbackModalOpen(true)}
                        className="px-4 py-2 text-xs font-extrabold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-sm flex items-center gap-1.5 transition-all"
                    >
                        <AlertOctagon className="w-4 h-4" />
                        Emergency Rollback (Hạ 0%)
                    </button>
                </div>

                {/* Rollback Notification if active */}
                {activeRollout?.status === 'rolled_back' && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
                        <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <strong className="block font-bold">CẢNH BÁO: PHIÊN BẢN ĐÃ BỊ THU HỒI KHẨN CẤP</strong>
                            Lý do: <em>{activeRollout.rollback_reason || 'Kích hoạt thu hồi khẩn cấp'}</em>. Toàn bộ lưu lượng đã đưa về 0% để bảo vệ an toàn hệ thống.
                        </div>
                    </div>
                )}

                {/* Traffic Control Stages & Slider */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Lưu lượng người dùng hiện tại:</span>
                        <span className="text-base font-extrabold text-indigo-600 font-mono">
                            {activeRollout?.traffic_percentage || 0}%
                        </span>
                    </div>

                    {/* Quick Stage Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                            { pct: 0, label: '0% (Tắt)' },
                            { pct: 10, label: '10% (Canary 1)' },
                            { pct: 25, label: '25% (Canary 2)' },
                            { pct: 50, label: '50% (Mở rộng)' },
                            { pct: 100, label: '100% (Toàn diện)' },
                        ].map((stage) => {
                            const isCurrent = (activeRollout?.traffic_percentage || 0) === stage.pct;
                            return (
                                <button
                                    key={stage.pct}
                                    onClick={() => handleUpdateTraffic(stage.pct)}
                                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                                        isCurrent
                                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-transparent shadow-md'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div>{stage.pct}%</div>
                                    <div className="text-[10px] font-normal opacity-85 mt-0.5">{stage.label}</div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Visual Progress Pod Bar */}
                    <div className="pt-2">
                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div
                                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-full rounded-full transition-all duration-700"
                                style={{ width: `${activeRollout?.traffic_percentage || 0}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                            <span>0% Isolated</span>
                            <span>25% Pod Group A</span>
                            <span>50% Pod Group B</span>
                            <span>100% Full Cluster</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal: Ký Chữ Ký Số CAB */}
            {isSignModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-purple-600" />
                            <h4 className="text-base font-bold text-slate-800">Ký Duyệt Phát Hành Hội Đồng CAB</h4>
                        </div>

                        <form onSubmit={handleSign} className="space-y-4 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Phiên bản *</label>
                                <input
                                    type="text"
                                    disabled
                                    value={signData.release_version}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 font-mono text-slate-600"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Vai trò thẩm định *</label>
                                <select
                                    value={signData.role_required}
                                    onChange={(e) => setSignData('role_required', e.target.value as any)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-bold"
                                >
                                    <option value="LEAD_ARCHITECT">LEAD_ARCHITECT (Kiến Trúc Sư Trưởng)</option>
                                    <option value="SECOPS_LEAD">SECOPS_LEAD (Trưởng Nhóm An Toàn SecOps)</option>
                                    <option value="PRODUCT_OWNER">PRODUCT_OWNER (Chủ Quản Sản Phẩm)</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Họ tên người ký *</label>
                                <input
                                    type="text"
                                    required
                                    value={signData.signer_name}
                                    onChange={(e) => setSignData('signer_name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Quyết định *</label>
                                <select
                                    value={signData.decision}
                                    onChange={(e) => setSignData('decision', e.target.value as any)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                >
                                    <option value="approved">Phê Duyệt (Approved)</option>
                                    <option value="rejected">Từ Chối (Rejected)</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Ý kiến thẩm định</label>
                                <textarea
                                    rows={2}
                                    value={signData.notes}
                                    onChange={(e) => setSignData('notes', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsSignModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={signing}
                                    className="px-5 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <KeyRound className="w-3.5 h-3.5" />
                                    {signing ? 'Đang xác thực...' : 'Xác Nhận Ký Số'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Emergency Rollback */}
            {isRollbackModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2">
                            <AlertOctagon className="w-5 h-5 text-rose-600" />
                            <h4 className="text-base font-bold text-slate-800">Kích Hoạt Emergency Rollback</h4>
                        </div>

                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                            <strong>Cảnh báo khẩn cấp:</strong> Thao tác này sẽ lập tức cắt toàn bộ lưu lượng người dùng (chuyển về 0%) của phiên bản <strong>{releaseVersion}</strong> và khóa trạng thái phát hành.
                        </div>

                        <form onSubmit={handleTriggerRollback} className="space-y-4 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">
                                    Lý do thu hồi khẩn cấp *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Ví dụ: Phát hiện rò rỉ bộ nhớ nghiêm trọng tại dịch vụ thanh toán liên ngân hàng..."
                                    value={rollbackReason}
                                    onChange={(e) => setRollbackReason(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsRollbackModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-xs flex items-center gap-1.5"
                                >
                                    <AlertOctagon className="w-3.5 h-3.5" />
                                    Xác Nhận Thu Hồi Khẩn Cấp
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
