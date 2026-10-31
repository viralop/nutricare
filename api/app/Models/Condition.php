<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Condition extends Model
{
    protected $fillable = ['slug', 'name_en', 'name_ar', 'description_en', 'description_ar'];

    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    public function localizedName(string $locale): string
    {
        return $locale === 'ar' ? $this->name_ar : $this->name_en;
    }
}
