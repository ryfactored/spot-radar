-- =============================================================================
-- 003_admin_features.sql
--
-- Admin-related schema: is_admin() helper function and RLS policy allowing
-- admins to view all profiles.
-- =============================================================================
set search_path to angular_starter, public;

-- ---------------------------------------------------------------------------
-- is_admin() helper function
--
-- SECURITY DEFINER bypasses RLS to check if the requesting user has admin role.
-- This avoids infinite recursion when used in a profiles RLS policy.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = angular_starter
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Admin RLS policy for profiles
--
-- Allows admins to SELECT all rows in profiles table.
-- Non-admins still only see their own row via the existing "Users can view
-- own profile" policy. Supabase ORs all SELECT policies together.
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated, service_role;

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (angular_starter.is_admin());
