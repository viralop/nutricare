# NutriCare Database Schema

All nutrients on `foods` and related tables are stored **per 100 g (or 100 ml)** — the
international standard for food composition tables — plus a `serving_size_g` used to
derive per-serving values in the assessment engine and UI.

## Entity relationship overview

```
users 1──1 health_profiles
users 1──* condition_user *──1 conditions            (multi-select)
users 1──* food_analysis_logs
users 1──* meal_logs / water_logs
users 1──* meal_plans 1──* meal_plan_entries ──? recipes / foods
users 1──* chat_sessions 1──* chat_messages
users 1──1 notification_preferences
users 1──* feedback

foods 1──* food_aliases
foods 1──* food_alternatives (food_id → alternative_food_id) *──1 foods
recipes 1──* recipe_ingredients *──1 foods
articles (standalone)
```

## Tables

### users
`id, name, email (unique), password, role enum(user|admin) default user,
locale enum(en|ar) default en, timestamps`

### health_profiles
`user_id (unique FK), age, gender nullable (male|female), height_cm, weight_kg,
activity_level enum(sedentary|light|moderate|active|very_active),
allergies json, dietary_preferences json, food_restrictions json,
daily_calorie_target int nullable, daily_water_target_ml int default 2000, timestamps`

Targets are computed at registration (Mifflin-St Jeor + activity factor, rounded) and
user-editable afterwards.

### conditions
`id, slug unique (diabetes_t1|diabetes_t2|hypertension|high_cholesterol|heart_disease|
obesity|general_wellness), name_en, name_ar, description_en, description_ar, timestamps`

### condition_user (pivot)
`condition_id, user_id`

### foods
`id, slug unique, name_en, name_ar, category (grain|vegetable|fruit|meat|fish|dairy|
legume|dish|drink|snack|sweet|packaged|sauce|fat|nut), cuisine (egyptian|sudanese|arab|
international), energy_kcal, carbohydrate_g, sugar_g, protein_g, total_fat_g, sat_fat_g,
sodium_mg, fiber_g, serving_size_g, serving_label_en, serving_label_ar,
source_type enum(usda|regional_estimate|brand_label), source_reference,
source_url nullable, is_verified bool, status enum(published|draft) default published,
image_emoji (lightweight placeholder instead of binary images), timestamps`

Nullable nutrient columns = "no data"; the analyzer surfaces that as uncertainty rather
than treating it as zero.

### food_aliases
`id, food_id FK, alias` — bilingual + transliteration search terms (كشري, koshari,
kushari, koshary).

### food_alternatives
`id, food_id FK, alternative_food_id FK, reason_en, reason_ar, suggested_serving_en,
suggested_serving_ar, priority int` — curated swaps (white bread → baladi wholemeal,
sugary drink → water, fried → grilled …).

### recipes
`id, slug unique, title_en, title_ar, description_en, description_ar, meal_type
(breakfast|lunch|dinner|snack), servings int, steps_en json (array), steps_ar json,
energy_kcal_per_serving, carbohydrate_g_per_serving, sugar_g_per_serving,
protein_g_per_serving, total_fat_g_per_serving, sat_fat_g_per_serving,
sodium_mg_per_serving, fiber_g_per_serving, cost_level (low|medium|high),
minutes int, suitable_conditions json (slugs), is_published bool, timestamps`

Per-serving values are computed from ingredient rows and labelled "estimated" in the UI.

### recipe_ingredients
`id, recipe_id FK, food_id nullable FK, quantity_g, note_en nullable, note_ar nullable`

### meal_plans / meal_plan_entries
- `meal_plans`: `user_id FK, week_start_date (Monday), timestamps`
- `meal_plan_entries`: `meal_plan_id FK, date, meal_slot enum(breakfast|lunch|dinner|snack),
recipe_id FK` — generated per user conditions/preferences, swappable.

### food_analysis_logs
`user_id nullable, food_id FK, verdict, locale, created_at` — search/analysis history.

### meal_logs
`user_id FK, food_id FK, meal_slot, quantity_servings decimal(5,2) default 1, logged_date,
created_at` — powers the dashboard's daily summary.

### water_logs
`user_id FK, amount_ml, logged_date, created_at`

### chat_sessions / chat_messages
- `chat_sessions`: `user_id FK, locale, created_at`
- `chat_messages`: `chat_session_id FK, role enum(user|assistant), content text,
blocked bool default false, created_at`

Schema exists now so the Phase-5 LLM provider plugs in without migrations.

### articles
`id, slug unique, category (diabetes|hypertension|cholesterol|heart|obesity|general|
cooking|labels|myths), title_en/ar, excerpt_en/ar, body_en/ar (markdown),
sources json (array of {label,url}), read_minutes, is_published, reviewed_by_admin bool,
timestamps`

### notification_preferences
`user_id unique FK, water_reminders bool, meal_reminders bool, daily_tips bool,
weekly_summary bool, plan_reminders bool, quiet_hours_start nullable,
quiet_hours_end nullable, timestamps`

### feedback
`user_id FK, message text, category nullable, status enum(new|reviewed|closed), timestamps`

## Seeding policy (no invented data)

- Items that exist in **USDA FoodData Central** use USDA values, `source_type=usda`,
  reference e.g. `USDA FDC 168874 (bread, white)` with search URL.
- Regional dishes absent from USDA are marked `source_type=regional_estimate` with an
  explicit reference to published regional composition data and `is_verified=false`;
  the UI shows an "estimated — varies by preparation" badge on those rows.
- Admins can correct values and flip `is_verified` from the admin dashboard.

## Guideline thresholds

Nutrient verdict thresholds live in `api/config/nutrition.php` — not in code — each with a
`source` note (UK FSA traffic-light bands per 100 g; WHO free-sugar <10 % energy; AHA
sodium ≤2,300 mg/day (ideal 1,500) and sat-fat <13 g/day; ADA "carbohydrate amount
individualized" notes; CDC/Rolls energy-density classes). See the file for exact values.
