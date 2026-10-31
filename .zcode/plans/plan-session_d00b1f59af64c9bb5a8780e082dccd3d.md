# NutriCare — Foundation + Core Loop (Phases 1–4 skeleton)

## Locked decisions
- **Backend:** Laravel 11 (PHP 8.3) REST API, Sanctum token auth, role-based access (user/admin).
- **Database:** SQLite for dev → PostgreSQL in prod (portable Eloquent migrations; switch via `.env`). Schema designed for PostgreSQL.
- **AI:** Provider added later. A `NutritionAssistantService` interface with a **rule-based offline engine** now; an OpenAI-compatible adapter slot (`config/ai.php`) for plugging any provider in later. No external AI calls this session.
- **Scope:** Monorepo + Next.js web app (full navigation, AR/EN, RTL, dark mode, design system) + Laravel API + complete DB schema + verified seed data + auth & health profiles + **working food analyzer** (search, per-condition assessment, alternatives, compare).

## Step 0 — Environment setup (this machine has no dev tooling)
`C:\ai\app` is empty; Node.js is not on PATH. Check and install as needed (each install asks permission):
- Git for Windows (also `git init` the repo), Node.js LTS (for Next.js), PHP 8.3+ with `pdo_sqlite/sqlite3/openssl/mbstring/fileinfo/curl` extensions, Composer.
- Prefer `winget`; if blocked, fall back to official installers and verify with `--version` checks.

## Repository layout
```
C:\ai\app\
├── README.md                 # setup + run instructions
├── docs/                     # architecture.md, database-schema.md, api.md, medical-safety.md
├── api/                      # Laravel 11 backend
│   ├── app/Models, app/Http/{Controllers/Api,Requests,Resources}, app/Policies
│   ├── app/Services/Assessment/   # rule engine (core)
│   ├── app/Services/Ai/           # assistant interface + offline engine + SafetyGuard
│   ├── database/{migrations,seeders}
│   ├── routes/api.php, config/nutrition.php
│   └── tests/Feature/
└── web/                      # Next.js (App Router) + TypeScript + Tailwind
    ├── app/[locale]/         # en | ar routing, RTL
    ├── components/{ui,layout,features}
    ├── lib/api/              # typed API client + zod schemas
    └── messages/{en,ar}.json # next-intl dictionaries
```
`mobile/` (Expo) is deferred to Phase 9; it will reuse this API and the design tokens.

## Database schema (Laravel migrations + Eloquent models)
- **users** (name, email, password, role user|admin, locale en|ar) + Sanctum tokens.
- **health_profiles** (1–1 with user: age, gender?, height_cm, weight_kg, activity_level, allergies JSON, dietary_preferences JSON, food_restrictions JSON, daily_calorie_target, daily_water_target_ml).
- **conditions** catalog seeded: diabetes_t1, diabetes_t2, hypertension, high_cholesterol, heart_disease, obesity, general_wellness + `condition_user` pivot (multi-select).
- **foods** — canonical nutrients stored **per 100 g/ml** (energy_kcal, carbohydrate_g, sugar_g, protein_g, total_fat_g, sat_fat_g, sodium_mg, fiber_g) + serving_size + serving label (EN/AR), name_en/name_ar, category, cuisine, `source_type/source_reference/source_url`, `is_verified`, status. Assessment normalizes to per-serving.
- **food_aliases** (search aliases in both languages: "كشري", "koshari", "kushari").
- **food_alternatives** (curated food→food mapping with bilingual rationale + suggested serving).
- **recipes / recipe_ingredients** (bilingual steps JSON, servings, cost level, per-serving nutrition cache).
- **meal_plans / meal_plan_entries** (date, breakfast|lunch|dinner|snack, recipe or food).
- **food_analysis_logs** (search history + verdict snapshot), **meal_logs**, **water_logs** (daily dashboard inputs).
- **chat_sessions / chat_messages** (schema ready now for Phase 5).
- **articles** (educational content, bilingual, category, sources JSON, reviewed flag).
- **notification_preferences**, **feedback**.

## Food assessment engine — the heart of the product
`app/Services/Assessment/` — deterministic rules, one rule class per condition (DiabetesRule, HypertensionRule, CholesterolRule, HeartDiseaseRule, ObesityRule, WellnessRule):
- Evaluates the food per serving **and** per 100 g against thresholds held in `config/nutrition.php`, each threshold annotated with its guideline source (ADA Standards of Care, AHA, WHO, CDC) — no invented numbers.
- Returns per-condition verdicts (good / acceptable / moderation / not_recommended) with machine-generated bilingual reason strings that cite the actual nutrient value vs the guideline range, plus warnings. Final verdict = most severe across the user's conditions. Missing nutrient data → explicit "incomplete data" uncertainty note.
- **Same food, different conditions → different verdicts** (e.g., dates for T2 diabetes vs hypertension), covered by feature tests.
- Database facts (nutrients) are always rendered as facts; engine explanations are labeled as guideline-based analysis — kept visually distinct in the UI.

## API surface (routes/api.php, prefix /api/v1 — documented in docs/api.md)
Auth (register/login/me) · profile & conditions CRUD · `GET /foods` (search, filters, pagination) · `GET /foods/{slug}` · `POST /foods/analyze` · `GET /foods/{id}/alternatives` · `POST /foods/compare` · `POST /assistant/chat` (offline engine) · `GET /dashboard/summary` · meal/water logs · recipes & articles reads · admin CRUD (foods, recipes, articles, users, stats) behind `role:admin`. Form Requests for validation; API Resources for consistent JSON; CORS configured for the web origin.

## AI assistant (offline mode this session)
TemplateAssistantEngine reuses the assessment engine + food DB to answer the example question types (is X good for my condition / how much sugar / healthier alternative) bilingually. A `SafetyGuard` intercepts diagnosis/medication intents with the medical disclaimer; every answer carries the "education, not medical advice — consult a dietitian" footer.

## Seed data policy (no invented values)
- ~120 foods: Egyptian (koshari, ful medames, taameya, molokhia, mahshi…), Sudanese (kisra, aseeda, gurasa…), Arabic (hummus, kabsa, fattoush…), international staples, drinks, packaged snacks.
- Each row carries `source_reference`: USDA FoodData Central values where the item exists; published regional food-composition tables for local dishes, with per-preparation uncertainty surfaced in the UI; admin dashboard manages corrections and verification flags.
- 7 conditions, ~15 curated alternative mappings (white bread→baladi/whole-grain, sugary drinks→water, fried→grilled…), ~12 bilingual recipes with ingredient-derived nutrition, ~8 educational articles citing ADA/AHA/WHO/CDC source URLs, demo user + admin accounts.

## Frontend (web/)
- **Design system first**: Tailwind tokens (deep green primary, soft mint secondary, teal accent, white/light-gray surfaces), rounded cards, accessible verdict badges (green/amber/red **with icon + text label**, never color-only), WCAG-AA contrast. Reusable `components/ui`: Button, Card, Badge, Input, Select, Dialog, Tabs, ProgressRing, NutritionChart (Recharts).
- next-intl with `app/[locale]` routing (EN LTR / AR RTL), next-themes dark/light, persisted.
- App shell: desktop sidebar + mobile bottom nav with the 9 required sections.
- Pages this session: Login/Register (multi-step health profile + conditions picker), Dashboard (daily nutrition charts, water tracker, history, recommendations), **Food Analyzer** (search EN/AR, nutrition card, per-condition verdicts with reasons, alternatives, side-by-side compare), Assistant chat (offline engine), Health Profile, Settings (language/theme/notification prefs), Education list+detail, Recipes + Meal Planner (seeded content, interactive editing next phase), Notifications, Admin (foods table with edit, users, stats, articles).
- Typed API client + TanStack Query; graceful loading/error states; medical-safety disclaimer components.

## Testing & verification
- PHPUnit feature tests: assessment engine matrix (same food × multiple conditions), auth flow, foods search/analyze endpoints, validation errors.
- End-to-end manual check: run `php artisan serve` (8000) + `next dev` (3000); register → set diabetes+hypertension → analyze white bread vs koshari vs dates → verify different verdicts + alternatives render in both EN and AR, both themes.

## Deferred (explicitly out of this session)
Real AI provider integration (adapter slot ready), Expo mobile app (Phase 9), push notifications (in-app preferences now), interactive meal-plan editing, image-upload analysis, production deployment config.

## Build order
1. Step 0 tooling → git init → repo skeleton + docs.
2. Laravel: migrations + models + seeders → assessment engine + tests (green) → API controllers + Sanctum + CORS.
3. Next.js: design system + i18n + shell → auth/profile → analyzer (core loop) → dashboard → remaining sections + admin.
4. Run both, verify core loop end-to-end, finalize docs/README.