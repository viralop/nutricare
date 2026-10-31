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

        $alternatives = $food->alternatives()->with('alternativeFood')->get()->map(function ($alt) use ($food, $locale) {
            return [
                'food' => new FoodResource($alt->alternativeFood),
                'reason' => $locale === 'ar' ? $alt->reason_ar : $alt->reason_en,
                'suggested_serving' => $locale === 'ar' ? $alt->suggested_serving_ar : $alt->suggested_serving_en,
                'auto' => false,
                'delta' => $this->delta($food, $alt->alternativeFood),
            ];
        })->values();

        // Unfavorable verdict with no curated swap? Auto-suggest same-group foods
        // that fix the nutrient driving the verdict.
        if ($alternatives->isEmpty() && in_array($assessment['verdict'], ['moderation', 'not_recommended'], true)) {
            $alternatives = $alternatives->toBase()->merge(
                $this->autoAlternatives($food, $locale)
            );
        }

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

    /** Nutrient that most drives an unfavorable verdict, worst ratio first. */
    protected function failingNutrient(Food $food): ?string
    {
        $perServing = $food->perServing();
        $candidates = [
            'sodium_mg' => [config('nutrition.per_serving.sodium_high_mg'), 'mg'],
            'sugar_g' => [config('nutrition.per_serving.sugar_high_g'), 'g'],
            'sat_fat_g' => [config('nutrition.per_serving.sat_fat_high_g'), 'g'],
            'carbohydrate_g' => [config('nutrition.per_serving.carb_meal_high_g'), 'g'],
            'energy_kcal' => [config('nutrition.per_serving.energy_dense_kcal') * 1.2, 'kcal'],
        ];

        $worst = null;
        $worstRatio = 1.0; // must exceed its threshold to count
        foreach ($candidates as $field => [$threshold]) {
            $value = $perServing[$field];
            if ($value === null || $threshold <= 0) {
                continue;
            }
            $ratio = $value / $threshold;
            if ($ratio > $worstRatio) {
                $worstRatio = $ratio;
                $worst = $field;
            }
        }

        return $worst;
    }

    /**
     * Auto-generated alternatives: same/companion food group, low in the failing
     * nutrient, same cuisine preferred. Bilingual reasons cite both values.
     */
    protected function autoAlternatives(Food $food, string $locale): array
    {
        $field = $this->failingNutrient($food);
        if ($field === null) {
            return [];
        }

        // Per-serving ceiling for a candidate to count as "low" in this nutrient.
        $ceilings = [
            'sodium_mg' => 300, 'sugar_g' => 8, 'sat_fat_g' => 3,
            'carbohydrate_g' => 45, 'energy_kcal' => 350,
        ];
        $ceiling = $ceilings[$field] ?? 300;

        $companions = [
            'sweet' => ['fruit', 'snack'],
            'snack' => ['vegetable', 'fruit'],
            'drink' => ['drink'],
            'meat' => ['fish', 'legume'],
            'packaged' => ['snack', 'dish'],
            'dish' => ['dish', 'vegetable'],
        ];
        $categories = array_unique(array_merge([$food->category], $companions[$food->category] ?? []));

        $factor = $ceiling; // per-serving ceiling; SQL scales by each candidate's serving size
        $candidates = Food::query()
            ->where('status', 'published')
            ->where('id', '!=', $food->id)
            ->whereIn('category', $categories)
            ->whereNotNull($field)
            ->whereRaw("({$field} * serving_size_g / 100.0) <= ?", [$factor])
            ->orderByRaw('case when cuisine = ? then 0 else 1 end', [$food->cuisine])
            ->orderBy($field)
            ->limit(10)
            ->get();

        // Quality guards: a suggestion must itself be a decent choice (wellness
        // verdict good/acceptable) and must not exceed the original's calories
        // by more than 10% — otherwise "lower sugar" chips would sneak in.
        $wellness = new \App\Services\Assessment\WellnessRule;
        $foodKcal = $food->perServing()['energy_kcal'];
        $filtered = $candidates->filter(function (Food $c) use ($wellness, $foodKcal) {
            $verdict = $wellness->assess($c, 'en')['verdict'];
            if (! in_array($verdict, ['good', 'acceptable'], true)) {
                return false;
            }
            $kcal = $c->perServing()['energy_kcal'];

            return $kcal === null || $foodKcal === null || $kcal <= $foodKcal * 1.1;
        })->take(3);

        $names = [
            'sodium_mg' => ['sodium', 'الصوديوم'],
            'sugar_g' => ['sugars', 'السكريات'],
            'sat_fat_g' => ['saturated fat', 'الدهون المشبعة'],
            'carbohydrate_g' => ['carbohydrate', 'الكربوهيدرات'],
            'energy_kcal' => ['calories', 'السعرات'],
        ][$field];
        $unit = $field === 'sodium_mg' ? 'mg' : ($field === 'energy_kcal' ? 'kcal' : 'g');
        $ar = $locale === 'ar';
        $foodValue = $this->fmtVal($food->perServing()[$field]);

        return $filtered->map(function (Food $c) use ($food, $field, $names, $unit, $foodValue, $locale, $ar) {
            $cValue = $this->fmtVal($c->perServing()[$field]);
            $reason = $ar
                ? "بديل مقترح تلقائيًا من نفس المجموعة الغذائية: يحتوي {$cValue} {$unit} {$names[1]} في الحصة مقابل {$foodValue} {$unit} في «{$food->localizedName('ar')}»."
                : "Auto-suggested from the same food group: {$cValue} {$unit} of {$names[0]} per serving versus {$foodValue} {$unit} in {$food->localizedName('en')}.";

            return [
                'food' => new FoodResource($c),
                'reason' => $reason,
                'suggested_serving' => $c->localizedServingLabel($locale),
                'auto' => true,
                'delta' => $this->delta($food, $c),
            ];
        })->all();
    }

    protected function fmtVal($v): string
    {
        return $v === null ? '?' : rtrim(rtrim(number_format($v, 1, '.', ''), '0'), '.');
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
