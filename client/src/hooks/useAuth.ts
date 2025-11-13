import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useDisconnect } from 'wagmi';
import type { Session, User } from '@supabase/supabase-js';
import { useUser } from './useUser';

// AuthState interface remains the same
interface AuthState {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const { disconnect } = useDisconnect();
  const { setUser } = useUser();

  // Initial session check and sync with useUser
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({ session, user: session?.user ?? null, isAuthenticated: !!session, isLoading: false, error: null });
      setUser(session?.user ?? null); // Sync with useUser
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({ session, user: session?.user ?? null, isAuthenticated: !!session, isLoading: false, error: null });
      setUser(session?.user ?? null); // Sync with useUser on auth changes
    });
    return () => subscription.unsubscribe();
  }, [setUser]);

  /**
   * Sign in using Supabase's built-in Sign-In with Ethereum (SIWE)
   * This uses the native signInWithWeb3 method
   */
  const signIn = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Use Supabase's native Web3 sign-in with Ethereum
      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: 'ethereum',
        statement: 'Sign in to TrustFi',
      });

      if (error) throw error;
      
      // The session will be set automatically via onAuthStateChange
      // but we can also set it here for immediate feedback
      if (data?.session) {
        setAuthState(prev => ({ 
          ...prev, 
          session: data.session, 
          user: data.session?.user ?? null, 
          isAuthenticated: true, 
          isLoading: false 
        }));
      }

    } catch (error: any) {
      console.error("SIWE Error:", error);
      setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    await supabase.auth.signOut();
    disconnect();
    setUser(null); // Clear user in useUser store
    setAuthState({ session: null, user: null, isAuthenticated: false, isLoading: false, error: null });
  }, [disconnect, setUser]);

  return { ...authState, signIn, signOut };
}
