-- Remove redundant columns from user_artists — artist_name and artist_image_url
-- already live in the shared artists table and should be joined from there.
alter table spot_radar.user_artists
  drop column if exists artist_name,
  drop column if exists artist_image_url;
