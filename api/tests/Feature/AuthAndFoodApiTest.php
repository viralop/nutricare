<?php

namespace Tests\Feature;

use App\Models\Condition;
use App\Models\User;
use Database\Seeders\ConditionSeeder;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\FoodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthAndFoodApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([ConditionSeeder::class, FoodSeeder::class, DemoUserSeeder::class]);
    }

    public function test_guest_can_search_foods_in_arabic_and_transliteration(): void
    {
        $arabic = $this->getJson('/api/v1/foods?q='.rawurlencode('كشري'));
        $arabic->assertOk();
        $this->assertTrue($arabic->json('data.0.slug') === 'koshari' || collect($arabic->json('data'))->contains(fn ($f) => $f['slug'] === 'koshari'));

        $translit = $this->getJson('/api/v1/foods?q=kushari');
        $translit->assertOk();
        $this->assertTrue(collect($translit->json('data'))->contains(fn ($f) => $f['slug'] === 'koshari'));
    }

    public function test_register_creates_profile_with_computed_targets(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'profile' => [
                'age' => 30,
                'gender' => 'male',
                'height_cm' => 180,
                'weight_kg' => 80,
                'activity_level' => 'moderate',
                'conditions' => ['diabetes_t2'],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'profile', 'conditions']]);

        $this->assertSame('diabetes_t2', $response->json('user.conditions.0.slug'));
        $this->assertNotNull($response->json('user.profile.daily_calorie_target'));
        $this->assertGreaterThan(1500, $response->json('user.profile.daily_calorie_target'));
    }

    public function test_registration_validation_errors(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'x', 'email' => 'not-an-email', 'password' => 'short',
            'password_confirmation' => 'nope',
            'profile' => ['age' => 300, 'height_cm' => 50, 'weight_kg' => 20, 'activity_level' => 'bananas'],
        ])->assertStatus(422)->assertJsonValidationErrors([
            'email', 'password', 'profile.age', 'profile.height_cm', 'profile.weight_kg', 'profile.activity_level',
        ]);
    }

    public function test_analysis_is_personalized_by_conditions(): void
    {
        // Guest request first: wellness-only analysis, no per-condition verdicts
        $guest = $this->postJson('/api/v1/foods/analyze', ['slug' => 'domiati-cheese']);
        $guest->assertOk();
        $this->assertSame('general_wellness', $guest->json('data.assessment.assessments.0.condition'));

        // The guard caches the (null) guest user between requests in tests — reset it.
        $this->app->make('auth')->forgetGuards();

        // Login as sara (diabetes_t2 + hypertension)
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'sara@nutricare.test',
            'password' => 'password1234',
        ]);
        $token = $login->json('token');
        $this->app->make('auth')->forgetGuards();

        $response = $this->withToken($token)
            ->postJson('/api/v1/foods/analyze', ['slug' => 'domiati-cheese', 'locale' => 'en']);
        $response->assertOk();

        $slugs = collect($response->json('data.assessment.assessments'))->pluck('condition');
        $this->assertContains('hypertension', $slugs);
        $this->assertContains('diabetes_t2', $slugs);
    }

    public function test_analysis_history_is_logged_for_users(): void
    {
        $user = User::where('email', 'sara@nutricare.test')->first();
        $token = $user->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/foods/analyze', ['slug' => 'white-bread'])->assertOk();

        $summary = $this->withToken($token)->getJson('/api/v1/dashboard/summary');
        $summary->assertOk();

        $this->assertTrue(collect($summary->json('data.recent_analyses'))->contains(fn ($a) => $a['food']['slug'] === 'white-bread'));
    }

    public function test_admin_endpoints_require_admin_role(): void
    {
        $user = User::where('email', 'sara@nutricare.test')->first();
        $token = $user->createToken('t')->plainTextToken;
        $this->withToken($token)->getJson('/api/v1/admin/stats')->assertForbidden();

        // Sanctum guard caches the resolved user between test requests — reset it.
        $this->app->make('auth')->forgetGuards();

        $admin = User::where('email', 'admin@nutricare.test')->first();
        $adminToken = $admin->createToken('t')->plainTextToken;
        $this->withToken($adminToken)->getJson('/api/v1/admin/stats')->assertOk()
            ->assertJsonStructure(['data' => ['users', 'foods', 'analyses', 'top_foods']]);
    }

    public function test_assistant_blocks_medication_questions(): void
    {
        $user = User::where('email', 'sara@nutricare.test')->first();
        $token = $user->createToken('t')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/assistant/chat', [
            'message' => 'Should I increase my insulin dose after eating koshari?',
            'locale' => 'en',
        ]);
        $response->assertOk();
        $this->assertTrue($response->json('data.blocked'));
        $this->assertStringContainsString("can't give any guidance about medications", $response->json('data.reply'));
    }

    public function test_assistant_answers_sugar_question_with_db_value(): void
    {
        $user = User::where('email', 'sara@nutricare.test')->first();
        $token = $user->createToken('t')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/assistant/chat', [
            'message' => 'How much sugar is in dates?',
            'locale' => 'en',
        ]);
        $response->assertOk();
        $this->assertStringContainsString('dates', $response->json('data.reply'));
        $this->assertStringContainsString('66.5 g per 100 g', $response->json('data.reply'));
    }

    public function test_compare_endpoint_returns_both_foods(): void
    {
        $response = $this->postJson('/api/v1/foods/compare', [
            'slugs' => ['white-bread', 'baladi-bread'],
        ]);
        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }
}
