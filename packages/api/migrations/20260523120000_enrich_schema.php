<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class EnrichSchema extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("ALTER TABLE providers ADD COLUMN npm TEXT");
        $this->execute("ALTER TABLE providers ADD COLUMN doc TEXT");
        $this->execute("ALTER TABLE providers ADD COLUMN env TEXT");

        $this->execute("ALTER TABLE models ADD COLUMN family TEXT");

        $this->execute("ALTER TABLE models DROP COLUMN reasoning");
        $this->execute("ALTER TABLE models DROP COLUMN cost_per_1m_tokens_in");
        $this->execute("ALTER TABLE models DROP COLUMN cost_per_1m_tokens_out");

        $this->execute("ALTER TABLE model_provider ADD COLUMN cost_per_1m_tokens_in REAL");
        $this->execute("ALTER TABLE model_provider ADD COLUMN cost_per_1m_tokens_out REAL");
        $this->execute("ALTER TABLE model_provider ADD COLUMN cost_per_1m_tokens_cache_read REAL");
        $this->execute("ALTER TABLE model_provider ADD COLUMN cost_per_1m_tokens_cache_write REAL");
        $this->execute("ALTER TABLE model_provider ADD COLUMN reasoning INTEGER DEFAULT 0");
        $this->execute("ALTER TABLE model_provider ADD COLUMN tool_call INTEGER DEFAULT 0");
        $this->execute("ALTER TABLE model_provider ADD COLUMN attachment INTEGER DEFAULT 0");
        $this->execute("ALTER TABLE model_provider ADD COLUMN structured_output INTEGER DEFAULT 0");
        $this->execute("ALTER TABLE model_provider ADD COLUMN temperature INTEGER DEFAULT 0");
        $this->execute("ALTER TABLE model_provider ADD COLUMN status TEXT");
    }

    public function down(): void
    {
        // Destructive reverse not supported — schema changes are additive.
    }
}
