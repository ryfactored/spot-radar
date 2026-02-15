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

-- ---------------------------------------------------------------------------
-- Functions (defined before policies/triggers that reference them)
-- ---------------------------------------------------------------------------
create or replace function update_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function get_my_role()
returns text
language sql
security definer
stable
set search_path = angular_starter
as $$
  select role from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Auto-create profile on sign-up
-- Pulls display_name from OAuth metadata (full_name) or falls back to
-- the local part of the email (split_part).
-- First registered user automatically becomes admin (for self-hosted setups).
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into angular_starter.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when (select count(*) from profiles) = 0 then 'admin' else 'user' end
  );
  return new;
end;
$$ language plpgsql security definer set search_path = angular_starter;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = angular_starter.get_my_role());

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Grant permissions
-- ---------------------------------------------------------------------------
grant select on profiles to anon;
grant select, insert, update on profiles to authenticated;
grant all on profiles to service_role;

grant execute on function get_my_role() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Avatars storage bucket (public -- profile pictures are publicly readable)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can delete own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
