<?php

namespace App\Actions\Integrations;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;
use App\Models\RTMTrace;
use App\Repositories\Contracts\RTMRepositoryInterface;

class IngestGitWebhookAction
{
    public function __construct(
        protected RTMRepositoryInterface $rtmRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Ingest Git webhook event (commit push or PR merge) and automatically bind to RTM trace.
     *
     * @param array{
     *     project_code: string,
     *     event_type: 'push'|'pull_request',
     *     author: string,
     *     commit_sha?: string,
     *     pr_number?: int,
     *     message: string,
     *     url?: string
     * } $payload
     */
    public function execute(array $payload): ?RTMTrace
    {
        $project = Project::where('code', $payload['project_code'])->first();
        if (! $project) {
            return null;
        }

        $message = $payload['message'];

        // Extract REQ-XXX pattern from commit/PR message
        preg_match('/REQ-[A-Z0-9-]+/i', $message, $reqMatches);
        $reqCode = $reqMatches[0] ?? null;

        // Extract STORY-XXX pattern
        preg_match('/STORY-[A-Z0-9-]+/i', $message, $storyMatches);
        $storyCode = $storyMatches[0] ?? 'STORY-AUTO';

        $prOrCommit = isset($payload['pr_number'])
            ? "PR #{$payload['pr_number']}"
            : (isset($payload['commit_sha']) ? substr($payload['commit_sha'], 0, 8) : 'Commit');

        if ($reqCode) {
            // Find existing RTM or create new
            $trace = RTMTrace::where('project_id', $project->id)
                ->where('req_code', strtoupper($reqCode))
                ->first();

            if ($trace) {
                $trace->update([
                    'commit_or_pr' => $prOrCommit,
                    'status' => $trace->status === 'mapped' ? 'in_dev' : $trace->status,
                ]);
            } else {
                $trace = $this->rtmRepository->create([
                    'project_id' => $project->id,
                    'req_code' => strtoupper($reqCode),
                    'req_title' => $message,
                    'user_story_code' => strtoupper($storyCode),
                    'commit_or_pr' => $prOrCommit,
                    'status' => 'in_dev',
                ]);
            }

            // Log Audit
            $this->recordAuditLogAction->execute(
                projectId: $project->id,
                userName: $payload['author'],
                userRole: 'Git Automation Webhook',
                actionType: 'GIT_WEBHOOK_INGESTED',
                entityType: 'RTMTrace',
                entityId: $trace->id,
                details: [
                    'event' => $payload['event_type'],
                    'pr_or_commit' => $prOrCommit,
                    'message' => $message,
                    'bound_req' => $reqCode,
                ]
            );

            return $trace;
        }

        return null;
    }
}
