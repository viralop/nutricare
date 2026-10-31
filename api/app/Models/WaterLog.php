<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaterLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'amount_ml', 'logged_date', 'created_at'];
}
