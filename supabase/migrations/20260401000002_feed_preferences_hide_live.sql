-- Add hide_live preference to user_feed_preferences
alter table spot_radar.user_feed_preferences
  add column if not exists hide_live boolean not null default false;
