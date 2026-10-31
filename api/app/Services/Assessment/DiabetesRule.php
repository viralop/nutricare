<?php

namespace App\Services\Assessment;

use App\Models\Food;

/**
 * Diabetes (Type 1 & Type 2): sugars per serving vs WHO free-sugar limit,
 * sugar band per 100 g (UK FSA), carbohydrate amount per meal (ADA note),
 * fiber bonus (EU high-fibre ≥ 6 g/100 g).
 */
class DiabetesRule extends ConditionRule
{
    public function slug(): string
    {
        return 'diabetes';
    }

    public function assess(Food $food, string $locale): array
    {
        $bands = config('nutrition.bands_per_100g');
        $dailySugar = config('nutrition.daily.sugar_g.limit');
        $sugarBand = $this->band($food->sugar_g, $bands['sugars_g']['low'], $bands['sugars_g']['high']);
        $sugarPerServing = $this->servingValue($food, 'sugar_g');
        $carbPerServing = $this->servingValue($food, 'carbohydrate_g');
        $fiberHigh = $food->fiber_g !== null && $food->fiber_g >= $bands['fiber_g']['high'];

        $reasons = $en = $ar = [];

        if ($sugarBand === 'low') {
            $en[] = "Low in sugars ({$this->fmt($food->sugar_g)} g per 100 g — UK FSA 'low' band ≤ 5 g).";
            $ar[] = "منخفض السكر ({$this->fmt($food->sugar_g)} جم لكل ١٠٠ جم — ضمن حد «منخفض» ≤ ٥ جم حسب المعيار البريطاني).";
        } elseif ($sugarBand === 'mid') {
            $en[] = "Moderate sugars ({$this->fmt($food->sugar_g)} g per 100 g; 'high' starts above {$this->fmt($bands['sugars_g']['high'])} g).";
            $ar[] = "سكر متوسط ({$this->fmt($food->sugar_g)} جم لكل ١٠٠ جم؛ يبدأ التصنيف «مرتفع» فوق {$this->fmt($bands['sugars_g']['high'])} جم).";
        } elseif ($sugarBand === 'high') {
            $en[] = "High in sugars ({$this->fmt($food->sugar_g)} g per 100 g — above the {$this->fmt($bands['sugars_g']['high'])} g/100 g traffic-light 'high' band).";
            $ar[] = "مرتفع السكر ({$this->fmt($food->sugar_g)} جم لكل ١٠٠ جم — يتجاوز حد «المرتفع» البالغ {$this->fmt($bands['sugars_g']['high'])} جم/١٠٠ جم).";
        }

        if ($sugarPerServing !== null && $sugarPerServing >= config('nutrition.per_serving.sugar_high_g')) {
            $pct = round($sugarPerServing / $dailySugar * 100);
            $en[] = "One serving ({$this->fmt($food->serving_size_g)} g) contains {$this->fmt($sugarPerServing)} g sugars — about {$pct}% of the WHO daily free-sugar limit ({$this->fmt($dailySugar)} g at 2,000 kcal).";
            $ar[] = "الحصة الواحدة ({$this->fmt($food->serving_size_g)} جم) تحتوي على {$this->fmt($sugarPerServing)} جم سكريات — نحو {$pct}٪ من الحد اليومي للسكريات الحر وفق منظمة الصحة العالمية ({$this->fmt($dailySugar)} جم عند ٢٠٠٠ سعرة).";
        }

        if ($carbPerServing !== null && $carbPerServing >= config('nutrition.per_serving.carb_meal_moderate_g')) {
            $en[] = "One serving provides {$this->fmt($carbPerServing)} g carbohydrate. The ADA notes carbohydrate per meal is individualized; many plans use roughly 45–60 g — count this portion against your meal budget.";
            $ar[] = "الحصة الواحدة تمد الجسم بـ {$this->fmt($carbPerServing)} جم كربوهيدرات. تشير الجمعية الأمريكية للسكري إلى أن الكمية فردية؛ كثير من الخطط تعتمد نطاق ٤٥–٦٠ جم للوجبة — احتسب هذه الحصة ضمن وجبتك.";
        }

        if ($fiberHigh) {
            $en[] = "High in fiber ({$this->fmt($food->fiber_g)} g/100 g) — fiber slows glucose absorption, which generally helps blood-sugar control.";
            $ar[] = "غني بالألياف ({$this->fmt($food->fiber_g)} جم/١٠٠ جم) — الألياف تبطئ امتصاص الجلوكوز مما يساعد عادةً على التحكم في سكر الدم.";
        }

        $warnings = [];
        if ($sugarPerServing !== null && $sugarPerServing >= config('nutrition.per_serving.sugar_high_g') * 1.5) {
            $warnings[] = $locale === 'ar'
                ? 'تحذير: هذه الحصة وحدها تحتوي كمية سكريات كبيرة مقارنة بالحد اليومي — قدترفع سكر الدم بسرعة.'
                : 'Warning: this single serving carries a large share of the daily free-sugar limit — it can raise blood glucose quickly.';
        }

        $verdict = 'acceptable';
        if ($sugarPerServing !== null && $sugarPerServing >= config('nutrition.per_serving.sugar_high_g') && $sugarBand === 'high') {
            $verdict = 'not_recommended';
        } elseif ($sugarBand === 'high'
            || ($sugarPerServing !== null && $sugarPerServing >= config('nutrition.per_serving.sugar_high_g'))
            || ($carbPerServing !== null && $carbPerServing >= config('nutrition.per_serving.carb_meal_high_g'))) {
            $verdict = 'moderation';
        } elseif ($sugarBand === 'low' && $fiberHigh) {
            $verdict = 'good';
        } elseif ($sugarBand === 'mid' && ! $fiberHigh) {
            $verdict = 'moderation';
        }

        return [
            'condition' => $this->slug(),
            'verdict' => $verdict,
            'reasons' => $locale === 'ar' ? $ar : $en,
            'warnings' => $warnings,
        ];
    }
}
