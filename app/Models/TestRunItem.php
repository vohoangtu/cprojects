<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestRunItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_run_id',
        'rtm_trace_id',
        'test_case_code',
        'title',
        'steps',
        'expected_result',
        'actual_result',
        'status',
        'defect_id',
    ];

    public function testRun(): BelongsTo
    {
        return $this->belongsTo(TestRun::class);
    }

    public function rtmTrace(): BelongsTo
    {
        return $this->belongsTo(RTMTrace::class);
    }

    public function defect(): BelongsTo
    {
        return $this->belongsTo(Defect::class);
    }
}
