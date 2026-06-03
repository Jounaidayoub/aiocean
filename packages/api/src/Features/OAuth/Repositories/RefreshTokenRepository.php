<?php

declare(strict_types=1);

namespace App\Features\OAuth\Repositories;

use App\Features\OAuth\Entities\RefreshTokenEntity;
use League\OAuth2\Server\Entities\RefreshTokenEntityInterface;
use League\OAuth2\Server\Repositories\RefreshTokenRepositoryInterface;

final class RefreshTokenRepository implements RefreshTokenRepositoryInterface
{
    public function __construct(private FileStore $store) {}

    public function getNewRefreshToken(): RefreshTokenEntityInterface
    {
        return new RefreshTokenEntity();
    }

    public function persistNewRefreshToken(RefreshTokenEntityInterface $refreshTokenEntity): void
    {
        $this->store->put($refreshTokenEntity->getIdentifier(), [
            'access_token_id' => $refreshTokenEntity->getAccessToken()->getIdentifier(),
            'expires_at' => $refreshTokenEntity->getExpiryDateTime()->format(DATE_ATOM),
            'revoked' => false,
        ]);
    }

    public function revokeRefreshToken($tokenId): void
    {
        $this->store->markRevoked((string) $tokenId);
    }

    public function isRefreshTokenRevoked($tokenId): bool
    {
        return $this->store->isRevoked((string) $tokenId);
    }
}
