<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\OAuth\OAuthController;

Router::get('/.well-known/oauth-authorization-server', [OAuthController::class, 'discovery']);
Router::get('/oauth/authorize', [OAuthController::class, 'authorize']);
Router::post('/oauth/authorize', [OAuthController::class, 'approve']);
Router::post('/oauth/token', [OAuthController::class, 'token']);
