<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\ConditionSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\FoodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssistantUnderstandingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([ConditionSeeder::class, FoodSeeder::class, ContentSeeder::class, DemoUserSeeder::class]);
    }

    protected function ask(string $message, string $locale = 'en'): string
    {
        $user = User::where('email', 'sara@nutricare.test')->first();
        $token = $user->createToken('t')->plainTextToken;

        return $this->withToken($token)
            ->postJson('/api/v1/assistant/chat', ['message' => $message, 'locale' => $locale])
            ->assertOk()
            ->json('data.reply');
    }

    /** Quantities are understood and scale the answer. */
    public function test_quantity_in_question_scales_answer(): void
    {
        $reply = $this->ask('How much sugar is in 3 dates?');
        // 1 medjool date ≈ 16 g sugars → 3 ≈ 48 g
        $this->assertStringContainsString('48', $reply);
        $this->assertStringContainsString('96%', $reply); // 48/50 WHO limit
    }

    /** Gram quantities convert across serving sizes. */
    public function test_gram_quantity_converts(): void
    {
        $reply = $this->ask('how much sodium in 200 g of domiati cheese');
        // 1500 mg/100 g × 2 = 3000 mg
        $this->assertStringContainsString('3000', $reply);
    }

    /** Arabic phrasing with definite article + natural word order. */
    public function test_arabic_natural_phrasing(): void
    {
        $reply = $this->ask('هل الأرز الأبيض مناسب لمريض السكر؟', 'ar');
        $this->assertStringContainsString('أرز أبيض', $reply);
        $this->assertStringContainsString('مقبول', $reply);
    }

    /** Comparison intent picks a winner. */
    public function test_comparison_intent(): void
    {
        $reply = $this->ask('brown rice or white rice, which is better?');
        $this->assertStringContainsString('Brown rice', $reply);
        $this->assertStringContainsString('better pick', $reply);
    }

    /** Concept questions are explained without any food present. */
    public function test_concept_question(): void
    {
        $reply = $this->ask('what is the difference between saturated fat and unsaturated fat?');
        $this->assertStringContainsString('Saturated fat', $reply);
        $this->assertStringContainsString('13 g', $reply);
    }

    /** Meal advice recommends real recipes for the asked slot. */
    public function test_meal_advice_intent(): void
    {
        $reply = $this->ask('What should I eat for breakfast?');
        $this->assertStringContainsString('breakfast', $reply);
        $this->assertStringContainsString('kcal/serving', $reply);
    }

    /** Alternatives intent works for foods without curated swaps (auto). */
    public function test_alternative_intent_auto_suggestions(): void
    {
        $reply = $this->ask('what can I eat instead of basbousa?');
        $this->assertStringContainsString('Swaps for Basbousa', $reply);
        $this->assertStringContainsString('Guava', $reply);
    }

    /** Conditions mentioned in the question contextualize the verdict. */
    public function test_condition_in_question(): void
    {
        // Omar has obesity+cholesterol; asking about hypertension should analyze for sodium.
        $user = User::where('email', 'omar@nutricare.test')->first();
        $token = $user->createToken('t')->plainTextToken;
        $reply = $this->withToken($token)
            ->postJson('/api/v1/assistant/chat', ['message' => 'is instant noodles okay with high blood pressure?', 'locale' => 'en'])
            ->assertOk()->json('data.reply');
        $this->assertStringContainsString('Not recommended', $reply);
    }

    /** Greetings get a warm, informative reply, not the fallback. */
    public function test_greeting(): void
    {
        $reply = $this->ask('hello');
        $this->assertStringContainsString('Welcome to NutriCare', $reply);
    }

    /**
     * Every suggestion chip must answer: feeding each returned suggestion
     * back through the assistant never lands on the fallback, chips rotate
     * (not one fixed list), and the just-asked question is never re-suggested.
     */
    public function test_suggestions_are_fresh_and_answerable(): void
    {
        $user = User::where('email', 'sara@nutricare.test')->first();
        $token = $user->createToken('t')->plainTextToken;

        $respond = function (string $message, string $locale = 'en') use ($token) {
            return $this->withToken($token)
                ->postJson('/api/v1/assistant/chat', ['message' => $message, 'locale' => $locale])
                ->assertOk()
                ->json('data');
        };

        foreach (['en' => 'Is koshari bad for diabetes?', 'ar' => 'هل البطاطس المحمرة مضرة للقلب؟'] as $locale => $seed) {
            $first = $respond($seed, $locale);

            $this->assertCount(3, $first['suggestions']);
            $this->assertNotEquals($seed, $first['suggestions'][0]);

            foreach ($first['suggestions'] as $chip) {
                $answer = $respond($chip, $locale)['reply'];
                $this->assertStringNotContainsString(
                    $locale === 'ar' ? 'لم أفهم السؤال' : "didn't quite catch",
                    $answer,
                    "Suggestion chip fell back: {$chip}",
                );
            }

            // Chips rotate: across several identical asks, at least one
            // suggestion set must differ (shuffle, not a fixed list).
            $varied = false;
            for ($i = 0; $i < 4 && ! $varied; $i++) {
                $again = $respond($seed, $locale);
                if ($again['suggestions'] !== $first['suggestions']) {
                    $varied = true;
                }
            }
            $this->assertTrue($varied, 'Suggestions never varied across repeated asks.');
        }
    }
}
