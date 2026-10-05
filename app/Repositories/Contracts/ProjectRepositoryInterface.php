<?php

namespace App\Repositories\Contracts;

use App\Models\Project;
use Illuminate\Database\Eloquent\Collection;

interface ProjectRepositoryInterface
{
    /**
     * @return Collection<int, Project>
     */
    public function getAll(): Collection;

    public function findById(int $id): ?Project;

    public function findByCode(string $code): ?Project;

    public function create(array $data): Project;

    public function update(int $id, array $data): bool;

    public function delete(int $id): bool;

    public function advancePhase(int $projectId, int $nextPhaseNumber): bool;
}
