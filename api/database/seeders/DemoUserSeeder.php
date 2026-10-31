<?php

namespace Database\Seeders;

use App\Models\Condition;
use App\Models\HealthProfile;
use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@nutricare.test'],
            ['name' => 'NutriCare Admin', 'password' => 'admin1234!', 'role' => 'admin', 'locale' => 'en']
        );

        $sara = User::updateOrCreate(
            ['email' => 'sara@nutricare.test'],
            ['name' => 'Sara Hassan', 'password' => 'password1234', 'role' => 'user', 'locale' => 'ar']
        );

        HealthProfile::updateOrCreate(
            ['user_id' => $sara->id],
            [
                'age' => 47,
                'gender' => 'female',
                'height_cm' => 162,
                'weight_kg' => 78,
                'activity_level' => 'light',
                'allergies' => [],
                'dietary_preferences' => ['egyptian-cuisine'],
                'food_restrictions' => [],
                'daily_calorie_target' => 1650,
                'daily_water_target_ml' => 2000,
            ]
        );
        $sara->conditions()->sync(
            Condition::whereIn('slug', ['diabetes_t2', 'hypertension'])->pluck('id')
        );

        $omar = User::updateOrCreate(
            ['email' => 'omar@nutricare.test'],
            ['name' => 'Omar Ali', 'password' => 'password1234', 'role' => 'user', 'locale' => 'en']
        );
        HealthProfile::updateOrCreate(
            ['user_id' => $omar->id],
            [
                'age' => 34, 'gender' => 'male', 'height_cm' => 176, 'weight_kg' => 88,
                'activity_level' => 'sedentary', 'allergies' => ['peanuts'],
                'dietary_preferences' => [], 'food_restrictions' => [],
                'daily_calorie_target' => 2100, 'daily_water_target_ml' => 2500,
            ]
        );
        $omar->conditions()->sync(
            Condition::whereIn('slug', ['obesity', 'high_cholesterol'])->pluck('id')
        );

        foreach ([$admin->id, $sara->id, $omar->id] as $uid) {
            NotificationPreference::firstOrCreate(['user_id' => $uid]);
        }
    }
}
