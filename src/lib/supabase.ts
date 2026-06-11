import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const missingVars: string[] = [];
if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_PUBLISHABLE_KEY');

if (missingVars.length > 0) {
  console.warn(
    `Supabase: ${missingVars.join(', ')} não definidas. App funcionará apenas com localStorage.`,
  );
}

type TypedSupabase = ReturnType<typeof createClient<Database>>;

function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

/** The real typed Supabase client (null in offline/dev mode) */
const realClient = isSupabaseConfigured()
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: { autoRefreshToken: true, persistSession: true },
      db: { schema: 'public' },
    })
  : null;

// ── Mock client (for dev/demo without Supabase env vars) ──
const mock = {
  from: (_table: string) => ({
    select: () => Promise.resolve({ data: null, error: new Error('Supabase: client not configured') }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase: client not configured') }),
    upsert: () => Promise.resolve({ data: null, error: new Error('Supabase: client not configured') }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: new Error('Supabase: client not configured') }),
      in: () => Promise.resolve({ data: null, error: new Error('Supabase: client not configured') }),
    }),
  }),
  rpc: () => Promise.resolve({ data: null, error: new Error('Supabase: client not configured') }),
  channel: (_name: string) => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
  }),
  removeChannel: () => Promise.resolve('ok'),
  removeAllChannels: () => {},
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOtp: () => Promise.resolve({ data: {}, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  realtime: { setAuth: () => {} },
} as unknown as TypedSupabase;

/** Export the typed client (falls back to mock when env vars missing) */
export const supabase: TypedSupabase = realClient ?? mock;

/**
 * Shape of rows in dynamic month tables (rows_YYYY_MM).
 * Created at runtime, not in Database type.
 */
export interface DynamicRow {
  row_id: string;
  user_id: string;
  data: Record<string, string | number | null>;
  created_at: string;
}
