# Database Migrations Guide

How migrations work, how to run them for the first time, and how to add new ones going forward.

---

## Overview

All database schema lives in `supabase/migrations/` as timestamped SQL files. These are the **single source of truth** for both hosted Supabase and self-hosted Docker setups. Files are applied in sorted order by filename — the `YYYYMMDDHHMMSS_` prefix ensures correct ordering.

---

## Initial Setup

### Supabase CLI (local development)

```bash
supabase start        # Starts local Supabase (Postgres, GoTrue, etc.)
supabase db reset     # Applies all migrations from supabase/migrations/
```

The CLI applies migration files automatically in sorted order. The `supabase/config.toml` configures the local instance.

### Hosted Supabase (cloud dashboard)

Paste each migration file into the **SQL Editor** (Dashboard > SQL Editor > New query) and run them in order. See [setup.md](./setup.md#4-set-up-the-database) for post-migration steps like exposing the schema and enabling Realtime.

### Self-hosted Docker

The Docker setup uses `docker/finalize.sh` to apply migrations after GoTrue is ready (migration files reference `auth.users` with FK constraints, so they can't run before GoTrue creates the auth schema).

```bash
# Start the Supabase infrastructure
docker compose -f docker/docker-compose.yml up -d

# Wait for containers to be healthy, then apply migrations
sudo ./docker/finalize.sh
```

`finalize.sh` does three things:

1. Waits for Postgres and GoTrue to be ready
2. Creates `auth.uid()`, `auth.role()`, `auth.email()` helper functions (needed for self-hosted Supabase where GoTrue may not provide them)
3. Applies all `supabase/migrations/*.sql` files in sorted order

---

## Adding New Migrations

### 1. Create the migration file

```bash
# Using the Supabase CLI (recommended — generates the timestamp for you):
supabase migration new add_tags_table

# Or manually:
touch supabase/migrations/20260215120000_add_tags_table.sql
```

### 2. Write the SQL

Set the search path at the top, then write your schema changes:

```sql
set search_path to angular_starter, public;

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO authenticated;
GRANT ALL ON tags TO service_role;
```

### 3. Apply the migration

**Supabase CLI:** `supabase db reset` to re-apply all migrations, or `supabase migration up` to apply only new ones.

**Hosted Supabase:** Paste the SQL into the SQL Editor and run it.

**Self-hosted Docker:** Apply the single new migration file directly:

```bash
docker exec -i supabase-db psql -U postgres -d postgres \
  < supabase/migrations/20260215120000_add_tags_table.sql
```

Or, on a fresh database, re-run `finalize.sh` to apply everything from scratch.

---

## Conventions

- **One concern per file.** Don't mix unrelated schema changes in the same migration.
- **Use `IF NOT EXISTS` / `IF EXISTS`** for tables, indexes, and triggers to make migrations safer to re-run.
- **Use `CREATE OR REPLACE`** for functions.
- **Use `DROP POLICY IF EXISTS` before `CREATE POLICY`** since policies don't support `CREATE OR REPLACE`.
- **Set `search_path`** at the top of each migration: `set search_path to angular_starter, public;`
- **All app tables go in the `angular_starter` schema**, not `public`.
- **Grant permissions** explicitly — `authenticated` for user-facing tables, `service_role` for admin access.
