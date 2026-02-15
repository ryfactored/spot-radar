#!/bin/bash
# Run this AFTER all containers are healthy to add the auth trigger
# Usage: sudo ./finalize.sh

set -e

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

echo "Adding auth trigger and foreign key constraints..."

docker exec -i supabase-db psql -U postgres -d postgres <<'EOSQL'
-- Create auth helper functions for RLS policies
-- These supplement GoTrue's built-in functions
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

SET search_path TO angular_starter, public;

-- Create trigger on auth.users to auto-create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add foreign key constraints now that auth.users exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey'
      AND table_name = 'profiles'
      AND table_schema = 'angular_starter'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notes_user_id_fkey'
      AND table_name = 'notes'
      AND table_schema = 'angular_starter'
  ) THEN
    ALTER TABLE notes
    ADD CONSTRAINT notes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

EOSQL

echo ""
echo "Done! Your self-hosted setup is complete."
echo "Register your first user - they will automatically become admin."
