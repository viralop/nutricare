<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MealPlanEntry extends Model
{
    public $timestamps = false;

    protected $fillable = ['meal_plan_id', 'date', 'meal_slot', 'recipe_id'];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    public function mealPlan()
    {
        return $this->belongsTo(MealPlan::class);
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }
}
