import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Tier = 'free' | 'plus' | 'premium';

export interface User {
  id: string;
  username: string;
  avatar?: string;
  discriminator?: string;
  tier: Tier;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  setUser: (u: User | null) => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

import { apiUrl } from '../lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (markLoadingDone = true) => {
    try {
      const res = await fetch(apiUrl('/api/me'), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUserState(data.user ?? null);
      } else {
        setUserState(null);
      }
    } catch {
      setUserState(null);
    } finally {
      if (markLoadingDone) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refetchUser = useCallback(() => fetchUser(false), [fetchUser]);

  // After OAuth redirect we land with ?auth=callback; refetch once so the session cookie is picked up, then clean the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') !== 'callback') return;
    const t = setTimeout(() => {
      fetchUser(false).then(() => {
        const u = new URL(window.location.href);
        u.searchParams.delete('auth');
        const clean = u.searchParams.toString() ? `${u.pathname}?${u.searchParams}` : u.pathname;
        window.history.replaceState(null, '', clean);
      });
    }, 50);
    return () => clearTimeout(t);
  }, [fetchUser]);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(apiUrl('/api/auth/discord/logout'), { credentials: 'include', method: 'POST' });
    } finally {
      setUserState(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
