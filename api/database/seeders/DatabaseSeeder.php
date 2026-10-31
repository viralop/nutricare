<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            ConditionSeeder::class,
            FoodSeeder::class,
            ContentSeeder::class,
            ArticleSeeder::class,
            DemoUserSeeder::class,
        ]);
    }
}
