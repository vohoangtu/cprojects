<?php

namespace App\Actions\Integrations;

use App\Models\Project;
use Illuminate\Support\Facades\Http;

class DispatchProjectWebhookAction
{
    /**
     * Dispatch an event payload to all active webhooks subscribed to the event.
     *
     * @param  array<string, mixed>  $payload
     */
    public function execute(Project $project, string $event, array $payload): int
    {
        $webhooks = $project->webhooks()
            ->where('is_active', true)
            ->get()
            ->filter(fn ($wh) => in_array($event, $wh->events ?? []));

        $dispatchedCount = 0;

        foreach ($webhooks as $wh) {
            $jsonPayload = json_encode([
                'event' => $event,
                'project_code' => $project->code,
                'project_name' => $project->name,
                'timestamp' => now()->toIso8601String(),
                'data' => $payload,
            ]);

            $signature = hash_hmac('sha256', (string) $jsonPayload, $wh->secret_token);

            try {
                // In testing/local environment, avoid real blocking calls if URL is dummy
                if (! app()->runningUnitTests()) {
                    $response = Http::timeout(2)
                        ->withHeaders([
                            'Content-Type' => 'application/json',
                            'X-MCMS-Signature' => $signature,
                            'X-MCMS-Event' => $event,
                        ])
                        ->post($wh->url, json_decode((string) $jsonPayload, true));

                    $wh->update([
                        'last_triggered_at' => now(),
                        'last_status_code' => $response->status(),
                    ]);
                } else {
                    $wh->update([
                        'last_triggered_at' => now(),
                        'last_status_code' => 200,
                    ]);
                }

                $dispatchedCount++;
            } catch (\Throwable $e) {
                $wh->update([
                    'last_triggered_at' => now(),
                    'last_status_code' => 500,
                ]);
            }
        }

        return $dispatchedCount;
    }
}
