-- Spotify token storage for Edge Functions
create table angular_starter.user_spotify_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scopes text not null default '',
  updated_at timestamptz default now() not null
);

alter table angular_starter.user_spotify_tokens enable row level security;

create policy "Users can view own tokens"
  on angular_starter.user_spotify_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own tokens"
  on angular_starter.user_spotify_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tokens"
  on angular_starter.user_spotify_tokens for update
  using (auth.uid() = user_id);

-- Shared artists table (not per-user)
create table angular_starter.artists (
  spotify_artist_id text primary key,
  artist_name text not null,
  artist_image_url text,
  last_release_check timestamptz
);

alter table angular_starter.artists enable row level security;

create policy "Authenticated users can read artists"
  on angular_starter.artists for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert artists"
  on angular_starter.artists for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update artists"
  on angular_starter.artists for update
  using (auth.role() = 'authenticated');

-- Per-user artist list
create table angular_starter.user_artists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  spotify_artist_id text not null references angular_starter.artists(spotify_artist_id),
  artist_name text not null,
  artist_image_url text,
  source text not null default 'followed',
  synced_at timestamptz default now() not null,
  unique(user_id, spotify_artist_id)
);

alter table angular_starter.user_artists enable row level security;

create policy "Users can view own artists"
  on angular_starter.user_artists for select
  using (auth.uid() = user_id);

create policy "Users can insert own artists"
  on angular_starter.user_artists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own artists"
  on angular_starter.user_artists for update
  using (auth.uid() = user_id);

create policy "Users can delete own artists"
  on angular_starter.user_artists for delete
  using (auth.uid() = user_id);

-- Shared releases table
create table angular_starter.releases (
  spotify_album_id text primary key,
  spotify_artist_id text not null,
  artist_name text not null,
  title text not null,
  release_type text not null,
  release_date date not null,
  image_url text,
  spotify_url text not null,
  track_count integer not null default 0,
  fetched_at timestamptz default now() not null
);

alter table angular_starter.releases enable row level security;

create policy "Authenticated users can read releases"
  on angular_starter.releases for select
  using (auth.role() = 'authenticated');

-- Per-user release state (dismissed)
create table angular_starter.user_release_state (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  spotify_album_id text not null references angular_starter.releases(spotify_album_id),
  dismissed boolean not null default false,
  dismissed_at timestamptz,
  unique(user_id, spotify_album_id)
);

alter table angular_starter.user_release_state enable row level security;

create policy "Users can view own release state"
  on angular_starter.user_release_state for select
  using (auth.uid() = user_id);

create policy "Users can insert own release state"
  on angular_starter.user_release_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update own release state"
  on angular_starter.user_release_state for update
  using (auth.uid() = user_id);

-- Per-user feed preferences
create table angular_starter.user_feed_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  release_type_filter text not null default 'everything',
  min_track_count integer not null default 0,
  recency_days integer not null default 90,
  last_checked_at timestamptz
);

alter table angular_starter.user_feed_preferences enable row level security;

create policy "Users can view own preferences"
  on angular_starter.user_feed_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on angular_starter.user_feed_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on angular_starter.user_feed_preferences for update
  using (auth.uid() = user_id);

-- Enable Realtime on releases table for live feed updates during sync
alter publication supabase_realtime add table angular_starter.releases;
