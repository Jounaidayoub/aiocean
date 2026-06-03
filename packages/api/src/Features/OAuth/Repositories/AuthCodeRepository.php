<?php

declare(strict_types=1);

namespace App\Features\OAuth\Repositories;

use App\Features\OAuth\Entities\AuthCodeEntity;
use League\OAuth2\Server\Entities\AuthCodeEntityInterface;
use League\OAuth2\Server\Repositories\AuthCodeRepositoryInterface;

final class AuthCodeRepository implements AuthCodeRepositoryInterface
{
    public function __construct(private FileStore $store) {}

    public function getNewAuthCode(): AuthCodeEntityInterface
    {
        return new AuthCodeEntity();
    }

    public function persistNewAuthCode(AuthCodeEntityInterface $authCodeEntity): void
    {
        $this->store->put($authCodeEntity->getIdentifier(), [
            'client_id' => $authCodeEntity->getClient()->getIdentifier(),
            'user_id' => $authCodeEntity->getUserIdentifier(),
            'redirect_uri' => $authCodeEntity->getRedirectUri(),
            'scopes' => array_map(static fn ($scope) => $scope->getIdentifier(), $authCodeEntity->getScopes()),
            'expires_at' => $authCodeEntity->getExpiryDateTime()->format(DATE_ATOM),
            'revoked' => false,
        ]);
    }

    public function revokeAuthCode($codeId): void
    {
        $this->store->markRevoked((string) $codeId);
    }

    public function isAuthCodeRevoked($codeId): bool
    {
        return $this->store->isRevoked((string) $codeId);
    }
}
