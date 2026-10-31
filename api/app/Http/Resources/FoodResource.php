<?php

namespace App\Http\Resources;

use App\Models\Food;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FoodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = 'en';
        $qLocale = $request->input('locale') ?? $request->header('Accept-Language');
        if (is_string($qLocale) && str_starts_with($qLocale, 'ar')) {
            $locale = 'ar';
        }

        $per100 = [];
        foreach (Food::NUTRIENT_FIELDS as $field) {
            $per100[$field] = $this->{$field} === null ? null : (float) $this->{$field};
        }

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->localizedName($locale),
            'name_en' => $this->name_en,
            'name_ar' => $this->name_ar,
            'category' => $this->category,
            'cuisine' => $this->cuisine,
            'emoji' => $this->image_emoji,
            'image_url' => $this->image_url,
            'serving_size_g' => (float) $this->serving_size_g,
            'serving_label' => $this->localizedServingLabel($locale),
            'per_100g' => $per100,
            'per_serving' => $this->perServing(),
            'source' => [
                'type' => $this->source_type,
                'reference' => $this->source_reference,
                'url' => $this->source_url,
                'is_verified' => $this->is_verified,
                'is_estimated' => $this->isEstimated(),
            ],
        ];
    }
}
