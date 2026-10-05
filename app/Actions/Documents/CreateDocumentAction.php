<?php

namespace App\Actions\Documents;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\ProjectDocument;
use App\Repositories\Contracts\DocumentRepositoryInterface;

class CreateDocumentAction
{
    public function __construct(
        protected DocumentRepositoryInterface $documentRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * @param  array{phase_number: int, doc_type: string, title: string, version?: string, content?: string}  $data
     */
    public function execute(
        int $projectId,
        array $data,
        string $creatorName = 'Võ Hoàng Tú',
        string $creatorRole = 'Solution Architect',
    ): ProjectDocument {
        $document = $this->documentRepository->create([
            'project_id' => $projectId,
            'phase_number' => (int) $data['phase_number'],
            'doc_type' => strtoupper(trim($data['doc_type'])),
            'title' => trim($data['title']),
            'version' => ! empty($data['version']) ? trim($data['version']) : 'v1.0',
            'status' => 'draft',
            'content' => $data['content'] ?? '',
        ]);

        $this->recordAuditLogAction->execute(
            projectId: $projectId,
            userName: $creatorName,
            userRole: $creatorRole,
            actionType: 'DOCUMENT_CREATED',
            entityType: 'ProjectDocument',
            entityId: $document->id,
            details: [
                'doc_type' => $document->doc_type,
                'title' => $document->title,
                'phase_number' => $document->phase_number,
                'version' => $document->version,
            ]
        );

        return $document;
    }
}
