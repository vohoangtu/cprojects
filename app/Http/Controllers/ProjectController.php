<?php

namespace App\Http\Controllers;

use App\Actions\Agile\CreateTaskAction;
use App\Actions\Agile\UpdateTaskStatusAction;
use App\Actions\AI\AnalyzeProjectIdeaAction;
use App\Actions\AI\AuditProjectComplianceAction;
use App\Actions\AI\BatchSynthesizeProjectDocumentsAction;
use App\Actions\AI\EvaluateQualityGateAction;
use App\Actions\AI\GenerateSDLCDocumentAction;
use App\Actions\AI\GenerateSprintTasksAction;
use App\Actions\AI\GenerateTestSuiteAction;
use App\Actions\Audit\VerifyAuditChainAction;
use App\Actions\Defects\LogDefectAction;
use App\Actions\Defects\ResolveDefectAction;
use App\Actions\Documents\BatchSignOffPhaseDocumentsAction;
use App\Actions\Documents\CreateDocumentAction;
use App\Actions\Documents\SaveDocumentContentAction;
use App\Actions\Documents\SignOffDocumentAction;
use App\Actions\Gates\ApproveQualityGateAction;
use App\Actions\Gates\RejectQualityGateAction;
use App\Actions\Gates\ToggleGateCriteriaAction;
use App\Actions\Integrations\CreateWebhookAction;
use App\Actions\Integrations\IngestCIPipelineMetricsAction;
use App\Actions\Integrations\IngestGitWebhookAction;
use App\Actions\Operations\CalculateSLAMetricsAction;
use App\Actions\Operations\LogProductionIncidentAction;
use App\Actions\Phases\CalculatePhaseProgressAction;
use App\Actions\Projects\CreateProjectAction;
use App\Actions\Projects\CreateProjectFromIdeaAction;
use App\Actions\RACI\AnalyzeRACIWorkloadAction;
use App\Actions\RACI\AssignRACIRoleAction;
use App\Actions\Release\PackageReleaseAction;
use App\Actions\Release\SignCABAction;
use App\Actions\Release\UpdateRolloutTrafficAction;
use App\Actions\RTM\AnalyzeRTMGapsAction;
use App\Actions\RTM\CreateRTMTraceAction;
use App\Actions\Testing\ConvertTestFailToDefectAction;
use App\Actions\Testing\CreateTestRunAction;
use App\Actions\Testing\ExecuteTestItemAction;
use App\Models\AuditLog;
use App\Models\ProductionIncident;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __construct(
        protected ProjectRepositoryInterface $projectRepository,
    ) {}

    /**
     * Display a listing of SDLC projects and corporate subsystems.
     */
    public function index(Request $request): Response
    {
        $projects = $this->projectRepository->getAll();
        $recentAuditLogs = AuditLog::with('project:id,name,code')->latest()->take(30)->get();
        $recentIncidents = ProductionIncident::with('project:id,name,code')->latest()->take(20)->get();
        $initialTab = (string) $request->query('tab', 'projects');

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'recentAuditLogs' => $recentAuditLogs,
            'recentIncidents' => $recentIncidents,
            'initialTab' => $initialTab,
        ]);
    }

    /**
     * Display the specified project dashboard with 7 phases, gates, RACI, RTM, defects, CI/CD, Agile Kanban and docs.
     */
    public function show(
        int $id,
        AnalyzeRTMGapsAction $analyzeRtmAction,
        VerifyAuditChainAction $verifyAuditAction,
        AnalyzeRACIWorkloadAction $raciWorkloadAction,
        CalculateSLAMetricsAction $slaAction,
        AuditProjectComplianceAction $complianceAction,
        CalculatePhaseProgressAction $calculatePhaseProgressAction,
    ): Response {
        $project = $this->projectRepository->findById($id);

        if (! $project) {
            abort(404, 'Dự án không tồn tại.');
        }

        $project->load([
            'defects.rtmTrace',
            'ciPipelineMetrics',
            'productionIncidents',
            'sprints.tasks',
            'tasks.rtmTrace',
            'testRuns.items.defect',
            'cabSignoffs',
            'deploymentRollouts',
            'webhooks',
        ]);

        $calculatePhaseProgressAction->execute($project);

        $rtmAnalysis = $analyzeRtmAction->execute($id);
        $auditVerification = $verifyAuditAction->execute($id);
        $raciWorkload = $raciWorkloadAction->execute($project);
        $slaMetrics = $slaAction->execute($project);
        $complianceAudit = $complianceAction->execute($project);

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'rtmAnalysis' => $rtmAnalysis,
            'auditVerification' => $auditVerification,
            'raciWorkload' => $raciWorkload,
            'slaMetrics' => $slaMetrics,
            'complianceAudit' => $complianceAudit,
        ]);
    }

    /**
     * Store a newly created project using CreateProjectAction.
     */
    public function store(Request $request, CreateProjectAction $createProjectAction): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:projects,code',
            'description' => 'nullable|string',
            'client_name' => 'required|string|max:255',
            'project_type' => 'required|in:outsourcing,product,enterprise,rnd',
            'budget' => 'nullable|numeric|min:0',
            'target_delivery_date' => 'nullable|date',
        ]);

        $project = $createProjectAction->execute(
            data: $validated,
            creatorName: $request->input('creator_name', 'Võ Hoàng Tú'),
            creatorRole: $request->input('creator_role', 'Lead Solution Architect'),
        );

        return redirect()->route('projects.show', $project->id)
            ->with('success', 'Dự án và toàn bộ 7 Pha SDLC đã được khởi tạo thành công.');
    }

    /**
     * Analyze a raw product idea or business challenge into structured SDLC specifications.
     */
    public function analyzeIdea(
        Request $request,
        AnalyzeProjectIdeaAction $analyzeAction,
    ): JsonResponse {
        $validated = $request->validate([
            'idea_prompt' => 'required|string|min:5|max:5000',
            'client_name' => 'nullable|string|max:255',
            'project_type' => 'nullable|in:outsourcing,product,enterprise,rnd',
            'budget' => 'nullable|numeric|min:0',
        ]);

        $analysis = $analyzeAction->execute(
            ideaPrompt: $validated['idea_prompt'],
            context: $validated,
        );

        return response()->json([
            'success' => true,
            'analysis' => $analysis,
        ]);
    }

    /**
     * Incubate and initialize a new enterprise SDLC project from an analyzed idea.
     */
    public function createFromIdea(
        Request $request,
        CreateProjectFromIdeaAction $createFromIdeaAction,
    ): RedirectResponse {
        $validated = $request->validate([
            'idea_prompt' => 'required|string|min:5|max:5000',
            'name' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:50|unique:projects,code',
            'client_name' => 'nullable|string|max:255',
            'project_type' => 'nullable|in:outsourcing,product,enterprise,rnd',
            'budget' => 'nullable|numeric|min:0',
        ]);

        $project = $createFromIdeaAction->execute(
            ideaPrompt: $validated['idea_prompt'],
            overrides: $validated,
            creatorName: $request->input('creator_name', 'Võ Hoàng Tú'),
            creatorRole: $request->input('creator_role', 'Lead Solution Architect'),
        );

        return redirect()->route('projects.show', $project->id)
            ->with('success', "Dự án '{$project->name}' đã được AI ươm mầm và sinh trọn bộ hồ sơ 7 pha SDLC thành công.");
    }

    /**
     * Approve a quality gate with digital non-repudiation signature.
     */
    public function approveGate(
        Request $request,
        int $gateId,
        ApproveQualityGateAction $approveGateAction,
    ): RedirectResponse {
        $validated = $request->validate([
            'approver_name' => 'required|string|max:255',
            'approver_role' => 'required|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'override_reason' => 'nullable|string|max:1000',
        ]);

        try {
            $approveGateAction->execute(
                gateId: $gateId,
                approverName: $validated['approver_name'],
                approverRole: $validated['approver_role'],
                notes: $validated['notes'] ?? null,
                overrideReason: $validated['override_reason'] ?? null,
            );

            return back()->with('success', 'Cổng chất lượng đã được ký số phê duyệt và dự án đã chuyển sang pha tiếp theo.');
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Reject a quality gate.
     */
    public function rejectGate(
        Request $request,
        int $gateId,
        RejectQualityGateAction $rejectGateAction,
    ): RedirectResponse {
        $validated = $request->validate([
            'reviewer_name' => 'required|string|max:255',
            'reviewer_role' => 'required|string|max:255',
            'reason' => 'required|string|max:1000',
        ]);

        $rejectGateAction->execute(
            gateId: $gateId,
            reviewerName: $validated['reviewer_name'],
            reviewerRole: $validated['reviewer_role'],
            rejectionReason: $validated['reason'],
        );

        return back()->with('warning', 'Cổng chất lượng đã bị từ chối phê duyệt. Yêu cầu hoàn thiện tiêu chuẩn.');
    }

    /**
     * Sign off a technical deliverable document.
     */
    public function signDocument(
        Request $request,
        int $docId,
        SignOffDocumentAction $signDocAction,
    ): RedirectResponse {
        $validated = $request->validate([
            'signer_name' => 'required|string|max:255',
            'signer_role' => 'required|string|max:255',
        ]);

        $signDocAction->execute(
            documentId: $docId,
            signOffBy: $validated['signer_name'],
            signOffRole: $validated['signer_role'],
        );

        return back()->with('success', 'Tài liệu đã được ký số phê duyệt tính hợp lệ.');
    }

    /**
     * Batch sign-off all unapproved documents within an SDLC phase.
     */
    public function batchSignPhaseDocs(
        Request $request,
        int $projectId,
        int $phaseNumber,
        BatchSignOffPhaseDocumentsAction $batchSignAction,
    ): RedirectResponse {
        $project = $this->projectRepository->findById($projectId);
        if (! $project) {
            abort(404, 'Dự án không tồn tại.');
        }

        $signerName = $request->input('signer_name', 'Võ Hoàng Tú');
        $signerRole = $request->input('signer_role', 'Lead Solution Architect');

        $result = $batchSignAction->execute(
            project: $project,
            phaseNumber: $phaseNumber,
            signOffBy: $signerName,
            signOffRole: $signerRole
        );

        if ($result['total_signed'] === 0) {
            return back()->with('info', "Pha {$phaseNumber} không có tài liệu nào cần ký duyệt bổ sung.");
        }

        return back()->with('success', "Đã ký số phê duyệt thành công {$result['total_signed']} tài liệu kỹ thuật trong Pha {$phaseNumber} với chứng thực HMAC-SHA256.");
    }

    /**
     * Add a traceability link to RTM.
     */
    public function addRtmTrace(
        Request $request,
        int $projectId,
        CreateRTMTraceAction $rtmAction,
    ): RedirectResponse {
        $validated = $request->validate([
            'req_code' => 'required|string|max:50',
            'req_title' => 'required|string|max:255',
            'user_story_code' => 'required|string|max:50',
            'commit_or_pr' => 'nullable|string|max:100',
            'test_case_code' => 'nullable|string|max:50',
            'defect_code' => 'nullable|string|max:50',
            'release_version' => 'nullable|string|max:50',
            'status' => 'required|in:mapped,in_dev,tested,passed,released',
        ]);

        $rtmAction->execute(
            projectId: $projectId,
            data: $validated,
            userName: $request->input('user_name', 'QA Lead'),
            userRole: 'Quality Assurance',
        );

        return back()->with('success', 'Mắt xích truy xuất RTM đã được ghi nhận.');
    }

    /**
     * Toggle a specific criterion in a Quality Gate checklist.
     */
    public function toggleGateCriteria(
        Request $request,
        int $gateId,
        ToggleGateCriteriaAction $toggleAction,
    ): RedirectResponse {
        $validated = $request->validate([
            'criterion' => 'required|string',
            'passed' => 'required|boolean',
        ]);

        $toggleAction->execute(
            gateId: $gateId,
            criterion: $validated['criterion'],
            passed: (bool) $validated['passed'],
            userName: $request->input('user_name', 'Võ Hoàng Tú'),
            userRole: 'Solution Architect',
        );

        return back()->with('success', 'Cập nhật tiêu chí thẩm định chất lượng thành công.');
    }

    /**
     * Inspect project artifacts & metrics to auto-evaluate Quality Gate criteria via AI.
     */
    public function aiEvaluateGate(
        int $gateId,
        EvaluateQualityGateAction $evaluateAction,
    ): RedirectResponse {
        $result = $evaluateAction->execute($gateId);

        $statusMsg = $result['all_passed']
            ? "AI đã thẩm định thành công 100% ({$result['passed_criteria_count']}/{$result['total_criteria_count']} tiêu chí đạt). Sẵn sàng để ký duyệt số."
            : "AI đã thẩm định: Đạt {$result['passed_criteria_count']}/{$result['total_criteria_count']} tiêu chí. Vui lòng rà soát lại các mục chưa hoàn thiện.";

        return back()->with('success', $statusMsg);
    }

    /**
     * Update technical document content and version.
     */
    public function updateDocument(
        Request $request,
        int $docId,
        SaveDocumentContentAction $saveDocAction,
    ): RedirectResponse {
        $validated = $request->validate([
            'content' => 'required|string',
            'version' => 'required|string|max:20',
        ]);

        $saveDocAction->execute(
            documentId: $docId,
            content: $validated['content'],
            version: $validated['version'],
            editorName: $request->input('editor_name', 'Võ Hoàng Tú'),
            editorRole: 'Solution Architect',
        );

        return back()->with('success', 'Tài liệu kỹ thuật đã được cập nhật thành công.');
    }

    /**
     * Create a new technical deliverable document in the Document Library.
     */
    public function storeDocument(
        Request $request,
        int $projectId,
        CreateDocumentAction $createDocAction,
    ): RedirectResponse {
        $validated = $request->validate([
            'phase_number' => 'required|integer|min:1|max:7',
            'doc_type' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'version' => 'nullable|string|max:20',
            'content' => 'nullable|string',
        ]);

        $createDocAction->execute(
            projectId: $projectId,
            data: $validated,
            creatorName: $request->input('creator_name', 'Võ Hoàng Tú'),
            creatorRole: $request->input('creator_role', 'Solution Architect'),
        );

        return back()->with('success', 'Hồ sơ kỹ thuật mới đã được khởi tạo và lưu vào Kho Tài Liệu.');
    }

    /**
     * Add a new RACI matrix assignment.
     */
    public function addRaci(
        Request $request,
        int $projectId,
        AssignRACIRoleAction $raciAction,
    ): RedirectResponse {
        $validated = $request->validate([
            'activity_name' => 'required|string|max:255',
            'phase_number' => 'required|integer|min:1|max:7',
            'responsible' => 'required|string|max:255',
            'accountable' => 'required|string|max:255',
            'consulted' => 'nullable',
            'informed' => 'nullable',
        ]);

        $raciAction->execute(
            projectId: $projectId,
            data: $validated,
            assignerName: $request->input('user_name', 'Võ Hoàng Tú'),
            assignerRole: 'Solution Architect',
        );

        return back()->with('success', 'Đã bổ sung ma trận trách nhiệm RACI mới.');
    }

    /**
     * Synthesize and generate SDLC technical document using AI Action.
     */
    public function aiGenerateDoc(
        Request $request,
        int $projectId,
        GenerateSDLCDocumentAction $aiAction,
    ): RedirectResponse {
        $project = $this->projectRepository->findById($projectId);
        if (! $project) {
            abort(404, 'Dự án không tồn tại.');
        }

        $validated = $request->validate([
            'doc_type' => 'required|string|max:50',
            'topic_prompt' => 'required|string|min:3|max:1000',
            'phase_number' => 'required|integer|min:1|max:7',
        ]);

        $aiAction->execute(
            project: $project,
            docType: $validated['doc_type'],
            topicPrompt: $validated['topic_prompt'],
            phaseNumber: (int) $validated['phase_number'],
            authorName: $request->input('author_name', 'Võ Hoàng Tú'),
            authorRole: 'Lead Solution Architect',
        );

        return back()->with('success', 'Trợ lý AI đã tổng hợp và sinh tài liệu kỹ thuật thành công.');
    }

    /**
     * 1-Click Batch Synthesize SDLC deliverables for a phase or all 7 phases via AI 99% Engine.
     */
    public function batchAiGenerateDocs(
        Request $request,
        int $projectId,
        BatchSynthesizeProjectDocumentsAction $batchAiAction,
    ): RedirectResponse {
        $project = $this->projectRepository->findById($projectId);
        if (! $project) {
            abort(404, 'Dự án không tồn tại.');
        }

        $phaseNumber = $request->input('phase_number') ? (int) $request->input('phase_number') : null;

        $result = $batchAiAction->execute(
            project: $project,
            targetPhaseNumber: $phaseNumber,
            authorName: $request->input('author_name', 'AI SDLC Copilot Engine (Autonomous 99%)'),
            authorRole: 'Autonomous AI Solution Architect',
        );

        $scopeMsg = $phaseNumber !== null ? "Pha {$phaseNumber}" : 'toàn bộ 7 Pha SDLC';

        if ($result['total_synthesized'] === 0) {
            return back()->with('info', "Hồ sơ kỹ thuật cho {$scopeMsg} đã đầy đủ chuẩn hóa, không cần sinh thêm.");
        }

        return back()->with('success', "Trợ lý AI 99% đã tự động tổng hợp thành công {$result['total_synthesized']} hồ sơ kỹ thuật chuyên sâu cho {$scopeMsg}.");
    }

    /**
     * Cryptographically verify all audit logs in the chain for non-repudiation integrity.
     */
    public function verifyAuditChain(
        int $projectId,
        VerifyAuditChainAction $verifyAction,
    ): RedirectResponse {
        $result = $verifyAction->execute($projectId);

        if ($result['is_valid']) {
            return back()->with('success', "Xác thực thành công 100% ({$result['total_verified']} bản ghi). Chuỗi kiểm toán bất biến và hoàn toàn toàn vẹn.");
        }

        return back()->with('warning', "Cảnh báo: Phát hiện {$result['tampered_count']} bản ghi có dấu hiệu bất thường!");
    }

    /**
     * Package a release, tag RTM requirements, synthesize Release Notes, and record audit log.
     */
    public function packageRelease(
        Request $request,
        int $projectId,
        PackageReleaseAction $releaseAction,
    ): RedirectResponse {
        $project = $this->projectRepository->findById($projectId);
        if (! $project) {
            abort(404, 'Dự án không tồn tại.');
        }

        $validated = $request->validate([
            'release_version' => 'required|string|max:50',
            'release_notes_summary' => 'required|string|max:2000',
            'release_manager' => 'nullable|string|max:255',
            'manager_role' => 'nullable|string|max:255',
        ]);

        $result = $releaseAction->execute(
            project: $project,
            releaseVersion: $validated['release_version'],
            releaseNotesSummary: $validated['release_notes_summary'],
            releaseManager: $validated['release_manager'] ?? 'Võ Hoàng Tú',
            managerRole: $validated['manager_role'] ?? 'Lead Solution Architect',
        );

        return back()->with('success', "Bản phát hành {$result['release_version']} đã được đóng gói thành công cùng {$result['requirements_tagged']} hạng mục yêu cầu kỹ thuật được chuyển giao.");
    }

    /**
     * Ingest Git webhook commit or PR event and link to RTM trace.
     */
    public function ingestGitWebhook(
        Request $request,
        int $projectId,
        IngestGitWebhookAction $gitAction,
    ): RedirectResponse {
        $project = $this->projectRepository->findById($projectId);
        if (! $project) {
            abort(404, 'Dự án không tồn tại.');
        }

        $validated = $request->validate([
            'event_type' => 'required|in:push,pull_request',
            'author' => 'required|string|max:255',
            'message' => 'required|string|max:500',
            'commit_sha' => 'nullable|string|max:100',
            'pr_number' => 'nullable|integer',
        ]);

        $trace = $gitAction->execute([
            'project_code' => $project->code,
            'event_type' => $validated['event_type'],
            'author' => $validated['author'],
            'commit_sha' => $validated['commit_sha'] ?? null,
            'pr_number' => ! empty($validated['pr_number']) ? (int) $validated['pr_number'] : null,
            'message' => $validated['message'],
        ]);

        if ($trace) {
            return back()->with('success', "Sự kiện Git đã được phân tích và liên kết tự động tới mã yêu cầu {$trace->req_code} trong RTM.");
        }

        return back()->with('info', 'Sự kiện Git đã được ghi nhận. Không tìm thấy mã REQ-* trong thông điệp commit/PR để liên kết tự động.');
    }

    /**
     * Log a new defect into the project and sync to RTM.
     */
    public function logDefect(
        Request $request,
        int $projectId,
        LogDefectAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'defect_code' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'steps_to_reproduce' => 'nullable|string',
            'severity' => 'required|in:blocker,critical,major,minor',
            'rtm_trace_id' => 'nullable|exists:rtm_traces,id',
            'assigned_to' => 'nullable|string|max:255',
        ]);

        $action->execute(
            data: array_merge($validated, ['project_id' => $projectId]),
            userName: $request->input('user_name', 'Võ Hoàng Tú'),
            userRole: 'QA Lead',
        );

        return back()->with('success', "Khiếm khuyết {$validated['defect_code']} đã được ghi nhận vào hệ thống.");
    }

    /**
     * Resolve or close a defect.
     */
    public function resolveDefect(
        Request $request,
        int $defectId,
        ResolveDefectAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'status' => 'required|in:resolved,closed',
            'resolution_notes' => 'required|string|max:1000',
        ]);

        $action->execute(
            defectId: $defectId,
            data: $validated,
            resolverName: $request->input('user_name', 'Võ Hoàng Tú'),
            resolverRole: 'Lead Solution Architect',
        );

        return back()->with('success', 'Trạng thái xử lý lỗi đã được cập nhật thành công.');
    }

    /**
     * Ingest automated CI/CD pipeline build & test coverage metrics.
     */
    public function ingestCIMetrics(
        Request $request,
        int $projectId,
        IngestCIPipelineMetricsAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'build_number' => 'required|string|max:50',
            'branch' => 'nullable|string|max:100',
            'commit_sha' => 'required|string|max:100',
            'unit_test_passed' => 'required|integer|min:0',
            'unit_test_failed' => 'required|integer|min:0',
            'coverage_percentage' => 'required|numeric|min:0|max:100',
            'code_smells_count' => 'nullable|integer|min:0',
            'vulnerabilities_count' => 'nullable|integer|min:0',
            'sast_status' => 'required|in:passed,failed',
            'pipeline_status' => 'required|in:success,failed,running',
        ]);

        $metric = $action->execute(
            payload: array_merge($validated, ['project_id' => $projectId]),
            reporter: $request->input('reporter', 'GitHub Actions CI'),
        );

        return back()->with('success', "Chỉ số CI/CD Build #{$metric->build_number} (Coverage: {$metric->coverage_percentage}%) đã được nạp thành công.");
    }

    /**
     * Log a production incident and calculate SLA impact.
     */
    public function logIncident(
        Request $request,
        int $projectId,
        LogProductionIncidentAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'incident_code' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'severity' => 'required|in:P1_CRITICAL,P2_MAJOR,P3_MINOR',
            'downtime_minutes' => 'required|integer|min:0',
            'root_cause' => 'nullable|string',
            'corrective_actions' => 'nullable|string',
            'status' => 'required|in:investigating,mitigated,resolved',
            'detected_at' => 'required|date',
            'resolved_at' => 'nullable|date',
        ]);

        $action->execute(
            data: array_merge($validated, ['project_id' => $projectId]),
            operatorName: $request->input('user_name', 'Võ Hoàng Tú'),
            operatorRole: 'Lead SRE',
        );

        return back()->with('success', "Sự cố {$validated['incident_code']} đã được ghi nhận vào nhật ký SLA vận hành.");
    }

    /**
     * Create an Agile task on the Kanban board.
     */
    public function createTask(
        Request $request,
        int $projectId,
        CreateTaskAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'task_code' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:todo,in_progress,code_review,done',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'story_points' => 'required|integer|min:1|max:100',
            'assigned_to' => 'nullable|string|max:100',
            'sprint_id' => 'nullable|integer|exists:sprints,id',
            'rtm_trace_id' => 'nullable|integer|exists:rtm_traces,id',
            'github_pr_url' => 'nullable|url|max:255',
        ]);

        $task = $action->execute(
            data: array_merge($validated, ['project_id' => $projectId]),
            creatorName: $request->input('user_name', 'Võ Hoàng Tú'),
            creatorRole: 'Lead Solution Architect',
        );

        return back()->with('success', "Task {$task->task_code} đã được tạo thành công trên Kanban Board.");
    }

    /**
     * Update task status (Kanban column transition).
     */
    public function updateTaskStatus(
        Request $request,
        int $taskId,
        UpdateTaskStatusAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'status' => 'required|in:todo,in_progress,code_review,done',
            'github_pr_url' => 'nullable|url|max:255',
        ]);

        $task = $action->execute(
            taskId: $taskId,
            newStatus: $validated['status'],
            githubPrUrl: $validated['github_pr_url'] ?? null,
            userName: $request->input('user_name', 'Võ Hoàng Tú'),
            userRole: 'Developer',
        );

        return back()->with('success', "Trạng thái task {$task->task_code} đã chuyển sang [{$task->status}].");
    }

    /**
     * 1-Click AI Synthesize granular Agile tasks from WBS & SRS for Kanban Sprint board.
     */
    public function aiGenerateSprintTasks(
        Request $request,
        int $projectId,
        GenerateSprintTasksAction $action,
    ): RedirectResponse {
        $project = $this->projectRepository->findById($projectId);
        if (! $project) {
            abort(404, 'Dự án không tồn tại.');
        }

        $result = $action->execute(
            project: $project,
            authorName: $request->input('author_name', 'AI Agile Coach (Autonomous 99%)'),
            authorRole: 'Autonomous Scrum Master',
        );

        if ($result['total_tasks'] === 0) {
            return back()->with('info', 'Các task trong sprint đã tồn tại đầy đủ, không cần sinh thêm.');
        }

        return back()->with('success', "AI đã tự động phân rã thành công {$result['total_tasks']} nhiệm vụ kỹ thuật chi tiết vào Kanban Sprint Board.");
    }

    /**
     * Create a new Test Run suite.
     */
    public function createTestRun(
        Request $request,
        int $projectId,
        CreateTestRunAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'environment' => 'required|in:staging,uat,performance,production',
            'release_version' => 'nullable|string|max:50',
            'auto_populate_rtm' => 'nullable|boolean',
        ]);

        $testRun = $action->execute(
            data: [
                'project_id' => $projectId,
                'name' => $validated['name'],
                'environment' => $validated['environment'],
                'release_version' => $validated['release_version'] ?? null,
            ],
            userName: $request->input('user_name', 'Võ Hoàng Tú'),
            userRole: 'QA Lead',
        );

        return back()->with('success', "Đợt kiểm thử {$testRun->name} ({$testRun->environment}) đã được khởi tạo.");
    }

    /**
     * 1-Click AI Synthesize comprehensive Test Suite with realistic test cases for Phase 5 QA.
     */
    public function aiGenerateTestRun(
        Request $request,
        int $projectId,
        GenerateTestSuiteAction $action,
    ): RedirectResponse {
        $project = $this->projectRepository->findById($projectId);
        if (! $project) {
            abort(404, 'Dự án không tồn tại.');
        }

        $testRun = $action->execute(
            project: $project,
            authorName: $request->input('author_name', 'AI QA Test Suite Generator (Autonomous 99%)'),
            authorRole: 'Autonomous QA Engineer',
        );

        $itemsCount = $testRun->items()->count();

        return back()->with('success', "AI đã tự động thiết lập đợt kiểm thử '{$testRun->name}' với {$itemsCount} kịch bản test cases toàn diện.");
    }

    /**
     * Execute and record status for a specific test run item.
     */
    public function executeTestItem(
        Request $request,
        int $itemId,
        ExecuteTestItemAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'status' => 'required|in:passed,failed,blocked,skipped',
            'actual_result' => 'nullable|string',
        ]);

        $item = $action->execute(
            itemId: $itemId,
            status: $validated['status'],
            actualResult: $validated['actual_result'] ?? null,
            userName: $request->input('user_name', 'Võ Hoàng Tú'),
        );

        return back()->with('success', "Ca kiểm thử {$item->test_case_code} đã được ghi nhận: {$item->status}.");
    }

    /**
     * 1-Click Convert Failed Test Item into a Defect (locks Gate 5 if blocker/critical).
     */
    public function convertTestToDefect(
        Request $request,
        int $itemId,
        ConvertTestFailToDefectAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'severity' => 'required|in:blocker,critical,major,minor',
            'assigned_to' => 'nullable|string|max:100',
        ]);

        $defect = $action->execute(
            testRunItemId: $itemId,
            severity: $validated['severity'],
            assignedTo: $validated['assigned_to'] ?? 'Võ Hoàng Tú',
            reporter: $request->input('user_name', 'Võ Hoàng Tú (QA Lead)'),
        );

        $msg = "Đã sinh tự động lỗi {$defect->defect_code} từ ca kiểm thử.";
        if (in_array($validated['severity'], ['blocker', 'critical'])) {
            $msg .= ' Lưu ý: Quality Gate 5 đã tự động KHÓA do mức độ nghiêm trọng.';
        }

        return back()->with('success', $msg);
    }

    /**
     * Cryptographically sign CAB release authorization.
     */
    public function signCAB(
        Request $request,
        int $projectId,
        SignCABAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'release_version' => 'required|string|max:50',
            'role_required' => 'required|in:LEAD_ARCHITECT,SECOPS_LEAD,PRODUCT_OWNER',
            'decision' => 'required|in:approved,rejected',
            'notes' => 'nullable|string|max:1000',
        ]);

        $signoff = $action->execute(
            projectId: $projectId,
            releaseVersion: $validated['release_version'],
            roleRequired: $validated['role_required'],
            signerName: $request->input('user_name', 'Võ Hoàng Tú'),
            decision: $validated['decision'],
            notes: $validated['notes'] ?? null,
        );

        return back()->with('success', "Hội đồng CAB: Chữ ký số [{$signoff->signature_token}] ({$signoff->role_required}) đã được xác thực an toàn.");
    }

    /**
     * 1-Click Batch sign-off all 3 CAB governance roles (Lead SA, SecOps, PO).
     */
    public function batchSignCAB(
        Request $request,
        int $projectId,
        SignCABAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'release_version' => 'required|string|max:50',
            'signer_name' => 'nullable|string|max:255',
        ]);

        $roles = ['LEAD_ARCHITECT', 'SECOPS_LEAD', 'PRODUCT_OWNER'];
        $signerName = $validated['signer_name'] ?? 'Võ Hoàng Tú';

        foreach ($roles as $role) {
            $action->execute(
                projectId: $projectId,
                releaseVersion: $validated['release_version'],
                roleRequired: $role,
                signerName: $signerName,
                decision: 'approved',
                notes: 'Hội đồng CAB phê chuẩn phát hành (Autonomous 99% Sign-off).'
            );
        }

        return back()->with('success', "Đã ký số phê chuẩn trọn bộ 3/3 vai trò Hội đồng CAB cho phiên bản {$validated['release_version']}.");
    }

    /**
     * Update Canary Deployment traffic percentage or trigger emergency rollback.
     */
    public function updateRolloutTraffic(
        Request $request,
        int $projectId,
        UpdateRolloutTrafficAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'release_version' => 'required|string|max:50',
            'traffic_percentage' => 'required|integer|min:0|max:100',
            'is_rollback' => 'nullable|boolean',
            'rollback_reason' => 'nullable|string|max:500',
        ]);

        $rollout = $action->execute(
            projectId: $projectId,
            releaseVersion: $validated['release_version'],
            trafficPercentage: (int) $validated['traffic_percentage'],
            isRollback: (bool) ($validated['is_rollback'] ?? false),
            rollbackReason: $validated['rollback_reason'] ?? null,
            userName: $request->input('user_name', 'Võ Hoàng Tú'),
        );

        $msg = "Canary Rollout v{$rollout->release_version} lưu lượng điều chỉnh về {$rollout->traffic_percentage}%.";
        if ($rollout->status === 'rolled_back') {
            $msg = "⚠️ CẢNH BÁO: Đã kích hoạt Emergency Rollback cho phiên bản v{$rollout->release_version} (Lưu lượng 0%).";
        }

        return back()->with('success', $msg);
    }

    /**
     * Trigger on-demand AI Compliance & Risk Audit.
     */
    public function auditCompliance(
        int $projectId,
        AuditProjectComplianceAction $action,
    ): RedirectResponse {
        $project = $this->projectRepository->findById($projectId);
        if (! $project) {
            abort(404, 'Dự án không tồn tại.');
        }

        $audit = $action->execute($project);

        return back()->with('success', "Đã hoàn thành kiểm toán tuân thủ: Điểm {$audit['score']}/100 (Hạng {$audit['grade']}).");
    }

    /**
     * Create an external integration Webhook.
     */
    public function createWebhook(
        Request $request,
        int $projectId,
        CreateWebhookAction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'url' => 'required|url|max:255',
            'events' => 'required|array|min:1',
            'events.*' => 'string|in:gate.approved,defect.logged,release.packaged,rollout.updated',
        ]);

        $webhook = $action->execute(
            data: [
                'project_id' => $projectId,
                'name' => $validated['name'],
                'url' => $validated['url'],
                'events' => $validated['events'],
            ],
            userName: $request->input('user_name', 'Võ Hoàng Tú'),
        );

        return back()->with('success', "Webhook [{$webhook->name}] đã được kích hoạt thành công với Secret Key.");
    }
}
