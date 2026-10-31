<?php

namespace App\Services\Ai;

/**
 * Intercepts medically out-of-scope intents (diagnosis, medication, dosing)
 * in English and Arabic. Every provider — offline or LLM — must pass through
 * this guard before answering (see docs/medical-safety.md).
 */
class SafetyGuard
{
    /** @var array<string, array<string>> intent => regex patterns */
    protected array $blockPatterns = [
        'medication' => [
            '/\b(insulin|metformin|dose|dosage|medication|medicine|pill|tablet|injection)\w*\b/i',
            '/(دواء|أدوية|دوا|جرعة|جرعه|حبوب|حقن|أنسولين|انسولين|ميتفورمين|أغير الدواء|اغير الدواء)/u',
        ],
        'diagnosis' => [
            '/\b(do i have|diagnose|diagnosis|my (lab|blood test|results?|sugar (reading|level|is \d))|is my (sugar|glucose|pressure|cholesterol)\b)/i',
            '/(هل عندي|هل لدي|تشخيص|تحليلاتي|نتيجت?[يى]|سكر[يى] (مرتفع|منخفض|واقف)|ضغط[يى] (مرتفع|منخفض))/u',
        ],
        'emergency' => [
            '/\b(emergency|chest pain|can.?t breathe|unconscious|severe bleeding)\b/i',
            '/(طوارئ|ألم في الصدر|الم في الصدر|لا أستطيع التنفس|غيبوبة)/u',
        ],
    ];

    /**
     * @return array{blocked: bool, intent: ?string, reply: ?string}
     */
    public function check(string $message, string $locale): array
    {
        foreach ($this->blockPatterns as $intent => $patterns) {
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $message)) {
                    return [
                        'blocked' => true,
                        'intent' => $intent,
                        'reply' => $this->refusal($intent, $locale),
                    ];
                }
            }
        }

        return ['blocked' => false, 'intent' => null, 'reply' => null];
    }

    protected function refusal(string $intent, string $locale): string
    {
        if ($locale === 'ar') {
            return match ($intent) {
                'medication' => "لا أستطيع تقديم أي إرشادات عن الأدوية أو الجرعات — هذا خارج نطاق ناتريكير تمامًا. أي أسئلة عن الدواء (بدءًا أو توقفًا أو تغيير جرعة) يجب توجيهها لطبيبك أو الصيدلي مباشرة.",
                'emergency' => "هذه قد تكون حالة طارئة. تواصل فورًا مع الطوارئ أو أقرب مستشفى. ناتريكير ليس أداة للطوارئ.",
                default => "لا أستطيع تشخيص الحالات أو تفسير نتائج التحاليل. للتشخيص استشر طبيبك. يمكنني مساعدتك في أسئلة التغذية والطعام فقط.",
            };
        }

        return match ($intent) {
            'medication' => "I can't give any guidance about medications or doses — that is fully outside NutriCare's scope. Please direct medication questions (starting, stopping, or changing a dose) to your physician or pharmacist.",
            'emergency' => "This may be an emergency. Please contact emergency services or the nearest hospital right away. NutriCare is not an emergency tool.",
            default => "I can't diagnose conditions or interpret lab results. Please see your physician for diagnosis. I can only help with food and nutrition questions.",
        };
    }

    public function disclaimer(string $locale): string
    {
        return config("ai.disclaimer.{$locale}", config('ai.disclaimer.en'));
    }
}
