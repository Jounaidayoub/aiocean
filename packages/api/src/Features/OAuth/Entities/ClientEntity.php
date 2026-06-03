<?php

declare(strict_types=1);

namespace App\Features\OAuth\Entities;

use League\OAuth2\Server\Entities\ClientEntityInterface;

final class ClientEntity implements ClientEntityInterface
{
    public function __construct(
        private string $identifier,
        private string $name,
        private string|array $redirectUri,
        private bool $confidential = false,
    ) {}

    public function getIdentifier(): string
    {
        return $this->identifier;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getRedirectUri(): string|array
    {
        return $this->redirectUri;
    }

    public function isConfidential(): bool
    {
        return $this->confidential;
    }
}
