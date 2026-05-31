<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class InitialSchema extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            CREATE TABLE providers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                website TEXT,
                description TEXT
            )
        ");

        $this->execute("
            CREATE TABLE models (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                creator_id TEXT REFERENCES providers(id),
                is_open_source INTEGER DEFAULT 0,
                description TEXT,
                reasoning INTEGER DEFAULT 0,
                release_date TEXT,
                cutoff_date TEXT,
                cost_per_1m_tokens_in REAL,
                cost_per_1m_tokens_out REAL,
                context_window INTEGER,
                max_output INTEGER
            )
        ");

        $this->execute("
            CREATE TABLE model_modality (
                model_id TEXT REFERENCES models(id),
                modality TEXT CHECK(modality IN ('text','image','video','audio','pdf')),
                direction TEXT CHECK(direction IN ('input','output')),
                UNIQUE(model_id, modality, direction)
            )
        ");

        $this->execute("
            CREATE TABLE model_provider (
                model_id TEXT REFERENCES models(id),
                provider_id TEXT REFERENCES providers(id),
                api_endpoint TEXT,
                UNIQUE(model_id, provider_id)
            )
        ");

        $this->execute("
            CREATE TABLE categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                description TEXT
            )
        ");

        $this->execute("
            CREATE TABLE tools (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                url TEXT,
                short_description TEXT,
                description TEXT,
                pricing_model TEXT,
                logo_url TEXT,
                status TEXT DEFAULT 'inactive' CHECK(status IN ('active','inactive')),
                provider_id TEXT REFERENCES providers(id),
                submitted_by TEXT REFERENCES users(id),
                usage_count INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        ");

        $this->execute("
            CREATE TABLE tool_category (
                tool_id TEXT REFERENCES tools(id),
                category_id TEXT REFERENCES categories(id),
                UNIQUE(tool_id, category_id)
            )
        ");

        $this->execute("
            CREATE TABLE tool_model (
                tool_id TEXT REFERENCES tools(id),
                model_id TEXT REFERENCES models(id),
                UNIQUE(tool_id, model_id)
            )
        ");

        $this->execute("
            CREATE TABLE reviews (
                id TEXT PRIMARY KEY,
                tool_id TEXT NOT NULL REFERENCES tools(id),
                user_id TEXT NOT NULL REFERENCES users(id),
                comment TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                UNIQUE(tool_id, user_id)
            )
        ");

        $this->execute("
            CREATE TABLE votes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                tool_id TEXT NOT NULL REFERENCES tools(id),
                created_at TEXT DEFAULT (datetime('now')),
                UNIQUE(user_id, tool_id)
            )
        ");

        $this->execute("
            CREATE TABLE collections (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                name TEXT NOT NULL,
                is_public INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            )
        ");

        $this->execute("
            CREATE TABLE collection_tools (
                collection_id TEXT REFERENCES collections(id),
                tool_id TEXT REFERENCES tools(id),
                created_at TEXT DEFAULT (datetime('now')),
                UNIQUE(collection_id, tool_id)
            )
        ");

        $this->execute("
            CREATE TABLE reports (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                tool_id TEXT NOT NULL REFERENCES tools(id),
                reason TEXT NOT NULL CHECK(reason IN ('spam','inappropriate','duplicate','incorrect_info')),
                note TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        ");

        $this->execute("
            CREATE TABLE submissions (
                id TEXT PRIMARY KEY,
                tool_id TEXT NOT NULL REFERENCES tools(id),
                submitted_by TEXT NOT NULL REFERENCES users(id),
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
                admin_notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        ");
    }

    public function down(): void
    {
        $this->execute('DROP TABLE IF EXISTS submissions');
        $this->execute('DROP TABLE IF EXISTS reports');
        $this->execute('DROP TABLE IF EXISTS collection_tools');
        $this->execute('DROP TABLE IF EXISTS collections');
        $this->execute('DROP TABLE IF EXISTS votes');
        $this->execute('DROP TABLE IF EXISTS reviews');
        $this->execute('DROP TABLE IF EXISTS tool_model');
        $this->execute('DROP TABLE IF EXISTS tool_category');
        $this->execute('DROP TABLE IF EXISTS tools');
        $this->execute('DROP TABLE IF EXISTS categories');
        $this->execute('DROP TABLE IF EXISTS model_provider');
        $this->execute('DROP TABLE IF EXISTS model_modality');
        $this->execute('DROP TABLE IF EXISTS models');
        $this->execute('DROP TABLE IF EXISTS providers');
    }
}
