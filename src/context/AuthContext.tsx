import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  setActiveUser,
  getActiveUser,
  type AuthUser,
} from '@/lib/api/auth';
import { ensureSeeded } from '@/lib/api/mock-store';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => getActiveUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      ensureSeeded();
    }
  }, [user]);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await apiLogin(username, password);
      setActiveUser(result.user);
      ensureSeeded();
      setUserState(result.user);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const result = await apiRegister(username, password, name);
      setActiveUser(result.user);
      ensureSeeded();
      setUserState(result.user);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setActiveUser(null);
    setUserState(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
