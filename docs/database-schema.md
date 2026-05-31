# Database Schema — Finalized

Resolved 2026-05-22. See `docs/plans/2026-05-22-task-dependencies.md` for design decisions.

---

## users

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    pass_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    pfp_url TEXT
);
```

## providers

```sql
CREATE TABLE providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    website TEXT,
    description TEXT
);
```

## models

One row per model version (e.g. `gpt-4-0613`, `claude-3-sonnet-20240229`).

```sql
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
);
```

## model_modality

Modalities a model supports (text, image, video, audio, pdf) with input/output direction.

```sql
CREATE TABLE model_modality (
    model_id TEXT REFERENCES models(id),
    modality TEXT CHECK(modality IN ('text','image','video','audio','pdf')),
    direction TEXT CHECK(direction IN ('input','output')),
    UNIQUE(model_id, modality, direction)
);
```

## model_provider

Which providers host/inference a model (e.g. Llama 3 hosted by Meta, Groq, Together AI).

```sql
CREATE TABLE model_provider (
    model_id TEXT REFERENCES models(id),
    provider_id TEXT REFERENCES providers(id),
    api_endpoint TEXT,
    UNIQUE(model_id, provider_id)
);
```

## categories

```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT
);
```

## tools

```sql
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
);
```

## tool_category

Many-to-many: a tool can belong to multiple categories.

```sql
CREATE TABLE tool_category (
    tool_id TEXT REFERENCES tools(id),
    category_id TEXT REFERENCES categories(id),
    UNIQUE(tool_id, category_id)
);
```

## tool_model

Many-to-many: which models a tool uses under the hood.

```sql
CREATE TABLE tool_model (
    tool_id TEXT REFERENCES tools(id),
    model_id TEXT REFERENCES models(id),
    UNIQUE(tool_id, model_id)
);
```

## reviews

One review per user per tool (upsert on repeat).

```sql
CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL REFERENCES tools(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(tool_id, user_id)
);
```

## votes

Upvote only. One vote per user per tool (toggle on/off).

```sql
CREATE TABLE votes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    tool_id TEXT NOT NULL REFERENCES tools(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, tool_id)
);
```

## collections

Named folders, optionally public.

```sql
CREATE TABLE collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    is_public INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
```

## collection_tools

Which tools are saved in which collection.

```sql
CREATE TABLE collection_tools (
    collection_id TEXT REFERENCES collections(id),
    tool_id TEXT REFERENCES tools(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(collection_id, tool_id)
);
```

## reports

Report a tool with a reason and optional note.

```sql
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    tool_id TEXT NOT NULL REFERENCES tools(id),
    reason TEXT NOT NULL CHECK(reason IN ('spam','inappropriate','duplicate','incorrect_info')),
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
```

## submissions

Workflow tracker for tool submissions. Tool record is created with `status=inactive` during submission.

```sql
CREATE TABLE submissions (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL REFERENCES tools(id),
    submitted_by TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    admin_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

---

## Resolved Design Decisions

| Topic | Decision |
|-------|----------|
| Pricing | Single string field (`pricing_model`). TODO: replace with `pricing_plans` table later. |
| Model granularity | Version-level (one row per specific version, not model family). |
| Provider identity | Single `providers` table. `models.creator_id` for creator. `model_provider` junction for hosts. |
| Tool modalities | Deferred. Models have modalities via `model_modality`. |
| Tags | Not needed. Categories only (many-to-many via `tool_category`). |
| Reviews | UNIQUE(tool_id, user_id). Context field deferred. |
| Voting | Upvote only. UNIQUE(user_id, tool_id). Toggle. |
| Collections | Public/private toggle. Manual save only. |
| Reports | Enum reasons. No status field. |
| Submissions | Three states (pending/approved/rejected). Tool record created on submit with status=inactive. |
