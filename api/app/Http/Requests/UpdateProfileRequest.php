<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'age' => ['sometimes', 'integer', 'between:10,110'],
            'gender' => ['sometimes', 'nullable', Rule::in(['male', 'female'])],
            'height_cm' => ['sometimes', 'numeric', 'between:100,230'],
            'weight_kg' => ['sometimes', 'numeric', 'between:30,300'],
            'activity_level' => ['sometimes', Rule::in(['sedentary', 'light', 'moderate', 'active', 'very_active'])],
            'allergies' => ['sometimes', 'array'],
            'allergies.*' => ['string', 'max:60'],
            'dietary_preferences' => ['sometimes', 'array'],
            'dietary_preferences.*' => ['string', 'max:60'],
            'food_restrictions' => ['sometimes', 'array'],
            'food_restrictions.*' => ['string', 'max:60'],
            'daily_calorie_target' => ['sometimes', 'nullable', 'integer', 'between:800,5000'],
            'daily_water_target_ml' => ['sometimes', 'integer', 'between:500,6000'],
            'locale' => ['sometimes', Rule::in(['en', 'ar'])],
            'conditions' => ['sometimes', 'array'],
            'conditions.*' => ['string', 'exists:conditions,slug'],
        ];
    }
}
