<?php

declare(strict_types=1);

/**
 * Application configuration.
 *
 * Reads from .env file if present, falls back to sensible defaults.
 */

// Load .env if it exists
$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#')) {
            continue;
        }
        if (str_contains($line, '=')) {
            [$key, $value] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

return [
    'env'         => $_ENV['APP_ENV']     ?? 'development',
    'debug'       => ($_ENV['APP_DEBUG']  ?? 'true') === 'true',
    'cors_origin' => $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173',

    'db' => [
        'driver' => $_ENV['DB_DRIVER'] ?? 'sqlite',
        'path'   => $_ENV['DB_PATH'] ?? dirname(__DIR__) . '/database.sqlite',
    ],
];
