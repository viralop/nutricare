<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    protected $fillable = [
        'slug', 'title_en', 'title_ar', 'description_en', 'description_ar',
        'meal_type', 'servings', 'steps_en', 'steps_ar',
        'energy_kcal', 'carbohydrate_g', 'sugar_g', 'protein_g',
        'total_fat_g', 'sat_fat_g', 'sodium_mg', 'fiber_g',
        'cost_level', 'minutes', 'suitable_conditions', 'is_published',
    ];

    protected function casts(): array
    {
        return [
            'steps_en' => 'array',
            'steps_ar' => 'array',
            'suitable_conditions' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function ingredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function localizedTitle(string $locale): string
    {
        return $locale === 'ar' ? $this->title_ar : $this->title_en;
    }
}
