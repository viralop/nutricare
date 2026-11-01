<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function preferences(Request $request): JsonResponse
    {
        $pref = NotificationPreference::firstOrCreate(['user_id' => $request->user()->id]);

        return response()->json(['data' => $pref]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $data = $request->validate([
            'water_reminders' => ['sometimes', 'boolean'],
            'meal_reminders' => ['sometimes', 'boolean'],
            'daily_tips' => ['sometimes', 'boolean'],
            'weekly_summary' => ['sometimes', 'boolean'],
            'plan_reminders' => ['sometimes', 'boolean'],
            'quiet_hours_start' => ['sometimes', 'nullable', 'date_format:H:i'],
            'quiet_hours_end' => ['sometimes', 'nullable', 'date_format:H:i'],
        ]);

        $pref = NotificationPreference::firstOrCreate(['user_id' => $request->user()->id]);
        $pref->update($data);

        return response()->json(['data' => $pref->fresh()]);
    }

    /**
     * In-site notification feed (tips, reminders) shown on the website.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $pref = NotificationPreference::firstOrCreate(['user_id' => $user->id]);
        $explicit = $request->input('locale');
        $header = (string) $request->header('Accept-Language', '');
        $locale = is_string($explicit) && in_array($explicit, ['en', 'ar'], true)
            ? $explicit
            : (str_starts_with($header, 'ar') ? 'ar' : (str_starts_with($header, 'en') ? 'en' : ($user->locale ?? 'en')));
        $ar = $locale === 'ar';

        $items = [];
        if ($pref->water_reminders) {
            $items[] = ['type' => 'water', 'title' => $ar ? 'وقت الماء' : 'Water time', 'body' => $ar ? 'اشرب كوب ماء الآن وابقَ منتعشًا.' : 'Have a glass of water now and stay refreshed.'];
        }
        if ($pref->meal_reminders) {
            $items[] = ['type' => 'meal', 'title' => $ar ? 'سجل وجبتك' : 'Log your meal', 'body' => $ar ? 'لا تنسَ تسجيل وجبتك لمتابعة أهدافك اليومية.' : 'Don\'t forget to log your meal to track today\'s goals.'];
        }
        if ($pref->daily_tips) {
            $items[] = ['type' => 'tip', 'title' => $ar ? 'نصيحة اليوم' : 'Tip of the day', 'body' => $ar ? 'استبدل المشروبات المحلاة بالماء أو الشاي بدون سكر — تقليل السكر الحر يخفض السعرات بسرعة.' : 'Swap sweetened drinks for water or unsweetened tea — cutting free sugar trims calories fast.'];
        }
        if ($pref->weekly_summary) {
            $items[] = ['type' => 'summary', 'title' => $ar ? 'ملخص الأسبوع' : 'Weekly summary', 'body' => $ar ? 'راجع متوسط استهلاكك للسكر والصوديوم هذا الأسبوع من لوحة التحكم.' : 'Review this week\'s average sugar and sodium from the dashboard.'];
        }
        if ($pref->plan_reminders) {
            $items[] = ['type' => 'plan', 'title' => $ar ? 'خطة الوجبات' : 'Meal plan', 'body' => $ar ? 'ألقِ نظرة على وجبات الغد من خطتك الأسبوعية.' : 'Check tomorrow\'s meals in your weekly plan.'];
        }

        return response()->json(['data' => $items]);
    }
}
