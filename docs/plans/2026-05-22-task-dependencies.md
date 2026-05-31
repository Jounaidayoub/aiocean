# Task Dependencies & Sequencing

**Date:** 2026-05-22
**Context:** AI Tools Discovery Platform — team of 4 needs to split work without blocking each other.

---

## Phase 0 — Foundation

These must be done first. Everything else depends on them.

### T1 — Database Schema Implementation

Create all tables in SQLite. The resolved schema is below.

**Dependencies:** none  
**Blocks:** all other tasks

### T2 — Seed with Real Data

Populate tools, categories, providers, and models with real data.

**Dependencies:** T1  
**Blocks:** T11

### T3 — Signup Endpoint

Add `POST /api/register` so new users can create accounts. Wire up frontend registration form and link from login page.

**Dependencies:** none (users table exists)  
**Blocks:** T4, T5, T6, T7, T8, T9, T10

---

## Phase 1 — Core Features

No interdependencies between these. Can be done in any order.

### T4 — Reviews + Ratings

Create review on a tool. One review per user per tool (upsert on repeat).

**Dependencies:** T1, T3

### T5 — Voting (Upvote)

Upvote a tool. One vote per user per tool (toggle on/off).

**Dependencies:** T1, T3

### T6 — Submit a Tool

User submits a tool → creates tool record with status=inactive + submission record with status=pending. Admin approves (tool→active, submission→approved) or rejects (submission→rejected).

**Dependencies:** T1, T3

### T7 — Collections / Save Tool

User creates named folders (public/private) and saves tools into them.

**Dependencies:** T1, T3

### T8 — Report a Tool

Report a tool with a reason (enum) and optional note.

**Dependencies:** T1, T3

---

## Phase 2 — Aggregation Features

### T9 — Admin Panel

Submission queue (depends on T6). Flagged content list (depends on T8). Tool management.

**Dependencies:** T1, T3, T6, T8

### T10 — User Profile Page

My reviews, votes, submissions, and collections. DashboardPage is currently empty.

**Dependencies:** T3, T4, T5, T6, T7

### T11 — Model Selection Filter

Add AI model as a filter on the homepage. Requires seeded models.

**Dependencies:** T1, T2

---

## Phase 3 — Next Sprint

### T12 — Password Reset

Forgot password flow with email verification.

**Dependencies:** T3, T13

### T13 — Email Service

SMTP integration for transactional emails.

**Dependencies:** none

### T14 — Google OAuth

Social login via Google.

**Dependencies:** T3

---

## Resolved Database Schema

### users (already exists)

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

### providers

```sql
CREATE TABLE providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    website TEXT,
    description TEXT
);
```

### models

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

### model_modality

```sql
CREATE TABLE model_modality (
    model_id TEXT REFERENCES models(id),
    modality TEXT CHECK(modality IN ('text','image','video','audio','pdf')),
    direction TEXT CHECK(direction IN ('input','output')),
    UNIQUE(model_id, modality, direction)
);
```

### model_provider (hosting)

```sql
CREATE TABLE model_provider (
    model_id TEXT REFERENCES models(id),
    provider_id TEXT REFERENCES providers(id),
    api_endpoint TEXT,
    UNIQUE(model_id, provider_id)
);
```

### categories

```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT
);
```

### tools

```sql
CREATE TABLE tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    url TEXT,
    short_description TEXT,
    description TEXT,
    pricing_model TEXT,           -- TODO: replace with pricing_plans table
    logo_url TEXT,
    status TEXT DEFAULT 'inactive' CHECK(status IN ('active','inactive')),
    provider_id TEXT REFERENCES providers(id),
    submitted_by TEXT REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

### tool_category (junction)

```sql
CREATE TABLE tool_category (
    tool_id TEXT REFERENCES tools(id),
    category_id TEXT REFERENCES categories(id),
    UNIQUE(tool_id, category_id)
);
```

### tool_model (junction)

```sql
CREATE TABLE tool_model (
    tool_id TEXT REFERENCES tools(id),
    model_id TEXT REFERENCES models(id),
    UNIQUE(tool_id, model_id)
);
```

### reviews

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

### votes

```sql
CREATE TABLE votes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    tool_id TEXT NOT NULL REFERENCES tools(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, tool_id)
);
```

### collections

```sql
CREATE TABLE collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    is_public INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
```

### collection_tools (junction)

```sql
CREATE TABLE collection_tools (
    collection_id TEXT REFERENCES collections(id),
    tool_id TEXT REFERENCES tools(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(collection_id, tool_id)
);
```

### reports

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

### submissions (workflow tracker)

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

## Schema Design Decisions (Summary)

| Topic | Decision |
|-------|----------|
| Reviews | tool_id, user_id, comment, rating (1-5). UNIQUE per user per tool. Context field deferred. |
| Voting | Upvote only. Toggle on/off. One per user per tool. |
| Collections | Named folders (public/private). Junction table for tools. Manual save only. |
| Reports | Enum reason (spam/inappropriate/duplicate/incorrect_info) + optional note. No status field. |
| Submissions | Tool record created with status=inactive. Separate submissions table tracks workflow. States: pending → approved/rejected. |
| Pricing | Single string field. TODO for future pricing_plans table. |
| Models | Version-level granularity. creator_id on models table for creator. model_provider junction for hosting. |
| Providers | Single table. |
| Tags | Not needed. Categories only. |
| Modalities | Included now on models (model_modality table). |

---

## Team Splitting Strategy

### Phase 0 (blocker clearance)
- Person A: T1 (DB schema — all tables)
- Person B: T1 (DB schema — repository methods) + T2 (seed data prep)
- Person C: T3 (signup endpoint + frontend)
- Person D: T2 (seed data collection), helps anyone who finishes first

### Phase 1 (fully parallel)
- Person A: T4 (Reviews + Ratings)
- Person B: T5 (Voting) + T8 (Report)
- Person C: T6 (Submit a Tool)
- Person D: T7 (Collections / Save)

### Phase 2
- Person A: T9 (Admin Panel)
- Person B: T10 (User Profile)
- Person C: T11 (Model Filter)
- Person D: bugfixes / polish / assist

### Phase 3 (next sprint)
- T12 + T13 (Password Reset + Email Service)
- T14 (Google OAuth)

---

## Open Questions

1. **Tool detail page data** — currently uses hardcoded mock data. Should it be wired to the real API as part of T4, or is that a separate task?
2. **Admin role** — the seed creates test@example.com as admin. Is manual DB insert fine for assigning admin roles, or do we need a proper flow?
3. **Usage count** — tools table has usage_count. How is this populated? From vote count? From review count? Manual?
