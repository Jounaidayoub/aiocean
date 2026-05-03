<?php

declare(strict_types=1);

namespace App\Features\Users;

interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;
    public function findById(string $id): ?User;
}
