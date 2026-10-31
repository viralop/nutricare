<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IngredientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = 'en';
        $qLocale = $request->input('locale') ?? $request->header('Accept-Language');
        if (is_string($qLocale) && str_starts_with($qLocale, 'ar')) {
            $locale = 'ar';
        }

        return [
            'name' => $this->food
                ? $this->food->localizedName($locale)
                : ($locale === 'ar' ? $this->note_ar : $this->note_en),
            'quantity_g' => (float) $this->quantity_g,
            'note' => $locale === 'ar' ? $this->note_ar : $this->note_en,
        ];
    }
}
