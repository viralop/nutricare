<?php

/**
 * NutriCare guideline thresholds.
 *
 * Every threshold carries its published source. Verdict reasons cite these values,
 * so nothing in the assessment engine is an invented number. Per-100 g bands follow
 * the UK front-of-pack traffic-light standard; per-day limits come from WHO/AHA.
 */
return [

    'sources' => [
        'fsa' => 'UK FSA front-of-pack traffic light bands (per 100 g)',
        'who_sugar' => 'WHO — free sugars < 10% of energy (≈50 g/day at 2,000 kcal)',
        'aha_sodium' => 'AHA — sodium < 2,300 mg/day, ideal 1,500 mg/day',
        'aha_satfat' => 'AHA — saturated fat < 13 g/day (2,000 kcal diet)',
        'ada_carb' => 'ADA Standards of Care — carbohydrate amount is individualized; common meal range 45–60 g',
        'cdc_energy' => 'CDC / energy-density literature (Rolls) — ≤1.5 low, 1.5–4 moderate, ≥4 high kcal/g',
    ],

    // ---- UK FSA traffic-light bands, per 100 g ----
    'bands_per_100g' => [
        'sugars_g' => ['low' => 5.0, 'high' => 22.5],
        'fat_g' => ['low' => 3.0, 'high' => 17.5],
        'sat_fat_g' => ['low' => 1.5, 'high' => 5.0],
        'sodium_mg' => ['low' => 120, 'high' => 600],
        'fiber_g' => ['high' => 6.0], // EU "high in fibre" ≥ 6 g/100 g
    ],

    // ---- Daily limits used to contextualize per-serving values ----
    'daily' => [
        'sugar_g' => ['limit' => 50.0, 'source' => 'who_sugar'],   // <10% of 2,000 kcal
        'sodium_mg' => ['limit' => 2300, 'ideal' => 1500, 'source' => 'aha_sodium'],
        'sat_fat_g' => ['limit' => 13.0, 'source' => 'aha_satfat'],
        'energy_kcal' => ['default' => 2000],
    ],

    // ---- Per-serving flags (relative to one serving) ----
    'per_serving' => [
        'sugar_high_g' => 15.0,    // ≈ 30% of WHO daily free-sugar limit in one serving
        'carb_meal_high_g' => 60,  // ADA common upper end of a meal carbohydrate range
        'carb_meal_moderate_g' => 45,
        'sodium_high_mg' => 766,   // ≈ ⅓ of AHA 2,300 mg daily limit
        'sat_fat_high_g' => 5.0,   // ≈ 38% of AHA daily limit
        'energy_dense_kcal' => 450,
    ],

    // ---- Energy density classes (kcal per 100 g) ----
    'energy_density' => [
        'low' => 1.5,
        'high' => 4.0,
        'source' => 'cdc_energy',
    ],

    // ---- Mifflin-St Jeor activity factors (calorie target estimate) ----
    'activity_factors' => [
        'sedentary' => 1.2,
        'light' => 1.375,
        'moderate' => 1.55,
        'active' => 1.725,
        'very_active' => 1.9,
    ],

    // ---- Verdict severity order (overall = most severe across conditions) ----
    'verdict_severity' => [
        'good' => 0,
        'acceptable' => 1,
        'moderation' => 2,
        'not_recommended' => 3,
    ],
];
