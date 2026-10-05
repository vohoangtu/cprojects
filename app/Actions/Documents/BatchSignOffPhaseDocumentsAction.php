<?php

namespace App\Actions\Documents;

use App\Actions\Audit\RecordAuditLogAction;
use App\Models\Project;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use Illuminate\Support\Collection;

class BatchSignOffPhaseDocumentsAction
{
    public function __construct(
        protected DocumentRepositoryInterface $documentRepository,
        protected RecordAuditLogAction $recordAuditLogAction,
    ) {}

    /**
     * Cryptographically sign off all under-review or draft documents within an SDLC phase.
     *
     * @return array{total_signed: int, phase_number: int, signed_documents: Collection}
     */
    public function execute(
        Project $project,
        int $phaseNumber,
        string $signOffBy = 'Võ Hoàng Tú',
        string $signOffRole = 'Lead Solution Architect',
    ): array {
        $unapprovedDocs = $project->documents()
            ->where('phase_number', $phaseNumber)
            ->where('status', '!=', 'approved')
            ->get();

        $signedDocs = collect();

        foreach ($unapprovedDocs as $doc) {
            $contentHash = hash('sha256', $doc->content ?? $doc->title);
            $sigToken = 'DOC-SIG-'.strtoupper(hash_hmac('sha256', "{$doc->id}:{$contentHash}:{$signOffBy}", config('app.key', 'mcms-secret-key-2026')));

            $this->documentRepository->signOff($doc->id, $signOffBy, $sigToken);

            $this->recordAuditLogAction->execute(
                projectId: $project->id,
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
                    'batch_phase' => $phaseNumber,
                ]
            );

            $signedDocs->push($doc->fresh());
        }

        if ($signedDocs->isNotEmpty()) {
            $this->recordAuditLogAction->execute(
                projectId: $project->id,
                userName: $signOffBy,
                userRole: $signOffRole,
                actionType: 'PHASE_DOCUMENTS_BATCH_SIGNED',
                entityType: 'Project',
                entityId: $project->id,
                details: [
                    'phase_number' => $phaseNumber,
                    'total_signed' => $signedDocs->count(),
                    'documents' => $signedDocs->pluck('doc_type')->toArray(),
                ]
            );
        }

        return [
            'total_signed' => $signedDocs->count(),
            'phase_number' => $phaseNumber,
            'signed_documents' => $signedDocs,
        ];
    }
}
