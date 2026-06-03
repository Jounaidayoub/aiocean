<?php

declare(strict_types=1);

namespace App\Features\OAuth\Repositories;

use App\Features\OAuth\Entities\AccessTokenEntity;
use League\OAuth2\Server\Entities\AccessTokenEntityInterface;
use League\OAuth2\Server\Repositories\AccessTokenRepositoryInterface;

final class AccessTokenRepository implements AccessTokenRepositoryInterface
{
    public function __construct(private FileStore $store) {}

    public function getNewToken($clientEntity, array $scopes, $userIdentifier = null): AccessTokenEntityInterface
    {
        return new AccessTokenEntity();
    }

    public function persistNewAccessToken(AccessTokenEntityInterface $accessTokenEntity): void
    {
        $this->store->put($accessTokenEntity->getIdentifier(), [
            'client_id' => $accessTokenEntity->getClient()->getIdentifier(),
            'user_id' => $accessTokenEntity->getUserIdentifier(),
            'scopes' => array_map(static fn ($scope) => $scope->getIdentifier(), $accessTokenEntity->getScopes()),
            'expires_at' => $accessTokenEntity->getExpiryDateTime()->format(DATE_ATOM),
            'revoked' => false,
        ]);
    }

    public function revokeAccessToken($tokenId): void
    {
        $this->store->markRevoked((string) $tokenId);
    }

    public function isAccessTokenRevoked($tokenId): bool
    {
        return $this->store->isRevoked((string) $tokenId);
    }
}
