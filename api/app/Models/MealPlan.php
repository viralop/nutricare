<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MealPlan extends Model
{
    protected $fillable = ['user_id', 'week_start_date'];

    protected function casts(): array
    {
        return ['week_start_date' => 'date'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function entries()
    {
        return $this->hasMany(MealPlanEntry::class)->orderBy('date')->orderBy('meal_slot');
    }
}
