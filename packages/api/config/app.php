<?php

declare(strict_types=1);

/**
 * Application configuration.
 *
 * Reads from .env file if present, falls back to sensible defaults.
 */

// Load .env if it exists
$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

return [
    'env'         => $_ENV['APP_ENV']     ?? 'development',
    'debug'       => ($_ENV['APP_DEBUG']  ?? 'true') === 'true',
    'cors_origin' => $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173',

    'db' => [
        'driver' => ($_ENV['DB_DRIVER'] ?? '') ?: 'sqlite',
        'path'   => ($_ENV['DB_PATH'] ?? '') ?: dirname(__DIR__) . '/database.sqlite',
    ],

    'email' => [
        'api_key' => $_ENV['RESEND_API_KEY'] ?? '',
        'from'    => $_ENV['RESEND_FROM']    ?? 'AI Ocean <noreply@aiocean.dev>',
    ],

    'agent_webhook_url' => $_ENV['AGENT_WEBHOOK_URL'] ?? 'http://localhost:3001/api/agent/review',


    'oauth' => [
        'issuer' => rtrim($_ENV['OAUTH_ISSUER'] ?? 'http://localhost:8080', '/'),
        'login_url' => $_ENV['OAUTH_LOGIN_URL'] ?? (($_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173') . '/login'),
        'client_id' => $_ENV['OAUTH_MCP_CLIENT_ID'] ?? 'aiocean-ai-agent',
        'client_secret' => $_ENV['OAUTH_MCP_CLIENT_SECRET'] ?? '',
        'client_name' => $_ENV['OAUTH_MCP_CLIENT_NAME'] ?? 'AI Ocean MCP Agent',
        'redirect_uris' => array_filter(array_map('trim', explode(',', $_ENV['OAUTH_MCP_REDIRECT_URIS'] ?? 'http://localhost:3001/oauth/callback'))),
        'private_key_path' => $_ENV['OAUTH_PRIVATE_KEY_PATH'] ?? dirname(__DIR__) . '/storage/oauth/private.key',
        'public_key_path' => $_ENV['OAUTH_PUBLIC_KEY_PATH'] ?? dirname(__DIR__) . '/storage/oauth/public.key',
        'encryption_key' => $_ENV['OAUTH_ENCRYPTION_KEY'] ?? 'aiocean-dev-oauth-encryption-key-32-bytes',
        'auth_code_ttl' => $_ENV['OAUTH_AUTH_CODE_TTL'] ?? 'PT10M',
        'access_token_ttl' => $_ENV['OAUTH_ACCESS_TOKEN_TTL'] ?? 'PT1H',
        'refresh_token_ttl' => $_ENV['OAUTH_REFRESH_TOKEN_TTL'] ?? 'P30D',
    ],
];
