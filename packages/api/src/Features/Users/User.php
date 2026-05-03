<?php

declare(strict_types=1);

namespace App\Features\Users;

final class User
{
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public string $pass_hash,
        public string $role = 'user',
        public ?string $pfp_url = null
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'pfp_url' => $this->pfp_url,
        ];
    }
}
