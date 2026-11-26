import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { APIError, SESSION_STORAGE_KEY } from '../services/api';
import { authService } from '../services/authService';
import type { AuthError, AuthResponseDTO, AuthSession, User } from '../types/auth';

interface AuthContextValue {
  session: AuthSession;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { email: string; password: string; name?: string; organization?: string }) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  updateUser: (updates: { name?: string; organization?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseError(err: unknown): AuthError {
  if (err instanceof APIError) {
    return { code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof Error) {
    return { code: 'AUTH_ERROR', message: err.message };
  }
  return { code: 'AUTH_ERROR', message: 'Authentication failed' };
}

function persistSession(data: AuthResponseDTO | null): void {
  if (!data) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: data.user,
      token: data.token,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    })
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!saved) {
        if (active) {
          setSession((prev) => ({ ...prev, isLoading: false }));
        }
        return;
      }

      try {
        const parsed = JSON.parse(saved) as Partial<AuthSession>;
        if (!parsed.token) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          if (active) setSession((prev) => ({ ...prev, isLoading: false }));
          return;
        }
        // Verify token is still valid against backend
        const user = await authService.me();
        if (active) {
          setSession({
            user,
            token: parsed.token,
            refreshToken: parsed.refreshToken ?? null,
            expiresAt: parsed.expiresAt,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        }
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        if (active) {
          setSession({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setSession((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await authService.login({ email, password });
      persistSession(res);
      setSession({
        user: res.user,
        token: res.token,
        refreshToken: res.refreshToken,
        expiresAt: res.expiresAt,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const authError = parseError(err);
      setSession((prev) => ({ ...prev, isLoading: false, error: authError }));
      throw authError;
    }
  }, []);

  const signup = useCallback(
    async (payload: { email: string; password: string; name?: string; organization?: string }) => {
      setSession((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const res = await authService.signup(payload);
        persistSession(res);
        setSession({
          user: res.user,
          token: res.token,
          refreshToken: res.refreshToken,
          expiresAt: res.expiresAt,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const authError = parseError(err);
        setSession((prev) => ({ ...prev, isLoading: false, error: authError }));
        throw authError;
      }
    },
    []
  );

  const logout = useCallback(() => {
    persistSession(null);
    setSession({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session.refreshToken) return;
    try {
      const res = await authService.refresh(session.refreshToken);
      persistSession(res);
      setSession({
        user: res.user,
        token: res.token,
        refreshToken: res.refreshToken,
        expiresAt: res.expiresAt,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      logout();
    }
  }, [session.refreshToken, logout]);

  const updateUser = useCallback(async (updates: { name?: string; organization?: string }) => {
    const updated = await authService.updateMe(updates);
    setSession((prev) => {
      const next = { ...prev, user: updated };
      if (prev.token && prev.refreshToken) {
        persistSession({
          user: updated,
          token: prev.token,
          refreshToken: prev.refreshToken,
          expiresAt: prev.expiresAt ?? 0,
        });
      }
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session.user,
        isAuthenticated: session.isAuthenticated,
        isLoading: session.isLoading,
        login,
        signup,
        logout,
        refreshSession,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
