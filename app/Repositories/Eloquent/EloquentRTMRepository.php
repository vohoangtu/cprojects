<?php

namespace App\Repositories\Eloquent;

use App\Models\RTMTrace;
use App\Repositories\Contracts\RTMRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentRTMRepository implements RTMRepositoryInterface
{
    public function getByProject(int $projectId): Collection
    {
        return RTMTrace::where('project_id', $projectId)->get();
    }

    public function create(array $data): RTMTrace
    {
        return RTMTrace::create($data);
    }

    public function updateStatus(int $id, string $status): bool
    {
        $trace = RTMTrace::find($id);
        if (! $trace) {
            return false;
        }

        return $trace->update(['status' => $status]);
    }
}
