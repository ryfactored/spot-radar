-- Switch get_user_feed from OFFSET to keyset (seek) pagination.
--
-- OFFSET pagination is both incorrect and slow here: a realtime INSERT (from a
-- background sync or another device) shifts every row's offset by one, so the
-- next "load more" re-serves the previous page's last row — producing duplicate
-- cards and Angular NG0955 duplicate-key errors. And `count(*) over ()` forced
-- Postgres to materialize the entire filtered join on every page just to return
-- 20 rows.
--
-- Keyset pages by the (release_date, spotify_album_id) of the last row seen, so
-- each page is O(limit) against the index and immune to inserts above the
-- cursor. hasMore is derived client-side from whether a full page came back, so
-- the total_count column is dropped.
set search_path to spot_radar, public;

drop function if exists get_user_feed(uuid, text, integer, integer, boolean, text, integer, integer);

create function get_user_feed(
  p_user_id uuid,
  p_release_type text,
  p_min_track_count integer,
  p_recency_days integer,
  p_hide_live boolean,
  p_source_filter text,
  p_cursor_release_date date,
  p_cursor_album_id text,
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
  discovered_at timestamptz
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
    r.discovered_at
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
    -- Keyset: rows strictly after the cursor in (release_date desc, album_id desc).
    and (
      p_cursor_release_date is null
      or (r.release_date, r.spotify_album_id) < (p_cursor_release_date, p_cursor_album_id)
    )
  order by r.release_date desc, r.spotify_album_id desc
  limit p_limit
$$;

grant execute on function get_user_feed(uuid, text, integer, integer, boolean, text, date, text, integer) to authenticated;

-- Keyset pagination no longer returns a total_count. The dashboard still wants a
-- "releases found" total, so expose a dedicated count that runs the same filter
-- without the cursor/limit — called once for a stat, not per feed page.
create function get_user_feed_count(
  p_user_id uuid,
  p_release_type text,
  p_min_track_count integer,
  p_recency_days integer,
  p_hide_live boolean,
  p_source_filter text
)
returns bigint
language sql
stable
security invoker
as $$
  select count(*)
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
$$;

grant execute on function get_user_feed_count(uuid, text, integer, integer, boolean, text) to authenticated;
