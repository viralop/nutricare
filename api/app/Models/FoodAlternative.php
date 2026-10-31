<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodAlternative extends Model
{
    protected $fillable = [
        'food_id', 'alternative_food_id', 'reason_en', 'reason_ar',
        'suggested_serving_en', 'suggested_serving_ar', 'priority',
    ];

    public function food()
    {
        return $this->belongsTo(Food::class, 'food_id');
    }

    public function alternativeFood()
    {
        return $this->belongsTo(Food::class, 'alternative_food_id');
    }
}
