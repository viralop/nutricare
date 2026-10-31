<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthProfile extends Model
{
    protected $fillable = [
        'user_id', 'age', 'gender', 'height_cm', 'weight_kg', 'activity_level',
        'allergies', 'dietary_preferences', 'food_restrictions',
        'daily_calorie_target', 'daily_water_target_ml',
    ];

    protected function casts(): array
    {
        return [
            'allergies' => 'array',
            'dietary_preferences' => 'array',
            'food_restrictions' => 'array',
            'daily_calorie_target' => 'integer',
            'daily_water_target_ml' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mifflin-St Jeor estimate (kcal/day), rounded to the nearest 50.
     * Always presented to users as an editable estimate.
     */
    public function estimatedCalorieTarget(): int
    {
        $bmr = 10 * $this->weight_kg
            + 6.25 * $this->height_cm
            - 5 * $this->age
            + ($this->gender === 'male' ? 5 : -161);

        $factor = config("nutrition.activity_factors.{$this->activity_level}", 1.55);

        return (int) (round(($bmr * $factor) / 50) * 50);
    }
}
