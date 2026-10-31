<?php

namespace App\Services\Ai;

use App\Models\Food;
use App\Models\User;
use App\Services\Assessment\AssessmentEngine;
use Illuminate\Support\Facades\DB;

/**
 * Offline assistant: SafetyGuard first, then deterministic answers built from
 * the food database + the assessment engine. Handles the core question types:
 *   - "is X good for <condition>?"
 *   - "how much sugar/sodium/fat in X?"
 *   - "what's a healthier alternative to X?"
 *   - generic greeting / capability / healthy-eating questions.
 * An LLM provider (config/ai.php) can replace this later behind the same interface.
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
            ? ['هل الأرز مناسب لمرضى السكر؟', 'كم نسبة الصوديوم في الجبنة البيضاء؟', 'ما البديل الصحي للشيبس؟']
            : ['Is rice good for diabetics?', 'How much sodium is in white cheese?', 'What is a healthier snack than chips?'];

        $guard = $this->guard->check($message, $locale);
        if ($guard['blocked']) {
            return ['reply' => $guard['reply'], 'blocked' => true, 'suggestions' => []];
        }

        // 1) Try to find a food mentioned in the question (search DB by fragments).
        $food = $this->findFood($message);
        if (! $food) {
            return [
                'reply' => $this->fallback($user, $ar),
                'blocked' => false,
                'suggestions' => $suggestions,
            ];
        }

        $text = mb_strtolower($message);
        $conditions = $user->conditions()->get();
        $assessment = $this->engine->assess($food, $conditions, $locale);
        $verdictLabel = $this->verdictLabel($assessment['verdict'], $ar);
        $name = $food->localizedName($locale);

        // 2) Nutrient-specific question ("how much sugar ...")
        foreach (['sugar' => 'sugar_g', 'sodium' => 'sodium_mg', 'salt' => 'sodium_mg', 'fat' => 'total_fat_g', 'calories' => 'energy_kcal', 'calorie' => 'energy_kcal'] as $kw => $field) {
            $kwAr = ['sugar' => 'سكر', 'sodium' => 'صوديوم', 'salt' => 'ملح', 'fat' => 'دهون', 'calories' => 'سعرات', 'calorie' => 'سعرات'][$kw];
            if (mb_stripos($text, $kw) !== false || mb_stripos($message, $kwAr) !== false) {
                $unit = in_array($field, ['sodium_mg']) ? 'mg' : ($field === 'energy_kcal' ? 'kcal' : 'g');
                $perServing = $food->perServing()[$field];
                $per100 = $food->{$field};
                $line = $ar
                    ? "في «{$name}»: {$this->n($per100)} {$unit} لكل ١٠٠ جم، وحوالي {$this->n($perServing)} {$unit} في الحصة ({$food->localizedServingLabel('ar')})."
                    : "In {$name}: {$this->n($per100)} {$unit} per 100 g, and about {$this->n($perServing)} {$unit} per serving ({$food->localizedServingLabel('en')}).";
                if ($perServing === null) {
                    $line = $ar ? 'هذه البيانات غير متوفرة لهذا الصنف حالياً.' : 'That nutrient is not available for this item yet.';
                }

                return [
                    'reply' => $line."\n\n".$this->verdictLine($name, $verdictLabel, $ar)."\n\n".$this->guard->disclaimer($locale),
                    'blocked' => false,
                    'suggestions' => $suggestions,
                ];
            }
        }

        // 3) Alternative question
        if (mb_stripos($text, 'alternative') !== false || mb_stripos($text, 'instead') !== false
            || mb_stripos($message, 'بديل') !== false || mb_stripos($message, 'بدل') !== false) {
            $alt = $food->alternatives()->with('alternativeFood')->first();
            if ($alt && $alt->alternativeFood) {
                $altName = $alt->alternativeFood->localizedName($locale);
                $reason = $ar ? $alt->reason_ar : $alt->reason_en;
                $line = $ar
                    ? "بديل صحي لـ «{$name}»: «{$altName}». {$reason}"
                    : "A healthier swap for {$name}: {$altName}. {$reason}";

                return [
                    'reply' => $line."\n\n".$this->guard->disclaimer($locale),
                    'blocked' => false,
                    'suggestions' => $suggestions,
                ];
            }
            $line = $ar
                ? "لم أجد بديلاً مُدرجًا لـ«{$name}» بعد — جرّب البحث عنه في محلل الطعام لرؤية التحليل الكامل."
                : "I don't have a curated alternative for {$name} yet — try it in the Food Analyzer for the full breakdown.";

            return ['reply' => $line, 'blocked' => false, 'suggestions' => $suggestions];
        }

        // 4) Default: suitability answer using the engine.
        $reasons = collect($assessment['assessments'])
            ->flatMap(fn ($a) => array_slice($a['reasons'], 0, 2))
            ->take(4)
            ->implode("\n• ");

        $reply = ($ar
            ? "بالنسبة لحالة «{$name}» وتحليلها وفق حالتك الصحية: التصنيف — {$verdictLabel}."
            : "For {$name}, based on your health profile the verdict is: {$verdictLabel}.")
            ."\n\n• ".$reasons;

        if ($assessment['warnings']) {
            $reply .= "\n\n".implode("\n", $assessment['warnings']);
        }
        $reply .= "\n\n".$this->guard->disclaimer($locale);

        return ['reply' => $reply, 'blocked' => false, 'suggestions' => $suggestions];
    }

    protected function findFood(string $message): ?Food
    {
        // Common question words in both languages that never identify a food.
        $stop = [
            'is', 'are', 'the', 'a', 'an', 'in', 'on', 'for', 'of', 'to', 'and', 'or',
            'how', 'much', 'many', 'what', 'which', 'who', 'do', 'does', 'can', 'could',
            'should', 'would', 'i', 'my', 'me', 'it', 'this', 'that', 'with', 'eat',
            'eating', 'good', 'bad', 'okay', 'ok', 'healthy', 'unhealthy', 'have', 'has',
            'هل', 'في', 'من', 'على', 'عن', 'ما', 'هو', 'هي', 'هل', 'كم', 'نسبة', 'ماذا',
            'أكل', 'اكل', 'طعام', 'حلو', 'مفيد', 'ضار', 'يصلح', 'مناسب', 'يناسب', 'مع',
        ];

        $words = preg_split('/[\s,،?.!؟]+/u', $message) ?: [];
        $words = array_values(array_filter(array_map(
            function ($w) {
                $w = trim($w, "'\"()\u{200f}\u{200e}");
                // Strip the Arabic definite article so الجبنة matches جبنة.
                if (mb_strlen($w) > 4 && mb_strpos($w, 'ال') === 0) {
                    $w = mb_substr($w, 2);
                }

                return $w;
            },
            $words
        ), fn ($w) => mb_strlen($w) >= 2 && ! in_array(mb_strtolower($w), $stop, true)));

        if ($words === []) {
            return null;
        }

        // Nutrient keywords are matched by the dedicated nutrient branch; never
        // treat them as food names ("how much sugar is in dates?" → dates).
        $nutrientWords = [
            'sugar', 'sodium', 'salt', 'fat', 'fats', 'calories', 'calorie', 'carbs',
            'carbohydrate', 'carbohydrates', 'protein', 'fiber', 'fibre', 'cholesterol',
            'سكر', 'سكريات', 'صوديوم', 'ملح', 'دهون', 'سعرات', 'كربوهيدرات', 'بروتين', 'ألياف', 'كوليسترول',
        ];
        $foodWords = array_values(array_filter($words, fn ($w) => ! in_array(mb_strtolower($w), $nutrientWords, true)));
        $words = $foodWords !== [] ? $foodWords : $words;

        // Longest query words first — they are the most specific (e.g. "dates").
        usort($words, fn ($a, $b) => mb_strlen($b) <=> mb_strlen($a));

        foreach ($words as $word) {
            $exact = Food::query()->where('status', 'published')
                ->where(fn ($q) => $q
                    ->where('name_en', $word)
                    ->orWhere('name_ar', $word)
                    ->orWhereHas('aliases', fn ($a) => $a->where('alias', $word)))
                ->orderBy('name_en')->get();
            if ($exact->isNotEmpty()) {
                return $exact->first();
            }

            $partial = Food::query()->where('status', 'published')
                ->where(fn ($q) => $q
                    ->where('name_en', 'like', "%{$word}%")
                    ->orWhere('name_ar', 'like', "%{$word}%")
                    ->orWhereHas('aliases', fn ($a) => $a->where('alias', 'like', "%{$word}%")))
                ->orderBy('name_en')->get();
            if ($partial->isNotEmpty()) {
                // Shortest name is the most specific (e.g. "Medjool dates" over long dish names).
                return $partial->sortBy(fn ($f) => mb_strlen($f->name_en))->first();
            }
        }

        return null;
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

    protected function verdictLine(string $name, string $label, bool $ar): string
    {
        return $ar ? "تقييم «{$name}» لحالتك: {$label}." : "Verdict for {$name} with your conditions: {$label}.";
    }

    protected function n($v): string
    {
        return $v === null ? '—' : rtrim(rtrim(number_format($v, 1, '.', ''), '0'), '.');
    }

    protected function fallback(User $user, bool $ar): string
    {
        $names = $user->conditions()->get()
            ->map(fn ($c) => $c->localizedName($ar ? 'ar' : 'en'))
            ->implode(', ');
        if ($names === '') {
            $names = $ar ? 'لا شيء مسجل بعد' : 'none recorded yet';
        }

        return ($ar
            ? "أنا مساعد تغذية ناتريكير. اسألني عن أي طعام أو مشروب وسأحلل مناسبيته لحالتك الصحية (حالاتك المسجلة: {$names}). جرب: «هل المكرونة مناسبة لمرضى السكر؟» أو «كم سكر في التمر؟»"
            : "I'm the NutriCare nutrition assistant. Ask me about any food or drink and I'll analyze it against your health profile (your conditions: {$names}). Try: \"Is pasta okay for diabetics?\" or \"How much sugar is in dates?\"")
            ."\n\n".$this->guard->disclaimer($ar ? 'ar' : 'en');
    }
}
