// NutriCare API types — mirror api/app/Http/Resources.

export type NutrientKey =
  | 'energy_kcal'
  | 'carbohydrate_g'
  | 'sugar_g'
  | 'protein_g'
  | 'total_fat_g'
  | 'sat_fat_g'
  | 'sodium_mg'
  | 'fiber_g';

export type Nutrients = Record<NutrientKey, number | null>;

export interface Food {
  id: number;
  slug: string;
  name: string;
  name_en: string;
  name_ar: string;
  category: string;
  cuisine: string;
  emoji: string;
  image_url: string | null;
  serving_size_g: number;
  serving_label: string;
  per_100g: Nutrients;
  per_serving: Nutrients;
  source: {
    type: 'usda' | 'regional_estimate' | 'brand_label';
    reference: string | null;
    url: string | null;
    is_verified: boolean;
    is_estimated: boolean;
  };
}

export type Verdict = 'good' | 'acceptable' | 'moderation' | 'not_recommended';

export interface AssessmentEntry {
  condition: string;
  condition_name: string;
  verdict: Verdict;
  reasons: string[];
  warnings?: string[];
}

export interface Assessment {
  verdict: Verdict;
  assessments: AssessmentEntry[];
  warnings: string[];
  data_confidence: { level: 'verified' | 'estimated'; note: string };
}

export interface Alternative {
  food: Food;
  reason: string;
  suggested_serving: string | null;
  auto?: boolean;
  delta: Partial<Record<NutrientKey, number>>;
}

export interface Analysis {
  food: Food;
  assessment: Assessment;
  alternatives: Alternative[];
  disclaimer: string;
}

export interface Condition {
  slug: string;
  name: string;
  description: string | null;
}

export interface HealthProfile {
  age: number;
  gender: string | null;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  allergies: string[];
  dietary_preferences: string[];
  food_restrictions: string[];
  daily_calorie_target: number | null;
  daily_water_target_ml: number;
  bmi: number | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  locale: 'en' | 'ar';
  profile: HealthProfile | null;
  conditions: Condition[];
}

export interface DashboardSummary {
  date: string;
  totals: Nutrients;
  targets: {
    energy_kcal: number;
    sugar_g: number;
    sodium_mg: number;
    sat_fat_g: number;
    water_ml: number;
  };
  water_ml: number;
  meals: {
    id: number;
    slot: string;
    quantity_servings: number;
    food: Food;
  }[];
  recent_analyses: { food: Food; verdict: Verdict; at: string | null }[];
  recommendations: string[];
}

export interface Recipe {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  steps: string[];
  nutrition_per_serving: Nutrients;
  cost_level: 'low' | 'medium' | 'high';
  minutes: number;
  suitable_conditions: string[];
  ingredients?: { name: string; quantity_g: number; note: string | null }[];
}

export interface Article {
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  body?: string;
  sources: { label: string; url: string }[];
  read_minutes: number;
}

export interface MealPlanDay {
  [date: string]: {
    id: number;
    meal_slot: string;
    recipe: Recipe;
  }[];
}

export interface ChatReply {
  session_id: number;
  reply: string;
  blocked: boolean;
  suggestions: string[];
}

export interface NotificationPrefs {
  water_reminders: boolean;
  meal_reminders: boolean;
  daily_tips: boolean;
  weekly_summary: boolean;
  plan_reminders: boolean;
}
