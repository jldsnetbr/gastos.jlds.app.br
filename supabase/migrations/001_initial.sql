-- ============================================
-- FinanSpreadOS - Initial Schema
-- ============================================

-- 1. Profiles (auto-created via trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. User Columns (column definitions per user)
CREATE TABLE IF NOT EXISTS user_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  column_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text','number','select','date')),
  options JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, column_id)
);

ALTER TABLE user_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own columns"
  ON user_columns FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Month Registry (tracks which months exist per user)
CREATE TABLE IF NOT EXISTS month_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE month_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own months"
  ON month_registry FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Function: ensure_month_table (creates rows_YYYY_MM dynamically)
CREATE OR REPLACE FUNCTION ensure_month_table(month_key TEXT)
RETURNS VOID AS $$
DECLARE
  table_name TEXT := 'rows_' || replace(month_key, '-', '_');
  policy_name TEXT := 'user_isolation_' || replace(month_key, '-', '_');
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      row_id TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT ''{}'',
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, row_id)
    )', table_name
  );

  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

  BEGIN
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      policy_name, table_name
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function: ensure_month_registry (inserts into month_registry)
CREATE OR REPLACE FUNCTION ensure_month_registry(month_key TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO month_registry (user_id, month)
  VALUES (auth.uid(), month_key)
  ON CONFLICT (user_id, month) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email) VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Enable real-time for profiles, user_columns, month_registry
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_columns;
ALTER PUBLICATION supabase_realtime ADD TABLE month_registry;
