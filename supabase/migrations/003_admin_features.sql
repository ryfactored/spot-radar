-- =============================================================================
-- 003_admin_features.sql
--
-- Admin-related schema: is_admin() helper function and RLS policy allowing
-- admins to view all profiles.
-- =============================================================================

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
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
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
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());
