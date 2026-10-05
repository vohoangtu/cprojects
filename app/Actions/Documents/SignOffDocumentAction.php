<?php

namespace App\Actions\Documents;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\ProjectDocument;
use App\Repositories\Contracts\DocumentRepositoryInterface;

class SignOffDocumentAction
{
    public function __construct(
        protected DocumentRepositoryInterface $documentRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    public function execute(
        int $documentId,
        string $signOffBy,
        string $signOffRole,
    ): ProjectDocument {
        $doc = $this->documentRepository->findById($documentId);
        if (! $doc) {
            throw new \InvalidArgumentException("Document with ID {$documentId} not found.");
        }

        // Generate cryptographic hash of content for integrity verification
        $contentHash = hash('sha256', $doc->content ?? $doc->title);
        $sigToken = 'DOC-SIG-'.strtoupper(hash_hmac('sha256', "{$doc->id}:{$contentHash}:{$signOffBy}", config('app.key', 'mcms-secret-key-2026')));

        $this->documentRepository->signOff($documentId, $signOffBy, $sigToken);

        $this->recordAuditLogAction->execute(
            projectId: $doc->project_id,
            userName: $signOffBy,
            userRole: $signOffRole,
            actionType: 'DOCUMENT_SIGNED',
            entityType: 'ProjectDocument',
            entityId: $doc->id,
            details: [
                'doc_type' => $doc->doc_type,
                'title' => $doc->title,
                'version' => $doc->version,
                'content_hash' => $contentHash,
                'signature' => $sigToken,
            ]
        );

        return $doc->fresh();
    }
}
