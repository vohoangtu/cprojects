<?php

namespace App\Actions\RACI;

use App\Models\Project;

class AnalyzeRACIWorkloadAction
{
    /**
     * Analyze RACI distribution and detect single-point-of-failure / bottleneck risks.
     *
     * @return array{
     *     workload_by_person: array<string, array{a_count: int, r_count: int, total: int}>,
     *     bottlenecks: array<string>,
     *     total_activities: int
     * }
     */
    public function execute(Project $project): array
    {
        $assignments = $project->raciAssignments;
        $workload = [];
        $bottlenecks = [];

        foreach ($assignments as $item) {
            $aPerson = $item->accountable;
            $rPerson = $item->responsible;

            // Tally Accountable
            if (! isset($workload[$aPerson])) {
                $workload[$aPerson] = ['a_count' => 0, 'r_count' => 0, 'total' => 0];
            }
            $workload[$aPerson]['a_count']++;
            $workload[$aPerson]['total']++;

            // Tally Responsible
            if (! isset($workload[$rPerson])) {
                $workload[$rPerson] = ['a_count' => 0, 'r_count' => 0, 'total' => 0];
            }
            $workload[$rPerson]['r_count']++;
            $workload[$rPerson]['total']++;
        }

        // Detect bottlenecks: any individual accountable for >= 3 activities
        foreach ($workload as $person => $counts) {
            if ($counts['a_count'] >= 3) {
                $bottlenecks[] = "{$person} đang chịu trách nhiệm giải trình (A) cho {$counts['a_count']} hoạt động kỹ thuật trọng yếu.";
            }
        }

        return [
            'workload_by_person' => $workload,
            'bottlenecks' => $bottlenecks,
            'total_activities' => $assignments->count(),
        ];
    }
}
