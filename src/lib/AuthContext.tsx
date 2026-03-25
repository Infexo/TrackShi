import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        if (error.message.includes('lock request is aborted')) {
          // Ignore this error, it happens in React Strict Mode or when multiple tabs are open
          setLoading(false);
          return;
        }
        console.error('Auth session error:', error.message);
        if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
          supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          setUser(null);
        }
      } else {
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Unexpected auth error:', err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED' as any) {
        if (event === 'TOKEN_REFRESH_FAILED' as any) {
          supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        }
        setUser(null);
      } else if (session) {
        setUser(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
