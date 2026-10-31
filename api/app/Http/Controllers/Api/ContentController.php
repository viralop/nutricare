<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\RecipeResource;
use App\Models\Article;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ContentController extends Controller
{
    public function recipes(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'meal_type' => ['nullable', 'in:breakfast,lunch,dinner,snack'],
            'q' => ['nullable', 'string', 'max:80'],
        ]);

        return RecipeResource::collection(
            Recipe::where('is_published', true)
                ->when($request->filled('meal_type'), fn ($q) => $q->where('meal_type', $request->meal_type))
                ->when($request->filled('q'), function ($query) use ($request) {
                    $s = $request->string('q');
                    $query->where(fn ($inner) => $inner
                        ->where('title_en', 'like', "%{$s}%")
                        ->orWhere('title_ar', 'like', "%{$s}%"));
                })
                ->with('ingredients.food')
                ->orderBy('title_en')
                ->get()
        );
    }

    public function recipe(string $slug): JsonResponse
    {
        $recipe = Recipe::where('slug', $slug)->where('is_published', true)
            ->with('ingredients.food')->firstOrFail();

        return response()->json(['data' => new RecipeResource($recipe)]);
    }

    public function articles(Request $request): AnonymousResourceCollection
    {
        $request->validate(['category' => ['nullable', 'string', 'max:20']]);

        return ArticleResource::collection(
            Article::where('is_published', true)
                ->when($request->filled('category'), fn ($q) => $q->where('category', $request->category))
                ->orderByDesc('id')
                ->get()
        );
    }

    public function article(string $slug): JsonResponse
    {
        $article = Article::where('slug', $slug)->where('is_published', true)->firstOrFail();

        return response()->json(['data' => new ArticleResource($article)]);
    }

    public function storeFeedback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'min:5', 'max:2000'],
            'category' => ['nullable', 'string', 'max:40'],
        ]);

        $request->user()->feedback()->create($data + ['status' => 'new']);

        return response()->json(['message' => 'Feedback received. Thank you!'], 201);
    }
}
