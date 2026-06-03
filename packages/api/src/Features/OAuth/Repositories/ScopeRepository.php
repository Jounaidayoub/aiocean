<?php

declare(strict_types=1);

namespace App\Features\OAuth\Repositories;

use App\Features\OAuth\Entities\ScopeEntity;
use App\Features\Users\UserRepository;
use League\OAuth2\Server\Entities\ClientEntityInterface;
use League\OAuth2\Server\Entities\ScopeEntityInterface;
use League\OAuth2\Server\Repositories\ScopeRepositoryInterface;

final class ScopeRepository implements ScopeRepositoryInterface
{
    /** @var string[] */
    private array $supported = ['mcp:user', 'mcp:admin'];

    public function __construct(private UserRepository $users) {}

    public function getScopeEntityByIdentifier($identifier): ?ScopeEntityInterface
    {
        $identifier = (string) $identifier;
        return in_array($identifier, $this->supported, true) ? new ScopeEntity($identifier) : null;
    }

    public function finalizeScopes(array $scopes, $grantType, ClientEntityInterface $clientEntity, $userIdentifier = null): array
    {
        $user = is_string($userIdentifier) ? $this->users->findById($userIdentifier) : null;
        $allowed = $user?->role === 'admin' ? ['mcp:user', 'mcp:admin'] : ['mcp:user'];
        $requested = array_map(static fn (ScopeEntityInterface $scope) => $scope->getIdentifier(), $scopes);
        $selected = $requested === [] ? $allowed : array_values(array_intersect($requested, $allowed));

        if ($selected === []) {
            $selected = ['mcp:user'];
        }

        return array_map(static fn (string $scope) => new ScopeEntity($scope), $selected);
    }
}
