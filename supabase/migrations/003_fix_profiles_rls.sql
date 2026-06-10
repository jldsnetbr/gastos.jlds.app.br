-- Fix: allow trigger to insert into profiles via RLS
-- The SECURITY DEFINER should bypass RLS, but adding explicit policy as safety net

-- Drop existing insert policy if any, then create permissive one
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  WITH CHECK (true);
