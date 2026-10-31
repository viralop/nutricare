<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\FoodResource;
use App\Models\Article;
use App\Models\Food;
use App\Models\FoodAnalysisLog;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'users' => User::count(),
                'foods' => Food::count(),
                'verified_foods' => Food::where('is_verified', true)->count(),
                'estimated_foods' => Food::where('source_type', 'regional_estimate')->count(),
                'recipes' => Recipe::count(),
                'articles' => Article::count(),
                'analyses' => FoodAnalysisLog::count(),
                'top_foods' => FoodAnalysisLog::with('food:id,slug,name_en,name_ar,image_emoji')
                    ->select('food_id', DB::raw('count(*) as total'))
                    ->groupBy('food_id')
                    ->orderByDesc('total')
                    ->limit(8)
                    ->get()
                    ->map(fn ($row) => [
                        'total' => $row->total,
                        'food' => new FoodResource($row->food),
                    ]),
            ],
        ]);
    }

    public function foods(Request $request): AnonymousResourceCollection
    {
        return FoodResource::collection(
            Food::when($request->filled('q'), function ($query) use ($request) {
                $s = trim((string) $request->string('q'));
                $query->where(fn ($inner) => $inner
                    ->where('name_en', 'like', "%{$s}%")
                    ->orWhere('name_ar', 'like', "%{$s}%"));
            })
                ->orderBy('name_en')
                ->paginate($request->integer('per_page', 20))
        );
    }

    public function storeFood(Request $request): JsonResponse
    {
        $food = Food::create($this->foodRules($request));

        return response()->json(['data' => new FoodResource($food)], 201);
    }

    public function updateFood(Request $request, int $id): JsonResponse
    {
        $food = Food::findOrFail($id);
        $food->update($this->foodRules($request, $food->slug));

        return response()->json(['data' => new FoodResource($food->fresh())]);
    }

    public function destroyFood(int $id): JsonResponse
    {
        $food = Food::findOrFail($id);
        if ($food->analysisLogs()->exists() || $food->mealLogs()->exists()) {
            // Keep history intact — retire the row instead of deleting it.
            $food->update(['status' => 'draft']);

            return response()->json(['message' => 'Food is referenced by history; it was unpublished (draft) instead of deleted.']);
        }
        $food->delete();

        return response()->json(['message' => 'Food deleted.']);
    }

    public function users(Request $request): JsonResponse
    {
        $users = User::with('conditions', 'profile')
            ->when($request->filled('q'), function ($query) use ($request) {
                $s = trim((string) $request->string('q'));
                $query->where(fn ($inner) => $inner
                    ->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%"));
            })
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $users->through(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'locale' => $u->locale,
            'created_at' => $u->created_at?->toIso8601String(),
            'conditions' => $u->conditions->map(fn ($c) => ['slug' => $c->slug, 'name' => $c->name_en]),
        ])]);
    }

    public function articles(): AnonymousResourceCollection
    {
        return ArticleResource::collection(Article::orderByDesc('id')->get());
    }

    public function storeArticle(Request $request): JsonResponse
    {
        $data = $this->articleRules($request);
        $data['reviewed_by_admin'] = true;
        $article = Article::create($data);

        return response()->json(['data' => new ArticleResource($article)], 201);
    }

    public function updateArticle(Request $request, int $id): JsonResponse
    {
        $article = Article::findOrFail($id);
        $article->update($this->articleRules($request));

        return response()->json(['data' => new ArticleResource($article->fresh())]);
    }

    public function feedback(): JsonResponse
    {
        return response()->json(['data' => \App\Models\Feedback::with('user:id,name,email')
            ->orderByDesc('id')->limit(50)->get()->map(fn ($f) => [
                'id' => $f->id,
                'message' => $f->message,
                'category' => $f->category,
                'status' => $f->status,
                'user' => ['name' => $f->user?->name, 'email' => $f->user?->email],
                'created_at' => $f->created_at?->toIso8601String(),
            ])]);
    }

    protected function foodRules(Request $request, ?string $currentSlug = null): array
    {
        $slugRule = $currentSlug
            ? ['sometimes', 'string', 'max:80', Rule::unique('foods', 'slug')->ignore($currentSlug, 'slug')]
            : ['required', 'string', 'max:80', 'unique:foods,slug'];

        $data = $request->validate([
            'slug' => $slugRule,
            'name_en' => ['sometimes', 'required', 'string', 'max:120'],
            'name_ar' => ['sometimes', 'required', 'string', 'max:120'],
            'category' => ['sometimes', Rule::in(['grain', 'vegetable', 'fruit', 'meat', 'fish', 'dairy', 'legume', 'dish', 'drink', 'snack', 'sweet', 'packaged', 'sauce', 'fat', 'nut'])],
            'cuisine' => ['sometimes', Rule::in(['egyptian', 'sudanese', 'arab', 'international'])],
            'energy_kcal' => ['sometimes', 'nullable', 'numeric', 'between:0,950'],
            'carbohydrate_g' => ['sometimes', 'nullable', 'numeric', 'between:0,100'],
            'sugar_g' => ['sometimes', 'nullable', 'numeric', 'between:0,100'],
            'protein_g' => ['sometimes', 'nullable', 'numeric', 'between:0,100'],
            'total_fat_g' => ['sometimes', 'nullable', 'numeric', 'between:0,100'],
            'sat_fat_g' => ['sometimes', 'nullable', 'numeric', 'between:0,100'],
            'sodium_mg' => ['sometimes', 'nullable', 'numeric', 'between:0,10000'],
            'fiber_g' => ['sometimes', 'nullable', 'numeric', 'between:0,90'],
            'serving_size_g' => ['sometimes', 'numeric', 'between:1,2000'],
            'serving_label_en' => ['sometimes', 'string', 'max:60'],
            'serving_label_ar' => ['sometimes', 'string', 'max:60'],
            'source_type' => ['sometimes', Rule::in(['usda', 'regional_estimate', 'brand_label'])],
            'source_reference' => ['sometimes', 'nullable', 'string', 'max:255'],
            'source_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'is_verified' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['published', 'draft'])],
            'image_emoji' => ['sometimes', 'string', 'max:8'],
        ]);

        // Guardrail: only verified USDA/label rows may flip is_verified on estimates
        // without a reference.
        if (($data['is_verified'] ?? false) && ($data['source_type'] ?? '') !== 'usda'
            && empty($data['source_reference']) && empty($request->input('source_reference'))) {
            $data['is_verified'] = false;
        }

        return $data;
    }

    protected function articleRules(Request $request): array
    {
        return $request->validate([
            'slug' => ['required', 'string', 'max:90'],
            'category' => ['required', Rule::in(['diabetes', 'hypertension', 'cholesterol', 'heart', 'obesity', 'general', 'cooking', 'labels', 'myths'])],
            'title_en' => ['required', 'string', 'max:160'],
            'title_ar' => ['required', 'string', 'max:160'],
            'excerpt_en' => ['nullable', 'string', 'max:400'],
            'excerpt_ar' => ['nullable', 'string', 'max:400'],
            'body_en' => ['required', 'string'],
            'body_ar' => ['required', 'string'],
            'sources' => ['required', 'array', 'min:1'],
            'sources.*.label' => ['required', 'string', 'max:120'],
            'sources.*.url' => ['required', 'url'],
            'read_minutes' => ['sometimes', 'integer', 'between:1,60'],
            'is_published' => ['sometimes', 'boolean'],
        ]);
    }
}
