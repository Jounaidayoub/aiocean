<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Middleware\Pipeline;
use App\Core\Middleware\CorsMiddleware;
use App\Core\Middleware\SessionMiddleware;
use App\Core\Middleware\JsonBodyParser;
use App\Features\Tools\ToolController;
use App\Features\Tools\ToolRepository;
use App\Features\Tools\ToolService;

use App\Features\Users\UserController;
use App\Features\Users\UserRepository;
use App\Features\Users\UserService;
use PDO;

/**
 * Application kernel.
 */
final class Application
{
    private Pipeline $pipeline;
    private array $config;
    private string $basePath;

    /** @var array<string, object> */
    private array $controllers = [];

    public function __construct(string $basePath)
    {
        $this->basePath = $basePath;
        $this->config   = require $basePath . '/config/app.php';
        $this->pipeline = new Pipeline();

        $this->boot();
        $this->discoverRoutes();

        // Health check
        Router::get('/api/health', fn() => (new Response())->json([
            'status'    => 'ok',
            'timestamp' => date('c'),
            'php'       => PHP_VERSION,
        ]));

        $corsOrigin = $this->config['cors_origin'] ?? '*';
        $this->pipeline->pipe(new CorsMiddleware($corsOrigin));
        $this->pipeline->pipe(new SessionMiddleware());
        $this->pipeline->pipe(new JsonBodyParser());
    }

    public function run(): void
    {
        $request = new Request();

        $response = $this->pipeline->run($request, function (Request $req): Response {
            return $this->dispatch($req);
        });

        $response->send();
    }

    /**
     * Wire all dependencies here. One place, explicit.
     */
    private function boot(): void
    {
        $toolRepo    = new ToolRepository();
        $toolService = new ToolService($toolRepo);

        $pdo = new PDO(
            $this->config['db']['driver'] . ':' . $this->config['db']['path']
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $userRepo = new UserRepository($pdo);
        $userService = new UserService($userRepo);

        $this->controllers[ToolController::class] = new ToolController($toolService);
        $this->controllers[UserController::class] = new UserController($userService);
    }

    /**
     * Auto-discover feature route files via glob.
     */
    private function discoverRoutes(): void
    {
        foreach (glob($this->basePath . '/src/Features/*/routes.php') as $file) {
            require $file;
        }
    }

    private function dispatch(Request $request): Response
    {
        $method = $request->method();
        $path   = $request->path();

        $match = Router::resolve($method, $path);

        if ($match === null) {
            if (Router::pathExists($path)) {
                return (new Response())->json(['error' => 'Method not allowed'], 405);
            }
            return (new Response())->json(['error' => 'Not found'], 404);
        }

        $request->setRouteParams($match['params']);
        $handler = $match['handler'];

        if (is_array($handler)) {
            [$controllerClass, $method] = $handler;
            $controller = $this->controllers[$controllerClass]
                ?? throw new \RuntimeException("Controller '$controllerClass' not registered in Application::boot()");
            return $controller->$method($request);
        }

        return $handler($request);
    }
}
