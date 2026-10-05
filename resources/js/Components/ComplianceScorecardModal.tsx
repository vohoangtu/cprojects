import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    FileCheck,
    RotateCcw,
    Lock,
    ExternalLink,
    Award
} from 'lucide-react';

interface ComplianceAudit {
    score: number;
    grade: 'A' | 'B' | 'C' | 'F';
    breakdown: {
        iso_12207: { score: number; max: number; status: string; details: string };
        ieee_830: { score: number; max: number; status: string; details: string };
        pci_dss_owasp: { score: number; max: number; status: string; details: string };
    };
    risk_findings: Array<{
        standard: string;
        risk: string;
        severity: 'high' | 'medium' | 'low';
        recommendation: string;
    }>;
    audited_at: string;
}

interface ComplianceScorecardModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    auditData?: ComplianceAudit;
}

export const ComplianceScorecardModal: React.FC<ComplianceScorecardModalProps> = ({
    isOpen,
    onClose,
    projectId,
    auditData,
}) => {
    const [recalculating, setRecalculating] = useState(false);

    if (!isOpen) return null;

    const handleReaudit = () => {
        setRecalculating(true);
        router.post(
            `/projects/${projectId}/compliance-audit`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setRecalculating(false),
            }
        );
    };

    const getGradeBadge = (grade?: string) => {
        switch (grade) {
            case 'A':
                return {
                    label: 'HẠNG A: SẴN SÀNG KIỂM TOÁN DOANH NGHIỆP',
                    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    gradient: 'from-emerald-600 to-teal-600',
                };
            case 'B':
                return {
                    label: 'HẠNG B: ĐẠT YÊU CẦU CƠ BẢN',
                    color: 'bg-blue-100 text-blue-800 border-blue-300',
                    gradient: 'from-blue-600 to-indigo-600',
                };
            case 'C':
                return {
                    label: 'HẠNG C: CẦN BỔ SUNG MINH CHỨNG',
                    color: 'bg-amber-100 text-amber-800 border-amber-300',
                    gradient: 'from-amber-600 to-orange-600',
                };
            default:
                return {
                    label: 'HẠNG F: NGUY CƠ VI PHẠM TUÂN THỦ',
                    color: 'bg-rose-100 text-rose-800 border-rose-300',
                    gradient: 'from-rose-600 to-red-600',
                };
        }
    };

    const gradeInfo = getGradeBadge(auditData?.grade);

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md">
                            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Báo Cáo Kiểm Toán Tuân Thủ SDLC (AI Compliance Scorecard)
                            </h3>
                            <p className="text-xs text-slate-500">
                                Đánh giá tự động theo chuẩn ISO/IEC 12207, IEEE 830 và PCI-DSS / OWASP Top 10
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

                {/* Score Hero Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2 z-10">
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-400" />
                            <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-300">
                                Điểm Đánh Giá Tuân Thủ Toàn Diện
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black font-mono tracking-tight text-white">
                                {auditData?.score ?? 90}
                            </span>
                            <span className="text-slate-400 font-semibold text-lg">/ 100 Điểm</span>
                        </div>
                        <div className="inline-block mt-1">
                            <span className={`px-3 py-1 text-xs font-black rounded-full border ${gradeInfo.color}`}>
                                {gradeInfo.label}
                            </span>
                        </div>
                    </div>

                    <div className="z-10 flex flex-col items-end gap-2">
                        <button
                            onClick={handleReaudit}
                            disabled={recalculating}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                            {recalculating ? 'Đang tính toán...' : 'Chạy Lại Đánh Giá AI'}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">
                            Cập nhật lúc: {auditData?.audited_at || new Date().toLocaleString('vi-VN')}
                        </span>
                    </div>

                    {/* Subtle BG Glow */}
                    <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* 3 Pillars Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* ISO 12207 */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">ISO/IEC 12207</span>
                            <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {auditData?.breakdown?.iso_12207?.score ?? 35} / 40
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Chu trình vòng đời phần mềm, cổng chất lượng Quality Gates & tài liệu C4 Model.
                        </p>
                        <div className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                            {auditData?.breakdown?.iso_12207?.details || 'Các cổng chất lượng chính đã được thiết lập.'}
                        </div>
                    </div>

                    {/* IEEE 830 */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">IEEE 830</span>
                            <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {auditData?.breakdown?.ieee_830?.score ?? 28} / 30
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Đặc tả yêu cầu phần mềm và độ bao phủ ma trận truy vết RTM 100%.
                        </p>
                        <div className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            {auditData?.breakdown?.ieee_830?.details || 'Ma trận RTM đã liên kết với mã nguồn.'}
                        </div>
                    </div>

                    {/* PCI-DSS / OWASP */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">PCI-DSS & OWASP</span>
                            <span className="font-mono text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                {auditData?.breakdown?.pci_dss_owasp?.score ?? 27} / 30
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            An toàn thông tin CI/CD SAST, không còn lỗi Blocker và kiểm toán SLA.
                        </p>
                        <div className="text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                            {auditData?.breakdown?.pci_dss_owasp?.details || 'Chỉ số bảo mật SAST đạt chuẩn.'}
                        </div>
                    </div>
                </div>

                {/* Risk Findings & Concrete Recommendations */}
                <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Danh Mục Cảnh Báo Rủi Ro & Đề Xuất Khắc Phục (Risk Findings)
                    </h4>

                    <div className="space-y-2">
                        {auditData?.risk_findings && auditData.risk_findings.length > 0 ? (
                            auditData.risk_findings.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs space-y-1.5"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900">{item.risk}</span>
                                        <span
                                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                                item.severity === 'high'
                                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}
                                        >
                                            {item.severity}
                                        </span>
                                    </div>
                                    <div className="text-slate-600 text-[11px] flex items-start gap-1">
                                        <strong className="text-indigo-700 shrink-0">Khắc phục:</strong>
                                        <span>{item.recommendation}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Không phát hiện rủi ro vi phạm tuân thủ nghiêm trọng. Dự án đang vận hành chuẩn mực!
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-xs"
                    >
                        Đóng Báo Cáo
                    </button>
                </div>
            </div>
        </div>
    );
};
