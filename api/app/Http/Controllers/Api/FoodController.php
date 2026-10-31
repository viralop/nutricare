<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConditionResource;
use App\Http\Resources\FoodResource;
use App\Models\Food;
use App\Services\Assessment\AssessmentEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FoodController extends Controller
{
    public function __construct(protected AssessmentEngine $engine) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:80'],
            'category' => ['nullable', 'string', 'max:20'],
            'cuisine' => ['nullable', 'string', 'max:20'],
            'per_page' => ['nullable', 'integer', 'between:1,50'],
        ]);

        $foods = Food::query()
            ->where('status', 'published')
            ->when($request->filled('q'), function ($query) use ($request) {
                $q = trim((string) $request->string('q'));
                $query->where(function ($inner) use ($q) {
                    $inner->where('name_en', 'like', "%{$q}%")
                        ->orWhere('name_ar', 'like', "%{$q}%")
                        ->orWhereHas('aliases', fn ($a) => $a->where('alias', 'like', "%{$q}%"));
                });
            })
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->category))
            ->when($request->filled('cuisine'), fn ($q) => $q->where('cuisine', $request->cuisine))
            ->orderBy('name_en')
            ->paginate($request->integer('per_page', 20));

        return FoodResource::collection($foods)->additional([
            'meta' => ['locale' => $this->locale($request)],
        ]);
    }

    public function show(string $slug, Request $request): JsonResponse
    {
        $food = Food::where('slug', $slug)->where('status', 'published')->firstOrFail();

        return response()->json([
            'data' => new FoodResource($food),
        ]);
    }

    /**
     * The core analysis endpoint: verdicts per the caller's conditions.
     */
    public function analyze(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'exists:foods,slug'],
            'servings' => ['nullable', 'numeric', 'between:0.25,10'],
        ]);

        $locale = $this->locale($request);
        $food = Food::where('slug', $data['slug'])->firstOrFail();
        // Public route: pick up the Bearer token if present so logged-in users
        // get personalized verdicts; guests fall back to general wellness.
        $user = auth('sanctum')->user();
        $conditions = $user
            ? $user->conditions()->get()
            : collect();

        $assessment = $this->engine->assess($food, $conditions, $locale);

        // Anonymous guests get general-wellness analysis; log history only for users.
        if ($user) {
            $food->analysisLogs()->create([
                'user_id' => $user->id,
                'verdict' => $assessment['verdict'],
                'locale' => $locale,
            ]);
        }

        $allowAuto = in_array($assessment['verdict'], ['moderation', 'not_recommended'], true);
        $alternatives = collect(app(\App\Services\Assessment\AlternativeFinder::class)
            ->forFood($food, $locale, $allowAuto))
            ->map(fn ($alt) => [
                'food' => new FoodResource($alt['food']),
                'reason' => $alt['reason'],
                'suggested_serving' => $alt['suggested_serving'],
                'auto' => $alt['auto'],
                'delta' => $alt['delta'],
            ])->values();

        return response()->json([
            'data' => [
                'food' => new FoodResource($food),
                'assessment' => $assessment,
                'alternatives' => $alternatives,
                'conditions' => ConditionResource::collection($conditions),
                'disclaimer' => config("ai.disclaimer.{$locale}"),
            ],
        ]);
    }

    public function alternatives(string $slug, Request $request): JsonResponse
    {
        $locale = $this->locale($request);
        $food = Food::where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => $food->alternatives()->with('alternativeFood')->get()->map(fn ($alt) => [
                'food' => new FoodResource($alt->alternativeFood),
                'reason' => $locale === 'ar' ? $alt->reason_ar : $alt->reason_en,
                'suggested_serving' => $locale === 'ar' ? $alt->suggested_serving_ar : $alt->suggested_serving_en,
            ]),
        ]);
    }

    public function compare(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slugs' => ['required', 'array', 'size:2'],
            'slugs.*' => ['string', 'exists:foods,slug'],
        ]);

        $locale = $this->locale($request);
        $foods = Food::whereIn('slug', $data['slugs'])->where('status', 'published')->get()->keyBy('slug');
        $user = auth('sanctum')->user();
        $conditions = $user ? $user->conditions()->get() : collect();

        $out = [];
        foreach ($data['slugs'] as $slug) {
            $food = $foods->get($slug);
            if (! $food) {
                continue;
            }
            $out[] = [
                'food' => new FoodResource($food),
                'assessment' => $this->engine->assess($food, $conditions, $locale),
            ];
        }

        return response()->json(['data' => $out]);
    }

    protected function locale(Request $request): string
    {
        $locale = $request->input('locale') ?? $request->header('Accept-Language');
        if (is_string($locale) && str_starts_with($locale, 'ar')) {
            return 'ar';
        }
        if (is_string($locale) && str_starts_with($locale, 'en')) {
            return 'en';
        }

        return auth('sanctum')->user()?->locale ?? 'en';
    }

    protected function delta(Food $a, Food $b): array
    {
        $delta = [];
        foreach (Food::NUTRIENT_FIELDS as $field) {
            if ($a->{$field} !== null && $b->{$field} !== null) {
                $delta[$field] = round($b->{$field} - $a->{$field}, 1);
            }
        }

        return $delta;
    }
}
