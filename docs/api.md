# NutriCare API Reference

Base URL: `http://localhost:8000/api/v1` — all responses JSON. Authenticated routes take
`Authorization: Bearer <token>` (Sanctum personal access token returned by login/register).
Text fields ending `_en` / `_ar` are localized server-side: pass `?locale=ar` (or the
`Accept-Language: ar` header) and resources return `name`/`reason` in that locale.

Error shape (validation, 422):

```json
{ "message": "The password field is required.", "errors": { "password": ["The password field is required."] } }
```

## Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `name, email, password, password_confirmation, locale?, profile{age, gender?, height_cm, weight_kg, activity_level, allergies[], dietary_preferences[], food_restrictions[], conditions[]}` | Returns `token` + `user` (with profile & conditions). Calorie/water targets auto-computed (Mifflin-St Jeor). |
| POST | `/auth/login` | `email, password` | Returns `token` + `user`. |
| POST | `/auth/logout` | — | Revoke current token. |
| GET | `/auth/me` | — | Current user + profile + conditions. |

## Health profile & conditions

| Method | Path | Notes |
|---|---|---|
| GET | `/conditions` | Catalog (7 seeded conditions). |
| PUT | `/profile` | Update profile (`age, gender, height_cm, weight_kg, activity_level, allergies, dietary_preferences, food_restrictions, daily_calorie_target, daily_water_target_ml, conditions[]`). |

## Foods & analysis

| Method | Path | Notes |
|---|---|---|
| GET | `/foods?q=&category=&cuisine=&per_page=` | Search `name_en`, `name_ar`, aliases; filters; paginated. |
| GET | `/foods/{slug}` | Full food detail. |
| POST | `/foods/analyze` | `{slug, servings?}` → nutrition per 100 g + per serving, `verdict`, per-condition `assessments[] {condition, verdict, reasons[], warnings[]}`, `alternatives[]`, `data_confidence`. |
| GET | `/foods/{slug}/alternatives` | Curated alternatives with nutrient deltas + rationale. |
| POST | `/foods/compare` | `{slugs:[a,b]}` → side-by-side nutrition + verdicts for the caller's conditions. |
| GET | `/analysis-history` | Caller's recent analyses (dashboard "recently analyzed"). |

## Assistant

| Method | Path | Notes |
|---|---|---|
| POST | `/assistant/chat` | `{message, session_id?, locale?}` → `{session_id, reply, blocked?, suggestions[]}`. Offline template engine; safety guard intercepts diagnosis/medication questions. |

## Dashboard & tracking

| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard/summary` | Today's totals (energy, carbs, sugar, sodium, sat fat, fiber), water %, targets, macro chart data, recent analyses, recommendations[]. |
| POST | `/meal-logs` | `{food_id, meal_slot, quantity_servings, logged_date?}` |
| GET | `/meal-logs?date=` | Day's logged meals. |
| DELETE | `/meal-logs/{id}` | Remove a log. |
| POST | `/water-logs` | `{amount_ml, logged_date?}` — add water. |
| GET | `/water-logs?date=` | Day's water entries. |

## Meal planner & recipes

| Method | Path | Notes |
|---|---|---|
| GET | `/meal-plan` | Current user's week (auto-generated on first call from suitable recipes). |
| POST | `/meal-plan/regenerate` | Discard & regenerate the week. |
| POST | `/meal-plan/entries/{id}/replace` | `{recipe_id}` — swap a meal, persisted. |
| GET | `/recipes?meal_type=&q=` | Published recipes with bilingual content. |
| GET | `/recipes/{slug}` | Detail incl. ingredients + steps. |

## Education

| Method | Path | Notes |
|---|---|---|
| GET | `/articles?category=` | Published articles w/ sources. |
| GET | `/articles/{slug}` | Full body (markdown). |

## Notifications & settings

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications/preferences` | Caller's toggles (auto-created defaults). |
| PUT | `/notifications/preferences` | Update toggles. |
| GET | `/notifications` | In-app notification feed (tips, reminders) — push arrives with the mobile phase. |
| POST | `/feedback` | `{message, category?}` |

## Admin (`role:admin`)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/stats` | Users, foods, analyses, top-searched foods. |
| GET | `/admin/foods?q=` | Full list incl. drafts. |
| POST | `/admin/foods` | Create food (validated nutrients). |
| PUT | `/admin/foods/{id}` | Update nutrients / verification / status. |
| DELETE | `/admin/foods/{id}` | Delete (blocked if referenced by logs — use `status=draft` instead). |
| GET | `/admin/users?q=` | List users w/ conditions. |
| GET | `/admin/articles` / `POST` / `PUT /{id}` | Manage educational content. |
| GET | `/admin/feedback` | Review user feedback. |
