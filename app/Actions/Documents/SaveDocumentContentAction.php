<?php

namespace App\Actions\Documents;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\ProjectDocument;
use App\Repositories\Contracts\DocumentRepositoryInterface;

class SaveDocumentContentAction
{
    public function __construct(
        protected DocumentRepositoryInterface $documentRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    public function execute(
        int $documentId,
        string $content,
        string $version,
        string $editorName = 'Võ Hoàng Tú',
        string $editorRole = 'Solution Architect',
    ): ProjectDocument {
        $doc = $this->documentRepository->findById($documentId);
        if (! $doc) {
            throw new \InvalidArgumentException("Document with ID {$documentId} not found.");
        }

        $oldVersion = $doc->version;
        $doc->update([
            'content' => $content,
            'version' => $version,
            'status' => 'under_review',
        ]);

        $this->recordAuditLogAction->execute(
            projectId: $doc->project_id,
            userName: $editorName,
            userRole: $editorRole,
            actionType: 'DOCUMENT_UPDATED',
            entityType: 'ProjectDocument',
            entityId: $doc->id,
            details: [
                'doc_type' => $doc->doc_type,
                'title' => $doc->title,
                'old_version' => $oldVersion,
                'new_version' => $version,
            ]
        );

        return $doc->fresh();
    }
}
