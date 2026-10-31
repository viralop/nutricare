<?php

namespace App\Services\Assessment;

use App\Models\Food;

/**
 * High cholesterol: saturated fat per 100 g band (UK FSA) + per serving vs the
 * AHA daily limit (< 13 g/day at 2,000 kcal). Preparation method (fried) is
 * surfaced as a context note.
 */
class CholesterolRule extends ConditionRule
{
    public function slug(): string
    {
        return 'high_cholesterol';
    }

    public function assess(Food $food, string $locale): array
    {
        $bands = config('nutrition.bands_per_100g');
        $dailySat = config('nutrition.daily.sat_fat_g.limit');
        $satBand = $this->band($food->sat_fat_g, $bands['sat_fat_g']['low'], $bands['sat_fat_g']['high']);
        $satPerServing = $this->servingValue($food, 'sat_fat_g');

        $en = $ar = [];
        if ($satBand === 'low') {
            $en[] = "Low in saturated fat ({$this->fmt($food->sat_fat_g)} g per 100 g — UK FSA 'low' band ≤ {$this->fmt($bands['sat_fat_g']['low'])} g).";
            $ar[] = "منخفض الدهون المشبعة ({$this->fmt($food->sat_fat_g)} جم لكل ١٠٠ جم — ضمن حد «منخفض» ≤ {$this->fmt($bands['sat_fat_g']['low'])} جم).";
        } elseif ($satBand === 'mid') {
            $en[] = "Moderate saturated fat ({$this->fmt($food->sat_fat_g)} g per 100 g; 'high' starts above {$this->fmt($bands['sat_fat_g']['high'])} g).";
            $ar[] = "دهون مشبعة متوسطة ({$this->fmt($food->sat_fat_g)} جم لكل ١٠٠ جم؛ يبدأ التصنيف «مرتفع» فوق {$this->fmt($bands['sat_fat_g']['high'])} جم).";
        } elseif ($satBand === 'high') {
            $en[] = "High in saturated fat ({$this->fmt($food->sat_fat_g)} g per 100 g — above the {$this->fmt($bands['sat_fat_g']['high'])} g/100 g 'high' band). Saturated fat raises LDL cholesterol.";
            $ar[] = "مرتفع الدهون المشبعة ({$this->fmt($food->sat_fat_g)} جم لكل ١٠٠ جم — يتجاوز حد «المرتفع» البالغ {$this->fmt($bands['sat_fat_g']['high'])} جم/١٠٠ جم). الدهون المشبعة ترفع الكوليسترول الضار.";
        }

        if ($satPerServing !== null && $satPerServing >= config('nutrition.per_serving.sat_fat_high_g')) {
            $pct = round($satPerServing / $dailySat * 100);
            $en[] = "One serving ({$this->fmt($food->serving_size_g)} g) contains {$this->fmt($satPerServing)} g saturated fat — about {$pct}% of the AHA daily limit ({$this->fmt($dailySat)} g at 2,000 kcal).";
            $ar[] = "الحصة الواحدة ({$this->fmt($food->serving_size_g)} جم) تحتوي على {$this->fmt($satPerServing)} جم دهون مشبعة — نحو {$pct}٪ من الحد اليومي للجمعية الأمريكية للقلب ({$this->fmt($dailySat)} جم عند ٢٠٠٠ سعرة).";
        }

        if ($food->fiber_g !== null && $food->fiber_g >= $bands['fiber_g']['high']) {
            $en[] = "High in fiber ({$this->fmt($food->fiber_g)} g/100 g) — soluble fiber helps lower LDL cholesterol as part of a balanced diet.";
            $ar[] = "غني بالألياف ({$this->fmt($food->fiber_g)} جم/١٠٠ جم) — الألياف الذائبة تساعد في خفض الكوليسترول الضار ضمن نظام متوازن.";
        }

        if ($this->isFriedPreparation($food)) {
            $en[] = 'Note: this item is fried — deep-frying adds fats that can raise LDL; grilled or baked versions are leaner.';
            $ar[] = 'ملاحظة: هذا الصنف مقلي — القلي العميق يضيف دهونًا قد ترفع الكوليسترول الضار؛ والمشوي أو المخبوز أخف.';
        }

        $warnings = [];
        if ($satPerServing !== null && $satPerServing >= $dailySat * 0.6) {
            $warnings[] = $locale === 'ar'
                ? 'تحذير: هذه الحصة تغطي جزءًا كبيرًا من الحد اليومي للدهون المشبعة.'
                : 'Warning: this serving covers a large share of the daily saturated-fat limit.';
        }

        $verdict = 'acceptable';
        if ($satPerServing !== null && $satPerServing >= $dailySat * 0.6) {
            $verdict = 'not_recommended';
        } elseif ($satBand === 'high' || ($satPerServing !== null && $satPerServing >= config('nutrition.per_serving.sat_fat_high_g'))) {
            $verdict = 'moderation';
        } elseif ($satBand === 'low' && $food->fiber_g !== null && $food->fiber_g >= $bands['fiber_g']['high']) {
            $verdict = 'good';
        } elseif ($satBand === 'low') {
            $verdict = 'good';
        }

        return [
            'condition' => $this->slug(),
            'verdict' => $verdict,
            'reasons' => $locale === 'ar' ? $ar : $en,
            'warnings' => $warnings,
        ];
    }
}
