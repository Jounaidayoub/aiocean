<?php

declare(strict_types=1);

namespace App\Features\OAuth\Repositories;

final class FileStore
{
    public function __construct(private string $path)
    {
        if (!is_dir(dirname($this->path))) {
            mkdir(dirname($this->path), 0700, true);
        }
        if (!is_file($this->path)) {
            file_put_contents($this->path, json_encode(new \stdClass(), JSON_PRETTY_PRINT));
        }
    }

    public function put(string $id, array $record): void
    {
        $records = $this->readAll();
        $records[$id] = $record;
        $this->writeAll($records);
    }

    public function get(string $id): ?array
    {
        $records = $this->readAll();
        return $records[$id] ?? null;
    }

    public function markRevoked(string $id): void
    {
        $records = $this->readAll();
        $records[$id] = array_merge($records[$id] ?? [], ['revoked' => true]);
        $this->writeAll($records);
    }

    public function isRevoked(string $id): bool
    {
        return (bool) (($this->get($id)['revoked'] ?? false));
    }

    private function readAll(): array
    {
        $json = file_get_contents($this->path);
        $decoded = json_decode($json ?: '{}', true);
        return is_array($decoded) ? $decoded : [];
    }

    private function writeAll(array $records): void
    {
        file_put_contents($this->path, json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
    }
}
