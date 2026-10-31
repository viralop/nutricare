<?php

namespace Database\Seeders;

use App\Models\Article;
use Illuminate\Database\Seeder;

class ArticleSeeder extends Seeder
{
    public function run(): void
    {
        $rows = require __DIR__.'/data/articles.php';

        foreach ($rows as [$slug, $category, $titleEn, $titleAr, $excerptEn, $excerptAr, $bodyEn, $bodyAr, $sources, $minutes]) {
            Article::updateOrCreate(
                ['slug' => $slug],
                [
                    'category' => $category,
                    'title_en' => $titleEn,
                    'title_ar' => $titleAr,
                    'excerpt_en' => $excerptEn,
                    'excerpt_ar' => $excerptAr,
                    'body_en' => $bodyEn,
                    'body_ar' => $bodyAr,
                    'sources' => $sources,
                    'read_minutes' => $minutes,
                    'is_published' => true,
                    'reviewed_by_admin' => true,
                ]
            );
        }
    }
}
