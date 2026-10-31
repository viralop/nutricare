<?php

namespace App\Services\Assessment;

use App\Models\Food;
use App\Models\FoodAlternative;

/**
 * Finds healthier alternatives for a food: curated mappings first, otherwise
 * auto-suggestions from the same food group that fix the failing nutrient.
 * Shared by the analyze endpoint and the AI assistant.
 */
class AlternativeFinder
{
    /**
     * @param  bool  $allowAuto  enable auto-suggestions when no curated mapping
     *                          exists (callers pass false for good-verdict foods).
     * @return array<int, array{food: Food, reason: string, suggested_serving: ?string, auto: bool, delta: array}>
     */
    public function forFood(Food $food, string $locale, bool $allowAuto = true): array
    {
        $curated = $food->alternatives()->with('alternativeFood')->get()
            ->map(fn (FoodAlternative $alt) => [
                'food' => $alt->alternativeFood,
                'reason' => $locale === 'ar' ? $alt->reason_ar : $alt->reason_en,
                'suggested_serving' => $locale === 'ar' ? $alt->suggested_serving_ar : $alt->suggested_serving_en,
                'auto' => false,
                'delta' => $this->delta($food, $alt->alternativeFood),
            ])->values()->all();

        if ($curated !== []) {
            return $curated;
        }

        return $allowAuto ? $this->auto($food, $locale) : [];
    }

    /** Nutrient that most drives an unfavorable verdict, worst ratio first. */
    protected function failingNutrient(Food $food): ?string
    {
        $perServing = $food->perServing();
        $candidates = [
            'sodium_mg' => config('nutrition.per_serving.sodium_high_mg'),
            'sugar_g' => config('nutrition.per_serving.sugar_high_g'),
            'sat_fat_g' => config('nutrition.per_serving.sat_fat_high_g'),
            'carbohydrate_g' => config('nutrition.per_serving.carb_meal_high_g'),
            'energy_kcal' => config('nutrition.per_serving.energy_dense_kcal') * 1.2,
        ];

        $worst = null;
        $worstRatio = 1.0;
        foreach ($candidates as $field => $threshold) {
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

    protected function auto(Food $food, string $locale): array
    {
        $field = $this->failingNutrient($food);
        if ($field === null) {
            return [];
        }

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

        $candidates = Food::query()
            ->where('status', 'published')
            ->where('id', '!=', $food->id)
            ->whereIn('category', $categories)
            ->whereNotNull($field)
            ->whereRaw("({$field} * serving_size_g / 100.0) <= ?", [$ceiling])
            ->orderByRaw('case when cuisine = ? then 0 else 1 end', [$food->cuisine])
            ->orderBy($field)
            ->limit(10)
            ->get();

        // Quality guards: a suggestion must itself be a decent choice and must
        // not exceed the original's calories by more than 10%.
        $wellness = new WellnessRule;
        $foodKcal = $food->perServing()['energy_kcal'];
        $filtered = $candidates->filter(function (Food $c) use ($wellness, $foodKcal) {
            if (! in_array($wellness->assess($c, 'en')['verdict'], ['good', 'acceptable'], true)) {
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
        $foodValue = $this->fmt($food->perServing()[$field]);

        return $filtered->map(function (Food $c) use ($food, $field, $names, $unit, $foodValue, $locale, $ar) {
            $cValue = $this->fmt($c->perServing()[$field]);
            $reason = $ar
                ? "بديل مقترح تلقائيًا من نفس المجموعة الغذائية: يحتوي {$cValue} {$unit} {$names[1]} في الحصة مقابل {$foodValue} {$unit} في «{$food->localizedName('ar')}»."
                : "Auto-suggested from the same food group: {$cValue} {$unit} of {$names[0]} per serving versus {$foodValue} {$unit} in {$food->localizedName('en')}.";

            return [
                'food' => $c,
                'reason' => $reason,
                'suggested_serving' => $c->localizedServingLabel($locale),
                'auto' => true,
                'delta' => $this->delta($food, $c),
            ];
        })->values()->all();
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

    protected function fmt($v): string
    {
        return $v === null ? '?' : rtrim(rtrim(number_format($v, 1, '.', ''), '0'), '.');
    }
}
