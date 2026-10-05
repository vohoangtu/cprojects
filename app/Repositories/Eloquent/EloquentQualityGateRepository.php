<?php

namespace App\Repositories\Eloquent;

use App\Models\QualityGate;
use App\Repositories\Contracts\QualityGateRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentQualityGateRepository implements QualityGateRepositoryInterface
{
    public function findById(int $id): ?QualityGate
    {
        return QualityGate::with(['project', 'phase'])->find($id);
    }

    public function getByProject(int $projectId): Collection
    {
        return QualityGate::where('project_id', $projectId)->orderBy('gate_number')->get();
    }

    public function updateStatus(int $id, string $status, array $signOffData = []): bool
    {
        $gate = QualityGate::find($id);
        if (! $gate) {
            return false;
        }

        $attributes = array_merge(['status' => $status], $signOffData);

        return $gate->update($attributes);
    }
}
