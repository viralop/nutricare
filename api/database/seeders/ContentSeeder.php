<?php

namespace Database\Seeders;

use App\Models\Food;
use App\Models\FoodAlternative;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use Illuminate\Database\Seeder;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedAlternatives();
        $this->seedRecipes();
    }

    protected function seedAlternatives(): void
    {
        $rows = require __DIR__.'/data/alternatives.php';

        foreach ($rows as [$foodSlug, $altSlug, $reasonEn, $reasonAr, $servingEn, $servingAr, $priority]) {
            $food = Food::where('slug', $foodSlug)->first();
            $alt = Food::where('slug', $altSlug)->first();
            if (! $food || ! $alt) {
                continue;
            }

            FoodAlternative::updateOrCreate(
                ['food_id' => $food->id, 'alternative_food_id' => $alt->id],
                [
                    'reason_en' => $reasonEn,
                    'reason_ar' => $reasonAr,
                    'suggested_serving_en' => $servingEn,
                    'suggested_serving_ar' => $servingAr,
                    'priority' => $priority,
                ]
            );
        }
    }

    protected function seedRecipes(): void
    {
        $rows = require __DIR__.'/data/recipes.php';

        foreach ($rows as [$slug, $titleEn, $titleAr, $mealType, $servings, $minutes, $cost, $conditions, $stepsEn, $stepsAr, $ingredients]) {
            // Estimate per-serving nutrition from ingredient rows (per 100 g values).
            $fields = Food::NUTRIENT_FIELDS;
            $totals = array_fill_keys($fields, 0.0);
            $ingredientRows = [];
            foreach ($ingredients as [$foodSlug, $grams, $noteEn, $noteAr]) {
                $food = Food::where('slug', $foodSlug)->first();
                if (! $food) {
                    continue;
                }
                $ingredientRows[] = [
                    'food_id' => $food->id,
                    'quantity_g' => $grams,
                    'note_en' => $noteEn,
                    'note_ar' => $noteAr,
                ];
                $factor = $grams / 100;
                foreach ($fields as $field) {
                    $totals[$field] += ($food->{$field} ?? 0) * $factor;
                }
            }

            $perServing = array_map(
                fn ($v) => round($v / max(1, $servings), 1),
                $totals
            );

            $recipe = Recipe::updateOrCreate(
                ['slug' => $slug],
                [
                    'title_en' => $titleEn,
                    'title_ar' => $titleAr,
                    'description_en' => 'Estimated nutrition computed from ingredient data; actual values vary with preparation.',
                    'description_ar' => 'قيم غذائية تقديرية محسوبة من بيانات المكونات؛ تتغير القيم الفعلية حسب التحضير.',
                    'meal_type' => $mealType,
                    'servings' => $servings,
                    'steps_en' => $stepsEn,
                    'steps_ar' => $stepsAr,
                    'energy_kcal' => $perServing['energy_kcal'],
                    'carbohydrate_g' => $perServing['carbohydrate_g'],
                    'sugar_g' => $perServing['sugar_g'],
                    'protein_g' => $perServing['protein_g'],
                    'total_fat_g' => $perServing['total_fat_g'],
                    'sat_fat_g' => $perServing['sat_fat_g'],
                    'sodium_mg' => $perServing['sodium_mg'],
                    'fiber_g' => $perServing['fiber_g'],
                    'cost_level' => $cost,
                    'minutes' => $minutes,
                    'suitable_conditions' => $conditions,
                    'is_published' => true,
                ]
            );

            $recipe->ingredients()->delete();
            foreach ($ingredientRows as $row) {
                $row['recipe_id'] = $recipe->id;
                RecipeIngredient::create($row);
            }
        }
    }
}
