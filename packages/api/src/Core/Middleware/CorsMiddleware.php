<?php

declare(strict_types=1);

namespace App\Core\Middleware;

use App\Core\Request;
use App\Core\Response;

/**
 * Handles CORS headers and OPTIONS preflight requests.
 */
final class CorsMiddleware implements MiddlewareInterface
{
    public function __construct(
        private string $allowedOrigin = '*',
    ) {}

    public function handle(Request $request, callable $next): Response
    {
        // Handle preflight
        if ($request->method() === 'OPTIONS') {
            return $this->preflight();
        }

        /** @var Response $response */
        $response = $next($request);

        return $this->addCorsHeaders($response);
    }

    private function preflight(): Response
    {
        $response = new Response();
        $response->status(204)->body('');
        return $this->addCorsHeaders($response);
    }

    private function addCorsHeaders(Response $response): Response
    {
        return $response
            ->header('Access-Control-Allow-Origin', $this->allowedOrigin)
            ->header('Access-Control-Allow-Credentials', 'true')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
            ->header('Access-Control-Max-Age', '86400');
    }
}
