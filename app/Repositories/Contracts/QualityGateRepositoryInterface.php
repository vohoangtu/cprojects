<?php

namespace App\Repositories\Contracts;

use App\Models\QualityGate;
use Illuminate\Database\Eloquent\Collection;

interface QualityGateRepositoryInterface
{
    public function findById(int $id): ?QualityGate;

    /**
     * @return Collection<int, QualityGate>
     */
    public function getByProject(int $projectId): Collection;

    public function updateStatus(int $id, string $status, array $signOffData = []): bool;
}
