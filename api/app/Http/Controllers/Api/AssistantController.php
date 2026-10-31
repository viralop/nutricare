<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Services\Ai\NutritionAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssistantController extends Controller
{
    public function __construct(protected NutritionAssistantService $assistant) {}

    public function chat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'min:2', 'max:1000'],
            'session_id' => ['nullable', 'integer', 'exists:chat_sessions,id'],
            'locale' => ['nullable', 'in:en,ar'],
        ]);

        $user = $request->user();
        $locale = $data['locale'] ?? $user->locale;

        $session = isset($data['session_id'])
            ? ChatSession::where('user_id', $user->id)->findOrFail($data['session_id'])
            : ChatSession::create(['user_id' => $user->id, 'locale' => $locale]);

        $session->messages()->create([
            'role' => 'user',
            'content' => $data['message'],
        ]);

        $answer = $this->assistant->answer($user, $data['message'], $locale);

        $session->messages()->create([
            'role' => 'assistant',
            'content' => $answer['reply'],
            'blocked' => $answer['blocked'],
        ]);

        return response()->json([
            'data' => [
                'session_id' => $session->id,
                'reply' => $answer['reply'],
                'blocked' => $answer['blocked'],
                'suggestions' => $answer['suggestions'],
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $session = ChatSession::where('user_id', $request->user()->id)
            ->latest()
            ->first();

        if (! $session) {
            return response()->json(['data' => []]);
        }

        return response()->json([
            'data' => ChatMessage::where('chat_session_id', $session->id)
                ->orderBy('id')
                ->get(['id', 'role', 'content', 'blocked', 'created_at']),
        ]);
    }
}
