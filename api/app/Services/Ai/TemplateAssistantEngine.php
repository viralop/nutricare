<?php

namespace App\Services\Ai;

use App\Models\Condition;
use App\Models\Food;
use App\Models\Recipe;
use App\Models\User;
use App\Services\Assessment\AlternativeFinder;
use App\Services\Assessment\AssessmentEngine;
use Illuminate\Support\Collection;

/**
 * Offline nutrition assistant with a small NLU pipeline — no LLM required.
 *
 * Pipeline: SafetyGuard → normalize (EN/AR) → intent detection → entity
 * extraction (foods, conditions, quantity, meal slot) → answer synthesis
 * from real database values via the assessment engine.
 *
 * It understands phrasing variety ("can I eat X", "is X bad for me",
 * "كم سكر في ٣ تمرات", "X or Y", "what should I eat for dinner", "what is
 * fiber") instead of matching fixed sentences, and scales answers by any
 * quantity the user mentions.
 */
class TemplateAssistantEngine implements NutritionAssistantService
{
    public function __construct(
        protected AssessmentEngine $engine,
        protected SafetyGuard $guard = new SafetyGuard,
    ) {}

    public function answer(User $user, string $message, string $locale): array
    {
        $ar = $locale === 'ar';
        $suggestions = $ar
            ? ['هل الأرز مناسب لمرضى السكر؟', 'كم سكر في ٣ تمرات؟', 'إيه بديل الشيبس؟', 'الفطور ولا العشاء أثقل للسكر؟']
            : ['Is rice okay for diabetes?', 'How much sugar is in 3 dates?', 'What can I eat instead of chips?', 'Brown rice or white rice for cholesterol?'];

        $guard = $this->guard->check($message, $locale);
        if ($guard['blocked']) {
            return ['reply' => $guard['reply'], 'blocked' => true, 'suggestions' => []];
        }

        $norm = $this->normalize($message);
        $intent = $this->detectIntent($norm, $message);
        $foods = $this->findFoods($message, $norm);
        $conditions = $this->conditionsIn($norm);
        $quantity = $this->quantityIn($message, $norm);
        $slot = $this->slotIn($norm);

        // Conditions that apply: the user's profile + any mentioned in the question.
        $userConditions = $user->conditions()->get();
        $allConditionSlugs = $userConditions->pluck('slug')
            ->merge($conditions)
            ->unique()
            ->values();
        $conditionModels = Condition::whereIn('slug', $allConditionSlugs)->get();

        $reply = match ($intent) {
            'greeting' => $this->greet($user, $ar),
            'thanks' => $ar ? 'العفو! دائمًا تحت أمرك 🌿' : "You're welcome! Always here to help 🌿",
            'meal_advice' => $this->mealAdvice($conditionModels, $slot, $ar),
            'concept' => $this->concept($norm, $ar),
            'comparison' => $this->compare($foods, $conditionModels, $locale)
                ?? $this->suitability($foods, $conditionModels, $quantity, $slot, $locale, $user),
            'nutrient' => $this->nutrientAnswer($foods, $norm, $quantity, $locale),
            'alternative' => $this->alternativeAnswer($foods, $locale),
            'suitability', 'unknown' => $this->suitability($foods, $conditionModels, $quantity, $slot, $locale, $user),
        };

        if ($reply === null) {
            $reply = $this->fallback($conditionModels, $ar);
        }

        $reply .= "\n\n".$this->guard->disclaimer($locale);

        return ['reply' => $reply, 'blocked' => false, 'suggestions' => $suggestions];
    }

    // ------------------------------------------------------------------
    // Text normalization (shared EN/AR)
    // ------------------------------------------------------------------

    protected function normalize(string $text): string
    {
        $t = mb_strtolower(trim($text));
        // Arabic-Indic digits → ASCII
        $t = strtr($t, ['٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9']);
        // Unify Arabic letter variants + strip diacritics + tatweel
        $t = strtr($t, ['أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'ى' => 'ي', 'ة' => 'ه']);
        $t = preg_replace('/[\x{064B}-\x{065F}\x{0640}]/u', '', $t);
        // Strip punctuation
        $t = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $t);

        return preg_replace('/\s+/', ' ', trim($t)) ?? '';
    }

    /** Per-word transform (plural + Arabic article) without stopword removal. */
    protected function transformWord(string $w): string
    {
        if (preg_match('/[a-z]/', $w) && mb_strlen($w) > 3 && str_ends_with($w, 's')) {
            $w = mb_substr($w, 0, -1);
        }
        if (preg_match('/\p{Arabic}/u', $w) && mb_strlen($w) >= 4 && str_starts_with($w, 'ال')) {
            $w = mb_substr($w, 2);
        }

        return $w;
    }

    protected function words(string $norm): array
    {
        $stop = [
            'is', 'are', 'the', 'a', 'an', 'in', 'on', 'for', 'of', 'to', 'and', 'or',
            'how', 'much', 'many', 'what', 'which', 'who', 'do', 'does', 'can', 'could',
            'should', 'would', 'i', 'my', 'me', 'it', 'this', 'that', 'with', 'eat',
            'eating', 'good', 'bad', 'okay', 'ok', 'healthy', 'unhealthy', 'have', 'has',
            'much', 'please', 'about', 'some', 'any', 'vs', 'versus',
            'هل', 'في', 'من', 'علي', 'عن', 'ما', 'هو', 'هي', 'كم', 'ماذا', 'اكل', 'يصلح',
            'ينفع', 'مسموح', 'ممنوع', 'ضار', 'مفيد', 'مناسب', 'مع', 'ولا', 'ام', 'و',
            'لدي', 'عندي', 'بي', 'الوقت', 'بدا', 'اقدر',
        ];

        $out = [];
        foreach (preg_split('/\s+/', $norm) ?: [] as $w) {
            if (mb_strlen($w) < 2 || in_array($w, $stop, true)) {
                continue;
            }
            // English plural → singular (crude but effective for foods)
            if (preg_match('/[a-z]/', $w) && mb_strlen($w) > 3 && str_ends_with($w, 's')) {
                $w = mb_substr($w, 0, -1);
            }
            // Arabic definite article: "الارز" should match the food name "ارز"
            if (preg_match('/\p{Arabic}/u', $w) && mb_strlen($w) >= 4 && str_starts_with($w, 'ال')) {
                $w = mb_substr($w, 2);
            }
            $out[] = $w;
        }

        return $out;
    }

    // ------------------------------------------------------------------
    // Intent detection
    // ------------------------------------------------------------------

    protected function detectIntent(string $norm, string $raw): string
    {
        $map = [
            'greeting' => '/^(hi|hii+|hello|hey|good (morning|evening|afternoon)|salam|السلام|مرحبا|اهلا|صباح|مساء)/u',
            'thanks' => '/(thank|thanks|shukran|شكرا|متشكر)/u',
            'alternative' => '/(alternative|instead of|instead|swap|replace|substitute|بديل|بدل|بدائل|استبدال|عوض)/u',
            'concept' => '/(what (is|are)|difference between|explain|meaning of|ما هو|ما هي|الفرق بين|اشرح|يعني ايه|عرفني)/u',
            'comparison' => '/(\bvs\b|versus|better( than)?|worse( than)?| or |أم|ولا|افضل ولا|أفضل ولا)/u',
            'meal_advice' => '/(what (should|can|could) i (eat|have|cook)|what to (eat|cook)|any (breakfast|lunch|dinner|snack)|meal idea|suggest (a|some)? ?(meal|breakfast|lunch|dinner|snack)|بدا اكل|اكل ايه|ماذا اكل|اقترح لي|وصفه|وصفة|اشتي اكل|ابي اكل)/u',
            'nutrient' => '/(how (much|many)|كم|نسبه|نسبة|محتوى|contains|contains how|فيه كم|كام)/u',
            'suitability' => '/(is .*(ok|okay|good|bad|safe|fine|allowed)|can i (eat|have|drink)|should i (eat|avoid)|مسموح|ممنوع|ضار|مفيد|مناسب|يصلح|ينفع)/u',
        ];

        foreach ($map as $intent => $pattern) {
            if (preg_match($pattern, $norm) || preg_match($pattern, mb_strtolower($raw))) {
                // "vs" between two foods wins over suitability phrasing
                if ($intent === 'suitability' && preg_match('/(\bvs\b|versus|أم|ولا)/u', $norm)) {
                    return 'comparison';
                }

                return $intent;
            }
        }

        return 'unknown';
    }

    // ------------------------------------------------------------------
    // Entity extraction
    // ------------------------------------------------------------------

    /** Fuzzy multi-match: normalized full-phrase + token overlap against names/aliases. */
    protected function findFoods(string $raw, string $norm): array
    {
        $msgWords = $this->words($norm);
        if ($msgWords === []) {
            return [];
        }

        $hits = collect();
        $normWordList = preg_split('/\s+/', $norm) ?: [];
        Food::where('status', 'published')->chunk(200, function ($foods) use ($norm, $normWordList, $msgWords, &$hits) {
            foreach ($foods as $food) {
                $phrases = array_merge(
                    [$food->name_en, $food->name_ar],
                    $food->aliases->pluck('alias')->all()
                );
                $score = 0;
                foreach ($phrases as $phrase) {
                    $p = $this->normalize($phrase);
                    if ($p === '' || mb_strlen($p) < 2) {
                        continue;
                    }
                    if ($p === $norm) {
                        $score = max($score, 100);
                        continue;
                    }
                    // Whole-word-sequence match only ("بيض" must NOT match inside "الابيض").
                    $pTransformed = array_map(fn ($w) => $this->transformWord($w), preg_split('/\s+/', $p) ?: []);
                    $msgTransformed = array_map(fn ($w) => $this->transformWord($w), $normWordList);
                    if ($pTransformed !== []) {
                        $len = count($pTransformed);
                        for ($i = 0; $i <= count($msgTransformed) - $len; $i++) {
                            if (array_slice($msgTransformed, $i, $len) === $pTransformed) {
                                $score = max($score, 50 + mb_strlen($p));
                                break;
                            }
                        }
                    }
                    // Partial: proportion of the food's own words present in the message
                    $pWords = $this->words($p);
                    $overlap = count(array_intersect($msgWords, $pWords));
                    if ($overlap > 0) {
                        $score = max($score, (int) round($overlap / max(1, count($pWords)) * 30) + $overlap);
                    }
                }
                if ($score >= 8) {
                    $hits->put($food->id, ['food' => $food, 'score' => $score]);
                }
            }
        });

        return $hits->sortByDesc('score')
            ->filter(fn ($h) => $h['score'] >= max(8, (int) floor($hits->max('score') * 0.4)))
            ->pluck('food')
            ->values()
            ->all();
    }

    /** Condition slugs mentioned in the question. */
    protected function conditionsIn(string $norm): array
    {
        $map = [
            'diabetes_t1' => '/(type ?1|النوع الاول|النوع 1)/u',
            'diabetes_t2' => '/(diabete|blood sugar|sugar disease|سكري|سكر|السكر)/u',
            'hypertension' => '/(blood pressure|hypertension|ضغط|الضغط)/u',
            'high_cholesterol' => '/(cholesterol|كوليسترول|كولسترول|الكوليسترول)/u',
            'heart_disease' => '/(heart|قلب|القلب)/u',
            'obesity' => '/(weight|diet|obese|وزن|الوزن|سمنه|سمنة|رجيم)/u',
        ];

        $found = [];
        foreach ($map as $slug => $pattern) {
            if (preg_match($pattern, $norm)) {
                $found[] = $slug;
            }
        }

        return $found;
    }

    /** @return array{count: float, mode: 'servings'|'grams'} */
    protected function quantityIn(string $raw, string $norm): array
    {
        $count = null;
        $mode = 'servings';

        if (preg_match('/(\d+(?:\.\d+)?)/u', $norm, $m)) {
            $count = (float) $m[1];
        } else {
            $wordNumbers = [
                'en' => ['one' => 1, 'two' => 2, 'three' => 3, 'four' => 4, 'five' => 5, 'six' => 6, 'seven' => 7, 'eight' => 8, 'nine' => 9, 'ten' => 10, 'eleven' => 11, 'twelve' => 12, 'couple' => 2],
                'ar' => ['واحده' => 1, 'واحد' => 1, 'اتنين' => 2, 'اثنين' => 2, 'ثلاث' => 3, 'تلات' => 3, 'اربع' => 4, 'خمس' => 5, 'ست' => 6, 'سبع' => 7, 'تمن' => 8, 'ثمان' => 8, 'تسع' => 9, 'عشر' => 10],
            ];
            foreach ([...$wordNumbers['en'], ...$wordNumbers['ar']] as $w => $n) {
                if (preg_match('/\b'.preg_quote($w, '/').'\b/u', $norm)) {
                    $count = (float) $n;
                    break;
                }
            }
        }

        if ($count === null) {
            return ['count' => 1.0, 'mode' => $mode];
        }

        // Gram-mode when a gram unit directly follows the number
        if (preg_match('/\d+(?:\.\d+)?\s*(g|gram|grams|جم|جرام|غرام|غ)/u', $norm)
            || preg_match('/(g|gram|grams|جم|جرام|غرام)\s*\d+/u', $norm)) {
            $mode = 'grams';
        }

        return ['count' => $count, 'mode' => $mode];
    }

    protected function slotIn(string $norm): ?string
    {
        return match (true) {
            (bool) preg_match('/(breakfast|فطور|الفطار|الافطار)/u', $norm) => 'breakfast',
            (bool) preg_match('/(lunch|غدا|الغداء)/u', $norm) => 'lunch',
            (bool) preg_match('/(dinner|عشاء|العشاء)/u', $norm) => 'dinner',
            (bool) preg_match('/(snack|سناك|وجبه خفيفه|وجبة خفيفة)/u', $norm) => 'snack',
            default => null,
        };
    }

    // ------------------------------------------------------------------
    // Answer synthesis
    // ------------------------------------------------------------------

    protected function greet(User $user, bool $ar): string
    {
        $names = $user->conditions()->get()->map(fn ($c) => $c->localizedName($ar ? 'ar' : 'en'))->implode(', ');

        return $ar
            ? "أهلًا بك في ناتريكير 🌿 أنا مساعدك الغذائي".($names !== '' ? " وحالاتك المسجلة: {$names}" : '').". اسألني عن أي طعام أو وجبة أو مفهوم غذائي."
            : "Welcome to NutriCare 🌿 I'm your nutrition assistant".($names !== '' ? " (your conditions: {$names})" : '').". Ask me about any food, meal, or nutrition concept.";
    }

    protected function suitability(array $foods, Collection $conditions, array $quantity, ?string $slot, string $locale, User $user): ?string
    {
        $ar = $locale === 'ar';
        if ($foods === []) {
            return null;
        }
        $food = $foods[0];
        $assessment = $this->engine->assess($food, $conditions, $locale);
        $label = $this->verdictLabel($assessment['verdict'], $ar);
        $name = $food->localizedName($locale);

        $qty = $this->quantityPhrase($food, $quantity, $ar);

        $head = $ar
            ? "«{$name}»{$qty} — التقييم وفق الحالات الصحية المعنية: {$label}."
            : "{$name}{$qty} — verdict for the relevant conditions: {$label}.";

        $reasons = collect($assessment['assessments'])
            ->take(2)
            ->flatMap(fn ($a) => array_slice($a['reasons'], 0, 2))
            ->take(4)
            ->implode("\n• ");
        $out = $head."\n\n• ".$reasons;

        if ($assessment['warnings']) {
            $out .= "\n\n".implode("\n", $assessment['warnings']);
        }

        if (in_array($assessment['verdict'], ['moderation', 'not_recommended'], true)) {
            $alts = app(AlternativeFinder::class)->forFood($food, $locale, true);
            if ($alts !== []) {
                $altNames = collect($alts)->take(3)
                    ->map(fn ($a) => $a['food']->localizedName($locale))
                    ->implode($ar ? '، ' : ', ');
                $out .= $ar
                    ? "\n\nبدائل مقترحة: {$altNames}."
                    : "\n\nSuggested swaps: {$altNames}.";
            }
        }

        if ($slot && $user->profile) {
            $out .= $ar
                ? "\n\n(احتسبها ضمن حصة {$this->slotLabel($slot, $ar)} في سجل يومك.)"
                : "\n\n(Log it under your {$this->slotLabel($slot, $ar)} in today's tracker.)";
        }

        return $out;
    }

    protected function nutrientAnswer(array $foods, string $norm, array $quantity, string $locale): ?string
    {
        $ar = $locale === 'ar';
        if ($foods === []) {
            return null;
        }
        $food = $foods[0];
        $name = $food->localizedName($locale);

        // Which nutrient? default to the one asked about; fallback: sugar.
        $nutrientMap = [
            'sugar_g' => ['sugar|sugars|سكريات|سكر', 'g', 'sugars / السكريات'],
            'sodium_mg' => ['sodium|salt|صوديوم|ملح', 'mg', 'sodium / الصوديوم'],
            'fat_g' => ['fat|fats|دهون', 'g', 'total fat / الدهون'],
            'sat_fat_g' => ['saturated|sat fat|مشبعه|المشبعه', 'g', 'saturated fat / الدهون المشبعة'],
            'protein_g' => ['protein|بروتين', 'g', 'protein / البروتين'],
            'fiber_g' => ['fiber|fibre|الياف|الألياف|الياف', 'g', 'fiber / الألياف'],
            'carbohydrate_g' => ['carb|carbs|carbohydrate|كارب|كربوهيدرات', 'g', 'carbs / الكربوهيدرات'],
            'energy_kcal' => ['calorie|calories|kcal|سعرات|سعره', 'kcal', 'calories / السعرات'],
        ];
        $field = 'sugar_g';
        foreach ($nutrientMap as $key => [$pattern]) {
            if (preg_match('/('.$pattern.')/u', $norm)) {
                $field = $key === 'fat_g' ? 'total_fat_g' : $key;
                break;
            }
        }
        $unit = $field === 'sodium_mg' ? 'mg' : ($field === 'energy_kcal' ? 'kcal' : 'g');

        $per100 = $food->{$this->col($field)};
        $perServing = $food->perServing()[$this->col($field)];
        if ($per100 === null && $perServing === null) {
            return $ar ? 'هذه البيانات غير متوفرة لهذا الصنف حاليًا.' : 'That nutrient is not available for this item yet.';
        }

        $n = fn ($v) => $v === null ? '—' : rtrim(rtrim(number_format($v, 1, '.', ''), '0'), '.');

        $qty = $quantity['count'];
        if ($quantity['mode'] === 'grams') {
            $multiplier = $qty / max(1, $food->serving_size_g);
            $qtyPhrase = $ar ? "{$n($qty)} جم" : "{$n($qty)} g";
        } else {
            $multiplier = $qty;
            $qtyPhrase = $ar
                ? ($qty == 1 ? 'الحصة ('.$food->localizedServingLabel('ar').')' : $n($qty).' × الحصة ('.$food->localizedServingLabel('ar').')')
                : ($qty == 1 ? 'one serving ('.$food->localizedServingLabel('en').')' : $n($qty).' × a serving ('.$food->localizedServingLabel('en').')');
        }
        $total = $perServing === null ? null : $perServing * $multiplier;

        $out = $ar
            ? "في «{$name}»: {$n($per100)} {$unit} لكل ١٠٠ جم."
            : "In {$name}: {$n($per100)} {$unit} per 100 g.";
        $out .= $ar
            ? "\nالكمية التي سألت عنها ({$qtyPhrase}) ≈ {$n($total)} {$unit}."
            : "\nFor {$qtyPhrase} that's about {$n($total)} {$unit}.";

        // Contextualize against the daily guideline.
        $limits = [
            'sugar_g' => [50, 'WHO free-sugar guidance', 'توجيه منظمة الصحة العالمية للسكريات الحرة'],
            'sodium_mg' => [2300, 'AHA guidance', 'توجيه الجمعية الأمريكية للقلب'],
            'sat_fat_g' => [13, 'AHA guidance', 'توجيه الجمعية الأمريكية للقلب'],
        ];
        $column = $this->col($field);
        if (isset($limits[$column]) && $total > 0) {
            [$lim, $enSrc, $arSrc] = $limits[$column];
            $pct = round($total / $lim * 100);
            $out .= $ar
                ? "\nأي نحو {$pct}٪ من الحد اليومي ({$lim} {$unit}) وفق {$arSrc}."
                : "\nThat's about {$pct}% of the {$lim} {$unit} daily guideline ({$enSrc}).";
        }

        return $out;
    }

    protected function alternativeAnswer(array $foods, string $locale): ?string
    {
        $ar = $locale === 'ar';
        if ($foods === []) {
            return null;
        }
        $food = $foods[0];
        $name = $food->localizedName($locale);
        $alts = app(AlternativeFinder::class)->forFood($food, $locale, true);
        if ($alts === []) {
            return $ar
                ? "لا يوجد بديل مُدرج لـ«{$name}» بعد — جرّب تحليله في محلل الطعام."
                : "I don't have a swap for {$name} yet — try it in the Food Analyzer for the full breakdown.";
        }

        $lines = collect($alts)->take(3)->map(function ($a) use ($ar) {
            $kcal = $a['food']->perServing()['energy_kcal'];

            return $ar
                ? '• '.$a['food']->localizedName('ar').' — '.(round($kcal ?? 0)).' سعرة/حصة. '.$a['reason']
                : '• '.$a['food']->localizedName('en').' — '.(round($kcal ?? 0)).' kcal/serving. '.$a['reason'];
        })->implode("\n");

        return ($ar ? "بدائل لـ«{$name}»:" : "Swaps for {$name}:")."\n\n".$lines;
    }

    protected function compare(array $foods, Collection $conditions, string $locale): ?string
    {
        $ar = $locale === 'ar';
        if (count($foods) < 2) {
            return null;
        }
        [$a, $b] = array_slice($foods, 0, 2);
        $sev = config('nutrition.verdict_severity');
        $resA = $this->engine->assess($a, $conditions, $locale);
        $resB = $this->engine->assess($b, $conditions, $locale);

        $line = function (Food $f, array $r) use ($ar, $locale) {
            $n = $f->localizedName($locale);
            $v = $this->verdictLabel($r['verdict'], $ar);
            $kcal = round($f->perServing()['energy_kcal'] ?? 0);
            $sugar = $f->perServing()['sugar_g'];
            $na = $f->perServing()['sodium_mg'];

            return $ar
                ? "• {$n}: {$v} — {$kcal} سعرة/حصة".($sugar !== null ? "، سكريات ".rtrim(rtrim(number_format($sugar, 1), '0'), '.').' جم' : '').($na !== null ? '، صوديوم '.round($na).' مجم' : '')
                : "• {$n}: {$v} — {$kcal} kcal/serving".($sugar !== null ? ', sugars '.rtrim(rtrim(number_format($sugar, 1), '0'), '.').' g' : '').($na !== null ? ', sodium '.round($na).' mg' : '');
        };

        $better = ($sev[$resB['verdict']] ?? 0) < ($sev[$resA['verdict']] ?? 0) ? $b : $a;
        $verdictLine = $ar
            ? 'الأقرب لأهدافك: '.$better->localizedName('ar').'.'
            : 'The better pick for your goals: '.$better->localizedName('en').'.';

        return ($ar ? "مقارنة سريعة (وفق حالاتك):\n" : "Quick comparison (for your conditions):\n")
            .$line($a, $resA)."\n".$line($b, $resB)."\n\n".$verdictLine;
    }

    protected function mealAdvice(Collection $conditions, ?string $slot, bool $ar): string
    {
        $slot = $slot ?? 'dinner';
        $slugs = $conditions->pluck('slug')->all();

        $recipes = Recipe::where('is_published', true)
            ->where('meal_type', $slot)
            ->get()
            ->sortByDesc(fn ($r) => count(array_intersect($r->suitable_conditions ?? [], $slugs)))
            ->take(2);

        $slotLabel = $this->slotLabel($slot, $ar);
        if ($recipes->isEmpty()) {
            return $ar
                ? "لا توجد وصفات لـ{$slotLabel} حاليًا — جرّب محلل الطعام لاختيارات سريعة."
                : "No {$slotLabel} recipes right now — try the Food Analyzer for quick picks.";
        }

        $lines = $recipes->map(function ($r) use ($ar) {
            $kcal = round($r->energy_kcal ?? 0);

            return $ar
                ? "• {$r->title_ar} — {$kcal} سعرة/حصة، {$r->minutes} دقيقة. أول خطوة: ".mb_substr($r->steps_ar[0] ?? '', 0, 90)
                : "• {$r->title_en} — {$kcal} kcal/serving, {$r->minutes} min. First step: ".mb_substr($r->steps_en[0] ?? '', 0, 90);
        })->implode("\n");

        return ($ar ? "اقتراحات لـ{$slotLabel} مناسبة لحالتك:\n\n" : "Ideas for {$slotLabel} that fit your conditions:\n\n").$lines;
    }

    protected function concept(string $norm, bool $ar): ?string
    {
        $kb = [
            'fiber' => ['/fiber|fibre|الياف|الألياف|الياف/', 'Dietary fiber is the part of plant foods your body doesn\'t digest. It slows glucose absorption, helps lower LDL cholesterol, and increases fullness. Sources: baladi/wholemeal bread, legumes (ful, lentils), vegetables, fruit. EU labeling calls a food "high in fibre" at ≥6 g/100 g.',
                'الألياف الغذائية هي جزء من الأطعمة النباتية لا يهضمها الجسم. تبطئ امتصاص الجلوكوز وتساعد في خفض الكوليسترول الضار وتزيد الشبع. مصادرها: الخبز البلدي، البقوليات (فول وعدس)، الخضروات والفاكهة. ويُعد الطعام «غنيًا بالألياف» عند ≥ ٦ جم/١٠٠ جم.'],
            'saturated' => ['/saturated|sat fat|دهون مشبعه|المشبعه/', 'Saturated fat (butter, ghee, fatty meats, coconut/palm oils) raises LDL cholesterol. The AHA advises under 13 g/day on a 2,000 kcal diet — swap ghee/butter for olive oil and grilled for fried.',
                'الدهون المشبعة (الزبدة والسمنة واللحوم الدهنية) ترفع الكوليسترول الضار. توصي الجمعية الأمريكية للقلب بأقل من ١٣ جم يوميًا في نظام ٢٠٠٠ سعرة — استبدل السمنة بزيت الزيتون والمقلي بالمشوي.'],
            'sugar' => ['/free sugar|added sugar|سكر حر|السكريات الحره|سكر مضاف/', 'Free sugars are those added to foods plus sugars in honey, syrups and juice — not the sugar inside intact fruit. WHO advises keeping them under 10% of daily energy (≈50 g at 2,000 kcal), ideally half that. Sweetened drinks are usually the biggest source.',
                'السكريات الحرة هي المضافة إلى الأطعمة بالإضافة إلى سكر العسل والعصائر — وليست سكر الفاكهة السليمة. تنصح منظمة الصحة العالمية بإبقائها تحت ١٠٪ من الطاقة اليومية (نحو ٥٠ جم عند ٢٠٠٠ سعرة) والأفضل نصفها. والمشروبات المحلاة عادة أكبر مصدر.'],
            'sodium' => ['/sodium|salt|ملح|صوديوم/', 'Sodium (mostly from salt) raises blood pressure in sensitive people. The AHA limit is under 2,300 mg/day, ideal 1,500 mg. It hides in brined cheese, pickles, luncheon meat, bread and instant noodles — taste with lemon, garlic and spices instead.',
                'الصوديوم (معظمه من الملح) يرفع ضغط الدم لدى المتحسسين. حد الجمعية الأمريكية للقلب أقل من ٢٣٠٠ مجم يوميًا والأمثل ١٥٠٠. يختبئ في الجبنة المملحة والمخللات واللانشون والخبز والنودلز — استخدم الليمون والثوم والتوابل بدلًا منه.'],
            'carbs' => ['/carb|كارب|كربوهيدرات/', 'Carbohydrates have the biggest effect on blood glucose. The ADA emphasizes the per-meal amount is individual — many plans use roughly 45–60 g — and whole grains/legumes release it more slowly than refined ones.',
                'الكربوهيدرات أكبر مؤثر على سكر الدم. تؤكد الجمعية الأمريكية للسكري أن الكمية في الوجبة فردية — كثير من الخطط تستخدم ٤٥–٦٠ جم — والحبوب الكاملة والبقوليات تُطلق الجلوكوز أبطأ من المصنعة.'],
            'protein' => ['/protein|بروتين/', 'Protein preserves muscle and keeps you full. Spread it across meals: eggs/ful at breakfast, chicken/fish/legumes at lunch and dinner, yogurt or nuts as snacks. Kidney patients need individualized targets — ask your dietitian.',
                'البروتين يحافظ على العضلات ويمنح الشبع. وزّعه على الوجبات: بيض أو فول على الفطور، ودجاج أو سمك أو بقوليات للغداء والعشاء، وزبادي أو مكسرات كسناكس. مرضى الكلى يحتاجون كميات فردية — استشر أخصائيك.'],
            'energy_density' => ['/energy density|كثافه الطاقه|كثافة الطاقة/', 'Energy density = calories per gram. Vegetables, ful and fruit are low (≤1.5 kcal/g) and fill you for few calories; fried food and sweets are high (≥4). Building meals around low-density foods is the simplest way to eat less without counting.',
                'الكثافة الطاقية = سعرات لكل جرام. الخضروات والفول والفاكهة منخفضة (≤١.٥ سعرة/جم) وتشبعك بسعرات قليلة؛ والمقليات والحلويات مرتفعة (≥٤). بناء الوجبات حول الأطعمة منخفضة الكثافة أبسط طريقة لتقليل الأكل دون عدّ.'],
            'gi' => ['/glycemic|مؤشر سكري|الجلايسيميك/', 'The glycemic index ranks how fast a food raises glucose. Whole grains, legumes and most fruit are lower-GI; white bread and sugary drinks are high. Pairing carbs with protein, fat or fiber lowers the overall response of the meal.',
                'مؤشر سكري يرتب سرعة رفع الطعام للجلوكوز. الحبوب الكاملة والبقوليات ومعظم الفاكهة أقل مؤشرًا؛ والخبز الأبيض والمشروبات المحلاة مرتفعة. وقرن الكربوهيدرات ببروتين أو دهون أو ألياف يخفض استجابة الوجبة.'],
            'labels' => ['/label|labeling|ملصق|الملصقات|قراءه الملصق/', 'On labels check: per-100 g column (traffic-light bands: sugars >22.5 g, fat >17.5 g, saturates >5 g, sodium >600 mg = high), serving size vs your portion, and the ingredient list — sugar in the first three items means think twice.',
                'على الملصقات افحص: عمود لكل ١٠٠ جم (نطاقات الألوان: سكريات >٢٢.٥ جم، دهون >١٧.٥، مشبعة >٥، صوديوم >٦٠٠ مجم = مرتفع)، وحجم الحصة مقابل كميتك، وقائمة المكونات — وجود السكر في أول ثلاثة يعني فكر مرتين.'],
        ];

        foreach ($kb as [$pattern, $en, $arText]) {
            if (preg_match($pattern, $norm)) {
                return $ar ? $arText : $en;
            }
        }

        return null;
    }

    protected function fallback(Collection $conditions, bool $ar): string
    {
        $names = $conditions->map(fn ($c) => $c->localizedName($ar ? 'ar' : 'en'))->implode(', ');

        return $ar
            ? "لم أفهم السؤال تمامًا 🌿 اسألني بصيغة فيها طعام أو مفهوم غذائي — مثل: «هل المكرونة مناسبة للسكر؟» أو «كم صوديوم في ربع رغيف بلدي؟» أو «إيه بديل الأرز الأبيض؟» أو «إيه الفرق بين الدهون المشبعة وغير المشبعة؟»".($names !== '' ? " (حالاتك: {$names})" : '')
            : "I didn't quite catch that 🌿 Try naming a food or a nutrition idea — e.g. \"Is pasta okay for diabetes?\" or \"How much sodium in a quarter baladi loaf?\" or \"What can I use instead of white rice?\" or \"What's the difference between saturated and unsaturated fat?\"".($names !== '' ? " (your conditions: {$names})" : '');
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    protected function quantityPhrase(Food $food, array $quantity, bool $ar): string
    {
        $qty = $quantity['count'];
        if ($quantity['mode'] === 'grams') {
            $g = rtrim(rtrim(number_format($qty, 1, '.', ''), '0'), '.');
            $servings = round($qty / max(1, $food->serving_size_g), 1);

            return $ar ? " ({$g} جم ≈ {$servings} من الحصة)" : " ({$g} g ≈ {$servings} of a serving)";
        }
        if ($qty == 1) {
            return '';
        }
        $n = rtrim(rtrim(number_format($qty, 1, '.', ''), '0'), '.');

        return $ar ? " ({$n} حصص)" : " ({$n} servings)";
    }

    protected function verdictLabel(string $verdict, bool $ar): string
    {
        $map = [
            'good' => ['Good choice', 'خيار مناسب'],
            'acceptable' => ['Generally acceptable', 'مقبول عمومًا'],
            'moderation' => ['Eat in moderation', 'باعتدال'],
            'not_recommended' => ['Not recommended for your condition', 'غير موصى به لحالتك'],
        ];

        return $map[$verdict][$ar ? 1 : 0];
    }

    protected function slotLabel(string $slot, bool $ar): string
    {
        $map = [
            'breakfast' => ['breakfast', 'الفطور'],
            'lunch' => ['lunch', 'الغداء'],
            'dinner' => ['dinner', 'العشاء'],
            'snack' => ['snack', 'السناك'],
        ];

        return $map[$slot][$ar ? 1 : 0];
    }

    /** nutrientAnswer works with both key styles → column name. */
    protected function col(string $field): string
    {
        return $field === 'fat_g' ? 'total_fat_g' : $field;
    }
}
