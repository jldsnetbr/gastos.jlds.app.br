-- Security fix: remove permissive INSERT policy on profiles
-- The SECURITY DEFINER trigger handle_new_user() bypasses RLS, so this policy is unnecessary
-- and creates a security hole where any user can insert profiles for any user_id.

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
