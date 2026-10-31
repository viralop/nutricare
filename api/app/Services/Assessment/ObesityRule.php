<?php

namespace App\Services\Assessment;

use App\Models\Food;

/**
 * Obesity / weight management: energy density classes (CDC/Rolls: ≤1.5 low,
 * 1.5–4 moderate, ≥4 high kcal per g) and calories per serving.
 */
class ObesityRule extends ConditionRule
{
    public function slug(): string
    {
        return 'obesity';
    }

    public function assess(Food $food, string $locale): array
    {
        $density = config('nutrition.energy_density');
        $kcalPerServing = $this->servingValue($food, 'energy_kcal');
        $ed = $food->energy_kcal; // per 100 g ≈ kcal/g

        $en = $ar = [];
        $class = 'unknown';
        if ($ed !== null) {
            if ($ed <= $density['low']) {
                $class = 'low';
                $en[] = "Low energy density ({$this->fmt($ed)} kcal per 100 g) — filling choices like this help control total calorie intake.";
                $ar[] = "كثافة طاقية منخفضة ({$this->fmt($ed)} سعرة لكل ١٠٠ جم) — الأصناف الشبعانة مثل هذا تساعد في ضبط إجمالي السعرات.";
            } elseif ($ed >= $density['high']) {
                $class = 'high';
                $en[] = "High energy density ({$this->fmt($ed)} kcal per 100 g ≥ {$this->fmt($density['high'])}) — small portions carry many calories.";
                $ar[] = "كثافة طاقية مرتفعة ({$this->fmt($ed)} سعرة لكل ١٠٠ جم ≥ {$this->fmt($density['high'])}) — الكميات الصغيرة تحمل سعرات كثيرة.";
            } else {
                $class = 'moderate';
                $en[] = "Moderate energy density ({$this->fmt($ed)} kcal per 100 g).";
                $ar[] = "كثافة طاقية متوسطة ({$this->fmt($ed)} سعرة لكل ١٠٠ جم).";
            }
        }

        if ($kcalPerServing !== null) {
            $en[] = "One serving ({$this->fmt($food->serving_size_g)} g) provides about {$this->fmt($kcalPerServing)} kcal.";
            $ar[] = "الحصة الواحدة ({$this->fmt($food->serving_size_g)} جم) تقدم نحو {$this->fmt($kcalPerServing)} سعرة.";
        }

        if ($food->fiber_g !== null && $food->fiber_g >= config('nutrition.bands_per_100g.fiber_g.high')) {
            $en[] = "High fiber ({$this->fmt($food->fiber_g)} g/100 g) increases satiety per calorie.";
            $ar[] = "غني بالألياف ({$this->fmt($food->fiber_g)} جم/١٠٠ جم) مما يعزز الإحساس بالشبع لكل سعرة.";
        }

        $verdict = 'acceptable';
        if ($kcalPerServing !== null && $kcalPerServing >= config('nutrition.per_serving.energy_dense_kcal') * 1.5) {
            $verdict = 'not_recommended';
        } elseif ($class === 'high' && ($kcalPerServing === null || $kcalPerServing >= config('nutrition.per_serving.energy_dense_kcal'))) {
            $verdict = 'moderation';
        } elseif ($class === 'low') {
            $verdict = 'good';
        } elseif ($class === 'moderate' && $kcalPerServing !== null && $kcalPerServing >= config('nutrition.per_serving.energy_dense_kcal')) {
            $verdict = 'moderation';
        }

        return [
            'condition' => $this->slug(),
            'verdict' => $verdict,
            'reasons' => $locale === 'ar' ? $ar : $en,
            'warnings' => [],
        ];
    }
}
