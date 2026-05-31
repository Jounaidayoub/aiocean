<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Static router. Register routes from anywhere — no instance passing needed.
 *
 * Usage in any feature routes.php:
 *   Router::get('/api/tools', [ToolController::class, 'index']);
 */
final class Router
{
    /** @var array{method: string, pattern: string, handler: array|callable}[] */
    private static array $routes = [];
    private static string $prefix = '';

    public static function get(string $path, array|callable $handler): void
    {
        self::addRoute('GET', $path, $handler);
    }

    public static function post(string $path, array|callable $handler): void
    {
        self::addRoute('POST', $path, $handler);
    }

    public static function put(string $path, array|callable $handler): void
    {
        self::addRoute('PUT', $path, $handler);
    }

    public static function patch(string $path, array|callable $handler): void
    {
        self::addRoute('PATCH', $path, $handler);
    }

    public static function delete(string $path, array|callable $handler): void
    {
        self::addRoute('DELETE', $path, $handler);
    }

    /**
     * Group routes under a common prefix.
     */
    public static function group(string $prefix, callable $callback): void
    {
        $prev = self::$prefix;
        self::$prefix = $prev . $prefix;
        $callback();
        self::$prefix = $prev;
    }

    /**
     * Resolve a request to a route match.
     *
     * @return array{handler: array|callable, params: array}|null
     */
    public static function resolve(string $method, string $path): ?array
    {
        foreach (self::$routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $pattern = self::toRegex($route['pattern']);

            if (preg_match($pattern, $path, $matches)) {
                $params = array_filter($matches, fn($key) => is_string($key), ARRAY_FILTER_USE_KEY);
                return [
                    'handler' => $route['handler'],
                    'params'  => $params,
                ];
            }
        }

        return null;
    }

    /**
     * Check if any route matches the path regardless of method (for 405).
     */
    public static function pathExists(string $path): bool
    {
        foreach (self::$routes as $route) {
            if (preg_match(self::toRegex($route['pattern']), $path)) {
                return true;
            }
        }
        return false;
    }

    private static function addRoute(string $method, string $path, array|callable $handler): void
    {
        self::$routes[] = [
            'method'  => $method,
            'pattern' => self::$prefix . $path,
            'handler' => $handler,
        ];
    }

    private static function toRegex(string $pattern): string
    {
        $regex = preg_replace_callback('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', function ($m) {
            return '(?P<' . $m[1] . '>[^/]+)';
        }, $pattern);

        return '#^' . $regex . '$#';
    }
}
