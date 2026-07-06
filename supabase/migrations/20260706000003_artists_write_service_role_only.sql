-- The `artists` table is shared across all users. Previously any authenticated
-- user could INSERT/UPDATE any row, allowing cache poisoning (overwriting an
-- artist's name/image, or pushing last_release_check into the future to
-- suppress everyone's syncs). Writes now go through the upsert-artists Edge
-- Function and the sync jobs, all of which use the service role (which bypasses
-- RLS). Drop the client-facing write policies so only the service role can
-- write; authenticated users keep read access.
set search_path to spot_radar, public;

drop policy if exists "Authenticated users can insert artists" on artists;
drop policy if exists "Authenticated users can update artists" on artists;
