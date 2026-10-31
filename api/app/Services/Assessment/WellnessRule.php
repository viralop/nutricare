<?php

namespace App\Services\Assessment;

use App\Models\Food;

/**
 * General wellness (no conditions selected): traffic-light aggregate across
 * sugars, fat, saturates and sodium (UK FSA bands), fiber bonus.
 */
class WellnessRule extends ConditionRule
{
    public function slug(): string
    {
        return 'general_wellness';
    }

    public function assess(Food $food, string $locale): array
    {
        $bands = config('nutrition.bands_per_100g');
        $bandsChecked = [
            'sugars' => $this->band($food->sugar_g, $bands['sugars_g']['low'], $bands['sugars_g']['high']),
            'fat' => $this->band($food->total_fat_g, $bands['fat_g']['low'], $bands['fat_g']['high']),
            'saturates' => $this->band($food->sat_fat_g, $bands['sat_fat_g']['low'], $bands['sat_fat_g']['high']),
            'sodium' => $this->band($food->sodium_mg, $bands['sodium_mg']['low'], $bands['sodium_mg']['high']),
        ];

        $highs = array_filter($bandsChecked, fn ($b) => $b === 'high');
        $labelMap = ['sugars' => 'sugars / السكريات', 'fat' => 'fat / الدهون', 'saturates' => 'saturates / المشبعة', 'sodium' => 'sodium / الصوديوم'];

        $en = $ar = [];
        if ($highs === []) {
            $en[] = 'No traffic-light nutrient is in the "high" band per 100 g (UK FSA front-of-pack standard).';
            $ar[] = 'لا يوجد عنصر غذائي في نطاق «المرتفع» لكل ١٠٠ جم وفق المعيار البريطاني للملصقات.';
        } else {
            $list = implode(', ', array_map(fn ($k) => $k, array_keys($highs)));
            $en[] = "High band per 100 g for: {$list} (UK FSA traffic-light standard).";
            $ar[] = 'تصنيف «مرتفع» لكل ١٠٠ جم لـ: '.implode('، ', array_keys($highs)).' (المعيار البريطاني).';
        }

        if ($food->fiber_g !== null && $food->fiber_g >= $bands['fiber_g']['high']) {
            $en[] = "High in fiber ({$this->fmt($food->fiber_g)} g/100 g).";
            $ar[] = "غني بالألياف ({$this->fmt($food->fiber_g)} جم/١٠٠ جم).";
        }
        if ($this->isFriedPreparation($food)) {
            $en[] = 'Fried preparation — fried foods are best kept occasional in a balanced diet.';
            $ar[] = 'تحضير مقلي — يُفضَّل أن تكون الأطعمة المقلية عرضية في نظام متوازن.';
        }

        $count = count($highs);
        $verdict = match (true) {
            $count === 0 && $food->fiber_g !== null && $food->fiber_g >= $bands['fiber_g']['high'] => 'good',
            $count === 0 => 'acceptable',
            $count === 1 => 'moderation',
            default => 'not_recommended',
        };

        return [
            'condition' => $this->slug(),
            'verdict' => $verdict,
            'reasons' => $locale === 'ar' ? $ar : $en,
            'warnings' => [],
        ];
    }
}
