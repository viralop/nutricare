<?php

/**
 * AI provider configuration.
 *
 * The assistant is behind the NutritionAssistantService interface. The default
 * 'none' provider uses the offline TemplateAssistantEngine (rules + food DB, no
 * external calls). To plug in an OpenAI-compatible LLM later, set provider to
 * 'openai-compatible' and fill endpoint/key/model — no code changes needed.
 */
return [
    'provider' => env('AI_PROVIDER', 'none'),

    'openai_compatible' => [
        'endpoint' => env('AI_ENDPOINT', 'https://api.openai.com/v1/chat/completions'),
        'api_key' => env('AI_KEY'),
        'model' => env('AI_MODEL', 'gpt-4o-mini'),
        'timeout' => 30,
    ],

    // Appended to every assistant answer (bilingual keys rendered by the client).
    'disclaimer' => [
        'en' => 'NutriCare provides nutrition education, not medical advice. For personal guidance consult a registered dietitian or your physician.',
        'ar' => 'يقدم ناتريكير تثقيفًا غذائيًا وليس نصيحة طبية. للتوجيه الشخصي استشر أخصائي تغذية مسجلاً أو طبيبك.',
    ],
];
