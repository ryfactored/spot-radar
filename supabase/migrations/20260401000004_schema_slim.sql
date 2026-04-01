-- user_artists: drop UUID surrogate key, make composite (user_id, spotify_artist_id) the PK,
-- and drop synced_at which is never queried.
alter table spot_radar.user_artists drop constraint user_artists_pkey;
alter table spot_radar.user_artists drop column id;
alter table spot_radar.user_artists drop constraint user_artists_user_id_spotify_artist_id_key;
alter table spot_radar.user_artists add primary key (user_id, spotify_artist_id);
alter table spot_radar.user_artists drop column synced_at;

-- releases: drop spotify_url (derivable as https://open.spotify.com/album/{id})
-- and fetched_at (never queried or displayed).
alter table spot_radar.releases drop column spotify_url;
alter table spot_radar.releases drop column fetched_at;

-- artists: drop artist_image_url (not used anywhere after user_artists cleanup).
alter table spot_radar.artists drop column artist_image_url;
