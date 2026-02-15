#!/bin/bash
# Applies Supabase migrations to the Docker-based self-hosted database.
# Run this AFTER all containers are healthy.
# Usage: sudo ./finalize.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../supabase/migrations"

# Wait for database to be ready
echo "Waiting for database to be ready..."
until docker exec supabase-db pg_isready -U postgres > /dev/null 2>&1; do
  sleep 2
done

# Wait for auth table to exist (GoTrue migrations complete)
echo "Waiting for GoTrue migrations..."
until docker exec supabase-db psql -U postgres -c "SELECT 1 FROM auth.users LIMIT 1" > /dev/null 2>&1; do
  sleep 2
done

# Create auth helper functions for RLS policies.
# Self-hosted Supabase doesn't always provide these; hosted Supabase does.
echo "Creating auth helper functions..."
docker exec -i supabase-db psql -U postgres -d postgres <<'EOSQL'
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      current_setting('request.jwt.claims', true)::json->>'sub'
    ),
    ''
  )::UUID;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    current_setting('request.jwt.claims', true)::json->>'role'
  );
$$;

CREATE OR REPLACE FUNCTION auth.email()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.email', true),
    current_setting('request.jwt.claims', true)::json->>'email'
  );
$$;
EOSQL

# Apply all migration files in sorted order
echo "Applying migrations..."
for migration in "$MIGRATIONS_DIR"/*.sql; do
  echo "  $(basename "$migration")"
  docker exec -i supabase-db psql -U postgres -d postgres < "$migration"
done

echo ""
echo "Done! Your self-hosted setup is complete."
echo "Register your first user - they will automatically become admin."
