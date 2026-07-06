-- Harden the profiles INSERT policy so a user cannot self-insert with an
-- elevated role. In practice new profile rows are created by the
-- handle_new_user() trigger (SECURITY DEFINER) during signup, so a client
-- insert normally hits a PK conflict and routes through the role-locked UPDATE
-- policy. This closes the latent gap if that trigger is ever changed or a row
-- is removed: a direct insert must now claim the default 'user' role.
set search_path to spot_radar, public;

drop policy if exists "Users can insert own profile" on profiles;

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id and role = 'user');
