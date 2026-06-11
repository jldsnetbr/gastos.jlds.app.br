import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';

const LOCAL_USER = {
  id: 'local-dev-user',
  email: 'dev@local.mode',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(LOCAL_MODE ? LOCAL_USER : null);
  const [loading, setLoading] = useState(!LOCAL_MODE);

  useEffect(() => {
    if (LOCAL_MODE) return; // Skip Supabase entirely

    supabase.auth.getSession().then((res) => {
      setUser(res.data.session?.user ?? null);
    }).catch(() => {
      setUser(null);
    }).finally(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, s: Session | null) => {
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error?.message };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    supabase.removeAllChannels();
  };

  return (
    <AuthContext value={{ user, loading, signInWithOtp, signOut }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
