<?php

namespace App\Repositories\Eloquent;

use App\Models\Defect;
use App\Repositories\Contracts\DefectRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentDefectRepository implements DefectRepositoryInterface
{
    public function getByProject(int $projectId): Collection
    {
        return Defect::where('project_id', $projectId)
            ->with('rtmTrace')
            ->latest()
            ->get();
    }

    public function findById(int $id): ?Defect
    {
        return Defect::with(['project', 'rtmTrace'])->find($id);
    }

    public function create(array $data): Defect
    {
        return Defect::create($data);
    }

    public function update(int $id, array $data): bool
    {
        $defect = Defect::find($id);

        return $defect ? $defect->update($data) : false;
    }

    public function countUnresolvedBlockers(int $projectId): int
    {
        return Defect::where('project_id', $projectId)
            ->unresolvedBlockers()
            ->count();
    }
}
