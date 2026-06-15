<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddActiveToUsers extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1");
    }

    public function down(): void
    {
        $this->execute("ALTER TABLE users DROP COLUMN active");
    }
}
