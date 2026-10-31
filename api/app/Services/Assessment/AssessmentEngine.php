<?php

namespace App\Services\Assessment;

use App\Models\Condition;
use App\Models\Food;
use Illuminate\Support\Collection;

/**
 * Runs every selected condition rule against a food and aggregates the result.
 * The overall verdict is the MOST SEVERE across the user's conditions, so the
 * same food legitimately receives different assessments for different people.
 */
class AssessmentEngine
{
    /**
     * @param  Collection<int, Condition>  $conditions
     * @return array{
     *   verdict: string,
     *   assessments: array<int, array{condition: string, condition_name: string, verdict: string, reasons: string[], warnings: array<string[]>}>,
     *   warnings: string[],
     *   data_confidence: array{level: string, note: string}
     * }
     */
    public function assess(Food $food, Collection $conditions, string $locale = 'en'): array
    {
        $assessments = [];
        $usedRules = [];

        foreach ($conditions as $condition) {
            $ruleClass = ConditionRule::REGISTRY[$condition->slug] ?? WellnessRule::class;
            // Both diabetes types share one rule; avoid duplicated output when both selected.
            $ruleKey = $ruleClass;
            if (in_array($ruleKey, $usedRules)) {
                continue;
            }
            $usedRules[] = $ruleKey;

            $rule = new $ruleClass;
            $result = $rule->assess($food, $locale);
            $result['condition'] = $condition->slug;
            $result['condition_name'] = $condition->localizedName($locale);
            $assessments[] = $result;
        }

        if ($assessments === []) {
            $rule = new WellnessRule;
            $result = $rule->assess($food, $locale);
            $result['condition_name'] = $locale === 'ar' ? 'صحة عامة' : 'General wellness';
            $assessments[] = $result;
        }

        $verdicts = array_map(fn ($a) => $a['verdict'], $assessments);

        $warnings = [];
        foreach ($assessments as $a) {
            foreach ($a['warnings'] ?? [] as $w) {
                $warnings[$w] = $w;
            }
        }

        $hasNull = collect(Food::NUTRIENT_FIELDS)->contains(fn ($f) => $food->{$f} === null);
        $confidence = 'verified';
        $note = $locale === 'ar'
            ? 'القيم من قاعدة بيانات موثوقة.'
            : 'Values from a verified database entry.';
        if ($food->isEstimated() || $hasNull) {
            $confidence = 'estimated';
            $note = $locale === 'ar'
                ? 'قيم تقديرية من بيانات إقليمية منشورة — تختلف حسب طريقة التحضير، وقد تكون بعض العناصر غير متوفرة.'
                : 'Estimated values from published regional data — actual content varies with preparation; some nutrients may be missing.';
        }

        return [
            'verdict' => ConditionRule::worst($verdicts),
            'assessments' => $assessments,
            'warnings' => array_values($warnings),
            'data_confidence' => ['level' => $confidence, 'note' => $note],
        ];
    }
}
