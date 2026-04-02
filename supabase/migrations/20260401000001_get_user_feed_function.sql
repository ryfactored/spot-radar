-- RPC function to fetch paginated releases for a user, avoiding large .in() URL params
drop function if exists spot_radar.get_user_feed(uuid, text, integer, integer, integer, integer);
drop function if exists spot_radar.get_user_feed(uuid, text, integer, integer, boolean, integer, integer);

create function spot_radar.get_user_feed(
  p_user_id uuid,
  p_release_type text,
  p_min_track_count integer,
  p_recency_days integer,
  p_hide_live boolean,
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
  order by r.release_date desc, r.spotify_album_id
  limit p_limit
  offset p_offset
$$;

-- Grant execute permission to authenticated users
grant execute on function spot_radar.get_user_feed(uuid, text, integer, integer, boolean, integer, integer) to authenticated;
