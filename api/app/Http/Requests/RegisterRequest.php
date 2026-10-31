<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'locale' => ['nullable', Rule::in(['en', 'ar'])],
            'profile.age' => ['required', 'integer', 'between:10,110'],
            'profile.gender' => ['nullable', Rule::in(['male', 'female'])],
            'profile.height_cm' => ['required', 'numeric', 'between:100,230'],
            'profile.weight_kg' => ['required', 'numeric', 'between:30,300'],
            'profile.activity_level' => ['required', Rule::in(['sedentary', 'light', 'moderate', 'active', 'very_active'])],
            'profile.allergies' => ['nullable', 'array'],
            'profile.allergies.*' => ['string', 'max:60'],
            'profile.dietary_preferences' => ['nullable', 'array'],
            'profile.dietary_preferences.*' => ['string', 'max:60'],
            'profile.food_restrictions' => ['nullable', 'array'],
            'profile.food_restrictions.*' => ['string', 'max:60'],
            'profile.conditions' => ['nullable', 'array'],
            'profile.conditions.*' => ['string', 'exists:conditions,slug'],
        ];
    }
}
