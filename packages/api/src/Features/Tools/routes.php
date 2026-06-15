<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Tools\ToolController;

Router::get('/api/tools',      [ToolController::class, 'index']);
Router::get('/api/tools/{id}', [ToolController::class, 'show']);
Router::get('/api/categories', [ToolController::class, 'categories']);

Router::get('/api/admin/tools',         [ToolController::class, 'adminIndex']);
Router::post('/api/admin/tools',        [ToolController::class, 'create']);
Router::patch('/api/admin/tools/{id}',  [ToolController::class, 'update']);
Router::delete('/api/admin/tools/{id}', [ToolController::class, 'delete']);
Router::get('/api/admin/models',        [ToolController::class, 'adminModels']);

