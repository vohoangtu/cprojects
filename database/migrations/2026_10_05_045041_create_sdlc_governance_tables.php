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
        // 1. Projects
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('client_name');
            $table->enum('project_type', ['outsourcing', 'product', 'enterprise', 'rnd'])->default('enterprise');
            $table->enum('status', ['planning', 'active', 'on_hold', 'completed'])->default('active');
            $table->unsignedTinyInteger('current_phase_number')->default(1);
            $table->enum('health_status', ['healthy', 'warning', 'critical'])->default('healthy');
            $table->decimal('budget', 15, 2)->default(0.00);
            $table->date('target_delivery_date')->nullable();
            $table->timestamps();
        });

        // 2. SDLC 7 Phases
        Schema::create('sdlc_phases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('phase_number'); // 1 to 7
            $table->string('name');
            $table->enum('status', ['pending', 'active', 'in_review', 'completed'])->default('pending');
            $table->unsignedTinyInteger('completion_rate')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'phase_number']);
        });

        // 3. Quality Gates (Gates 1 to 6)
        Schema::create('quality_gates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('phase_id')->constrained('sdlc_phases')->cascadeOnDelete();
            $table->unsignedTinyInteger('gate_number'); // 1 to 6
            $table->string('name');
            $table->enum('status', ['pending', 'in_review', 'passed', 'rejected'])->default('pending');
            $table->string('required_role');
            $table->string('sign_off_token')->nullable(); // HMAC non-repudiation signature
            $table->string('sign_off_by')->nullable();
            $table->string('sign_off_role')->nullable();
            $table->text('sign_off_notes')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->json('criteria_checklist')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'gate_number']);
        });

        // 4. Project Technical Deliverables / Documents
        Schema::create('project_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('phase_number');
            $table->string('doc_type'); // BRD, SRS, SAD, HLD_LLD, ERD, WBS, STP, RUNBOOK, RELEASE_NOTES, POST_MORTEM
            $table->string('title');
            $table->string('version')->default('v1.0');
            $table->enum('status', ['draft', 'under_review', 'approved', 'superseded'])->default('draft');
            $table->longText('content')->nullable();
            $table->string('signed_off_by')->nullable();
            $table->timestamp('signed_off_at')->nullable();
            $table->string('signature_hash')->nullable();
            $table->timestamps();
        });

        // 5. RACI Matrix Assignments
        Schema::create('raci_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('activity_name');
            $table->unsignedTinyInteger('phase_number');
            $table->string('responsible'); // R: Người làm
            $table->string('accountable'); // A: Người chịu trách nhiệm cao nhất (duy nhất 1 người)
            $table->json('consulted')->nullable(); // C: Tham vấn
            $table->json('informed')->nullable(); // I: Nhận thông tin
            $table->timestamps();
        });

        // 6. RTM (Requirements Traceability Matrix)
        Schema::create('rtm_traces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('req_code'); // REQ-AUTH-01
            $table->string('req_title');
            $table->string('user_story_code'); // STORY-101
            $table->string('commit_or_pr')->nullable(); // PR #45 or commit hash
            $table->string('test_case_code')->nullable(); // TC-AUTH-01
            $table->string('defect_code')->nullable(); // BUG-09
            $table->string('release_version')->nullable(); // v1.0.0
            $table->enum('status', ['mapped', 'in_dev', 'tested', 'passed', 'released'])->default('mapped');
            $table->timestamps();
        });

        // 7. Immutable Audit Logs & Digital Fingerprints
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name');
            $table->string('user_role');
            $table->string('action_type'); // GATE_APPROVED, DOC_SIGNED, RACI_UPDATED, RTM_LINKED, PROJECT_CREATED
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('details')->nullable();
            $table->string('digital_fingerprint'); // Non-repudiation cryptographic hash
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('rtm_traces');
        Schema::dropIfExists('raci_assignments');
        Schema::dropIfExists('project_documents');
        Schema::dropIfExists('quality_gates');
        Schema::dropIfExists('sdlc_phases');
        Schema::dropIfExists('projects');
    }
};
