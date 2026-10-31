<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\ConditionResource;
use App\Http\Resources\UserResource;
use App\Models\Condition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function conditions(): JsonResponse
    {
        return response()->json([
            'data' => ConditionResource::collection(Condition::all()),
        ]);
    }

    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $data = $request->validated();

        if (isset($data['locale'])) {
            $user->locale = $data['locale'];
            $user->save();
            unset($data['locale']);
        }

        if (isset($data['conditions'])) {
            $ids = Condition::whereIn('slug', $data['conditions'])->pluck('id');
            $user->conditions()->sync($ids);
            unset($data['conditions']);
        }

        $profile = $user->profile;
        if ($profile) {
            // Recompute the calorie estimate only when body metrics changed and the
            // user hasn't set an explicit override yet.
            $metricsChanged = collect(['age', 'gender', 'height_cm', 'weight_kg', 'activity_level'])
                ->contains(fn ($f) => isset($data[$f]));
            if ($metricsChanged && ! isset($data['daily_calorie_target'])) {
                $profile->fill(collect($data)->only([
                    'age', 'gender', 'height_cm', 'weight_kg', 'activity_level',
                ])->all());
                $data['daily_calorie_target'] = $profile->estimatedCalorieTarget();
            }
            $profile->fill(collect($data)->except(['conditions', 'locale'])->all());
            $profile->save();
        }

        return new UserResource($user->fresh(['profile', 'conditions']));
    }
}
