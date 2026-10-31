<?php

namespace App\Services\Assessment;

use App\Models\Food;

/**
 * Hypertension: sodium per 100 g band (UK FSA) + sodium per serving vs the AHA
 * daily limit (2,300 mg, ideal 1,500 mg).
 */
class HypertensionRule extends ConditionRule
{
    public function slug(): string
    {
        return 'hypertension';
    }

    public function assess(Food $food, string $locale): array
    {
        $bands = config('nutrition.bands_per_100g');
        $daily = config('nutrition.daily.sodium_mg');
        $sodiumBand = $this->band($food->sodium_mg, $bands['sodium_mg']['low'], $bands['sodium_mg']['high']);
        $sodiumPerServing = $this->servingValue($food, 'sodium_mg');

        $en = $ar = [];
        if ($sodiumBand === 'low') {
            $en[] = "Low in sodium ({$this->fmt($food->sodium_mg)} mg per 100 g — UK FSA 'low' band ≤ {$this->fmt($bands['sodium_mg']['low'])} mg).";
            $ar[] = "منخفض الصوديوم ({$this->fmt($food->sodium_mg)} مجم لكل ١٠٠ جم — ضمن حد «منخفض» ≤ {$this->fmt($bands['sodium_mg']['low'])} مجم).";
        } elseif ($sodiumBand === 'mid') {
            $en[] = "Moderate sodium ({$this->fmt($food->sodium_mg)} mg per 100 g; 'high' starts above {$this->fmt($bands['sodium_mg']['high'])} mg).";
            $ar[] = "صوديوم متوسط ({$this->fmt($food->sodium_mg)} مجم لكل ١٠٠ جم؛ يبدأ التصنيف «مرتفع» فوق {$this->fmt($bands['sodium_mg']['high'])} مجم).";
        } elseif ($sodiumBand === 'high') {
            $en[] = "High in sodium ({$this->fmt($food->sodium_mg)} mg per 100 g — above the {$this->fmt($bands['sodium_mg']['high'])} mg/100 g traffic-light 'high' band).";
            $ar[] = "مرتفع الصوديوم ({$this->fmt($food->sodium_mg)} مجم لكل ١٠٠ جم — يتجاوز حد «المرتفع» البالغ {$this->fmt($bands['sodium_mg']['high'])} مجم/١٠٠ جم).";
        }

        if ($sodiumPerServing !== null && $sodiumPerServing >= 400) {
            $pct = round($sodiumPerServing / $daily['limit'] * 100);
            $en[] = "One serving ({$this->fmt($food->serving_size_g)} g) contains {$this->fmt($sodiumPerServing)} mg sodium — about {$pct}% of the AHA daily limit ({$this->fmt($daily['limit'])} mg; ideal {$this->fmt($daily['ideal'])} mg).";
            $ar[] = "الحصة الواحدة ({$this->fmt($food->serving_size_g)} جم) تحتوي على {$this->fmt($sodiumPerServing)} مجم صوديوم — نحو {$pct}٪ من الحد اليومي للجمعية الأمريكية للقلب ({$this->fmt($daily['limit'])} مجم؛ والأمثل {$this->fmt($daily['ideal'])} مجم).";
        }

        $warnings = [];
        if ($sodiumPerServing !== null && $sodiumPerServing >= $daily['limit'] * 0.5) {
            $warnings[] = $locale === 'ar'
                ? 'تحذير: هذه الحصة وحدها تغطي نصف الحد اليومي للصوديوم أو أكثر — قدترفع ضغط الدم.'
                : 'Warning: this single serving covers half or more of the daily sodium limit — it can raise blood pressure.';
        }

        $verdict = 'acceptable';
        if ($sodiumPerServing !== null && ($sodiumPerServing >= $daily['limit'] * 0.5 || ($sodiumBand === 'high' && $sodiumPerServing >= config('nutrition.per_serving.sodium_high_mg')))) {
            $verdict = 'not_recommended';
        } elseif ($sodiumBand === 'high' || ($sodiumPerServing !== null && $sodiumPerServing >= config('nutrition.per_serving.sodium_high_mg'))) {
            $verdict = 'moderation';
        } elseif ($sodiumBand === 'low') {
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
