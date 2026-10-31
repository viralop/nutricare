<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Users: role + locale
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('user')->index(); // user|admin
            $table->string('locale', 5)->default('en');           // en|ar
        });

        Schema::create('conditions', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 40)->unique();
            $table->string('name_en');
            $table->string('name_ar');
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->timestamps();
        });

        Schema::create('condition_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('condition_id')->constrained()->cascadeOnDelete();
            $table->unique(['user_id', 'condition_id']);
        });

        Schema::create('health_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('age');
            $table->string('gender', 10)->nullable(); // male|female
            $table->decimal('height_cm', 5, 1);
            $table->decimal('weight_kg', 5, 1);
            $table->string('activity_level', 20)->default('moderate'); // sedentary|light|moderate|active|very_active
            $table->json('allergies')->nullable();
            $table->json('dietary_preferences')->nullable();
            $table->json('food_restrictions')->nullable();
            $table->unsignedInteger('daily_calorie_target')->nullable();
            $table->unsignedInteger('daily_water_target_ml')->default(2000);
            $table->timestamps();
        });

        Schema::create('foods', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 80)->unique();
            $table->string('name_en');
            $table->string('name_ar');
            $table->string('category', 20);  // grain|vegetable|fruit|meat|fish|dairy|legume|dish|drink|snack|sweet|packaged|sauce|fat|nut
            $table->string('cuisine', 20);   // egyptian|sudanese|arab|international
            // Nutrients per 100 g (or 100 ml) — NULL means "no data", never zero.
            $table->decimal('energy_kcal', 6, 1)->nullable();
            $table->decimal('carbohydrate_g', 6, 1)->nullable();
            $table->decimal('sugar_g', 6, 1)->nullable();
            $table->decimal('protein_g', 6, 1)->nullable();
            $table->decimal('total_fat_g', 6, 1)->nullable();
            $table->decimal('sat_fat_g', 6, 1)->nullable();
            $table->decimal('sodium_mg', 7, 1)->nullable();
            $table->decimal('fiber_g', 6, 1)->nullable();
            $table->decimal('serving_size_g', 6, 1);
            $table->string('serving_label_en', 60);
            $table->string('serving_label_ar', 60);
            $table->string('source_type', 25)->default('usda'); // usda|regional_estimate|brand_label
            $table->string('source_reference', 255)->nullable();
            $table->string('source_url', 255)->nullable();
            $table->boolean('is_verified')->default(false);
            $table->string('status', 10)->default('published'); // published|draft
            $table->string('image_emoji', 8)->default('🍽️');
            $table->timestamps();
        });

        Schema::create('food_aliases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_id')->constrained('foods')->cascadeOnDelete();
            $table->string('alias', 80)->index();
        });

        Schema::create('food_alternatives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_id')->constrained('foods')->cascadeOnDelete();
            $table->foreignId('alternative_food_id')->constrained('foods')->cascadeOnDelete();
            $table->text('reason_en');
            $table->text('reason_ar');
            $table->string('suggested_serving_en', 120)->nullable();
            $table->string('suggested_serving_ar', 120)->nullable();
            $table->unsignedTinyInteger('priority')->default(0);
            $table->timestamps();
        });

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 80)->unique();
            $table->string('title_en');
            $table->string('title_ar');
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->string('meal_type', 12); // breakfast|lunch|dinner|snack
            $table->unsignedTinyInteger('servings')->default(1);
            $table->json('steps_en');
            $table->json('steps_ar');
            // per-serving values, computed from ingredients (estimated)
            $table->decimal('energy_kcal', 6, 1)->nullable();
            $table->decimal('carbohydrate_g', 6, 1)->nullable();
            $table->decimal('sugar_g', 6, 1)->nullable();
            $table->decimal('protein_g', 6, 1)->nullable();
            $table->decimal('total_fat_g', 6, 1)->nullable();
            $table->decimal('sat_fat_g', 6, 1)->nullable();
            $table->decimal('sodium_mg', 7, 1)->nullable();
            $table->decimal('fiber_g', 6, 1)->nullable();
            $table->string('cost_level', 10)->default('medium'); // low|medium|high
            $table->unsignedSmallInteger('minutes')->default(20);
            $table->json('suitable_conditions')->nullable(); // condition slugs
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('food_id')->nullable()->constrained('foods')->nullOnDelete();
            $table->decimal('quantity_g', 7, 1);
            $table->string('note_en', 120)->nullable();
            $table->string('note_ar', 120)->nullable();
        });

        Schema::create('meal_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('week_start_date'); // Monday
            $table->timestamps();
        });

        Schema::create('meal_plan_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_plan_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('meal_slot', 12); // breakfast|lunch|dinner|snack
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->unique(['meal_plan_id', 'date', 'meal_slot']);
        });

        Schema::create('food_analysis_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('food_id')->constrained('foods')->cascadeOnDelete();
            $table->string('verdict', 20);
            $table->string('locale', 5)->default('en');
            $table->timestamp('created_at')->index();
        });

        Schema::create('meal_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('food_id')->constrained('foods')->cascadeOnDelete();
            $table->string('meal_slot', 12);
            $table->decimal('quantity_servings', 5, 2)->default(1);
            $table->date('logged_date')->index();
            $table->timestamp('created_at');
        });

        Schema::create('water_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount_ml');
            $table->date('logged_date')->index();
            $table->timestamp('created_at');
        });

        Schema::create('chat_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5)->default('en');
            $table->timestamps();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_session_id')->constrained()->cascadeOnDelete();
            $table->string('role', 12); // user|assistant
            $table->text('content');
            $table->boolean('blocked')->default(false);
            $table->timestamp('created_at');
        });

        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 90)->unique();
            $table->string('category', 20); // diabetes|hypertension|cholesterol|heart|obesity|general|cooking|labels|myths
            $table->string('title_en');
            $table->string('title_ar');
            $table->text('excerpt_en')->nullable();
            $table->text('excerpt_ar')->nullable();
            $table->longText('body_en'); // markdown
            $table->longText('body_ar'); // markdown
            $table->json('sources'); // [{label,url}]
            $table->unsignedTinyInteger('read_minutes')->default(5);
            $table->boolean('is_published')->default(true);
            $table->boolean('reviewed_by_admin')->default(false);
            $table->timestamps();
        });

        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('water_reminders')->default(true);
            $table->boolean('meal_reminders')->default(true);
            $table->boolean('daily_tips')->default(true);
            $table->boolean('weekly_summary')->default(true);
            $table->boolean('plan_reminders')->default(true);
            $table->time('quiet_hours_start')->nullable();
            $table->time('quiet_hours_end')->nullable();
            $table->timestamps();
        });

        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('message');
            $table->string('category', 40)->nullable();
            $table->string('status', 12)->default('new'); // new|reviewed|closed
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('articles');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_sessions');
        Schema::dropIfExists('water_logs');
        Schema::dropIfExists('meal_logs');
        Schema::dropIfExists('food_analysis_logs');
        Schema::dropIfExists('meal_plan_entries');
        Schema::dropIfExists('meal_plans');
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('food_alternatives');
        Schema::dropIfExists('food_aliases');
        Schema::dropIfExists('foods');
        Schema::dropIfExists('health_profiles');
        Schema::dropIfExists('condition_user');
        Schema::dropIfExists('conditions');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'locale']);
        });
    }
};
