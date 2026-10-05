<?php

namespace App\Repositories\Eloquent;

use App\Models\ProjectDocument;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentDocumentRepository implements DocumentRepositoryInterface
{
    public function getByProject(int $projectId): Collection
    {
        return ProjectDocument::where('project_id', $projectId)->latest()->get();
    }

    public function findById(int $id): ?ProjectDocument
    {
        return ProjectDocument::find($id);
    }

    public function create(array $data): ProjectDocument
    {
        return ProjectDocument::create($data);
    }

    public function signOff(int $id, string $signOffBy, string $signatureHash): bool
    {
        $doc = ProjectDocument::find($id);
        if (! $doc) {
            return false;
        }

        return $doc->update([
            'status' => 'approved',
            'signed_off_by' => $signOffBy,
            'signed_off_at' => now(),
            'signature_hash' => $signatureHash,
        ]);
    }
}
