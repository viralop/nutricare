# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People managing chronic conditions — type 1/type 2 diabetes, hypertension, high cholesterol, heart disease, obesity — plus general-wellness users. Arabic/English bilingual (Egyptian and Sudanese food culture front and center); many browse on phones first. Primary job: "can I eat this?" — deciding what to eat today, within their condition limits, without medical jargon.

## Product Purpose

NutriCare is a nutrition-education web platform: a food analyzer with per-condition verdicts (good/acceptable/moderation/not recommended) backed by guideline thresholds (UK FSA, WHO, AHA, ADA, CDC) — never invented values — plus healthier alternatives, an offline rule-based assistant, daily tracking (energy/water/sugar/sodium), meal planning, recipes, and education articles. Success: a user knows whether a food fits their conditions and what to eat instead, in seconds, in their language.

## Positioning

Deterministic, guideline-cited verdicts per condition for the same food — not generic health scores. Same dish can be "good" for hypertension and "not recommended" for diabetes, with the threshold shown. Bilingual EN/AR with Egyptian/Sudanese foods localized, not translated-afterthought.

## Operating Context

Users log meals and water through the day, analyze foods before eating (often on the phone at the table), ask the assistant free-form questions in English or Arabic, and check education articles. Daily targets come from the health profile (conditions, age, weight). The medical boundary is strict: education, not diagnosis or medication advice; every assistant reply carries the disclaimer.

## Capabilities and Constraints

- Laravel 13 REST API (`/api/v1`, Sanctum tokens) + Next.js 16 web (App Router, Tailwind v4, next-intl EN/AR RTL, next-themes light/dark). Monorepo `api/` + `web/`.
- 114-food bilingual database (USDA-sourced or clearly-flagged regional estimates), deterministic assessment engine, curated + auto alternatives, offline NLU assistant (no LLM; adapter slot ready in `api/config/ai.php`).
- Website only — no mobile-app references. Phone layout (375px) is the primary layout and must be checked first.
- Demo accounts seeded (sara@nutricare.test / admin@nutricare.test); public demo on Cloudflare Workers (web) with API moving to nutricare.softland.tech (VPS, pending deploy). GitHub: viralop/nutricare (public).

## Brand Commitments

- User-provided design spec (binding): emerald #10B981 primary / forest #047857 hover, sky #0EA5E9 secondary, light = off-white #F8FAFC + white surfaces + #E2E8F0 borders, dark = slate navy #0F172A / #1E293B / #334155. Status colors: mint-green good, warm-amber moderate, soft-crimson bad, sky info. Fonts: Plus Jakarta Sans (LTR) / Readex Pro (RTL). 52px capsule search, emerald focus rings, solid-emerald primary buttons with hover scale, rounded-2xl cards with soft shadows.
- No emoji as UI imagery — line icons (lucide) and real food photos (Wikimedia Commons) instead.
- Flat, professional, calm — the user explicitly rejected "AI-slop" gradients/decoration and cluttered headers.

## Evidence on Hand

Real seeded data: 114 foods with per-100g nutrients + sources, 24 corrected Commons photos, 12 recipes, 8 cited articles, 7 conditions, demo profiles (Sara: T2 diabetes + hypertension, 1,650 kcal / 2,000 ml water / 50 g sugar / 2,300 mg sodium targets). 33 passing PHPUnit tests including "every assistant suggestion is answerable."

## Product Principles

1. Verdict first: the answer ("can I eat this?") leads; reasoning and sources follow, never hidden.
2. Same food, different people, different answers — condition context shapes everything.
3. No invented numbers: every threshold cites its guideline; estimates are flagged as estimates.
4. Calm trust over engagement hooks: this is a daily health tool, not a feed.
5. Bilingual means equally native: RTL and Arabic copy are first-class, never mirrored leftovers.

## Accessibility & Inclusion

Verdict badges always pair color with icon + label (never color alone). Arabic RTL fully supported. Touch targets ≥ 44px on phone. Medical safety disclaimers on all assistant output.
