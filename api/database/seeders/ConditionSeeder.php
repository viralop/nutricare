<?php

namespace Database\Seeders;

use App\Models\Condition;
use Illuminate\Database\Seeder;

class ConditionSeeder extends Seeder
{
    public function run(): void
    {
        $conditions = [
            ['slug' => 'diabetes_t1', 'name_en' => 'Diabetes — Type 1', 'name_ar' => 'سكري النوع الأول',
                'description_en' => 'Carbohydrate counting and consistent timing matter most.',
                'description_ar' => 'عدّ الكربوهيدرات والانتظام في المواعيد هما الأهم.'],
            ['slug' => 'diabetes_t2', 'name_en' => 'Diabetes — Type 2', 'name_ar' => 'سكري النوع الثاني',
                'description_en' => 'Portion control, fiber and limiting free sugars help manage glucose.',
                'description_ar' => 'ضبط الكميات والألياف وتقليل السكريات الحرة تساعد في ضبط الجلوكوز.'],
            ['slug' => 'hypertension', 'name_en' => 'High blood pressure', 'name_ar' => 'ضغط الدم المرتفع',
                'description_en' => 'Keeping sodium under 2,300 mg/day (ideal 1,500) is the dietary priority.',
                'description_ar' => 'إبقاء الصوديوم تحت ٢٣٠٠ مجم يوميًا (والأمثل ١٥٠٠) هو الأولوية الغذائية.'],
            ['slug' => 'high_cholesterol', 'name_en' => 'High cholesterol', 'name_ar' => 'الكوليسترول المرتفع',
                'description_en' => 'Limiting saturated fat (AHA < 13 g/day) and eating soluble fiber.',
                'description_ar' => 'تقليل الدهون المشبعة (أقل من ١٣ جم يوميًا) وتناول الألياف الذائبة.'],
            ['slug' => 'heart_disease', 'name_en' => 'Heart disease', 'name_ar' => 'أمراض القلب',
                'description_en' => 'A Mediterranean-style pattern: vegetables, fish, olive oil; low sodium and sat fat.',
                'description_ar' => 'نمط متوسطي: خضروات وسمك وزيت زيتون؛ مع صوديوم ودهون مشبعة منخفضة.'],
            ['slug' => 'obesity', 'name_en' => 'Obesity / weight management', 'name_ar' => 'السمنة وإدارة الوزن',
                'description_en' => 'Lower energy density, protein at each meal, and steady habits.',
                'description_ar' => 'كثافة طاقية أقل وبروتين في كل وجبة وعادات ثابتة.'],
            ['slug' => 'general_wellness', 'name_en' => 'Healthy lifestyle', 'name_ar' => 'نمط حياة صحي',
                'description_en' => 'Balanced eating to maintain your health.',
                'description_ar' => 'أكل متوازن للحفاظ على صحتك.'],
        ];

        foreach ($conditions as $c) {
            Condition::updateOrCreate(['slug' => $c['slug']], $c);
        }
    }
}
