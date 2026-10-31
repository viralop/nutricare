<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodAnalysisLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'food_id', 'verdict', 'locale', 'created_at'];

    public function food()
    {
        return $this->belongsTo(Food::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
