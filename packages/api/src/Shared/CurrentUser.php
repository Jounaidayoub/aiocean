<?php

declare(strict_types=1);

namespace App\Shared;

final class CurrentUser
{
    public function id(): ?string
    {
        return $_SESSION['user_id'] ?? null;
    }

    public function role(): ?string
    {
        return $_SESSION['user_role'] ?? null;
    }

    public function isAdmin(): bool
    {
        return $this->role() === 'admin';
    }
}
