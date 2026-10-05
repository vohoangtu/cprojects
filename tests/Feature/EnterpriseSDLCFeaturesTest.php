<?php

namespace Tests\Feature;

use App\Actions\AI\AuditProjectComplianceAction;
use App\Actions\Projects\CreateProjectAction;
use App\Models\CABSignoff;
use App\Models\DeploymentRollout;
use App\Models\Project;
use App\Models\ProjectTask;
use App\Models\ProjectWebhook;
use App\Models\RTMTrace;
use App\Models\Sprint;
use App\Models\TestRun;
use App\Models\TestRunItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnterpriseSDLCFeaturesTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'architect@techcorp.vn',
            'name' => 'Võ Hoàng Tú',
        ]);

        $createProjectAction = app(CreateProjectAction::class);
        $this->project = $createProjectAction->execute([
            'name' => 'Hệ thống Ngân hàng Số Core Banking 2026',
            'code' => 'PRJ-TEST-2026',
            'client_name' => 'VietCredit Commercial Bank',
            'project_type' => 'enterprise',
            'budget' => 500000.00,
        ], 'Võ Hoàng Tú', 'Lead Solution Architect');
    }

    /**
     * Pillar 1: Can create Agile Kanban task and link to RTM.
     */
    public function test_can_create_agile_task_and_link_to_rtm(): void
    {
        $trace = RTMTrace::create([
            'project_id' => $this->project->id,
            'req_code' => 'REQ-AUTH-01',
            'req_title' => 'Xác thực đa yếu tố FIDO2 WebAuthn',
            'user_story_code' => 'US-01',
            'status' => 'mapped',
        ]);

        $sprint = Sprint::create([
            'project_id' => $this->project->id,
            'sprint_number' => 1,
            'name' => 'Sprint 1: Core Auth',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(14)->toDateString(),
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)->post(route('projects.tasks.store', $this->project->id), [
            'task_code' => 'TSK-201',
            'title' => 'Hiện thực hóa WebAuthn FIDO2 Controller',
            'description' => 'Tích hợp xác thực sinh trắc học và Passkeys',
            'status' => 'todo',
            'priority' => 'high',
            'story_points' => 5,
            'assigned_to' => 'Võ Hoàng Tú',
            'sprint_id' => $sprint->id,
            'rtm_trace_id' => $trace->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('project_tasks', [
            'project_id' => $this->project->id,
            'task_code' => 'TSK-201',
            'story_points' => 5,
        ]);

        // RTM should automatically advance to in_dev
        $this->assertEquals('in_dev', $trace->fresh()->status);
    }

    /**
     * Pillar 1: Can transition task status on Kanban board and sync PR to RTM.
     */
    public function test_can_update_task_status_and_pr_link(): void
    {
        $trace = RTMTrace::create([
            'project_id' => $this->project->id,
            'req_code' => 'REQ-PAY-01',
            'req_title' => 'Chuyển khoản liên ngân hàng',
            'user_story_code' => 'US-02',
            'status' => 'in_dev',
        ]);

        $task = ProjectTask::create([
            'project_id' => $this->project->id,
            'rtm_trace_id' => $trace->id,
            'task_code' => 'TSK-202',
            'title' => 'API Chuyển Khoản Core',
            'status' => 'in_progress',
            'story_points' => 8,
        ]);

        $prUrl = 'https://github.com/techcorp/banking-core/pull/202';
        $response = $this->actingAs($this->user)->post(route('tasks.status', $task->id), [
            'status' => 'done',
            'github_pr_url' => $prUrl,
        ]);

        $response->assertRedirect();
        $task->refresh();
        $this->assertEquals('done', $task->status);
        $this->assertEquals($prUrl, $task->github_pr_url);
        $this->assertNotNull($task->completed_at);

        // PR synced to RTM
        $this->assertEquals($prUrl, $trace->fresh()->commit_or_pr);
    }

    /**
     * Pillar 2: Can create Test Run and execute test items.
     */
    public function test_can_create_test_run_and_execute_test_item(): void
    {
        $response = $this->actingAs($this->user)->post(route('projects.test-runs.store', $this->project->id), [
            'name' => 'Staging E2E Suite v2.4',
            'environment' => 'staging',
            'release_version' => 'v2.4.0',
        ]);

        $response->assertRedirect();
        $testRun = TestRun::where('project_id', $this->project->id)->first();
        $this->assertNotNull($testRun);
        $this->assertEquals('staging', $testRun->environment);

        // Manually create item and execute
        $item = TestRunItem::create([
            'test_run_id' => $testRun->id,
            'test_case_code' => 'TC-E2E-01',
            'title' => 'Kiểm thử thanh toán QR Napas',
            'expected_result' => 'Thành công',
            'status' => 'pending',
        ]);

        $execResponse = $this->actingAs($this->user)->post(route('test-items.execute', $item->id), [
            'status' => 'passed',
            'actual_result' => 'Khớp 100% kết quả mong đợi.',
        ]);

        $execResponse->assertRedirect();
        $this->assertEquals('passed', $item->fresh()->status);
    }

    /**
     * Pillar 2: 1-Click convert failed test to Defect locks Gate 5 if blocker.
     */
    public function test_1_click_defect_from_failed_test_locks_gate_5_if_blocker(): void
    {
        $testRun = TestRun::create([
            'project_id' => $this->project->id,
            'name' => 'Regression Run',
            'environment' => 'staging',
        ]);

        $item = TestRunItem::create([
            'test_run_id' => $testRun->id,
            'test_case_code' => 'TC-CRIT-01',
            'title' => 'Kiểm thử giải mã HSM token',
            'status' => 'failed',
            'actual_result' => 'HSM timeout sau 30 giây.',
        ]);

        $response = $this->actingAs($this->user)->post(route('test-items.convert-defect', $item->id), [
            'severity' => 'blocker',
            'assigned_to' => 'Võ Hoàng Tú',
        ]);

        $response->assertRedirect();
        $item->refresh();
        $this->assertNotNull($item->defect_id);
        $this->assertDatabaseHas('defects', [
            'id' => $item->defect_id,
            'severity' => 'blocker',
        ]);

        // Attempting to approve Gate 5 without override should fail
        $gate5 = $this->project->qualityGates()->where('gate_number', 5)->first();
        $this->assertNotNull($gate5);

        $approveResponse = $this->actingAs($this->user)->post(route('gates.approve', $gate5->id), [
            'approver_name' => 'Đặng Thu Hằng',
            'approver_role' => 'QA Lead',
            'notes' => 'Thử nghiệm nghiệm thu',
        ]);

        $approveResponse->assertSessionHas('error');
        $this->assertNotEquals('passed', $gate5->fresh()->status);
    }

    /**
     * Pillar 3: CAB Multi-Signoff with HMAC signature.
     */
    public function test_cab_multi_signoff_generates_hmac_token(): void
    {
        $response = $this->actingAs($this->user)->post(route('projects.cab.sign', $this->project->id), [
            'release_version' => 'v2.4.0',
            'role_required' => 'LEAD_ARCHITECT',
            'signer_name' => 'Võ Hoàng Tú',
            'decision' => 'approved',
            'notes' => 'Kiến trúc C4 và SLA hoàn toàn đạt chuẩn.',
        ]);

        $response->assertRedirect();
        $signoff = CABSignoff::where('project_id', $this->project->id)
            ->where('role_required', 'LEAD_ARCHITECT')
            ->first();

        $this->assertNotNull($signoff);
        $this->assertEquals('approved', $signoff->decision);
        $this->assertStringStartsWith('CAB-SIG-', $signoff->sign_token);
    }

    /**
     * Pillar 3: Canary rollout traffic update and emergency rollback.
     */
    public function test_canary_rollout_traffic_update_and_emergency_rollback(): void
    {
        // 1. Promote to 50%
        $response = $this->actingAs($this->user)->post(route('projects.rollout.traffic', $this->project->id), [
            'release_version' => 'v2.4.0',
            'traffic_percentage' => 50,
        ]);

        $response->assertRedirect();
        $rollout = DeploymentRollout::where('project_id', $this->project->id)->first();
        $this->assertEquals(50, $rollout->current_traffic_percentage);
        $this->assertEquals('healthy', $rollout->health_status);

        // 2. Trigger Instant Emergency Rollback
        $rollbackResponse = $this->actingAs($this->user)->post(route('projects.rollout.traffic', $this->project->id), [
            'release_version' => 'v2.4.0',
            'traffic_percentage' => 0,
            'is_rollback' => true,
            'rollback_reason' => 'Phát hiện sự cố rò rỉ bộ nhớ nghiêm trọng tại Pod Cluster A.',
        ]);

        $rollbackResponse->assertRedirect();
        $rollout->refresh();
        $this->assertEquals(0, $rollout->current_traffic_percentage);
        $this->assertEquals('rolled_back', $rollout->health_status);
        $this->assertNotNull($rollout->rollback_reason);
    }

    /**
     * Pillar 4: AI Compliance Auditor evaluates ISO 12207, IEEE 830, PCI-DSS.
     */
    public function test_ai_compliance_auditor_calculates_scorecard(): void
    {
        $action = app(AuditProjectComplianceAction::class);
        $audit = $action->execute($this->project);

        $this->assertIsArray($audit);
        $this->assertArrayHasKey('score', $audit);
        $this->assertArrayHasKey('grade', $audit);
        $this->assertArrayHasKey('breakdown', $audit);
        $this->assertArrayHasKey('iso_12207', $audit['breakdown']);
        $this->assertArrayHasKey('ieee_830', $audit['breakdown']);
        $this->assertArrayHasKey('pci_dss_owasp', $audit['breakdown']);
        $this->assertGreaterThanOrEqual(0, $audit['score']);
        $this->assertLessThanOrEqual(100, $audit['score']);

        // Controller endpoint test
        $response = $this->actingAs($this->user)->post(route('projects.compliance.audit', $this->project->id));
        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /**
     * Pillar 5: Webhook integration endpoint creates secret token.
     */
    public function test_can_create_webhook_with_secret_token(): void
    {
        $response = $this->actingAs($this->user)->post(route('projects.webhooks.store', $this->project->id), [
            'name' => 'Slack Alerts & Jenkins Trigger',
            'url' => 'https://hooks.slack.com/services/T00/B00/X00',
            'events' => ['gate.approved', 'defect.logged', 'rollout.updated'],
        ]);

        $response->assertRedirect();
        $webhook = ProjectWebhook::where('project_id', $this->project->id)->first();
        $this->assertNotNull($webhook);
        $this->assertStringStartsWith('whsec_', $webhook->secret_token);
        $this->assertTrue($webhook->is_active);
    }
}
