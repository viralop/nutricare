<?php

namespace Tests\Feature;

use App\Models\Food;
use Database\Seeders\ConditionSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\FoodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutoAlternativesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([ConditionSeeder::class, FoodSeeder::class, ContentSeeder::class, DemoUserSeeder::class]);
    }

    /** A flagged sweet with no curated swap must return auto-suggestions lower in sugar. */
    public function test_bad_food_without_curated_alternative_gets_auto_suggestions(): void
    {
        // Basbousa: ~30 g sugars/serving, no curated alternative, wellness verdict not_recommended.
        $basbousa = Food::where('slug', 'basbousa')->firstOrFail();
        $this->assertCount(0, $basbousa->alternatives()->get());

        $res = $this->postJson('/api/v1/foods/analyze', ['slug' => 'basbousa', 'locale' => 'en']);
        $res->assertOk();

        $alts = $res->json('data.alternatives');
        $this->assertNotEmpty($alts, 'Auto alternatives must be generated for a flagged food.');
        $this->assertTrue($alts[0]['auto']);
        $this->assertStringContainsStringIgnoringCase('sugar', $alts[0]['reason']);
        // Every suggestion must actually be lower in sugar per serving than basbousa.
        $basSugar = $basbousa->perServing()['sugar_g'];
        foreach ($alts as $alt) {
            $this->assertLessThan($basSugar, $alt['food']['per_serving']['sugar_g']);
        }
    }

    /** Foods with a good verdict get no auto-suggestions. */
    public function test_good_food_gets_no_auto_suggestions(): void
    {
        $res = $this->postJson('/api/v1/foods/analyze', ['slug' => 'chickpeas-boiled', 'locale' => 'en']);
        $res->assertOk();
        $this->assertSame('good', $res->json('data.assessment.verdict'));
        $this->assertEmpty($res->json('data.alternatives'));
    }

    /** Curated alternatives still win over auto ones when present. */
    public function test_curated_alternatives_take_precedence(): void
    {
        $res = $this->postJson('/api/v1/foods/analyze', ['slug' => 'domiati-cheese', 'locale' => 'en']);
        $res->assertOk();
        $alts = collect($res->json('data.alternatives'));
        $this->assertTrue($alts->isNotEmpty());
        $this->assertTrue($alts->every(fn ($a) => $a['auto'] === false));
    }

    /** Arabic locale produces Arabic auto-suggestion reasons. */
    public function test_auto_reasons_are_localized(): void
    {
        $res = $this->postJson('/api/v1/foods/analyze', ['slug' => 'basbousa', 'locale' => 'ar']);
        $res->assertOk();
        $reason = $res->json('data.alternatives.0.reason');
        $this->assertStringContainsString('السكريات', $reason);
    }
}
