<?php

namespace App\Actions\RTM;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\RTMTrace;
use App\Repositories\Contracts\RTMRepositoryInterface;

class CreateRTMTraceAction
{
    public function __construct(
        protected RTMRepositoryInterface $rtmRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    public function execute(
        int $projectId,
        array $data,
        string $userName = 'QA Lead',
        string $userRole = 'Quality Assurance',
    ): RTMTrace {
        $trace = $this->rtmRepository->create([
            'project_id' => $projectId,
            'req_code' => $data['req_code'],
            'req_title' => $data['req_title'],
            'user_story_code' => $data['user_story_code'],
            'commit_or_pr' => $data['commit_or_pr'] ?? null,
            'test_case_code' => $data['test_case_code'] ?? null,
            'defect_code' => $data['defect_code'] ?? null,
            'release_version' => $data['release_version'] ?? 'v1.0.0',
            'status' => $data['status'] ?? 'mapped',
        ]);

        $this->recordAuditLogAction->execute(
            projectId: $projectId,
            userName: $userName,
            userRole: $userRole,
            actionType: 'RTM_LINKED',
            entityType: 'RTMTrace',
            entityId: $trace->id,
            details: [
                'req_code' => $trace->req_code,
                'user_story' => $trace->user_story_code,
                'commit_pr' => $trace->commit_or_pr,
                'test_case' => $trace->test_case_code,
            ]
        );

        return $trace;
    }
}
