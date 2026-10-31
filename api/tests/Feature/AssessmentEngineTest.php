<?php

namespace Tests\Feature;

use App\Models\Condition;
use App\Models\Food;
use App\Services\Assessment\AssessmentEngine;
use Database\Seeders\ConditionSeeder;
use Database\Seeders\FoodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssessmentEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ConditionSeeder::class);
        $this->seed(FoodSeeder::class);
    }

    /** The same food must yield different verdicts for different conditions. */
    public function test_dates_are_worse_for_diabetes_than_hypertension(): void
    {
        $engine = app(AssessmentEngine::class);
        $dates = Food::where('slug', 'dates-medjool')->firstOrFail();

        $diabetes = Condition::whereIn('slug', ['diabetes_t2'])->get();
        $hypertension = Condition::whereIn('slug', ['hypertension'])->get();

        $forDiabetes = $engine->assess($dates, $diabetes, 'en');
        $forHypertension = $engine->assess($dates, $hypertension, 'en');

        $severity = config('nutrition.verdict_severity');
        $this->assertGreaterThan(
            $severity[$forHypertension['verdict']],
            $severity[$forDiabetes['verdict']],
            "Dates should rate worse for diabetes ({$forDiabetes['verdict']}) than hypertension ({$forHypertension['verdict']})."
        );
    }

    /** Instant noodles carry ~1,170 mg sodium per pack — hard flag for hypertension. */
    public function test_high_sodium_food_not_recommended_for_hypertension(): void
    {
        $engine = app(AssessmentEngine::class);
        $noodles = Food::where('slug', 'instant-noodles')->firstOrFail();
        $conditions = Condition::whereIn('slug', ['hypertension'])->get();

        $result = $engine->assess($noodles, $conditions, 'en');

        $this->assertSame('not_recommended', $result['verdict']);
        $this->assertNotEmpty($result['warnings']);
    }

    /** Grilled chicken should be a good choice for cholesterol watchers. */
    public function test_grilled_chicken_good_for_cholesterol(): void
    {
        $engine = app(AssessmentEngine::class);
        $chicken = Food::where('slug', 'grilled-chicken-breast')->firstOrFail();
        $conditions = Condition::whereIn('slug', ['high_cholesterol'])->get();

        $result = $engine->assess($chicken, $conditions, 'en');

        $this->assertSame('good', $result['verdict']);
    }

    /** Overall verdict = most severe across multiple conditions. */
    public function test_overall_verdict_is_most_severe(): void
    {
        $engine = app(AssessmentEngine::class);
        $instantNoodles = Food::where('slug', 'instant-noodles')->firstOrFail();
        $conditions = Condition::whereIn('slug', ['diabetes_t2', 'hypertension'])->get();

        $result = $engine->assess($instantNoodles, $conditions, 'en');
        $this->assertSame('not_recommended', $result['verdict']);
        // One assessment per distinct rule: diabetes rule + hypertension rule.
        $this->assertCount(2, $result['assessments']);
    }

    /** Both diabetes types map to the same rule — no duplicated output. */
    public function test_both_diabetes_types_share_one_assessment(): void
    {
        $engine = app(AssessmentEngine::class);
        $cheese = Food::where('slug', 'domiati-cheese')->firstOrFail();
        $conditions = Condition::whereIn('slug', ['diabetes_t1', 'diabetes_t2'])->get();

        $result = $engine->assess($cheese, $conditions, 'en');
        $this->assertCount(1, $result['assessments']);
    }

    /** Guest users fall back to general wellness analysis. */
    public function test_no_conditions_uses_general_wellness(): void
    {
        $engine = app(AssessmentEngine::class);
        // Chickpeas: every band low + high fiber → good under wellness.
        $chickpeas = Food::where('slug', 'chickpeas-boiled')->firstOrFail();

        $result = $engine->assess($chickpeas, collect(), 'en');

        $this->assertSame('general_wellness', $result['assessments'][0]['condition']);
        $this->assertSame('good', $result['verdict']);
    }

    /** Estimated foods must surface a data-confidence note. */
    public function test_estimated_food_flags_uncertainty(): void
    {
        $engine = app(AssessmentEngine::class);
        $koshari = Food::where('slug', 'koshari')->firstOrFail();

        $result = $engine->assess($koshari, collect(), 'en');

        $this->assertSame('estimated', $result['data_confidence']['level']);
        $this->assertStringContainsString('Estimated', $result['data_confidence']['note']);
    }

    /** Arabic locale returns Arabic reasons. */
    public function test_arabic_reasons(): void
    {
        $engine = app(AssessmentEngine::class);
        $cheese = Food::where('slug', 'instant-noodles')->firstOrFail();
        $conditions = Condition::whereIn('slug', ['hypertension'])->get();

        $result = $engine->assess($cheese, $conditions, 'ar');

        $this->assertStringContainsString('صوديوم', implode(' ', $result['assessments'][0]['reasons']));
    }
}
