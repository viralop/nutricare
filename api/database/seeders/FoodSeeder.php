<?php

namespace Database\Seeders;

use App\Models\Food;
use App\Models\FoodAlias;
use Illuminate\Database\Seeder;

class FoodSeeder extends Seeder
{
    public function run(): void
    {
        $foods = require __DIR__.'/data/foods.php';
        $images = is_file(__DIR__.'/data/food-images.php') ? require __DIR__.'/data/food-images.php' : [];

        foreach ($foods as $f) {
            $usdaQuery = trim(explode('—', $f['ref'])[1] ?? '');
            $food = Food::updateOrCreate(
                ['slug' => $f['slug']],
                [
                    'name_en' => $f['en'],
                    'name_ar' => $f['ar'],
                    'category' => $f['cat'],
                    'cuisine' => $f['cuisine'],
                    'energy_kcal' => $f['kcal'],
                    'carbohydrate_g' => $f['carb'],
                    'sugar_g' => $f['sugar'],
                    'protein_g' => $f['prot'],
                    'total_fat_g' => $f['fat'],
                    'sat_fat_g' => $f['sat'],
                    'sodium_mg' => $f['na'],
                    'fiber_g' => $f['fiber'],
                    'serving_size_g' => $f['serving'],
                    'serving_label_en' => $f['s_en'],
                    'serving_label_ar' => $f['s_ar'],
                    'source_type' => $f['src'] === 'usda' ? 'usda' : 'regional_estimate',
                    'source_reference' => $f['ref'],
                    'source_url' => ($f['src'] === 'usda' && $usdaQuery !== '')
                        ? 'https://fdc.nal.usda.gov/fdc-app.html#/food-search?query='.rawurlencode($usdaQuery)
                        : null,
                    'is_verified' => $f['src'] === 'usda',
                    'status' => 'published',
                    'image_emoji' => $f['emoji'],
                    'image_url' => $images[$f['slug']] ?? null,
                ]
            );

            $aliases = array_merge($f['aliases'] ?? [], [$f['en'], $f['ar']]);
            foreach (array_unique($aliases) as $alias) {
                FoodAlias::firstOrCreate(['food_id' => $food->id, 'alias' => $alias]);
            }
        }
    }
}
