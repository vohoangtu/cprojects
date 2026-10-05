<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for Enterprise SDLC features.
     */
    public function up(): void
    {
        // 1. Agile Sprints Table
        Schema::create('sprints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->integer('sprint_number');
            $table->string('name');
            $table->text('goal')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['planning', 'active', 'completed'])->default('active');
            $table->timestamps();
        });

        // 2. Project Tasks / Kanban Board Table
        Schema::create('project_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sprint_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('rtm_trace_id')->nullable()->constrained('rtm_traces')->nullOnDelete();
            $table->string('task_code')->index(); // e.g. TSK-101
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('story_points')->default(3);
            $table->enum('status', ['todo', 'in_progress', 'code_review', 'done'])->default('todo');
            $table->string('assigned_to')->nullable();
            $table->string('github_pr_url')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // 3. Test Runs Table
        Schema::create('test_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // e.g. Sprint 5 Regression Suite
            $table->enum('environment', ['staging', 'uat', 'performance', 'production'])->default('staging');
            $table->enum('status', ['running', 'passed', 'failed'])->default('running');
            $table->string('executed_by')->default('QA Team');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // 4. Test Run Items / Test Cases Execution Table
        Schema::create('test_run_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_run_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rtm_trace_id')->nullable()->constrained('rtm_traces')->nullOnDelete();
            $table->string('test_case_code'); // e.g. TC-PAY-01
            $table->string('title');
            $table->text('steps')->nullable();
            $table->text('expected_result')->nullable();
            $table->text('actual_result')->nullable();
            $table->enum('status', ['pending', 'passed', 'failed', 'blocked', 'skipped'])->default('pending');
            $table->foreignId('defect_id')->nullable()->constrained('defects')->nullOnDelete();
            $table->timestamps();
        });

        // 5. CAB (Change Advisory Board) Approvals Table
        Schema::create('cab_signoffs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('release_version'); // e.g. v2.0.0
            $table->string('role_required'); // LEAD_ARCHITECT, SECOPS_LEAD, PRODUCT_OWNER
            $table->string('signer_name')->nullable();
            $table->enum('decision', ['pending', 'approved', 'rejected'])->default('pending');
            $table->string('sign_token')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
        });

        // 6. Deployment Rollouts & Canary Traffic Table
        Schema::create('deployment_rollouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('release_version');
            $table->enum('strategy', ['canary', 'blue_green', 'rolling'])->default('canary');
            $table->integer('current_traffic_percentage')->default(10); // 10%, 25%, 50%, 100%
            $table->enum('health_status', ['healthy', 'degraded', 'rolled_back'])->default('healthy');
            $table->text('rollback_reason')->nullable();
            $table->timestamp('deployed_at')->useCurrent();
            $table->timestamps();
        });

        // 7. Project Webhook Endpoints Table
        Schema::create('project_webhooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // e.g. DevOps Slack Channel
            $table->string('url');
            $table->json('events'); // ['gate.blocked', 'defect.blocker', 'sla.breached', 'cab.signed']
            $table->string('secret_token');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_triggered_at')->nullable();
            $table->integer('last_status_code')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_webhooks');
        Schema::dropIfExists('deployment_rollouts');
        Schema::dropIfExists('cab_signoffs');
        Schema::dropIfExists('test_run_items');
        Schema::dropIfExists('test_runs');
        Schema::dropIfExists('project_tasks');
        Schema::dropIfExists('sprints');
    }
};
