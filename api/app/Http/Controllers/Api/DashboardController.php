<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FoodResource;
use App\Models\Food;
use App\Models\MealLog;
use App\Models\WaterLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $locale = $this->resolveLocale($request, $user);
        $date = $request->date('date')?->toDateString() ?? now()->toDateString();
        $profile = $user->profile;

        $mealLogs = MealLog::with('food')->where('user_id', $user->id)
            ->where('logged_date', $date)->get();

        $totals = [
            'energy_kcal' => 0.0, 'carbohydrate_g' => 0.0, 'sugar_g' => 0.0,
            'protein_g' => 0.0, 'total_fat_g' => 0.0, 'sat_fat_g' => 0.0,
            'sodium_mg' => 0.0, 'fiber_g' => 0.0,
        ];
        $meals = [];
        foreach ($mealLogs as $log) {
            $factor = $log->quantity_servings * $log->food->serving_size_g / 100;
            foreach ($totals as $field => $_) {
                $totals[$field] += ($log->food->{$field} ?? 0) * $factor;
            }
            $meals[] = [
                'id' => $log->id,
                'slot' => $log->meal_slot,
                'quantity_servings' => (float) $log->quantity_servings,
                'food' => new FoodResource($log->food),
            ];
        }
        $totals = array_map(fn ($v) => round($v, 1), $totals);

        $water = (int) WaterLog::where('user_id', $user->id)
            ->where('logged_date', $date)->sum('amount_ml');

        $recentAnalyses = $user->analysisLogs()->with('food')->latest()->limit(6)->get()
            ->map(fn ($log) => [
                'food' => new FoodResource($log->food),
                'verdict' => $log->verdict,
                'at' => $log->created_at?->toIso8601String(),
            ]);

        $targets = [
            'energy_kcal' => $profile?->daily_calorie_target ?? config('nutrition.daily.energy_kcal.default'),
            'sugar_g' => config('nutrition.daily.sugar_g.limit'),
            'sodium_mg' => config('nutrition.daily.sodium_mg.limit'),
            'sat_fat_g' => config('nutrition.daily.sat_fat_g.limit'),
            'water_ml' => $profile?->daily_water_target_ml ?? 2000,
        ];

        return response()->json([
            'data' => [
                'date' => $date,
                'totals' => $totals,
                'targets' => $targets,
                'water_ml' => $water,
                'meals' => $meals,
                'recent_analyses' => $recentAnalyses,
                'recommendations' => $this->recommendations($totals, $targets, $water, $locale),
            ],
        ]);
    }

    public function addMeal(Request $request): JsonResponse
    {
        $data = $request->validate([
            'food_id' => ['required', 'integer', 'exists:foods,id'],
            'meal_slot' => ['required', 'in:breakfast,lunch,dinner,snack'],
            'quantity_servings' => ['nullable', 'numeric', 'between:0.25,10'],
            'logged_date' => ['nullable', 'date'],
        ]);

        $log = MealLog::create([
            'user_id' => $request->user()->id,
            'food_id' => $data['food_id'],
            'meal_slot' => $data['meal_slot'],
            'quantity_servings' => $data['quantity_servings'] ?? 1,
            'logged_date' => $data['logged_date'] ?? now()->toDateString(),
            'created_at' => now(),
        ]);
        $log->load('food');

        return response()->json([
            'data' => [
                'id' => $log->id,
                'slot' => $log->meal_slot,
                'quantity_servings' => (float) $log->quantity_servings,
                'food' => new FoodResource($log->food),
            ],
        ], 201);
    }

    public function deleteMeal(Request $request, int $id): JsonResponse
    {
        MealLog::where('user_id', $request->user()->id)->where('id', $id)->firstOrFail()->delete();

        return response()->json(['message' => 'Meal log deleted.']);
    }

    public function addWater(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount_ml' => ['required', 'integer', 'between:50,2000'],
            'logged_date' => ['nullable', 'date'],
        ]);

        WaterLog::create([
            'user_id' => $request->user()->id,
            'amount_ml' => $data['amount_ml'],
            'logged_date' => $data['logged_date'] ?? now()->toDateString(),
            'created_at' => now(),
        ]);

        $total = (int) WaterLog::where('user_id', $request->user()->id)
            ->where('logged_date', $data['logged_date'] ?? now()->toDateString())->sum('amount_ml');

        return response()->json(['data' => ['total_ml' => $total]], 201);
    }

    protected function resolveLocale(Request $request, $user): string
    {
        $explicit = $request->input('locale');
        if (is_string($explicit) && in_array($explicit, ['en', 'ar'], true)) {
            return $explicit;
        }
        $header = (string) $request->header('Accept-Language', '');
        if (str_starts_with($header, 'ar')) {
            return 'ar';
        }
        if (str_starts_with($header, 'en')) {
            return 'en';
        }

        return $user->locale ?? 'en';
    }

    protected function recommendations(array $totals, array $targets, int $water, string $locale): array
    {
        $ar = $locale === 'ar';
        $out = [];
        if ($targets['energy_kcal'] > 0 && $totals['energy_kcal'] > $targets['energy_kcal']) {
            $out[] = $ar
                ? 'تجاوزت هدف السعرات اليومي — جرّب مشروبًا خفيفًا الليلة مثل سلطة أو زبادي.'
                : 'You have passed your daily calorie target — try a light option tonight such as a salad or yogurt.';
        }
        if ($totals['sugar_g'] > $targets['sugar_g'] * 0.8) {
            $out[] = $ar
                ? 'اقتربت من الحد اليومي للسكريات (٥٠ جم وفق منظمة الصحة العالمية) — اختر ماءً أو مشروبات بدون سكر.'
                : 'You are close to the daily free-sugar limit (50 g, WHO) — choose water or unsweetened drinks.';
        }
        if ($totals['sodium_mg'] > $targets['sodium_mg'] * 0.8) {
            $out[] = $ar
                ? 'صوديوم اليوم مرتفع — قلّل المخللات والأطعمة المصنعة في الوجبات القادمة (الحد اليومي ٢٣٠٠ مجم).'
                : 'Sodium is running high today — cut pickles and processed foods in upcoming meals (daily limit 2,300 mg).';
        }
        if ($water < $targets['water_ml'] * 0.6) {
            $out[] = $ar
                ? 'اشرب المزيد من الماء — لم تصل بعد إلى ٦٠٪ من هدفك اليومي.'
                : 'Drink more water — you have not yet reached 60% of your daily goal.';
        }
        if ($out === []) {
            $out[] = $ar
                ? 'أنت على مسار جيد اليوم — استمر وحلّل وجبتك القادمة قبل تناولها.'
                : 'You are on track today — keep going and analyze your next meal before eating.';
        }

        return $out;
    }
}
