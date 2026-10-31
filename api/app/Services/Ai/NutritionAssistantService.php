<?php

namespace App\Services\Ai;

use App\Models\User;

/**
 * Contract for the nutrition assistant. The offline TemplateAssistantEngine
 * implements it today; an OpenAI-compatible adapter can be bound later
 * (config/ai.php) without touching callers.
 */
interface NutritionAssistantService
{
    /**
     * Answer a user's nutrition question.
     *
     * @return array{reply: string, blocked: bool, suggestions: string[]}
     */
    public function answer(User $user, string $message, string $locale): array;
}
