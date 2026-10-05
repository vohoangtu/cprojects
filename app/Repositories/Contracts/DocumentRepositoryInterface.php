<?php

namespace App\Repositories\Contracts;

use App\Models\ProjectDocument;
use Illuminate\Database\Eloquent\Collection;

interface DocumentRepositoryInterface
{
    /**
     * @return Collection<int, ProjectDocument>
     */
    public function getByProject(int $projectId): Collection;

    public function findById(int $id): ?ProjectDocument;

    public function create(array $data): ProjectDocument;

    public function signOff(int $id, string $signOffBy, string $signatureHash): bool;
}
