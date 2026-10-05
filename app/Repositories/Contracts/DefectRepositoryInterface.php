<?php

namespace App\Repositories\Contracts;

use App\Models\Defect;
use Illuminate\Database\Eloquent\Collection;

interface DefectRepositoryInterface
{
    /**
     * @return Collection<int, Defect>
     */
    public function getByProject(int $projectId): Collection;

    public function findById(int $id): ?Defect;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Defect;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(int $id, array $data): bool;

    /**
     * Count unresolved blocker and critical defects for a project.
     */
    public function countUnresolvedBlockers(int $projectId): int;
}
