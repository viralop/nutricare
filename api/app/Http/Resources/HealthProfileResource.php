<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HealthProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'age' => $this->age,
            'gender' => $this->gender,
            'height_cm' => (float) $this->height_cm,
            'weight_kg' => (float) $this->weight_kg,
            'activity_level' => $this->activity_level,
            'allergies' => $this->allergies ?? [],
            'dietary_preferences' => $this->dietary_preferences ?? [],
            'food_restrictions' => $this->food_restrictions ?? [],
            'daily_calorie_target' => $this->daily_calorie_target,
            'daily_water_target_ml' => $this->daily_water_target_ml,
            'bmi' => $this->height_cm && $this->weight_kg
                ? round($this->weight_kg / (($this->height_cm / 100) ** 2), 1)
                : null,
        ];
    }
}
