<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use App\Features\OAuth\Repositories\AccessTokenRepository;
use App\Features\OAuth\Repositories\AuthCodeRepository;
use App\Features\OAuth\Repositories\ClientRepository;
use App\Features\OAuth\Repositories\RefreshTokenRepository;
use App\Features\OAuth\Repositories\ScopeRepository;
use DateInterval;
use League\OAuth2\Server\AuthorizationServer;
use League\OAuth2\Server\Grant\AuthCodeGrant;
use League\OAuth2\Server\CryptKey;

final class OAuthServerFactory
{
    public function __construct(
        private ClientRepository $clients,
        private ScopeRepository $scopes,
        private AccessTokenRepository $accessTokens,
        private AuthCodeRepository $authCodes,
        private RefreshTokenRepository $refreshTokens,
        private array $config,
    ) {}

    public function make(): AuthorizationServer
    {
        $server = new AuthorizationServer(
            $this->clients,
            $this->accessTokens,
            $this->scopes,
            new CryptKey($this->config['private_key_path'], null, false),
            $this->config['encryption_key'],
        );

        $grant = new AuthCodeGrant(
            $this->authCodes,
            $this->refreshTokens,
            new DateInterval($this->config['auth_code_ttl']),
        );
        $grant->setRefreshTokenTTL(new DateInterval($this->config['refresh_token_ttl']));
        $server->enableGrantType($grant, new DateInterval($this->config['access_token_ttl']));

        return $server;
    }
}
