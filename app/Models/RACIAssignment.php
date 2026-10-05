<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RACIAssignment extends Model
{
    use HasFactory;

    protected $table = 'raci_assignments';

    protected $fillable = [
        'project_id',
        'activity_name',
        'phase_number',
        'responsible',
        'accountable',
        'consulted',
        'informed',
    ];

    protected function casts(): array
    {
        return [
            'phase_number' => 'integer',
            'consulted' => 'array',
            'informed' => 'array',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
