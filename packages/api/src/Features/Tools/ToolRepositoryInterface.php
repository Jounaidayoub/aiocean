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
}
