<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = [
        'slug', 'category', 'title_en', 'title_ar',
        'excerpt_en', 'excerpt_ar', 'body_en', 'body_ar',
        'sources', 'read_minutes', 'is_published', 'reviewed_by_admin',
    ];

    protected function casts(): array
    {
        return [
            'sources' => 'array',
            'is_published' => 'boolean',
            'reviewed_by_admin' => 'boolean',
        ];
    }
}
