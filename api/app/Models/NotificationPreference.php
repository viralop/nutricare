<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id', 'water_reminders', 'meal_reminders', 'daily_tips',
        'weekly_summary', 'plan_reminders', 'quiet_hours_start', 'quiet_hours_end',
    ];

    protected function casts(): array
    {
        return [
            'water_reminders' => 'boolean',
            'meal_reminders' => 'boolean',
            'daily_tips' => 'boolean',
            'weekly_summary' => 'boolean',
            'plan_reminders' => 'boolean',
        ];
    }
}
