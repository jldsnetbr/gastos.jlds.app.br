import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { RESEND_COOLDOWN_SECONDS } from '../constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastOtpSentAt = useRef<number>(0);

  useEffect(() => {
    supabase.auth.getSession().then((response: { data: { session: Session | null } }) => {
      setUser(response.data.session?.user ?? null);
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
    const elapsed = Date.now() - lastOtpSentAt.current;
    if (elapsed < RESEND_COOLDOWN_SECONDS * 1000) {
      const remaining = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - elapsed) / 1000);
      return { error: `Aguarde ${remaining}s para reenviar o código` };
    }
    lastOtpSentAt.current = Date.now();
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error?.message };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
