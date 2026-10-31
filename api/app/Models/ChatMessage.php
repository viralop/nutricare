<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['chat_session_id', 'role', 'content', 'blocked', 'created_at'];

    protected function casts(): array
    {
        return ['blocked' => 'boolean'];
    }
}
