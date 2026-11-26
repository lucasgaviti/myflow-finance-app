import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authFeedback } from '../lib/authFeedback';
import type { AuthResult } from '../lib/authFeedback';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isAuthLoading: boolean;
  isRecovering: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resetPassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
const recoveryKey = `myflow-recovery:${import.meta.env.VITE_SUPABASE_URL}`;
function readRecovery(): string | null { try { return sessionStorage.getItem(recoveryKey); } catch { return null; } }
function storeRecovery(id: string | null) { try { if (id) sessionStorage.setItem(recoveryKey, id); else sessionStorage.removeItem(recoveryKey); } catch { /* storage may be unavailable */ } }
const redirect = (path: string) => new URL(path, window.location.origin).href;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [recoveryUser, setRecoveryUser] = useState<string | null>(readRecovery);
  const user = session?.user ?? null;
  const isRecovering = Boolean(user && recoveryUser === user.id);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'PASSWORD_RECOVERY' && currentSession) {
        storeRecovery(currentSession.user.id);
        setRecoveryUser(currentSession.user.id);
      } else if (event === 'SIGNED_OUT' || !currentSession || (readRecovery() && readRecovery() !== currentSession.user.id)) {
        storeRecovery(null);
        setRecoveryUser(null);
      }
      setSession(currentSession);
      setIsAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try { const { error } = await supabase.auth.signInWithPassword({ email, password }); return authFeedback(error); }
    catch (error) { return authFeedback(error); }
  }, []);
  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect('/login') } });
      return error ? authFeedback(error) : { error: null, confirmationRequired: !data.session };
    } catch (error) { return authFeedback(error); }
  }, []);
  const resendConfirmation = useCallback(async (email: string): Promise<AuthResult> => {
    try { const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirect('/login') } }); return authFeedback(error); }
    catch (error) { return authFeedback(error); }
  }, []);
  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    try { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect('/reset-password') }); return authFeedback(error); }
    catch (error) { return authFeedback(error); }
  }, []);
  const resetPassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!isRecovering) return { error: 'Link de recuperação inválido ou expirado. Solicite outro.' };
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return authFeedback(error);
      storeRecovery(null);
      setRecoveryUser(null);
      return { error: null };
    } catch (error) { return authFeedback(error); }
  }, [isRecovering]);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);
  const value = useMemo(() => ({ user, session, isAuthLoading, isRecovering, signIn, signUp, resendConfirmation, requestPasswordReset, resetPassword, signOut }), [user, session, isAuthLoading, isRecovering, signIn, signUp, resendConfirmation, requestPasswordReset, resetPassword, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
