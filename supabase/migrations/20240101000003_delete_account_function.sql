set search_path to angular_starter, public;

-- Delete the caller's own auth.users row.
-- All app tables (profiles, notes, messages, files) cascade automatically
-- via ON DELETE CASCADE foreign keys.
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, angular_starter, public
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;
