<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecipeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = 'en';
        $qLocale = $request->input('locale') ?? $request->header('Accept-Language');
        if (is_string($qLocale) && str_starts_with($qLocale, 'ar')) {
            $locale = 'ar';
        }

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->localizedTitle($locale),
            'description' => $locale === 'ar' ? $this->description_ar : $this->description_en,
            'meal_type' => $this->meal_type,
            'servings' => $this->servings,
            'steps' => $locale === 'ar' ? $this->steps_ar : $this->steps_en,
            'nutrition_per_serving' => [
                'energy_kcal' => $this->energy_kcal,
                'carbohydrate_g' => $this->carbohydrate_g,
                'sugar_g' => $this->sugar_g,
                'protein_g' => $this->protein_g,
                'total_fat_g' => $this->total_fat_g,
                'sat_fat_g' => $this->sat_fat_g,
                'sodium_mg' => $this->sodium_mg,
                'fiber_g' => $this->fiber_g,
            ],
            'cost_level' => $this->cost_level,
            'minutes' => $this->minutes,
            'suitable_conditions' => $this->suitable_conditions ?? [],
            'ingredients' => IngredientResource::collection($this->whenLoaded('ingredients')),
        ];
    }
}
