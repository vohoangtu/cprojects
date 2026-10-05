<?php

namespace App\Repositories\Contracts;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Collection;

interface AuditLogRepositoryInterface
{
    /**
     * @return Collection<int, AuditLog>
     */
    public function getByProject(int $projectId): Collection;

    public function create(array $data): AuditLog;
}
