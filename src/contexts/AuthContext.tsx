import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from 'react';
  
  import type {
    Session,
    User,
  } from '@supabase/supabase-js';
  
  import { supabase } from '../lib/supabase';
  
  type AuthContextValue = {
    user: User | null;
    session: Session | null;
    isAuthLoading: boolean;
    signIn: (
      email: string,
      password: string,
    ) => Promise<{
      error: string | null;
    }>;
    signUp: (
      email: string,
      password: string,
    ) => Promise<{
      error: string | null;
    }>;
    signOut: () => Promise<void>;
  };
  
  const AuthContext =
    createContext<AuthContextValue | null>(
      null,
    );
  
  export function AuthProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const [session, setSession] =
      useState<Session | null>(null);
  
    const [isAuthLoading, setIsAuthLoading] =
      useState(true);
  
    const user = session?.user ?? null;
  
    useEffect(() => {
      async function loadSession() {
        const {
          data,
        } =
          await supabase.auth.getSession();
  
        setSession(data.session);
        setIsAuthLoading(false);
      }
  
      loadSession();
  
      const {
        data: authListener,
      } =
        supabase.auth.onAuthStateChange(
          (_event, currentSession) => {
            setSession(currentSession);
            setIsAuthLoading(false);
          },
        );
  
      return () => {
        authListener.subscription.unsubscribe();
      };
    }, []);
  
    async function signIn(
      email: string,
      password: string,
    ) {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
  
      return {
        error: error?.message ?? null,
      };
    }
  
    async function signUp(
      email: string,
      password: string,
    ) {
      const { error } =
        await supabase.auth.signUp({
          email,
          password,
        });
  
      return {
        error: error?.message ?? null,
      };
    }
  
    async function signOut() {
      await supabase.auth.signOut();
    }
  
    const value = useMemo(
      () => ({
        user,
        session,
        isAuthLoading,
        signIn,
        signUp,
        signOut,
      }),
      [
        user,
        session,
        isAuthLoading,
      ],
    );
  
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }
  
  export function useAuth() {
    const context =
      useContext(AuthContext);
  
    if (!context) {
      throw new Error(
        'useAuth must be used inside AuthProvider',
      );
    }
  
    return context;
  }