<?php

namespace App\Actions\Phases;

use App\Models\Project;

class CalculatePhaseProgressAction
{
    /**
     * Calculate and sync dynamic progress completion rates (0-100%) for all 7 SDLC phases.
     *
     * @return array<int, int>
     */
    public function execute(Project $project): array
    {
        $phases = $project->phases ? $project->phases->keyBy('phase_number') : collect();
        $gates = $project->qualityGates ? $project->qualityGates->keyBy('gate_number') : collect();
        $documents = $project->documents ? $project->documents->groupBy('phase_number') : collect();
        $rates = [];

        for ($num = 1; $num <= 7; $num++) {
            $phase = $phases->get($num);
            $gate = $gates->get($num);
            $isPassed = ($gate && $gate->status === 'passed') || $num < $project->current_phase_number;

            if ($isPassed) {
                $rate = 100;
            } else {
                $phaseDocs = $documents->get($num, collect());
                $docCount = $phaseDocs->count();
                $docApproved = $phaseDocs->where('status', 'approved')->count();
                $docRate = $docCount > 0 ? ($docApproved / $docCount) : 0.0;

                $gateChecklist = ($gate && is_array($gate->criteria_checklist)) ? $gate->criteria_checklist : [];
                $checklistCount = count($gateChecklist);
                $checklistPassed = count(array_filter($gateChecklist));
                $gateRate = $checklistCount > 0 ? ($checklistPassed / $checklistCount) : 0.0;

                switch ($num) {
                    case 1:
                        $rtmCount = $project->rtmTraces ? $project->rtmTraces->count() : 0;
                        $opRate = min(1.0, $rtmCount / 3.0);
                        $rate = ($docRate * 45) + ($gateRate * 35) + ($opRate * 20);
                        break;

                    case 2:
                        $rate = ($docRate * 55) + ($gateRate * 45);
                        break;

                    case 3:
                        $raciCount = $project->raciAssignments ? $project->raciAssignments->count() : 0;
                        $opRate = min(1.0, $raciCount / 4.0);
                        $rate = ($docRate * 35) + ($gateRate * 35) + ($opRate * 30);
                        break;

                    case 4:
                        $tasks = $project->tasks ?: collect();
                        $taskCount = $tasks->count();
                        $taskDone = $tasks->where('status', 'done')->count();
                        $taskRate = $taskCount > 0 ? ($taskDone / $taskCount) : 0.3;

                        $latestCi = $project->ciPipelineMetrics ? $project->ciPipelineMetrics->first() : null;
                        $ciRate = 0.0;
                        if ($latestCi) {
                            $covScore = min(1.0, ((float) $latestCi->coverage_percentage) / 100.0);
                            $sastScore = $latestCi->sast_status === 'passed' ? 1.0 : 0.2;
                            $ciRate = ($covScore * 0.7) + ($sastScore * 0.3);
                        }
                        $rate = ($docRate * 25) + ($gateRate * 25) + ($taskRate * 25) + ($ciRate * 25);
                        break;

                    case 5:
                        $testRuns = $project->testRuns ?: collect();
                        $testRunRate = $testRuns->count() > 0 ? 1.0 : 0.0;

                        $defects = $project->defects ?: collect();
                        $blockers = $defects->whereIn('severity', ['blocker', 'critical'])
                            ->whereNotIn('status', ['resolved', 'closed'])
                            ->count();

                        $rate = max(0, ($docRate * 30) + ($gateRate * 30) + ($testRunRate * 40) - ($blockers * 20));
                        break;

                    case 6:
                        $cabSignoffs = $project->cabSignoffs ?: collect();
                        $cabApproved = $cabSignoffs->where('decision', 'approved')->count();
                        $cabRate = min(1.0, $cabApproved / 3.0);

                        $rollouts = $project->deploymentRollouts ?: collect();
                        $rollout = $rollouts->first();
                        $rolloutRate = $rollout ? min(1.0, ((float) $rollout->traffic_percentage) / 100.0) : 0.0;

                        $rate = ($docRate * 30) + ($gateRate * 30) + ($cabRate * 20) + ($rolloutRate * 20);
                        break;

                    case 7:
                        $incidents = $project->productionIncidents ?: collect();
                        $incidentsCount = $incidents->count();
                        $incidentsResolved = $incidents->where('status', 'resolved')->count();
                        $incidentRate = $incidentsCount > 0 ? ($incidentsResolved / $incidentsCount) : 1.0;

                        $rate = ($docRate * 40) + ($incidentRate * 40) + 20;
                        break;

                    default:
                        $rate = 0;
                }

                $rate = min(99, max(0, (int) round($rate)));
            }

            $rates[$num] = $rate;

            if ($phase && $phase->completion_rate !== $rate) {
                $phase->updateQuietly(['completion_rate' => $rate]);
                $phase->completion_rate = $rate;
            }
        }

        return $rates;
    }
}
