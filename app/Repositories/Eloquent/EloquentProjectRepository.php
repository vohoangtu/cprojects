<?php

namespace App\Repositories\Eloquent;

use App\Models\Project;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentProjectRepository implements ProjectRepositoryInterface
{
    public function getAll(): Collection
    {
        return Project::with([
            'phases',
            'qualityGates',
            'defects',
            'raciAssignments',
            'productionIncidents',
        ])->latest()->get();
    }

    public function findById(int $id): ?Project
    {
        return Project::with([
            'phases.qualityGate',
            'qualityGates',
            'documents',
            'raciAssignments',
            'rtmTraces',
            'auditLogs',
        ])->find($id);
    }

    public function findByCode(string $code): ?Project
    {
        return Project::where('code', $code)->first();
    }

    public function create(array $data): Project
    {
        return Project::create($data);
    }

    public function update(int $id, array $data): bool
    {
        $project = Project::find($id);
        if (! $project) {
            return false;
        }

        return $project->update($data);
    }

    public function delete(int $id): bool
    {
        $project = Project::find($id);
        if (! $project) {
            return false;
        }

        return (bool) $project->delete();
    }

    public function advancePhase(int $projectId, int $nextPhaseNumber): bool
    {
        $project = Project::find($projectId);
        if (! $project) {
            return false;
        }

        return $project->update([
            'current_phase_number' => $nextPhaseNumber,
        ]);
    }
}
