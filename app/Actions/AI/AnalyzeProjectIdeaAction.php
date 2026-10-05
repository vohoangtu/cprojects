<?php

namespace App\Actions\AI;

use App\Services\AI\AIService;

class AnalyzeProjectIdeaAction
{
    public function __construct(
        protected AIService $aiService,
    ) {}

    /**
     * Analyze a raw user idea prompt into structured SDLC specifications.
     *
     * @return array<string, mixed>
     */
    public function execute(string $ideaPrompt, array $context = []): array
    {
        if (empty(trim($ideaPrompt))) {
            throw new \InvalidArgumentException('Ý tưởng dự án không được để trống.');
        }

        return $this->aiService->analyzeIdea($ideaPrompt, $context);
    }
}
