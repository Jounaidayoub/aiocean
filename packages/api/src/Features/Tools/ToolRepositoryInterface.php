<?php

declare(strict_types=1);

namespace App\Features\Tools;

/**
 * Contract for tool data access.
 *
 * Swap implementations (in-memory, SQL, API) without touching the service layer.
 */
interface ToolRepositoryInterface
{
    /** @return Tool[] */
    public function findAll(): array;

    public function findById(string $id): ?Tool;

    public function exists(string $id): bool;

    /** @return Tool[] */
    public function findByCategory(string $category): array;

    /** @return Tool[] */
    public function search(string $query): array;

    /** @return string[] */
    public function categories(): array;

    /** @return Tool[] */
    public function findAllAdmin(): array;

    public function create(array $data): string;

    public function update(string $id, array $data): void;

    public function delete(string $id): void;

    public function allModels(): array;
}
