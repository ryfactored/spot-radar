-- Performance indexes for the releases feed and sync jobs.
--
-- The schema had zero secondary indexes. `releases` (shared, grows with the
-- whole user base) has only its spotify_album_id PK, so get_user_feed's join to
-- user_artists on spotify_artist_id plus its `order by release_date desc` did a
-- full table scan + sort on every feed page. `artists` had only its PK, so the
-- cron's "oldest last_release_check" ordering and the sync's 24h skip filter
-- scanned + sorted the whole shared table each run.
--
-- user_artists and user_release_state already index user_id via their
-- (user_id, ...) primary keys, so no extra indexes are needed there.
set search_path to spot_radar, public;

-- Serves the get_user_feed join (spotify_artist_id) and per-artist recency.
create index if not exists idx_releases_artist_date
  on releases (spotify_artist_id, release_date desc);

-- Serves the global recency sort in get_user_feed.
create index if not exists idx_releases_release_date
  on releases (release_date desc);

-- Serves refresh-releases' staleness ordering and sync-releases' 24h skip filter.
create index if not exists idx_artists_last_release_check
  on artists (last_release_check nulls first);
