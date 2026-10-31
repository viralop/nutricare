<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Food extends Model
{
    // "Food" is uncountable in Laravel's pluralizer; pin the table name.
    protected $table = 'foods';

    public const NUTRIENT_FIELDS = [
        'energy_kcal', 'carbohydrate_g', 'sugar_g', 'protein_g',
        'total_fat_g', 'sat_fat_g', 'sodium_mg', 'fiber_g',
    ];

    protected $fillable = [
        'slug', 'name_en', 'name_ar', 'category', 'cuisine',
        'energy_kcal', 'carbohydrate_g', 'sugar_g', 'protein_g',
        'total_fat_g', 'sat_fat_g', 'sodium_mg', 'fiber_g',
        'serving_size_g', 'serving_label_en', 'serving_label_ar',
        'source_type', 'source_reference', 'source_url',
        'is_verified', 'status', 'image_emoji',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'serving_size_g' => 'float',
        ];
    }

    public function aliases()
    {
        return $this->hasMany(FoodAlias::class);
    }

    public function analysisLogs()
    {
        return $this->hasMany(FoodAnalysisLog::class);
    }

    public function mealLogs()
    {
        return $this->hasMany(MealLog::class);
    }

    public function alternatives()
    {
        return $this->hasMany(FoodAlternative::class, 'food_id')->orderBy('priority');
    }

    public function localizedName(string $locale): string
    {
        return $locale === 'ar' ? $this->name_ar : $this->name_en;
    }

    public function localizedServingLabel(string $locale): string
    {
        return $locale === 'ar' ? $this->serving_label_ar : $this->serving_label_en;
    }

    public function isEstimated(): bool
    {
        return $this->source_type === 'regional_estimate';
    }

    /**
     * Nutrients scaled from per-100 g to one serving.
     */
    public function perServing(): array
    {
        $factor = $this->serving_size_g / 100.0;
        $out = [];
        foreach (self::NUTRIENT_FIELDS as $field) {
            $out[$field] = $this->{$field} === null ? null : round($this->{$field} * $factor, 1);
        }

        return $out;
    }
}
