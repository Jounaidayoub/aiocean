<?php

declare(strict_types=1);

namespace App\Features\Users;

final class UserService
{
    public function __construct(
        private UserRepositoryInterface $userRepository
    ) {}

    public function verifyCredentials(string $email, string $password): ?User
    {
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            return null;
        }

        if (password_verify($password, $user->pass_hash)) {
            return $user;
        }

        return null;
    }

    public function getById(string $id): ?User
    {
        return $this->userRepository->findById($id);
    }
}
