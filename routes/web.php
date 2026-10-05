<?php

use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('projects.index');
});

Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
Route::post('/projects/analyze-idea', [ProjectController::class, 'analyzeIdea'])->name('projects.analyze-idea');
Route::post('/projects/create-from-idea', [ProjectController::class, 'createFromIdea'])->name('projects.create-from-idea');
Route::get('/projects/{id}', [ProjectController::class, 'show'])->name('projects.show');

// Quality Gate Approval & Criteria Toggle
Route::post('/quality-gates/{gateId}/approve', [ProjectController::class, 'approveGate'])->name('gates.approve');
Route::post('/quality-gates/{gateId}/reject', [ProjectController::class, 'rejectGate'])->name('gates.reject');
Route::post('/quality-gates/{gateId}/toggle-criteria', [ProjectController::class, 'toggleGateCriteria'])->name('gates.toggle-criteria');
Route::post('/quality-gates/{gateId}/ai-evaluate', [ProjectController::class, 'aiEvaluateGate'])->name('gates.ai-evaluate');

// Technical Deliverables: Create, Sign-off & Update Content
Route::post('/projects/{projectId}/documents', [ProjectController::class, 'storeDocument'])->name('documents.store');
Route::post('/documents/{docId}/sign', [ProjectController::class, 'signDocument'])->name('documents.sign');
Route::put('/documents/{docId}', [ProjectController::class, 'updateDocument'])->name('documents.update');
Route::post('/projects/{projectId}/phases/{phaseNumber}/batch-sign', [ProjectController::class, 'batchSignPhaseDocs'])->name('projects.phases.batch-sign');

// RTM Traceability Link & RACI Assignment
Route::post('/projects/{projectId}/rtm', [ProjectController::class, 'addRtmTrace'])->name('projects.rtm.store');
Route::post('/projects/{projectId}/raci', [ProjectController::class, 'addRaci'])->name('projects.raci.store');

// AI Copilot Document Synthesis & Audit Chain Verification
Route::post('/projects/{projectId}/ai-generate', [ProjectController::class, 'aiGenerateDoc'])->name('projects.ai.generate');
Route::post('/projects/{projectId}/batch-ai-generate', [ProjectController::class, 'batchAiGenerateDocs'])->name('projects.batch-ai-generate');
Route::post('/projects/{projectId}/verify-audit', [ProjectController::class, 'verifyAuditChain'])->name('projects.audit.verify');

// Release Packaging & Git Webhook Automation
Route::post('/projects/{projectId}/package-release', [ProjectController::class, 'packageRelease'])->name('projects.release.package');
Route::post('/projects/{projectId}/git-webhook', [ProjectController::class, 'ingestGitWebhook'])->name('projects.git.webhook');

// Defect / Bug Tracking Lifecycle
Route::post('/projects/{projectId}/defects', [ProjectController::class, 'logDefect'])->name('projects.defects.store');
Route::post('/defects/{defectId}/resolve', [ProjectController::class, 'resolveDefect'])->name('defects.resolve');

// CI/CD Automated Metrics & SAST
Route::post('/projects/{projectId}/ci-metrics', [ProjectController::class, 'ingestCIMetrics'])->name('projects.ci.metrics');

// Production Incidents & SLA
Route::post('/projects/{projectId}/incidents', [ProjectController::class, 'logIncident'])->name('projects.incidents.store');

// Agile Sprint & Kanban Board (Phase 4)
Route::post('/projects/{projectId}/tasks', [ProjectController::class, 'createTask'])->name('projects.tasks.store');
Route::post('/tasks/{taskId}/status', [ProjectController::class, 'updateTaskStatus'])->name('tasks.status');
Route::post('/projects/{projectId}/ai-generate-tasks', [ProjectController::class, 'aiGenerateSprintTasks'])->name('projects.tasks.ai-generate');

// Test Run Execution Suite & 1-Click Defect (Phase 5)
Route::post('/projects/{projectId}/test-runs', [ProjectController::class, 'createTestRun'])->name('projects.test-runs.store');
Route::post('/test-items/{itemId}/execute', [ProjectController::class, 'executeTestItem'])->name('test-items.execute');
Route::post('/test-items/{itemId}/convert-defect', [ProjectController::class, 'convertTestToDefect'])->name('test-items.convert-defect');
Route::post('/projects/{projectId}/ai-generate-test-run', [ProjectController::class, 'aiGenerateTestRun'])->name('projects.test-runs.ai-generate');

// CAB Multi-Signoff & Canary Rollout (Phase 6)
Route::post('/projects/{projectId}/cab/sign', [ProjectController::class, 'signCAB'])->name('projects.cab.sign');
Route::post('/projects/{projectId}/cab/batch-sign', [ProjectController::class, 'batchSignCAB'])->name('projects.cab.batch-sign');
Route::post('/projects/{projectId}/rollout/traffic', [ProjectController::class, 'updateRolloutTraffic'])->name('projects.rollout.traffic');

// AI Compliance Auditor (ISO/IEC 12207, IEEE 830, PCI-DSS)
Route::post('/projects/{projectId}/compliance-audit', [ProjectController::class, 'auditCompliance'])->name('projects.compliance.audit');

// Webhook Integrations Hub
Route::post('/projects/{projectId}/webhooks', [ProjectController::class, 'createWebhook'])->name('projects.webhooks.store');
