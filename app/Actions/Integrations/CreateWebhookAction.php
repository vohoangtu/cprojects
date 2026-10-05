<?php

namespace App\Actions\Integrations;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;
use App\Models\ProjectWebhook;
use Illuminate\Support\Str;

class CreateWebhookAction
{
    public function __construct(
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Create a new Webhook endpoint for the project.
     *
     * @param array{
     *     project_id: int,
     *     name: string,
     *     url: string,
     *     events: array<string>
     * } $data
     */
    public function execute(
        array $data,
        string $userName = 'Võ Hoàng Tú',
        string $userRole = 'Lead Solution Architect'
    ): ProjectWebhook {
        $project = Project::findOrFail($data['project_id']);

        $webhook = ProjectWebhook::create([
            'project_id' => $project->id,
            'name' => $data['name'],
            'url' => $data['url'],
            'events' => $data['events'] ?? ['gate.blocked', 'defect.blocker', 'sla.breached', 'cab.signed'],
            'secret_token' => 'whsec_'.Str::random(32),
            'is_active' => true,
        ]);

        $this->recordAuditLogAction->execute(
            projectId: $project->id,
            userName: $userName,
            userRole: $userRole,
            actionType: 'CREATE_WEBHOOK',
            entityType: 'ProjectWebhook',
            entityId: $webhook->id,
            details: [
                'name' => $webhook->name,
                'url' => $webhook->url,
                'events' => $webhook->events,
            ]
        );

        return $webhook;
    }
}
