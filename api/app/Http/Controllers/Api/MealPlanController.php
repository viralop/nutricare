<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RecipeResource;
use App\Models\MealPlan;
use App\Models\MealPlanEntry;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MealPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $weekStart = $request->date('week')?->startOfWeek(Carbon::MONDAY) ?? now()->startOfWeek(Carbon::MONDAY);

        $plan = MealPlan::where('user_id', $user->id)
            ->where('week_start_date', $weekStart->toDateString())
            ->with('entries.recipe')
            ->first();

        if (! $plan) {
            $plan = $this->generateWeek($user, $weekStart);
        }

        return response()->json([
            'data' => [
                'week_start' => $plan->week_start_date->toDateString(),
                'days' => $this->formatDays($plan),
            ],
        ]);
    }

    public function regenerate(Request $request): JsonResponse
    {
        $weekStart = $request->date('week')?->startOfWeek(Carbon::MONDAY) ?? now()->startOfWeek(Carbon::MONDAY);
        MealPlan::where('user_id', $request->user()->id)
            ->where('week_start_date', $weekStart->toDateString())
            ->delete();

        $plan = $this->generateWeek($request->user(), $weekStart);

        return response()->json([
            'data' => [
                'week_start' => $plan->week_start_date->toDateString(),
                'days' => $this->formatDays($plan),
            ],
        ]);
    }

    public function replaceEntry(Request $request, int $entryId): JsonResponse
    {
        $data = $request->validate([
            'recipe_id' => ['required', 'integer', 'exists:recipes,id'],
        ]);

        $entry = MealPlanEntry::whereHas('mealPlan', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($entryId);
        $entry->update(['recipe_id' => $data['recipe_id']]);
        $entry->load('recipe');

        return response()->json(['data' => [
            'id' => $entry->id,
            'date' => $entry->date->toDateString(),
            'meal_slot' => $entry->meal_slot,
            'recipe' => new RecipeResource($entry->recipe),
        ]]);
    }

    protected function generateWeek($user, Carbon $weekStart): MealPlan
    {
        $conditionSlugs = $user->conditions()->pluck('slug');
        $preferred = Recipe::where('is_published', true)
            ->whereJsonContains('suitable_conditions', $conditionSlugs->first() ?? 'general_wellness')
            ->pluck('id');
        $fallback = Recipe::where('is_published', true)->pluck('id');
        $pool = $preferred->isNotEmpty() ? $preferred : $fallback;

        $plan = MealPlan::create([
            'user_id' => $user->id,
            'week_start_date' => $weekStart->toDateString(),
        ]);

        $slots = ['breakfast', 'lunch', 'dinner', 'snack'];
        $bySlot = [];
        foreach ($slots as $slot) {
            $bySlot[$slot] = Recipe::where('is_published', true)
                ->where('meal_type', $slot)
                ->pluck('id')
                ->values();
            if ($bySlot[$slot]->isEmpty()) {
                $bySlot[$slot] = $pool->values();
            }
        }

        $rows = [];
        for ($d = 0; $d < 7; $d++) {
            foreach ($slots as $slot) {
                $list = $bySlot[$slot];
                if ($list->isEmpty()) {
                    continue;
                }
                $rows[] = [
                    'meal_plan_id' => $plan->id,
                    'date' => $weekStart->copy()->addDays($d)->toDateString(),
                    'meal_slot' => $slot,
                    'recipe_id' => $list[$d % $list->count()],
                ];
            }
        }
        MealPlanEntry::insert($rows);
        $plan->load('entries.recipe');

        return $plan;
    }

    protected function formatDays(MealPlan $plan): array
    {
        $byDay = [];
        foreach ($plan->entries as $entry) {
            $byDay[$entry->date->toDateString()][] = [
                'id' => $entry->id,
                'meal_slot' => $entry->meal_slot,
                'recipe' => new RecipeResource($entry->recipe),
            ];
        }
        ksort($byDay);

        return $byDay;
    }
}
