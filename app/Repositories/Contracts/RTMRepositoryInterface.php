<?php

namespace App\Repositories\Contracts;

use App\Models\RTMTrace;
use Illuminate\Database\Eloquent\Collection;

interface RTMRepositoryInterface
{
    /**
     * @return Collection<int, RTMTrace>
     */
    public function getByProject(int $projectId): Collection;

    public function create(array $data): RTMTrace;

    public function updateStatus(int $id, string $status): bool;
}
