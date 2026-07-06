-- Restore the "new vs previously seen" contract.
--
-- The feed splits releases on when they were DISCOVERED by a sync, not when
-- Spotify published them — a release that came out three weeks ago but was
-- first pulled in by today's sync should still surface as "new since you last
-- checked". That timestamp never existed on the table (fetched_at was dropped),
-- so the client fell back to release_date and any release found more than a day
-- late was silently filed under "previously seen".
set search_path to spot_radar, public;

alter table spot_radar.releases
  add column if not exists discovered_at timestamptz not null default now();

-- Existing rows all defaulted to now() (migration time), which would flag the
-- entire backlog as freshly discovered for everyone. Seed them from release_date
-- so only genuinely new syncs count as new going forward. New rows inserted by
-- the sync jobs keep the now() default; the upsert doesn't touch discovered_at
-- on conflict, so a release's first-seen time is preserved across re-syncs.
update spot_radar.releases set discovered_at = release_date::timestamptz;

-- Return discovered_at from the feed RPC (return-table shape changes, so drop
-- and recreate rather than replace).
drop function if exists spot_radar.get_user_feed(uuid, text, integer, integer, boolean, text, integer, integer);

create function spot_radar.get_user_feed(
  p_user_id uuid,
  p_release_type text,
  p_min_track_count integer,
  p_recency_days integer,
  p_hide_live boolean,
  p_source_filter text,
  p_offset integer,
  p_limit integer
)
returns table (
  spotify_album_id text,
  spotify_artist_id text,
  artist_name text,
  title text,
  release_type text,
  release_date date,
  image_url text,
  track_count integer,
  artist_source text,
  discovered_at timestamptz,
  total_count bigint
)
language sql
stable
security invoker
as $$
  select
    r.spotify_album_id,
    r.spotify_artist_id,
    r.artist_name,
    r.title,
    r.release_type,
    r.release_date,
    r.image_url,
    r.track_count,
    ua.source as artist_source,
    r.discovered_at,
    count(*) over () as total_count
  from spot_radar.releases r
  inner join spot_radar.user_artists ua
    on ua.spotify_artist_id = r.spotify_artist_id
    and ua.user_id = p_user_id
  where
    (p_release_type = 'everything' or r.release_type = p_release_type)
    and r.track_count >= p_min_track_count
    and r.release_date >= (current_date - (p_recency_days || ' days')::interval)::date
    and (not p_hide_live or r.title !~* '\mLive\M')
    and (p_source_filter = 'all' or ua.source = p_source_filter)
  order by r.release_date desc, r.spotify_album_id
  limit p_limit
  offset p_offset
$$;

grant execute on function spot_radar.get_user_feed(uuid, text, integer, integer, boolean, text, integer, integer) to authenticated;
