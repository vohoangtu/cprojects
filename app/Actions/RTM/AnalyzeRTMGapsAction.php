<?php

namespace App\Actions\RTM;

use App\Repositories\Contracts\RTMRepositoryInterface;

class AnalyzeRTMGapsAction
{
    public function __construct(
        protected RTMRepositoryInterface $rtmRepository,
    ) {}

    /**
     * Analyze requirements coverage and identify traceability gaps.
     *
     * @return array{
     *     total_requirements: int,
     *     tested_count: int,
     *     released_count: int,
     *     missing_tests: array,
     *     missing_commits: array,
     *     coverage_score: float
     * }
     */
    public function execute(int $projectId): array
    {
        $traces = $this->rtmRepository->getByProject($projectId);
        $total = $traces->count();

        if ($total === 0) {
            return [
                'total_requirements' => 0,
                'tested_count' => 0,
                'released_count' => 0,
                'missing_tests' => [],
                'missing_commits' => [],
                'coverage_score' => 0.0,
            ];
        }

        $missingTests = [];
        $missingCommits = [];
        $testedCount = 0;
        $releasedCount = 0;

        foreach ($traces as $trace) {
            if (empty($trace->test_case_code)) {
                $missingTests[] = [
                    'req_code' => $trace->req_code,
                    'req_title' => $trace->req_title,
                ];
            } else {
                $testedCount++;
            }

            if (empty($trace->commit_or_pr)) {
                $missingCommits[] = [
                    'req_code' => $trace->req_code,
                    'req_title' => $trace->req_title,
                ];
            }

            if ($trace->status === 'released' || ! empty($trace->release_version)) {
                $releasedCount++;
            }
        }

        $coverageScore = round(($testedCount / $total) * 100, 1);

        return [
            'total_requirements' => $total,
            'tested_count' => $testedCount,
            'released_count' => $releasedCount,
            'missing_tests' => $missingTests,
            'missing_commits' => $missingCommits,
            'coverage_score' => $coverageScore,
        ];
    }
}
