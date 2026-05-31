<?php

declare(strict_types=1);

namespace App\Features\Tools;

interface ToolLookupInterface
{
    public function exists(string $id): bool;
}
