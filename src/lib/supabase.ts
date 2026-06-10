import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingVars: string[] = [];
if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

if (missingVars.length > 0) {
  console.warn(
    `Supabase: ${missingVars.join(', ')} não definidas. App funcionará apenas com localStorage.`,
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : ({
        from: () => ({
          select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          upsert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          eq: () => ({
            select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            order: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            in: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            then: (cb: (value: unknown) => unknown) => Promise.resolve({ data: null, error: new Error('Supabase not configured') }).then(cb),
          }),
          in: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
          order: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        }),
        rpc: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        channel: () => ({
          on: () => ({ subscribe: () => ({}) }),
          unsubscribe: () => Promise.resolve(),
        }),
        removeChannel: () => Promise.resolve('ok'),
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithOtp: () => Promise.resolve({ data: {}, error: null }),
          signOut: () => Promise.resolve({ error: null }),
        },
      } as unknown as ReturnType<typeof createClient>);
