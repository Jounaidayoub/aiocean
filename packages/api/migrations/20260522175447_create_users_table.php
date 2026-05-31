<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateUsersTable extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                pass_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                pfp_url TEXT
            )
        ");
    }

    public function down(): void
    {
        $this->execute('DROP TABLE IF EXISTS users');
    }
}
