import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Zap,
    KeyRound,
    Copy,
    Check,
    Plus,
    ShieldCheck,
    ExternalLink,
    AlertCircle
} from 'lucide-react';

interface ProjectWebhook {
    id: number;
    project_id: number;
    name: string;
    url: string;
    secret_token: string;
    events: string[];
    is_active: boolean;
    created_at: string;
}

interface WebhookSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    webhooks: ProjectWebhook[];
}

const AVAILABLE_EVENTS = [
    { key: 'gate.approved', label: 'Cổng chất lượng được phê duyệt (Quality Gate Approved)' },
    { key: 'defect.logged', label: 'Lỗi phần mềm mới được ghi nhận (Defect Logged)' },
    { key: 'release.packaged', label: 'Đóng gói phát hành thành công (Release Packaged)' },
    { key: 'rollout.updated', label: 'Cập nhật lưu lượng Canary / Rollback (Rollout Updated)' },
];

export const WebhookSettingsModal: React.FC<WebhookSettingsModalProps> = ({
    isOpen,
    onClose,
    projectId,
    webhooks = [],
}) => {
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        url: '',
        events: ['gate.approved', 'defect.logged'] as string[],
    });

    if (!isOpen) return null;

    const handleCopy = (token: string) => {
        navigator.clipboard.writeText(token);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2500);
    };

    const handleToggleEvent = (eventKey: string) => {
        if (data.events.includes(eventKey)) {
            setData(
                'events',
                data.events.filter((e) => e !== eventKey)
            );
        } else {
            setData('events', [...data.events, eventKey]);
        }
    };

    const handleCreateWebhook = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/projects/${projectId}/webhooks`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddFormOpen(false);
                reset();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Trung Tâm Tích Hợp Webhook Doanh Nghiệp
                            </h3>
                            <p className="text-xs text-slate-500">
                                Phát tín hiệu sự kiện tự động đến CI/CD, Slack, Jira với chữ ký HMAC-SHA256 an toàn
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Security Verification Notice */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Xác thực chữ ký số payload (HMAC Signature)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                        Mọi request gửi đi từ MCMS đều đi kèm header <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">X-MCMS-Signature</code> chứa chữ ký SHA256 được tính toán từ secret token. Hãy kiểm tra chữ ký ở phía server nhận để đảm bảo dữ liệu không bị can thiệp.
                    </p>
                </div>

                {/* Webhooks List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Endpoints Đã Đăng Ký ({webhooks.length})
                        </h4>
                        {!isAddFormOpen && (
                            <button
                                onClick={() => setIsAddFormOpen(true)}
                                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Thêm Webhook Mới
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {webhooks.map((wh) => (
                            <div
                                key={wh.id}
                                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h5 className="text-xs font-bold text-slate-900">{wh.name}</h5>
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            ACTIVE
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        Tạo lúc: {wh.created_at?.slice(0, 10)}
                                    </span>
                                </div>

                                <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 truncate">
                                    {wh.url}
                                </div>

                                {/* Secret Token Box */}
                                <div className="flex items-center justify-between bg-amber-50/60 border border-amber-100 p-2 rounded-lg text-xs">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                        <span className="text-slate-500 text-[11px]">Secret:</span>
                                        <code className="font-mono text-[11px] text-amber-900 font-bold truncate">
                                            {wh.secret_token}
                                        </code>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(wh.secret_token)}
                                        className="px-2.5 py-1 text-[10px] font-bold bg-white text-slate-700 hover:text-amber-800 border border-slate-200 rounded-md transition-colors flex items-center gap-1 shrink-0 ml-2"
                                    >
                                        {copiedToken === wh.secret_token ? (
                                            <>
                                                <Check className="w-3 h-3 text-emerald-600" /> Đã chép
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" /> Sao chép
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Events List */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {wh.events.map((ev) => (
                                        <span
                                            key={ev}
                                            className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 font-mono"
                                        >
                                            {ev}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {webhooks.length === 0 && !isAddFormOpen && (
                            <div className="p-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                Chưa có webhook nào được kích hoạt. Hãy thêm webhook để tự động hóa quy trình với các hệ thống CI/CD bên ngoài.
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Webhook Form */}
                {isAddFormOpen && (
                    <form
                        onSubmit={handleCreateWebhook}
                        className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                            <span className="font-bold text-slate-800">Đăng ký Endpoint Webhook Mới</span>
                            <button
                                type="button"
                                onClick={() => setIsAddFormOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                                ✕ Đóng
                            </button>
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 block mb-1">Tên Endpoint *</label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: CI GitLab Pipeline Webhook..."
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            {errors.name && <span className="text-rose-600">{errors.name}</span>}
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 block mb-1">URL Nhận Webhook (HTTPS) *</label>
                            <input
                                type="url"
                                required
                                placeholder="https://ci.company.com/api/sdlc-events"
                                value={data.url}
                                onChange={(e) => setData('url', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            {errors.url && <span className="text-rose-600">{errors.url}</span>}
                        </div>

                        <div className="space-y-2">
                            <label className="font-semibold text-slate-700 block">Sự kiện lắng nghe (Events) *</label>
                            <div className="space-y-1.5">
                                {AVAILABLE_EVENTS.map((item) => (
                                    <label
                                        key={item.key}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.events.includes(item.key)}
                                            onChange={() => handleToggleEvent(item.key)}
                                            className="rounded text-amber-600 focus:ring-amber-500"
                                        />
                                        <span className="text-[11px] font-medium text-slate-800">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAddFormOpen(false)}
                                className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 shadow-xs disabled:opacity-50"
                            >
                                {processing ? 'Đang tạo...' : 'Lưu & Khởi Tạo Secret Token'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-xs"
                    >
                        Đóng Hộp Thoại
                    </button>
                </div>
            </div>
        </div>
    );
};
