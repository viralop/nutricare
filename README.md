# NutriCare — Smart Nutrition Platform

NutriCare is a bilingual (English / العربية) nutrition-education platform that helps people with
chronic conditions — diabetes, hypertension, high cholesterol, heart disease, obesity, or anyone
pursuing a healthy lifestyle — understand their food choices through a **rule-based food analyzer**,
an offline **AI nutrition assistant**, meal plans, recipes, and medically-reviewed educational content.

> **Medical safety:** NutriCare is a nutrition-education tool. It does not diagnose, treat, or
> prescribe. It never advises changing medication. See [docs/medical-safety.md](docs/medical-safety.md).

## Monorepo layout

| Path | What it is |
|---|---|
| `api/` | Laravel REST API (`/api/v1`) — auth, health profiles, food database, assessment engine, assistant, meal plans, admin |
| `web/` | Next.js website — bilingual (LTR/RTL), light/dark, responsive, mobile-first |
| `docs/` | Architecture, database schema, API reference, medical-safety policy |

## Quick start (Windows dev machine)

Tooling used: PHP 8.4 (CLI, extensions: curl, fileinfo, intl, mbstring, openssl, pdo_sqlite, sqlite3, zip),
Composer, Node.js LTS, Git. A helper `tools/` directory contains `php.bat` / `composer.bat` wrappers
that set `PATH` for this machine — adjust or remove for other machines.

### 1. API (Laravel, port 8000)

```bat
cd C:\ai\app\api
..\tools\composer.bat install
copy .env.example .env
..\tools\php.bat artisan key:generate
..\tools\php.bat artisan migrate --seed
..\tools\php.bat artisan serve
```

Dev database is **SQLite** (`database/database.sqlite`, created automatically). For production set
`DB_CONNECTION=pgsql` with PostgreSQL credentials — migrations are portable.

Seeded demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@nutricare.test` | `admin1234!` |
| User (diabetes T2 + hypertension) | `sara@nutricare.test` | `password1234` |

### 2. Web (Next.js, port 3000)

```bat
cd C:\ai\app\web
npm install
npm run dev
```

Open http://localhost:3000 (English) or http://localhost:3000/ar (Arabic, RTL).

### 3. Tests

```bat
cd C:\ai\app\api
..\tools\php.bat vendor\bin\phpunit  (or: ..\tools\php.bat artisan test)
```

## Feature map (current phase)

- ✅ Auth (register/login/profile) with health profile & multi-condition selection
- ✅ Food database — Egyptian, Sudanese, Arabic & international foods, bilingual search (aliases)
- ✅ **Food analyzer** — per-condition verdicts (good / acceptable / moderation / not recommended),
  nutrient-based bilingual reasoning, per-serving & per-100 g views, uncertainty notes for estimated data
- ✅ Healthier alternatives + side-by-side comparison
- ✅ Offline AI nutrition assistant (rule/template engine, safety guard, bilingual)
- ✅ Dashboard — daily calorie/sugar/sodium/fat/water tracking, charts, history, recommendations
- ✅ Meal planner (weekly plan generation per conditions, swap meals) & recipes
- ✅ Education articles (sourced from ADA/AHA/WHO/CDC)
- ✅ Notification preferences, settings (language, theme)
- ✅ Admin dashboard — foods CRUD & verification, users, articles, stats
- 🔜 Real AI provider (adapter slot in `api/config/ai.php`) and image analysis

## Documentation

- [Architecture](docs/architecture.md)
- [Database schema](docs/database-schema.md)
- [API reference](docs/api.md)
- [Medical safety policy](docs/medical-safety.md)
