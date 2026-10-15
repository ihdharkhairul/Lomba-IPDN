import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authProvider as defaultProvider, type AuthProvider, type RegisterInput, type ResetPasswordInput } from '@/services/auth';
import type { AuthUser } from '@/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** true setelah logout eksplisit: halaman privat tidak boleh menyimpan "tujuan kembali" ke akun berikutnya. */
  justLoggedOut: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  /** Bisa diganti (mis. di test, atau provider Firebase/Supabase di produksi). */
  provider?: AuthProvider;
}

export function AuthProvider({ children, provider = defaultProvider }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  // Pulihkan sesi saat aplikasi dibuka kembali.
  useEffect(() => {
    let cancelled = false;
    provider
      .getSessionUser()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus(u ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (!cancelled) setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, [provider]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const u = await provider.login(identifier, password);
      setUser(u);
      setStatus('authenticated');
      setJustLoggedOut(false);
      return u;
    },
    [provider],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const u = await provider.register(input);
      setUser(u);
      setStatus('authenticated');
      setJustLoggedOut(false);
      return u;
    },
    [provider],
  );

  const resetPassword = useCallback((input: ResetPasswordInput) => provider.resetPassword(input), [provider]);

  const logout = useCallback(async () => {
    await provider.logout();
    setJustLoggedOut(true);
    setUser(null);
    setStatus('unauthenticated');
  }, [provider]);

  const value = useMemo(
    () => ({ user, status, justLoggedOut, login, register, resetPassword, logout }),
    [user, status, justLoggedOut, login, register, resetPassword, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}

/** Untuk halaman yang hanya dirender saat sudah login. */
export function useCurrentUser(): AuthUser {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser dipakai tanpa pengguna yang login');
  return user;
}
