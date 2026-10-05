<?php

namespace App\Actions\AI;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;

class AuditProjectComplianceAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Audit project artifacts, gates, RTM, defects, and CI against international SDLC standards.
     *
     * @return array{
     *     overall_score: int,
     *     grade: string,
     *     standards: array<string, array{score: int, max: int, status: string, notes: string}>,
     *     risk_findings: array<int, array{severity: string, title: string, recommendation: string}>,
     *     audited_at: string
     * }
     */
    public function execute(
        Project $project,
        string $auditorName = 'AI SDLC Governance Auditor (Powered by MCMS 2026)'
    ): array {
        $docsCount = $project->documents()->count();
        $approvedDocsCount = $project->documents()->where('status', 'approved')->count();
        $passedGatesCount = $project->qualityGates()->where('status', 'passed')->count();
        $rtmCount = $project->rtmTraces()->count();
        $rtmTestedOrPassed = $project->rtmTraces()->whereIn('status', ['tested', 'passed', 'released'])->count();
        $unresolvedBlockers = $project->defects()->whereIn('severity', ['blocker', 'critical'])->whereIn('status', ['open', 'in_progress'])->count();
        $latestCi = $project->ciPipelineMetrics()->first();

        // 1. ISO/IEC 12207 Standard (Process & Deliverables) - Max 35
        $isoScore = 15;
        if ($docsCount >= 10) {
            $isoScore += 10;
        }
        if ($approvedDocsCount >= 3) {
            $isoScore += 10;
        }

        // 2. IEEE 830 Standard (Requirements & Traceability) - Max 30
        $ieeeScore = 10;
        if ($rtmCount > 0) {
            $ratio = $rtmTestedOrPassed / max(1, $rtmCount);
            $ieeeScore += (int) round($ratio * 20);
        }

        // 3. PCI-DSS & OWASP Top 10 (Security, SAST & Defect Rigor) - Max 35
        $secScore = 15;
        if ($latestCi && $latestCi->sast_status === 'passed') {
            $secScore += 10;
        }
        if ($latestCi && $latestCi->coverage_percentage >= 80) {
            $secScore += 5;
        }
        if ($unresolvedBlockers === 0) {
            $secScore += 5;
        } else {
            $secScore = max(0, $secScore - 10);
        }

        $overallScore = min(100, $isoScore + $ieeeScore + $secScore);

        $grade = match (true) {
            $overallScore >= 90 => 'A+ (Đạt Xuất Sắc)',
            $overallScore >= 80 => 'A (Đạt Chuẩn Doanh Nghiệp)',
            $overallScore >= 70 => 'B (Đạt Yêu Cầu Cơ Bản)',
            default => 'C (Cần Khắc Phục Rủi Ro)',
        };

        // Identify Risk Findings
        $findings = [];
        if ($unresolvedBlockers > 0) {
            $findings[] = [
                'severity' => 'HIGH',
                'title' => "Tồn tại {$unresolvedBlockers} khiếm khuyết mức Blocker/Critical chưa đóng",
                'recommendation' => 'Cần ưu tiên huy động Senior Developer xử lý hotfix và re-test trước khi mở Cổng 5.',
            ];
        }

        if (! $latestCi || $latestCi->coverage_percentage < 80) {
            $findings[] = [
                'severity' => 'MEDIUM',
                'title' => 'Độ bao phủ Unit Test dưới ngưỡng 80% tiêu chuẩn',
                'recommendation' => 'Bổ sung thêm Unit Tests cho các modules tính toán tài chính và bảo mật.',
            ];
        }

        if ($rtmCount > 0 && $rtmTestedOrPassed < $rtmCount) {
            $untested = $rtmCount - $rtmTestedOrPassed;
            $findings[] = [
                'severity' => 'LOW',
                'title' => "Còn {$untested} yêu cầu RTM chưa hoàn tất kịch bản kiểm thử",
                'recommendation' => 'Kích hoạt Test Run Suite để bao phủ 100% mắt xích truy vết.',
            ];
        }

        $result = [
            'overall_score' => $overallScore,
            'grade' => $grade,
            'standards' => [
                'ISO_12207' => [
                    'name' => 'ISO/IEC 12207 (Software Lifecycle)',
                    'score' => $isoScore,
                    'max' => 35,
                    'status' => $isoScore >= 25 ? 'COMPLIANT' : 'PARTIAL',
                    'notes' => "{$approvedDocsCount}/{$docsCount} tài liệu kỹ thuật đã ký duyệt số.",
                ],
                'IEEE_830' => [
                    'name' => 'IEEE 830 (SRS & RTM Traceability)',
                    'score' => $ieeeScore,
                    'max' => 30,
                    'status' => $ieeeScore >= 20 ? 'COMPLIANT' : 'PARTIAL',
                    'notes' => "{$rtmTestedOrPassed}/{$rtmCount} yêu cầu đã qua kiểm thử nghiệm thu.",
                ],
                'SECURITY_OWASP' => [
                    'name' => 'PCI-DSS & OWASP Top 10',
                    'score' => $secScore,
                    'max' => 35,
                    'status' => $secScore >= 25 ? 'COMPLIANT' : 'RISK_DETECTED',
                    'notes' => ($latestCi?->sast_status === 'passed' ? 'SAST Sạch • ' : 'SAST Cảnh báo • ').($unresolvedBlockers === 0 ? '0 Blocker' : "{$unresolvedBlockers} Blocker tồn đọng"),
                ],
            ],
            'risk_findings' => $findings,
            'audited_at' => now()->toIso8601String(),
            'score' => $overallScore,
            'breakdown' => [
                'iso_12207' => [
                    'score' => $isoScore,
                    'max' => 35,
                    'status' => $isoScore >= 25 ? 'COMPLIANT' : 'PARTIAL',
                    'details' => "{$approvedDocsCount}/{$docsCount} tài liệu kỹ thuật đã ký duyệt số.",
                ],
                'ieee_830' => [
                    'score' => $ieeeScore,
                    'max' => 30,
                    'status' => $ieeeScore >= 20 ? 'COMPLIANT' : 'PARTIAL',
                    'details' => "{$rtmTestedOrPassed}/{$rtmCount} yêu cầu đã qua kiểm thử nghiệm thu.",
                ],
                'pci_dss_owasp' => [
                    'score' => $secScore,
                    'max' => 35,
                    'status' => $secScore >= 25 ? 'COMPLIANT' : 'RISK_DETECTED',
                    'details' => ($latestCi?->sast_status === 'passed' ? 'SAST Sạch • ' : 'SAST Cảnh báo • ').($unresolvedBlockers === 0 ? '0 Blocker' : "{$unresolvedBlockers} Blocker tồn đọng"),
                ],
            ],
        ];

        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $auditorName,
            userRole: 'AI Compliance Auditor',
            actionType: 'COMPLIANCE_AUDIT_RUN',
            entityType: 'Project',
            entityId: $project->id,
            details: [
                'score' => $overallScore,
                'grade' => $grade,
                'findings_count' => count($findings),
            ]
        );

        return $result;
    }
}
