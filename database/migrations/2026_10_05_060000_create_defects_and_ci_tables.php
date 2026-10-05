<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Defect & Bug Tracking Table
        Schema::create('defects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rtm_trace_id')->nullable()->constrained('rtm_traces')->nullOnDelete();
            $table->string('defect_code', 50);
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('steps_to_reproduce')->nullable();
            $table->enum('severity', ['blocker', 'critical', 'major', 'minor'])->default('major');
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->string('assigned_to')->nullable();
            $table->string('logged_by')->default('Võ Hoàng Tú');
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'status']);
            $table->index(['project_id', 'severity']);
        });

        // 2. Automated CI/CD Pipeline Metrics & SAST Security Table
        Schema::create('ci_pipeline_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('build_number', 50);
            $table->string('branch', 100)->default('main');
            $table->string('commit_sha', 100);
            $table->integer('unit_test_passed')->default(0);
            $table->integer('unit_test_failed')->default(0);
            $table->decimal('coverage_percentage', 5, 2)->default(0.00);
            $table->integer('code_smells_count')->default(0);
            $table->integer('vulnerabilities_count')->default(0);
            $table->enum('sast_status', ['passed', 'failed'])->default('passed');
            $table->enum('pipeline_status', ['success', 'failed', 'running'])->default('success');
            $table->timestamps();

            $table->index(['project_id', 'created_at']);
        });

        // 3. Production Incident Management & SLA Table
        Schema::create('production_incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('incident_code', 50);
            $table->string('title');
            $table->enum('severity', ['P1_CRITICAL', 'P2_MAJOR', 'P3_MINOR'])->default('P2_MAJOR');
            $table->integer('downtime_minutes')->default(0);
            $table->text('root_cause')->nullable();
            $table->text('corrective_actions')->nullable();
            $table->enum('status', ['investigating', 'mitigated', 'resolved'])->default('investigating');
            $table->timestamp('detected_at');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_incidents');
        Schema::dropIfExists('ci_pipeline_metrics');
        Schema::dropIfExists('defects');
    }
};
