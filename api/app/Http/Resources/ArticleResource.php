<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = 'en';
        $qLocale = $request->input('locale') ?? $request->header('Accept-Language');
        if (is_string($qLocale) && str_starts_with($qLocale, 'ar')) {
            $locale = 'ar';
        }
        $full = $this->resource->exists && $request->routeIs('articles.show');

        return [
            'slug' => $this->slug,
            'category' => $this->category,
            'title' => $locale === 'ar' ? $this->title_ar : $this->title_en,
            'excerpt' => $locale === 'ar' ? $this->excerpt_ar : $this->excerpt_en,
            'body' => $this->when($full, $locale === 'ar' ? $this->body_ar : $this->body_en),
            'sources' => $this->sources ?? [],
            'read_minutes' => $this->read_minutes,
        ];
    }
}
