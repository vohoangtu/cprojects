<?php

namespace Tests\Feature;

use App\Actions\AI\GenerateSDLCDocumentAction;
use App\Actions\Audit\VerifyAuditChainAction;
use App\Actions\Defects\LogDefectAction;
use App\Actions\Defects\ResolveDefectAction;
use App\Actions\Documents\SaveDocumentContentAction;
use App\Actions\Documents\SignOffDocumentAction;
use App\Actions\Gates\ApproveQualityGateAction;
use App\Actions\Gates\ToggleGateCriteriaAction;
use App\Actions\Integrations\IngestCIPipelineMetricsAction;
use App\Actions\Operations\CalculateSLAMetricsAction;
use App\Actions\Operations\LogProductionIncidentAction;
use App\Actions\Phases\CalculatePhaseProgressAction;
use App\Actions\Projects\CreateProjectAction;
use App\Actions\RACI\AnalyzeRACIWorkloadAction;
use App\Actions\RACI\AssignRACIRoleAction;
use App\Actions\Release\PackageReleaseAction;
use App\Actions\RTM\AnalyzeRTMGapsAction;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SDLCWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_project_with_7_phases_and_full_deliverables_suite(): void
    {
        $action = app(CreateProjectAction::class);

        $project = $action->execute([
            'name' => 'Hệ thống Quản lý Viễn thông Telco 2026',
            'code' => 'PRJ-TELCO-2026',
            'client_name' => 'Viettel Telecom',
            'project_type' => 'enterprise',
            'budget' => 250000.00,
        ], creatorName: 'Võ Hoàng Tú', creatorRole: 'Lead Solution Architect');

        $this->assertInstanceOf(Project::class, $project);
        $this->assertEquals(7, $project->phases()->count());
        $this->assertEquals(6, $project->qualityGates()->count());
        $this->assertEquals(1, $project->current_phase_number);
        // Full suite of technical documents initialized
        $this->assertGreaterThanOrEqual(15, $project->documents()->count());
        $this->assertNotEmpty($project->raciAssignments);
        $this->assertNotEmpty($project->auditLogs);
    }

    public function test_can_toggle_quality_gate_checklist_criteria(): void
    {
        $createAction = app(CreateProjectAction::class);
        $toggleAction = app(ToggleGateCriteriaAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án Cloud Native 2026',
            'code' => 'PRJ-CLOUD-2026',
            'client_name' => 'Cloud Hub',
            'project_type' => 'enterprise',
        ]);

        $gate1 = $project->qualityGates()->first();
        $this->assertNotNull($gate1);

        $criterion = 'User Stories & Acceptance Criteria chuẩn Gherkin đầy đủ';
        $updatedGate = $toggleAction->execute(
            gateId: $gate1->id,
            criterion: $criterion,
            passed: true,
            userName: 'Võ Hoàng Tú',
            userRole: 'Solution Architect'
        );

        $this->assertTrue($updatedGate->criteria_checklist[$criterion]);
    }

    public function test_can_approve_quality_gate_and_advance_phase_with_cryptographic_token(): void
    {
        $createAction = app(CreateProjectAction::class);
        $approveAction = app(ApproveQualityGateAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án AI Healthcare 2026',
            'code' => 'PRJ-MED-2026',
            'client_name' => 'MedTech Global',
            'project_type' => 'product',
        ]);

        $gate1 = $project->qualityGates()->where('gate_number', 1)->first();
        $this->assertNotNull($gate1);
        $this->assertEquals('pending', $gate1->status);

        $approvedGate = $approveAction->execute(
            gateId: $gate1->id,
            approverName: 'Võ Hoàng Tú',
            approverRole: 'Solution Architect',
            notes: 'Đã hoàn tất đánh giá tính khả thi và tiêu chuẩn bảo mật y tế.'
        );

        $this->assertEquals('passed', $approvedGate->status);
        $this->assertStringStartsWith('QG-SIG-', $approvedGate->sign_off_token);

        // Project advances to Phase 2
        $project->refresh();
        $this->assertEquals(2, $project->current_phase_number);
    }

    public function test_can_save_and_sign_technical_document(): void
    {
        $createAction = app(CreateProjectAction::class);
        $saveDocAction = app(SaveDocumentContentAction::class);
        $signDocAction = app(SignOffDocumentAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án Smart City 2026',
            'code' => 'PRJ-CITY-2026',
            'client_name' => 'Hanoi Innovation Park',
            'project_type' => 'enterprise',
        ]);

        $doc = $project->documents()->where('doc_type', 'SRS')->first();
        $this->assertNotNull($doc);

        // 1. Update content
        $updatedDoc = $saveDocAction->execute(
            documentId: $doc->id,
            content: '# SRS v1.1 Updated with IoT Gateways',
            version: 'v1.1',
            editorName: 'Võ Hoàng Tú',
            editorRole: 'Lead Solution Architect'
        );
        $this->assertEquals('v1.1', $updatedDoc->version);

        // 2. Sign off with digital non-repudiation signature
        $signedDoc = $signDocAction->execute(
            documentId: $doc->id,
            signOffBy: 'Võ Hoàng Tú',
            signOffRole: 'Lead Solution Architect'
        );
        $this->assertEquals('approved', $signedDoc->status);
        $this->assertStringStartsWith('DOC-SIG-', $signedDoc->signature_hash);
    }

    public function test_can_manually_create_new_technical_document_via_route(): void
    {
        $createAction = app(CreateProjectAction::class);
        $project = $createAction->execute([
            'name' => 'Dự án Smart Banking',
            'code' => 'PRJ-BNK-2026',
            'client_name' => 'Vietcombank Digital',
            'project_type' => 'enterprise',
        ]);

        $initialDocCount = $project->documents()->count();

        $response = $this->post(route('documents.store', ['projectId' => $project->id]), [
            'phase_number' => 2,
            'doc_type' => 'DATA_DICTIONARY',
            'title' => 'Từ Điển Dữ Liệu & Chuẩn Hóa Schema',
            'version' => 'v1.0',
            'content' => '# DATA DICTIONARY\n\nDanh mục định nghĩa toàn bộ 250 trường dữ liệu nhạy cảm theo chuẩn PCI-DSS.',
            'creator_name' => 'Võ Hoàng Tú',
            'creator_role' => 'Data Architect',
        ]);

        $response->assertRedirect();
        $this->assertEquals($initialDocCount + 1, $project->documents()->count());

        $newDoc = $project->documents()->where('doc_type', 'DATA_DICTIONARY')->first();
        $this->assertNotNull($newDoc);
        $this->assertEquals(2, $newDoc->phase_number);
        $this->assertEquals('draft', $newDoc->status);
        $this->assertStringContainsString('PCI-DSS', $newDoc->content);

        // Verify audit log exists
        $this->assertDatabaseHas('audit_logs', [
            'project_id' => $project->id,
            'action_type' => 'DOCUMENT_CREATED',
            'entity_type' => 'ProjectDocument',
            'entity_id' => $newDoc->id,
        ]);
    }

    public function test_can_assign_raci_role_and_verify_audit_log(): void
    {
        $createAction = app(CreateProjectAction::class);
        $raciAction = app(AssignRACIRoleAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án Fintech 2026',
            'code' => 'PRJ-FIN-2026',
            'client_name' => 'Techcom Securities',
            'project_type' => 'enterprise',
        ]);

        $raci = $raciAction->execute(
            projectId: $project->id,
            data: [
                'activity_name' => 'Kiểm toán Thâm nhập Pentest',
                'phase_number' => 5,
                'responsible' => 'SecOps Whitehat Team',
                'accountable' => 'Võ Hoàng Tú',
                'consulted' => ['Infra Lead', 'External Auditor'],
                'informed' => ['Ban Giám Đốc'],
            ],
            assignerName: 'Võ Hoàng Tú',
            assignerRole: 'Solution Architect'
        );

        $this->assertEquals('Võ Hoàng Tú', $raci->accountable);

        // Verify Audit Log recorded with digital fingerprint
        $lastLog = $project->auditLogs()->first();
        $this->assertNotNull($lastLog);
        $this->assertNotEmpty($lastLog->digital_fingerprint);
    }

    public function test_can_synthesize_document_using_ai_action(): void
    {
        $createAction = app(CreateProjectAction::class);
        $aiAction = app(GenerateSDLCDocumentAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án AI Automation 2026',
            'code' => 'PRJ-AUTO-2026',
            'client_name' => 'RoboTech Asia',
            'project_type' => 'rnd',
        ]);

        $doc = $aiAction->execute(
            project: $project,
            docType: 'SRS',
            topicPrompt: 'Tự động hóa luồng phê duyệt cổng thanh toán qua Kafka event streams',
            phaseNumber: 1,
            authorName: 'Võ Hoàng Tú',
            authorRole: 'Lead Solution Architect'
        );

        $this->assertNotNull($doc);
        $this->assertEquals('SRS', $doc->doc_type);
        $this->assertStringContainsString('Kafka event streams', $doc->content);
    }

    public function test_can_verify_audit_chain_integrity(): void
    {
        $createAction = app(CreateProjectAction::class);
        $verifyAction = app(VerifyAuditChainAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án Core Ledger 2026',
            'code' => 'PRJ-LEDGER-2026',
            'client_name' => 'InterBank Network',
            'project_type' => 'enterprise',
        ]);

        $result = $verifyAction->execute($project->id);

        $this->assertTrue($result['is_valid']);
        $this->assertGreaterThan(0, $result['total_verified']);
        $this->assertEquals(0, $result['tampered_count']);
    }

    public function test_can_analyze_rtm_traceability_gaps(): void
    {
        $createAction = app(CreateProjectAction::class);
        $analyzeAction = app(AnalyzeRTMGapsAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án Mobile App 2026',
            'code' => 'PRJ-APP-2026',
            'client_name' => 'Digital Consumer Inc',
            'project_type' => 'product',
        ]);

        $analysis = $analyzeAction->execute($project->id);

        $this->assertArrayHasKey('coverage_score', $analysis);
        $this->assertArrayHasKey('tested_count', $analysis);
        $this->assertArrayHasKey('missing_tests', $analysis);
        $this->assertGreaterThan(0, $analysis['total_requirements']);
    }

    public function test_project_web_routes_and_actions(): void
    {
        $createAction = app(CreateProjectAction::class);
        $project = $createAction->execute([
            'name' => 'Dự án E-Commerce 2026',
            'code' => 'PRJ-ECOMM-2026',
            'client_name' => 'Retail Group',
            'project_type' => 'product',
        ]);

        // GET /projects
        $response = $this->get('/projects');
        $response->assertStatus(200);

        // GET /projects/{id}
        $showResponse = $this->get("/projects/{$project->id}");
        $showResponse->assertStatus(200);

        // POST toggle criteria
        $gate = $project->qualityGates()->first();
        $toggleRes = $this->post("/quality-gates/{$gate->id}/toggle-criteria", [
            'criterion' => array_key_first($gate->criteria_checklist),
            'passed' => true,
        ]);
        $toggleRes->assertStatus(302);

        // POST AI generate
        $aiRes = $this->post("/projects/{$project->id}/ai-generate", [
            'doc_type' => 'SAD',
            'phase_number' => 2,
            'topic_prompt' => 'Kiến trúc microservices phân tán chịu tải cao',
        ]);
        $aiRes->assertStatus(302);

        // POST verify audit
        $verifyRes = $this->post("/projects/{$project->id}/verify-audit");
        $verifyRes->assertStatus(302);

        // POST Git Webhook ingestion
        $gitRes = $this->post("/projects/{$project->id}/git-webhook", [
            'event_type' => 'push',
            'author' => 'Võ Hoàng Tú',
            'message' => 'feat(REQ-AUTH-01): Cập nhật cơ chế xác thực JWT [STORY-01]',
            'commit_sha' => 'c89e21bf',
        ]);
        $gitRes->assertStatus(302);

        // POST Package Release
        $releaseRes = $this->post("/projects/{$project->id}/package-release", [
            'release_version' => 'v1.0.0-PROD',
            'release_notes_summary' => 'Nghiệm thu toàn bộ tính năng và đóng gói bản phát hành chính thức.',
            'release_manager' => 'Võ Hoàng Tú',
            'manager_role' => 'Lead Solution Architect',
        ]);
        $releaseRes->assertStatus(302);
    }

    public function test_can_analyze_raci_workload_and_detect_bottlenecks(): void
    {
        $createAction = app(CreateProjectAction::class);
        $workloadAction = app(AnalyzeRACIWorkloadAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án BigData Analytics 2026',
            'code' => 'PRJ-DATA-2026',
            'client_name' => 'Data Corp',
            'project_type' => 'product',
        ]);

        $analysis = $workloadAction->execute($project);

        $this->assertArrayHasKey('workload_by_person', $analysis);
        $this->assertArrayHasKey('bottlenecks', $analysis);
        $this->assertArrayHasKey('total_activities', $analysis);
        $this->assertGreaterThan(0, $analysis['total_activities']);
    }

    public function test_can_package_release_and_tag_rtm_requirements(): void
    {
        $createAction = app(CreateProjectAction::class);
        $releaseAction = app(PackageReleaseAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án AI SCM 2026',
            'code' => 'PRJ-SCM-2026',
            'client_name' => 'SupplyChain Global',
            'project_type' => 'enterprise',
        ]);

        $result = $releaseAction->execute(
            project: $project,
            releaseVersion: 'v2.0.0',
            releaseNotesSummary: 'Phiên bản cải tiến hiệu năng 300% cho thuật toán định tuyến kho hàng.',
            releaseManager: 'Võ Hoàng Tú',
            managerRole: 'Lead Solution Architect'
        );

        $this->assertEquals('v2.0.0', $result['release_version']);
        $this->assertGreaterThan(0, $result['release_notes_id']);

        // Assert Release Notes document is created and approved
        $releaseDoc = $project->documents()->where('doc_type', 'RELEASE_NOTES')->first();
        $this->assertNotNull($releaseDoc);
        $this->assertEquals('approved', $releaseDoc->status);
        $this->assertEquals('Võ Hoàng Tú', $releaseDoc->signed_off_by);
        $this->assertStringContainsString('Phiên bản cải tiến hiệu năng 300%', $releaseDoc->content);
    }

    public function test_can_log_and_resolve_defect_with_rtm_trace_linking(): void
    {
        $createAction = app(CreateProjectAction::class);
        $logDefectAction = app(LogDefectAction::class);
        $resolveDefectAction = app(ResolveDefectAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án E-Commerce 2026',
            'code' => 'PRJ-ECOM-2026',
            'client_name' => 'Retail Group',
            'project_type' => 'enterprise',
        ]);

        $trace = $project->rtmTraces()->first();
        $this->assertNotNull($trace);

        $defect = $logDefectAction->execute([
            'project_id' => $project->id,
            'rtm_trace_id' => $trace->id,
            'defect_code' => 'DEF-001',
            'title' => 'Lỗi tính sai thuế VAT trong giỏ hàng',
            'severity' => 'major',
            'steps_to_reproduce' => 'Thêm 2 sản phẩm và áp voucher giảm 10%',
            'assigned_to' => 'Võ Hoàng Tú',
            'logged_by' => 'Tester Nguyễn Mai',
        ]);

        $this->assertEquals('open', $defect->status);
        $trace->refresh();
        $this->assertStringContainsString('DEF-001', $trace->defect_code);

        // Resolve Defect
        $resolved = $resolveDefectAction->execute(
            defectId: $defect->id,
            data: [
                'status' => 'resolved',
                'resolution_notes' => 'Đã fix hàm làm tròn thuế VAT theo chuẩn ISO.',
            ],
            resolverName: 'Võ Hoàng Tú',
            resolverRole: 'Lead Solution Architect'
        );

        $this->assertEquals('resolved', $resolved->status);
        $this->assertNotNull($resolved->resolved_at);
        $this->assertStringContainsString('Đã fix hàm làm tròn thuế VAT', $resolved->resolution_notes);
    }

    public function test_gate_5_enforcer_blocks_approval_when_blocker_defects_exist(): void
    {
        $createAction = app(CreateProjectAction::class);
        $approveAction = app(ApproveQualityGateAction::class);
        $logDefectAction = app(LogDefectAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án Fintech Gateway 2026',
            'code' => 'PRJ-FT-2026',
            'client_name' => 'Fintech Asia',
            'project_type' => 'enterprise',
        ]);

        // Advance project to Phase 5
        $gates = $project->qualityGates()->orderBy('gate_number')->get();
        for ($i = 0; $i < 4; $i++) {
            $approveAction->execute($gates[$i]->id, 'Võ Hoàng Tú', 'Solution Architect', "Duyệt cổng {$gates[$i]->gate_number}");
        }

        $project->refresh();
        $this->assertEquals(5, $project->current_phase_number);

        // Log a BLOCKER defect
        $logDefectAction->execute([
            'project_id' => $project->id,
            'defect_code' => 'DEF-999',
            'title' => 'Crash hệ thống khi decrypt khóa RSA',
            'severity' => 'blocker',
            'assigned_to' => 'Võ Hoàng Tú',
        ]);

        $gate5 = $gates[4];
        $this->assertEquals(5, $gate5->gate_number);

        // Expect domain exception because of unresolved blocker
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Cổng 5 (QA Testing Gate) bị khóa');

        $approveAction->execute($gate5->id, 'QA Lead', 'QA Lead', 'Cố gắng duyệt dù còn bug');
    }

    public function test_gate_5_enforcer_allows_approval_with_lead_sa_override_reason(): void
    {
        $createAction = app(CreateProjectAction::class);
        $approveAction = app(ApproveQualityGateAction::class);
        $logDefectAction = app(LogDefectAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án IoT Smart Meter 2026',
            'code' => 'PRJ-IOT-2026',
            'client_name' => 'EVN Power',
            'project_type' => 'enterprise',
        ]);

        // Advance project to Phase 5
        $gates = $project->qualityGates()->orderBy('gate_number')->get();
        for ($i = 0; $i < 4; $i++) {
            $approveAction->execute($gates[$i]->id, 'Võ Hoàng Tú', 'Solution Architect', "Duyệt cổng {$gates[$i]->gate_number}");
        }

        // Log a BLOCKER defect
        $logDefectAction->execute([
            'project_id' => $project->id,
            'defect_code' => 'DEF-BLOCK',
            'title' => 'Chậm kết nối MQTT broker',
            'severity' => 'blocker',
        ]);

        $gate5 = $gates[4];

        // Lead SA overrides with explicit reason
        $approvedGate = $approveAction->execute(
            gateId: $gate5->id,
            approverName: 'Võ Hoàng Tú',
            approverRole: 'Lead Solution Architect',
            notes: 'Phê duyệt chuyển pha có điều kiện.',
            overrideReason: 'Đã cô lập lỗi trên môi trường staging, cam kết release hotfix trước UAT signoff khách hàng.'
        );

        $this->assertEquals('passed', $approvedGate->status);
        $project->refresh();
        $this->assertEquals(6, $project->current_phase_number);

        // Verify Audit Log captured the override reason
        $latestLog = $project->auditLogs()->latest('id')->first();
        $this->assertNotNull($latestLog);
        $this->assertStringContainsString('SA OVERRIDE', json_encode($latestLog->details));
    }

    public function test_ci_pipeline_metrics_ingestion_and_gate_4_enforcer(): void
    {
        $createAction = app(CreateProjectAction::class);
        $approveAction = app(ApproveQualityGateAction::class);
        $ciAction = app(IngestCIPipelineMetricsAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án Bảo Mật CyberSec 2026',
            'code' => 'PRJ-SEC-2026',
            'client_name' => 'Cyber Defense',
            'project_type' => 'product',
        ]);

        // Advance to Phase 4
        $gates = $project->qualityGates()->orderBy('gate_number')->get();
        for ($i = 0; $i < 3; $i++) {
            $approveAction->execute($gates[$i]->id, 'Võ Hoàng Tú', 'Solution Architect', "Duyệt cổng {$gates[$i]->gate_number}");
        }

        // Ingest low coverage CI (65% < 80%)
        $ciAction->execute([
            'project_id' => $project->id,
            'build_number' => '#050',
            'commit_sha' => 'abc1234',
            'unit_test_passed' => 65,
            'unit_test_failed' => 0,
            'coverage_percentage' => 65.0,
            'sast_status' => 'passed',
        ]);

        $gate4 = $gates[3];

        // Should block Gate 4
        try {
            $approveAction->execute($gate4->id, 'Tech Lead', 'Tech Lead', 'Duyệt khi coverage thấp');
            $this->fail('Gate 4 should have blocked approval due to low coverage.');
        } catch (\DomainException $e) {
            $this->assertStringContainsString('Cổng 4 (Code Quality Gate) bị khóa', $e->getMessage());
        }

        // Now ingest passing CI (88.5% >= 80% & SAST passed)
        $ciAction->execute([
            'project_id' => $project->id,
            'build_number' => '#051',
            'commit_sha' => 'def5678',
            'unit_test_passed' => 120,
            'unit_test_failed' => 0,
            'coverage_percentage' => 88.5,
            'sast_status' => 'passed',
        ]);

        $passedGate4 = $approveAction->execute($gate4->id, 'Võ Hoàng Tú', 'Solution Architect', 'CI/CD đạt chuẩn 88.5% coverage.');
        $this->assertEquals('passed', $passedGate4->status);

        $project->refresh();
        $this->assertEquals(5, $project->current_phase_number);
    }

    public function test_production_incident_logging_and_sla_metrics_calculation(): void
    {
        $createAction = app(CreateProjectAction::class);
        $incidentAction = app(LogProductionIncidentAction::class);
        $calculateSlaAction = app(CalculateSLAMetricsAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án Sàn Giao Dịch Crypto 2026',
            'code' => 'PRJ-CRYPTO-2026',
            'client_name' => 'Global Exchange',
            'project_type' => 'enterprise',
        ]);

        // Log 2 incidents
        $incidentAction->execute([
            'project_id' => $project->id,
            'incident_code' => 'INC-01',
            'title' => 'Nghẽn mạng do ddos',
            'severity' => 'P1_CRITICAL',
            'downtime_minutes' => 30,
            'status' => 'resolved',
            'detected_at' => now()->subDay()->toDateTimeString(),
            'resolved_at' => now()->subDay()->addMinutes(30)->toDateTimeString(),
        ]);

        $incidentAction->execute([
            'project_id' => $project->id,
            'incident_code' => 'INC-02',
            'title' => 'Chậm websockets',
            'severity' => 'P2_MAJOR',
            'downtime_minutes' => 15,
            'status' => 'resolved',
            'detected_at' => now()->subHours(10)->toDateTimeString(),
            'resolved_at' => now()->subHours(10)->addMinutes(15)->toDateTimeString(),
        ]);

        $sla = $calculateSlaAction->execute($project);

        $this->assertEquals(2, $sla['total_incidents']);
        $this->assertEquals(1, $sla['p1_count']);
        $this->assertEquals(45, $sla['total_downtime_minutes']);
        $this->assertLessThan(100.0, $sla['uptime_percentage']);
        $this->assertGreaterThan(99.0, $sla['uptime_percentage']);
        $this->assertTrue($sla['sla_breached']);
    }

    public function test_http_endpoints_for_defects_ci_and_incidents(): void
    {
        $createAction = app(CreateProjectAction::class);
        $project = $createAction->execute([
            'name' => 'Dự án API Endpoints 2026',
            'code' => 'PRJ-API-2026',
            'client_name' => 'API Client',
            'project_type' => 'product',
        ]);

        // 1. POST /projects/{id}/defects
        $defectRes = $this->post("/projects/{$project->id}/defects", [
            'defect_code' => 'DEF-HTTP-01',
            'title' => 'Lỗi qua HTTP endpoint',
            'severity' => 'minor',
            'assigned_to' => 'Võ Hoàng Tú',
        ]);
        $defectRes->assertStatus(302);
        $defect = $project->defects()->first();
        $this->assertNotNull($defect);

        // 2. POST /defects/{id}/resolve
        $resolveRes = $this->post("/defects/{$defect->id}/resolve", [
            'status' => 'resolved',
            'resolution_notes' => 'Resolved via HTTP',
        ]);
        $resolveRes->assertStatus(302);

        // 3. POST /projects/{id}/ci-metrics
        $ciRes = $this->post("/projects/{$project->id}/ci-metrics", [
            'build_number' => '#999',
            'branch' => 'main',
            'commit_sha' => '12345678',
            'unit_test_passed' => 100,
            'unit_test_failed' => 0,
            'coverage_percentage' => 89.0,
            'sast_status' => 'passed',
            'pipeline_status' => 'success',
        ]);
        $ciRes->assertStatus(302);

        // 4. POST /projects/{id}/incidents
        $incRes = $this->post("/projects/{$project->id}/incidents", [
            'incident_code' => 'INC-HTTP-01',
            'title' => 'Sự cố qua HTTP endpoint',
            'severity' => 'P2_MAJOR',
            'downtime_minutes' => 10,
            'status' => 'resolved',
            'detected_at' => now()->toDateTimeString(),
        ]);
        $incRes->assertStatus(302);
    }

    public function test_autonomous_ai_batch_synthesis_and_phase_batch_sign_off(): void
    {
        $createAction = app(CreateProjectAction::class);
        $project = $createAction->execute([
            'name' => 'Dự án AI SDLC Autonomous 2026',
            'code' => 'PRJ-AI-99',
            'client_name' => 'GovTech Agency',
            'project_type' => 'enterprise',
        ]);

        // 1. Test 1-click batch AI generate deliverables for Phase 4
        $resBatchPhase = $this->post("/projects/{$project->id}/batch-ai-generate", [
            'phase_number' => 4,
        ]);
        $resBatchPhase->assertStatus(302);

        // Verify documents created for Phase 4 (CODING_STANDARDS, UNIT_TEST_PLAN)
        $phase4Docs = $project->documents()->where('phase_number', 4)->get();
        $this->assertGreaterThanOrEqual(2, $phase4Docs->count());
        $this->assertTrue($phase4Docs->pluck('doc_type')->contains('CODING_STANDARDS'));
        $this->assertTrue($phase4Docs->pluck('doc_type')->contains('UNIT_TEST_PLAN'));

        // 2. Test 1-click batch cryptographic sign-off for Phase 4
        $resSign = $this->post("/projects/{$project->id}/phases/4/batch-sign", [
            'signer_name' => 'Võ Hoàng Tú',
            'signer_role' => 'Lead Solution Architect',
        ]);
        $resSign->assertStatus(302);

        // Verify all Phase 4 documents are now approved with HMAC-SHA256 signature tokens
        $approvedPhase4Docs = $project->documents()->where('phase_number', 4)->where('status', 'approved')->get();
        $this->assertEquals($phase4Docs->count(), $approvedPhase4Docs->count());
        foreach ($approvedPhase4Docs as $doc) {
            $this->assertStringStartsWith('DOC-SIG-', $doc->signature_hash);
            $this->assertEquals('Võ Hoàng Tú', $doc->signed_off_by);
            $this->assertNotNull($doc->signed_off_at);
        }

        // 3. Test AI Quality Gate Evaluation for Gate 1
        $gate1 = $project->qualityGates()->where('gate_number', 1)->first();
        $this->assertNotNull($gate1);

        $resEval = $this->post("/quality-gates/{$gate1->id}/ai-evaluate");
        $resEval->assertStatus(302);

        $gate1->refresh();
        $this->assertNotNull($gate1->sign_off_notes);
        $this->assertStringContainsString('[AI EVALUATOR', $gate1->sign_off_notes);

        // 4. Test AI Sprint Tasks generation
        $resTasks = $this->post("/projects/{$project->id}/ai-generate-tasks");
        $resTasks->assertStatus(302);
        $this->assertGreaterThanOrEqual(4, $project->tasks()->count());

        // 5. Test AI Test Suite generation
        $resTestRun = $this->post("/projects/{$project->id}/ai-generate-test-run");
        $resTestRun->assertStatus(302);
        $testRun = $project->testRuns()->latest()->first();
        $this->assertNotNull($testRun);
        $this->assertGreaterThanOrEqual(5, $testRun->items()->count());

        // 6. Test 1-click Batch CAB sign-off for release v1.0.0-PROD
        $resCab = $this->post("/projects/{$project->id}/cab/batch-sign", [
            'release_version' => 'v1.0.0-PROD',
            'signer_name' => 'Võ Hoàng Tú',
        ]);
        $resCab->assertStatus(302);
        $cabSignoffs = $project->cabSignoffs()->where('release_version', 'v1.0.0-PROD')->get();
        $this->assertEquals(3, $cabSignoffs->count());
        $this->assertEquals(3, $cabSignoffs->where('decision', 'approved')->count());
    }

    public function test_can_dynamically_calculate_and_sync_all_7_phase_progress_rates(): void
    {
        $createAction = app(CreateProjectAction::class);
        $calcAction = app(CalculatePhaseProgressAction::class);

        $project = $createAction->execute([
            'name' => 'Dự án Fintech Dynamic Progress 2026',
            'code' => 'PRJ-FIN-2026',
            'client_name' => 'Fintech Bank',
            'project_type' => 'enterprise',
        ]);

        $rates = $calcAction->execute($project);

        $this->assertCount(7, $rates);
        foreach ($rates as $phaseNum => $rate) {
            $this->assertIsInt($rate);
            $this->assertGreaterThanOrEqual(0, $rate);
            $this->assertLessThanOrEqual(100, $rate);
        }

        // Test project show route computes and loads phase metrics
        $response = $this->get("/projects/{$project->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Projects/Show')
            ->has('project.phases', 7)
        );
    }

    public function test_can_analyze_project_idea_via_ai_endpoint(): void
    {
        $response = $this->postJson('/projects/analyze-idea', [
            'idea_prompt' => 'Xây dựng hệ thống vé xe buýt thông minh SmartBus tích hợp mã QR động, thẻ NFC và định vị GPS thời gian thực',
            'client_name' => 'MetroTrans Bus Corp',
            'project_type' => 'enterprise',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
        $response->assertJsonStructure([
            'success',
            'analysis' => [
                'name',
                'code',
                'client_name',
                'domain',
                'summary',
                'functional_requirements',
                'non_functional_requirements',
                'architecture_recommendation',
                'user_stories',
                'initial_rtm',
                'wbs_phases',
            ],
        ]);

        $data = $response->json('analysis');
        $this->assertNotEmpty($data['functional_requirements']);
        $this->assertNotEmpty($data['user_stories']);
    }

    public function test_can_incubate_and_create_complete_project_from_idea(): void
    {
        $idea = 'Xây dựng sàn thương mại điện tử nông sản B2B AgriNext với cơ chế đấu giá trực tiếp, quản lý kho lạnh IoT và thanh toán bảo chứng ngân hàng';

        $response = $this->post('/projects/create-from-idea', [
            'idea_prompt' => $idea,
            'client_name' => 'AgriTech Vietnam JSC',
            'project_type' => 'enterprise',
            'creator_name' => 'Võ Hoàng Tú',
            'creator_role' => 'Lead Solution Architect',
        ]);

        $response->assertStatus(302);

        $project = Project::latest()->first();
        $this->assertNotNull($project);
        $this->assertEquals(7, $project->phases()->count());
        $this->assertGreaterThanOrEqual(10, $project->documents()->count());
        $this->assertNotEmpty($project->rtmTraces);
        $this->assertNotEmpty($project->tasks);

        // Verify documents are domain-specific and not generic boilerplate
        $brd = $project->documents()->where('doc_type', 'BRD')->first();
        $this->assertNotNull($brd);
        $this->assertStringContainsString('Nông Nghiệp', $brd->content.$project->name.$project->description);

        $responseShow = $this->get("/projects/{$project->id}");
        $responseShow->assertStatus(200);
    }
}
