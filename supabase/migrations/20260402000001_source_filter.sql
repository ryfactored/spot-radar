alter table spot_radar.user_feed_preferences
  add column if not exists source_filter text not null default 'all';
