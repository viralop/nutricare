<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodAlias extends Model
{
    public $timestamps = false;

    protected $fillable = ['food_id', 'alias'];

    public function food()
    {
        return $this->belongsTo(Food::class);
    }
}
