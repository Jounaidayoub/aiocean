<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Reports\ReportController;

Router::post('/api/tools/{toolId}/reports', [ReportController::class, 'create']);

Router::get('/api/admin/reports',         [ReportController::class, 'adminIndex']);
Router::delete('/api/admin/reports/{id}',  [ReportController::class, 'adminDelete']);
