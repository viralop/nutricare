<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConditionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();
        // Prefer explicit ?locale= / Accept-Language ar on the request.
        $qLocale = $request->input('locale') ?? $request->header('Accept-Language');
        if (is_string($qLocale) && str_starts_with($qLocale, 'ar')) {
            $locale = 'ar';
        }

        return [
            'slug' => $this->slug,
            'name' => $this->localizedName($locale),
            'description' => $locale === 'ar' ? $this->description_ar : $this->description_en,
        ];
    }
}
