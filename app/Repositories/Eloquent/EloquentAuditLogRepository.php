<?php

namespace App\Repositories\Eloquent;

use App\Models\AuditLog;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentAuditLogRepository implements AuditLogRepositoryInterface
{
    public function getByProject(int $projectId): Collection
    {
        return AuditLog::where('project_id', $projectId)->latest()->get();
    }

    public function create(array $data): AuditLog
    {
        return AuditLog::create($data);
    }
}
