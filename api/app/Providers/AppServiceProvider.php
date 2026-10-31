<?php

namespace App\Providers;

use App\Services\Ai\NutritionAssistantService;
use App\Services\Ai\TemplateAssistantEngine;
use App\Services\Assessment\AssessmentEngine;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Provider slot: swap 'none' for an OpenAI-compatible adapter in config/ai.php.
        $this->app->bind(NutritionAssistantService::class, function ($app) {
            $provider = config('ai.provider');

            if ($provider === 'openai_compatible' && config('ai.openai_compatible.api_key')) {
                // Future: return new OpenAiCompatibleEngine(...);
            }

            return new TemplateAssistantEngine(
                $app->make(AssessmentEngine::class),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
