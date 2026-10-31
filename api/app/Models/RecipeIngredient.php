<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeIngredient extends Model
{
    public $timestamps = false;

    protected $fillable = ['recipe_id', 'food_id', 'quantity_g', 'note_en', 'note_ar'];

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }

    public function food()
    {
        return $this->belongsTo(Food::class);
    }
}
