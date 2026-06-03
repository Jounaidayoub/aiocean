<?php

declare(strict_types=1);

namespace App\Features\OAuth\Entities;

use League\OAuth2\Server\Entities\ScopeEntityInterface;

final class ScopeEntity implements ScopeEntityInterface
{
    public function __construct(private string $identifier) {}

    public function getIdentifier(): string
    {
        return $this->identifier;
    }

    public function jsonSerialize(): string
    {
        return $this->identifier;
    }
}
