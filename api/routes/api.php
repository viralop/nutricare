<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AssistantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FoodController;
use App\Http\Controllers\Api\MealPlanController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| NutriCare API v1
|--------------------------------------------------------------------------
*/

// Health
Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Public food browsing & analysis (guests get general-wellness verdicts)
Route::get('/foods', [FoodController::class, 'index']);
Route::get('/foods/{slug}', [FoodController::class, 'show'])->where('slug', '[a-z0-9-]+');
Route::post('/foods/analyze', [FoodController::class, 'analyze']);
Route::get('/foods/{slug}/alternatives', [FoodController::class, 'alternatives'])->where('slug', '[a-z0-9-]+');
Route::post('/foods/compare', [FoodController::class, 'compare']);

// Public catalog
Route::get('/conditions', [ProfileController::class, 'conditions']);
Route::get('/recipes', [ContentController::class, 'recipes']);
Route::get('/recipes/{slug}', [ContentController::class, 'recipe'])->where('slug', '[a-z0-9-]+');
Route::get('/articles', [ContentController::class, 'articles']);
Route::get('/articles/{slug}', [ContentController::class, 'article'])
    ->where('slug', '[a-z0-9-]+')
    ->name('articles.show');

// Authenticated
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [ProfileController::class, 'update']);

    Route::post('/assistant/chat', [AssistantController::class, 'chat']);
    Route::get('/assistant/history', [AssistantController::class, 'history']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::post('/meal-logs', [DashboardController::class, 'addMeal']);
    Route::delete('/meal-logs/{id}', [DashboardController::class, 'deleteMeal'])->whereNumber('id');
    Route::post('/water-logs', [DashboardController::class, 'addWater']);

    Route::get('/meal-plan', [MealPlanController::class, 'index']);
    Route::post('/meal-plan/regenerate', [MealPlanController::class, 'regenerate']);
    Route::post('/meal-plan/entries/{id}/replace', [MealPlanController::class, 'replaceEntry'])->whereNumber('id');

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/preferences', [NotificationController::class, 'preferences']);
    Route::put('/notifications/preferences', [NotificationController::class, 'updatePreferences']);

    Route::post('/feedback', [ContentController::class, 'storeFeedback']);

    // Admin
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/foods', [AdminController::class, 'foods']);
        Route::post('/foods', [AdminController::class, 'storeFood']);
        Route::put('/foods/{id}', [AdminController::class, 'updateFood'])->whereNumber('id');
        Route::delete('/foods/{id}', [AdminController::class, 'destroyFood'])->whereNumber('id');
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/articles', [AdminController::class, 'articles']);
        Route::post('/articles', [AdminController::class, 'storeArticle']);
        Route::put('/articles/{id}', [AdminController::class, 'updateArticle'])->whereNumber('id');
        Route::get('/feedback', [AdminController::class, 'feedback']);
    });
});
