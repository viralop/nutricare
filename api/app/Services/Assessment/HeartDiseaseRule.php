<?php

namespace App\Services\Assessment;

use App\Models\Food;

/**
 * Heart disease: worst of saturated fat + sodium (both AHA priorities), with a
 * fiber bonus and fried-preparation note.
 */
class HeartDiseaseRule extends ConditionRule
{
    public function slug(): string
    {
        return 'heart_disease';
    }

    public function assess(Food $food, string $locale): array
    {
        $bands = config('nutrition.bands_per_100g');
        $satBand = $this->band($food->sat_fat_g, $bands['sat_fat_g']['low'], $bands['sat_fat_g']['high']);
        $sodiumBand = $this->band($food->sodium_mg, $bands['sodium_mg']['low'], $bands['sodium_mg']['high']);
        $satPerServing = $this->servingValue($food, 'sat_fat_g');
        $sodiumPerServing = $this->servingValue($food, 'sodium_mg');

        $en = $ar = [];
        $en[] = "Saturated fat: {$this->fmt($food->sat_fat_g)} g/100 g (band: {$satBand}); sodium: {$this->fmt($food->sodium_mg)} mg/100 g (band: {$sodiumBand}) — both are AHA dietary priorities for heart health.";
        $ar[] = "الدهون المشبعة: {$this->fmt($food->sat_fat_g)} جم/١٠٠ جم (التصنيف: {$satBand})؛ الصوديوم: {$this->fmt($food->sodium_mg)} مجم/١٠٠ جم (التصنيف: {$sodiumBand}) — كلاهما من أولويات الجمعية الأمريكية للقلب لصحة القلب.";

        if ($satPerServing !== null && $satPerServing >= config('nutrition.per_serving.sat_fat_high_g')) {
            $en[] = "One serving gives {$this->fmt($satPerServing)} g saturated fat (AHA daily limit {$this->fmt(config('nutrition.daily.sat_fat_g.limit'))} g).";
            $ar[] = "الحصة الواحدة تقدم {$this->fmt($satPerServing)} جم دهون مشبعة (الحد اليومي للجمعية الأمريكية للقلب {$this->fmt(config('nutrition.daily.sat_fat_g.limit'))} جم).";
        }
        if ($sodiumPerServing !== null && $sodiumPerServing >= config('nutrition.per_serving.sodium_high_mg')) {
            $en[] = "One serving gives {$this->fmt($sodiumPerServing)} mg sodium (AHA daily limit {$this->fmt(config('nutrition.daily.sodium_mg.limit'))} mg).";
            $ar[] = "الحصة الواحدة تقدم {$this->fmt($sodiumPerServing)} مجم صوديوم (الحد اليومي للجمعية الأمريكية للقلب {$this->fmt(config('nutrition.daily.sodium_mg.limit'))} مجم).";
        }
        if ($food->fiber_g !== null && $food->fiber_g >= $bands['fiber_g']['high']) {
            $en[] = "High fiber ({$this->fmt($food->fiber_g)} g/100 g) supports heart-healthy eating patterns.";
            $ar[] = "الألياف المرتفعة ({$this->fmt($food->fiber_g)} جم/١٠٠ جم) تدعم أنماط الأكل الصحية للقلب.";
        }
        if ($this->isFriedPreparation($food)) {
            $en[] = 'This item is fried — frying fats are best limited in heart-healthy eating.';
            $ar[] = 'هذا الصنف مقلي — يُفضَّل تقليل دهون القلي في النمط الغذائي الصحي للقلب.';
        }

        $verdicts = [];
        if ($satBand === 'high') {
            $verdicts[] = 'moderation';
        }
        if ($sodiumBand === 'high') {
            $verdicts[] = 'moderation';
        }
        if ($satPerServing !== null && $satPerServing >= config('nutrition.daily.sat_fat_g.limit') * 0.5) {
            $verdicts[] = 'not_recommended';
        }
        if ($sodiumPerServing !== null && $sodiumPerServing >= config('nutrition.daily.sodium_mg.limit') * 0.5) {
            $verdicts[] = 'not_recommended';
        }

        $verdict = $verdicts === []
            ? (($satBand === 'low' && $sodiumBand === 'low') ? 'good' : 'acceptable')
            : $this->worst(array_merge(['acceptable'], $verdicts));

        return [
            'condition' => $this->slug(),
            'verdict' => $verdict,
            'reasons' => $locale === 'ar' ? $ar : $en,
            'warnings' => [],
        ];
    }
}
