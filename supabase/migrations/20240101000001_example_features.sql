-- =============================================================================
-- 002_example_features.sql
--
-- Schema for the example features: Notes, Chat, Files.
-- Skip this migration entirely if you've removed all example features,
-- or comment out individual sections for features you don't need.
-- See docs/feature-removal.md for details.
-- =============================================================================
set search_path to angular_starter, public;

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------
create table notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table notes enable row level security;

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();

create policy "Users can view own notes"
  on notes for select
  using (auth.uid() = user_id);

create policy "Users can create own notes"
  on notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on notes for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Chat (messages)
--
-- After running this migration, enable Realtime for the messages table:
-- Supabase Dashboard > Database > Replication > toggle on "messages"
-- ---------------------------------------------------------------------------
create table messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  username text not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table messages enable row level security;

create policy "Authenticated users can view messages"
  on messages for select
  using (auth.role() = 'authenticated');

create policy "Users can insert own messages"
  on messages for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Files (metadata table + private storage bucket)
-- ---------------------------------------------------------------------------
create table files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  storage_path text not null,
  size bigint not null,
  type text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table files enable row level security;

create policy "Users can view own files"
  on files for select
  using (auth.uid() = user_id);

create policy "Users can insert own files"
  on files for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own files"
  on files for delete
  using (auth.uid() = user_id);

-- Grant permissions on angular_starter schema tables
grant select, insert, update, delete on notes to authenticated;
grant all on notes to service_role;

grant select, insert on messages to authenticated;
grant all on messages to service_role;

grant select, insert, delete on files to authenticated;
grant all on files to service_role;

-- Private storage bucket for user file uploads
insert into storage.buckets (id, name, public) values ('user-files', 'user-files', false)
on conflict (id) do nothing;

create policy "Users can upload to user-files"
  on storage.objects for insert
  with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view own user-files"
  on storage.objects for select
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own user-files"
  on storage.objects for delete
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);
