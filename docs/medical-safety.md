# NutriCare Medical Safety Policy

NutriCare is a **nutrition-education and food- awareness platform**. It supports — never
replaces — professional medical care. Every feature is built against this policy.

## Non-negotiable rules

1. **No diagnosis.** The assistant never names a disease as an answer to symptoms, never
   interprets lab values, and never tells a user they have or might have a condition.
2. **No medication guidance.** The system never recommends starting, stopping, or changing
   any medication, insulin, or dose. The `SafetyGuard` (api/app/Services/Ai/SafetyGuard.php)
   detects medication/diagnosis intents in both English and Arabic and returns a fixed
   referral answer instead of engaging.
3. **No absolutes.** Copy avoids "safe for everyone", "guaranteed", "will cure". Verdict
   labels are relative to *your selected conditions*, not universal claims.
4. **Professional consultation is encouraged** — a persistent disclaimer appears on
   analyzer results, assistant chats, and dashboard recommendations: *"NutriCare offers
   nutrition education, not medical advice. Consult a registered dietitian or your
   physician for personal guidance."* (bilingual).
5. **Dietitian-first for conflicts.** When a user reports multiple conditions with
   conflicting guidance (e.g., kidney disease is *not* covered but sodium restriction vs.
   other needs can conflict), the UI recommends professional consultation.

## How safety is implemented technically

| Concern | Implementation |
|---|---|
| Multiple conditions simultaneously | Every analysis runs **all** selected condition rules; overall verdict = most severe; UI lists each condition's reasoning separately. |
| Serving size & preparation | Verdicts are computed per *serving* (and shown per 100 g); fried/preparation-dependent items carry preparation notes in reasons. |
| Incomplete information | Foods with `source_type=regional_estimate` render an "estimated — varies by preparation" badge; nullable nutrients render "no data" instead of 0. |
| Dangerous choices | High-sodium (hypertension) or high-sugar (diabetes) hits produce explicit **warnings** with daily-limit context (AHA 2,300 mg/day; WHO <10 % energy from free sugars). |
| Data provenance | Nutrient values display their source (USDA / regional estimate / label); guideline thresholds in `config/nutrition.php` each cite their authority (ADA, AHA, WHO, UK FSA, CDC). |
| AI boundaries | The assistant interface is provider-independent; whichever engine is bound must route through `SafetyGuard` before answering. |

## Guideline sources used for thresholds

- **UK FSA / Department of Health traffic-light front-of-pack bands** (per 100 g: fat ≤3 g low / >17.5 g high; saturates ≤1.5 g / >5 g; sugars ≤5 g / >22.5 g; salt ≤0.3 g / >1.5 g ≈ sodium ≤120 mg / >600 mg).
- **WHO** — free sugars <10 % of energy intake (ideally ~5 %), ≈50 g/day for a 2,000 kcal diet.
- **AHA** — sodium <2,300 mg/day (ideal 1,500 mg); saturated fat <13 g/day (2,000 kcal diet).
- **ADA Standards of Care** — carbohydrate amount is individualized; meal-planning approaches should be personalized with a dietitian (we present ranges, not prescriptions).
- **CDC / energy-density literature (Rolls et al.)** — ≤1.5 kcal/g low, 1.5–4 medium, ≥4 high energy density.

Calorie targets use the **Mifflin-St Jeor** equation × activity factor, rounded to the
nearest 50 kcal, and are always shown as *estimates* the user can override.

## Forbidden behaviors (enforced by review checklist)

- No medical claims in article content without a cited source.
- No medication dose numbers in any seeded content.
- No weight-loss promises or timelines.
- No presenting estimated nutrient values as measured facts.
