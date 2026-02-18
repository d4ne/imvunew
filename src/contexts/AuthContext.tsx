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
}

const AuthContext = createContext<AuthContextType | null>(null);

import { apiUrl } from '../lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
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
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
