-- Remove the dormant template feature tables (Notes, Chat, Files). The
-- corresponding frontend features have been deleted; these tables carried no
-- product data for spot-radar and only widened the surface area. Dropping them
-- (with cascade) also removes their RLS policies. Idempotent.
--
-- Note: the 'user-files' storage bucket and its storage.objects policies are
-- NOT dropped here — remove the bucket from the Supabase dashboard (or via a
-- separate storage migration) if you had uploaded objects to clean up.
set search_path to spot_radar, public;

drop table if exists spot_radar.messages cascade;
drop table if exists spot_radar.files cascade;
drop table if exists spot_radar.notes cascade;
