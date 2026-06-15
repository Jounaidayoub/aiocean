<?php

declare(strict_types=1);

namespace App\Features\Users;

use PDO;

final class UserRepository implements UserRepositoryInterface
{
    public function __construct(private PDO $pdo) {}

    public function findByEmail(string $email): ?User
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->hydrate($row) : null;
    }

    public function findById(string $id): ?User
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->hydrate($row) : null;
    }

    public function emailExists(string $email): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM users WHERE email = ?');
        $stmt->execute([$email]);
        return (bool) $stmt->fetch();
    }

    public function create(string $id, string $name, string $email, string $passHash): User
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO users (id, name, email, pass_hash, role) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$id, $name, $email, $passHash, 'user']);

        return new User($id, $name, $email, $passHash, 'user', null);
    }

    private function hydrate(array $row): User
    {
        return new User(
            $row['id'],
            $row['name'],
            $row['email'],
            $row['pass_hash'],
            $row['role'],
            $row['pfp_url'] ?? null
        );
    }

    public function updateProfile(string $id, string $name, string $email, ?string $pfpUrl): ?User
    {
        $stmt = $this->pdo->prepare(
            'UPDATE users SET name = ?, email = ?, pfp_url = ? WHERE id = ?'
        );
        $stmt->execute([$name, $email, $pfpUrl, $id]);
        return $this->findById($id);
    }


    public function updatePassword(string $id, string $passHash): void
    {
        $stmt = $this->pdo->prepare('UPDATE users SET pass_hash = ? WHERE id = ?');
        $stmt->execute([$passHash, $id]);
    }

    public function falsemail(string $email, string $userId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM users WHERE email = ? AND id != ?'
        );
        $stmt->execute([$email, $userId]);
        return (bool) $stmt->fetch();
    }

    /** @return User[] */
    public function findAll(): array
    {
        $stmt = $this->pdo->query("SELECT * FROM users ORDER BY name");
        return array_map(
            fn(array $row) => $this->hydrate($row),
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    public function updateUser(string $id, array $data): void
    {
        $fields = [];
        $params = [];
        
        $allowedFields = ['name', 'email', 'role', 'pfp_url'];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $fieldsStr = implode(', ', $fields);
            $params[] = $id;
            $stmt = $this->pdo->prepare("UPDATE users SET $fieldsStr WHERE id = ?");
            $stmt->execute($params);
        }
    }

    public function deleteUser(string $id): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("DELETE FROM reviews WHERE user_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM votes WHERE user_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM reports WHERE user_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM password_resets WHERE user_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM collections WHERE user_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM oauth_auth_codes WHERE user_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM oauth_access_tokens WHERE user_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM oauth_refresh_tokens WHERE user_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM submissions WHERE submitted_by = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
