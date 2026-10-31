<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MealLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'food_id', 'meal_slot', 'quantity_servings', 'logged_date', 'created_at'];

    public function food()
    {
        return $this->belongsTo(Food::class);
    }
}
