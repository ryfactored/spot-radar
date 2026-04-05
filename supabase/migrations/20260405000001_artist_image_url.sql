-- Re-add artist_image_url to store Spotify profile images.
-- Originally dropped in 20260401000004_schema_slim.sql but needed for the artists page.
alter table spot_radar.artists add column if not exists artist_image_url text;
