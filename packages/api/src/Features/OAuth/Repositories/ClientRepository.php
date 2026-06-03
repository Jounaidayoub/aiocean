<?php

declare(strict_types=1);

namespace App\Features\OAuth\Repositories;

use App\Features\OAuth\Entities\ClientEntity;
use League\OAuth2\Server\Entities\ClientEntityInterface;
use League\OAuth2\Server\Repositories\ClientRepositoryInterface;

final class ClientRepository implements ClientRepositoryInterface
{
    public function __construct(private array $config) {}

    public function getClientEntity($clientIdentifier): ?ClientEntityInterface
    {
        if ((string) $clientIdentifier !== $this->config['client_id']) {
            return null;
        }

        return new ClientEntity(
            $this->config['client_id'],
            $this->config['client_name'],
            $this->config['redirect_uris'],
            (bool) ($this->config['client_secret'] ?? false),
        );
    }

    public function validateClient($clientIdentifier, $clientSecret, $grantType): bool
    {
        if ((string) $clientIdentifier !== $this->config['client_id']) {
            return false;
        }

        $expectedSecret = $this->config['client_secret'] ?? '';
        if ($expectedSecret === '') {
            return true;
        }

        return is_string($clientSecret) && hash_equals($expectedSecret, $clientSecret);
    }
}
