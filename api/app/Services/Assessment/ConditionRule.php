<?php

namespace App\Services\Assessment;

use App\Models\Food;

/**
 * Shared helpers for condition rules. All thresholds come from config/nutrition.php
 * and each reason string cites the nutrient value against the published band/limit.
 */
abstract class ConditionRule
{
    abstract public function slug(): string;

    abstract public function assess(Food $food, string $locale): array;

    /** @var array<string, class-string<ConditionRule>> */
    public const REGISTRY = [
        'diabetes_t1' => DiabetesRule::class,
        'diabetes_t2' => DiabetesRule::class,
        'hypertension' => HypertensionRule::class,
        'high_cholesterol' => CholesterolRule::class,
        'heart_disease' => HeartDiseaseRule::class,
        'obesity' => ObesityRule::class,
        'general_wellness' => WellnessRule::class,
    ];

    protected function band(?float $value, float $low, float $high): string
    {
        if ($value === null) {
            return 'unknown';
        }
        if ($value <= $low) {
            return 'low';
        }

        return $value > $high ? 'high' : 'mid';
    }

    protected function servingValue(Food $food, string $field): ?float
    {
        return $food->{$field} === null ? null : round($food->{$field} * $food->serving_size_g / 100, 1);
    }

    protected function fmt(?float $v): string
    {
        return $v === null ? '?' : rtrim(rtrim(number_format($v, 1, '.', ''), '0'), '.');
    }

    public static function worst(array $verdicts): string
    {
        $severity = config('nutrition.verdict_severity');
        $worst = 'good';
        foreach ($verdicts as $v) {
            if (($severity[$v] ?? 0) >= ($severity[$worst] ?? 0)) {
                $worst = $v;
            }
        }

        return $worst;
    }

    protected function isFriedPreparation(Food $food): bool
    {
        return (bool) preg_match('/fried|فريد|مقلي|مقرمش|محمرة|deep-fried/i', $food->name_en.' '.$food->name_ar);
    }
}
