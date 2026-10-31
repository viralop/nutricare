<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Condition;
use App\Models\HealthProfile;
use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        $profileData = $data['profile'] ?? [];

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'locale' => $data['locale'] ?? 'en',
            'role' => 'user',
        ]);

        $profile = HealthProfile::create([
            'user_id' => $user->id,
            'age' => $profileData['age'],
            'gender' => $profileData['gender'] ?? null,
            'height_cm' => $profileData['height_cm'],
            'weight_kg' => $profileData['weight_kg'],
            'activity_level' => $profileData['activity_level'] ?? 'moderate',
            'allergies' => $profileData['allergies'] ?? [],
            'dietary_preferences' => $profileData['dietary_preferences'] ?? [],
            'food_restrictions' => $profileData['food_restrictions'] ?? [],
        ]);
        $profile->daily_calorie_target = $profile->estimatedCalorieTarget();
        $profile->save();

        if (! empty($profileData['conditions'])) {
            $slugs = Condition::whereIn('slug', $profileData['conditions'])->pluck('id');
            $user->conditions()->sync($slugs);
        }

        NotificationPreference::create(['user_id' => $user->id]);

        $token = $user->createToken('nutricare-web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user->load(['profile', 'conditions'])),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        return response()->json([
            'token' => $user->createToken('nutricare-web')->plainTextToken,
            'user' => new UserResource($user->load(['profile', 'conditions'])),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load(['profile', 'conditions']));
    }
}
