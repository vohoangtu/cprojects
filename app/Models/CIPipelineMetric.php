<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CIPipelineMetric extends Model
{
    use HasFactory;

    protected $table = 'ci_pipeline_metrics';

    protected $fillable = [
        'project_id',
        'build_number',
        'branch',
        'commit_sha',
        'unit_test_passed',
        'unit_test_failed',
        'coverage_percentage',
        'code_smells_count',
        'vulnerabilities_count',
        'sast_status',
        'pipeline_status',
    ];

    protected function casts(): array
    {
        return [
            'coverage_percentage' => 'decimal:2',
            'unit_test_passed' => 'integer',
            'unit_test_failed' => 'integer',
            'code_smells_count' => 'integer',
            'vulnerabilities_count' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
