<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'http://127.0.0.1:3000',
    ],

    'allowed_origins_patterns' => [
        // Public demo: any trycloudflare tunnel origin + the deployed worker
        '#^https://[a-z0-9-]+\.trycloudflare\.com$#',
        '#^https://nutricare-web\.[a-z0-9-]+\.workers\.dev$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
