# NutriCare Architecture

## System overview

```
┌─────────────────────┐      ┌──────────────────────────┐
│  Web (Next.js)      │      │  Admin (same Next        │
│  EN/AR, LTR/RTL     │      │  app, role=admin)        │
└─────────┬───────────┘      └─────────┬────────────────┘
          │  HTTPS  Bearer token (Sanctum)│
          ▼───────────────────────┬───────▼
                                │
                    ┌────────────▼─────────────┐
                    │  Laravel REST API /api/v1│
                    │  ┌────────────────────┐  │
                    │  │ Assessment Engine  │  │  rule-per-condition,
                    │  │ (deterministic)    │  │  thresholds + sources
                    │  └────────────────────┘  │
                    │  ┌────────────────────┐  │
                    │  │ Assistant Engine   │  │  offline templates now,
                    │  │ (AiProvider iface) │  │  pluggable LLM later
                    │  └────────────────────┘  │
                    └────────────┬─────────────┘
                                 │ Eloquent
                    ┌────────────▼─────────────┐
                    │ SQLite (dev)            │
                    │ PostgreSQL (prod)       │
                    └─────────────────────────┘
```

## Key design decisions

### 1. Assessment engine is deterministic and separate from AI
`app/Services/Assessment/` contains one rule class per condition (`DiabetesRule`,
`HypertensionRule`, `CholesterolRule`, `HeartDiseaseRule`, `ObesityRule`, `WellnessRule`).
Rules read thresholds from `config/nutrition.php`, where every threshold carries the
guideline it came from (UK FSA traffic-light bands, WHO sugar guidance, AHA sodium/sat-fat
limits, ADA carbohydrate individualization notes, CDC energy-density classes).

- Input: `Food` (nutrients per 100 g) + serving size + the user's conditions.
- Output: per-condition verdicts (`good | acceptable | moderation | not_recommended`)
  with bilingual reason strings that cite the actual numbers, plus warnings.
- The overall verdict is the **most severe** across the user's conditions, so the same
  food yields different assessments for different people (covered by tests).
- Missing/estimated nutrient data produces an explicit `data_confidence` note — the UI
  displays "estimated values" instead of silently presenting them as facts.

### 2. Database facts vs. AI explanations are visually distinct
Nutrient values rendered in the UI always come from the `foods` table (with `source_type`
and `source_reference`). Verdict reasons come from the rule engine and are labelled as
guideline-based analysis. The assistant's free-text answers are labelled as educational
content. No LLM ever generates nutrient numbers.

### 3. AI provider is an interface, not a dependency
`NutritionAssistantService` is the contract. `TemplateAssistantEngine` (offline, rule +
food-DB driven) is bound by default. `config/ai.php` has a `provider` slot (`none`, or an
OpenAI-compatible endpoint + key) so a real LLM can be wired in later without touching
callers. A `SafetyGuard` class intercepts diagnosis/medication intents for every provider.

### 4. Auth & roles
Laravel Sanctum personal-access tokens (Bearer). Users carry a `role` column
(`user|admin`); admin routes are protected by a `role:admin` middleware; policies guard
resource ownership (e.g., a user can only edit their own health profile).

### 5. Bilingualism at the data layer
Food names, serving labels, recipe steps, article bodies and reason templates all carry
separate `en` / `ar` fields. The client requests a locale; API resources localize text
server-side. Search matches `name_en`, `name_ar` and the `food_aliases` table
(transliterations such as *koshari/kushari/كشري*).

### 6. Portable database
Eloquent migrations avoid driver-specific column types. Dev runs SQLite (zero install);
production switches to PostgreSQL by changing `.env` only. JSON columns are used for
bilingual/free-form payloads (allergies, recipe steps, article sources).

## Request flow example — food analysis

1. `GET /api/v1/foods?q=كشري` → `FoodController@index` → Eloquent search across
   `name_en`, `name_ar`, aliases → paginated `FoodResource`.
2. `POST /api/v1/foods/analyze` `{slug, locale}` → `FoodAnalysisController`:
   - loads food + user's conditions,
   - `AssessmentEngine::assess($food, $conditions)` → verdicts + reasons + warnings,
   - attaches curated alternatives with nutrient deltas,
   - logs to `food_analysis_logs` (history),
   - returns `AnalysisResource`.
3. Web renders nutrition card (facts) + verdict banner (icon + label + color, never
   color-only) + per-condition reason cards + alternatives, in the requested locale/dir.

## Phases (plan alignment)

| Phase | Status |
|---|---|
| 1 UI/UX + responsive frontend | ✅ this build |
| 2 DB + backend APIs | ✅ this build |
| 3 Registration & health profiles | ✅ this build |
| 4 Food database & analyzer | ✅ this build |
| 5 AI assistant | ✅ offline engine; LLM adapter pending key |
| 6 Meal planner & recipes | ✅ generation + swap |
| 7 Notifications | ✅ preferences + in-site feed |
| 8 Admin dashboard | ✅ foods/users/articles/stats |
| 9 Mobile app | ✖ removed from scope — NutriCare is a website |
| 10 Testing/security/deploy | ✅ feature tests; deploy config pending |
