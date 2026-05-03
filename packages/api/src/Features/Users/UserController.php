<?php

declare(strict_types=1);

namespace App\Features\Users;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;

final class UserController extends BaseController
{
    public function __construct(
        private UserService $userService
    ) {}

    public function login(Request $request): Response
    {
        $body = $request->body();
        $email = $body['email'] ?? '';
        $password = $body['password'] ?? '';

        if (!$email || !$password) {
            return $this->json(['error' => 'Email and password are required'], 400);
        }

        $user = $this->userService->verifyCredentials($email, $password);

        if (!$user) {
            return $this->json(['error' => 'Invalid email or password'], 401);
        }

        $_SESSION['user_id'] = $user->id;

        return $this->json(['message' => 'Logged in successfully', 'user' => $user->toArray()]);
    }

    public function logout(Request $request): Response
    {
        $_SESSION = [];
        if (session_id() !== '') {
            session_destroy();
        }

        // Keep the cookie but clear server-side session
        return $this->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): Response
    {
        if (!isset($_SESSION['user_id'])) {
            return $this->json(['error' => 'Not authenticated'], 401);
        }

        $user = $this->userService->getById($_SESSION['user_id']);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 401);
        }

        return $this->json(['user' => $user->toArray()]);
    }
}
