-- =============================================================================
-- 001_initial_schema.sql
--
-- Core schema required by the Angular Starter template.
-- Creates: angular_starter schema, profiles table, auto-create trigger,
-- avatars storage bucket.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Create angular_starter schema
-- ---------------------------------------------------------------------------
create schema if not exists angular_starter;
grant usage on schema angular_starter to anon, authenticated, service_role;
set search_path to angular_starter, public;

-- ---------------------------------------------------------------------------
-- Profiles table
-- Every user gets a profile row. The trigger below auto-creates one on sign-up.
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  bio text,
  role text default 'user',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Auto-create profile on sign-up
-- Pulls display_name from OAuth metadata (full_name) or falls back to email.
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into angular_starter.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = angular_starter;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Grant permissions on angular_starter schema tables
-- ---------------------------------------------------------------------------
grant select on profiles to anon;
grant select, insert, update on profiles to authenticated;
grant all on profiles to service_role;

-- ---------------------------------------------------------------------------
-- Avatars storage bucket (public — profile pictures are publicly readable)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');
