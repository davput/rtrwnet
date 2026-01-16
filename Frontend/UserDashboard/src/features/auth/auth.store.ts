// Auth Store - State management
import { useState, useEffect, useCallback } from 'react';
import type { User } from './auth.types';

// Storage keys
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TENANT_KEY = 'tenant_id';
const USER_KEY = 'auth_user';

// Custom event for user updates
const USER_UPDATED_EVENT = 'auth:user-updated';

// Auth Store (localStorage wrapper)
export const authStore = {
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTenantId(tenantId: string): void {
    localStorage.setItem(TENANT_KEY, tenantId);
  },

  getTenantId(): string | null {
    return localStorage.getItem(TENANT_KEY);
  },

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Dispatch custom event to notify all listeners
    window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, { detail: user }));
  },

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TENANT_KEY);
    localStorage.removeItem(USER_KEY);
    // Dispatch event with null user
    window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, { detail: null }));
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

// Hook: useAuth
export function useAuth() {
  const [user, setUser] = useState<User | null>(() => authStore.getUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => authStore.isAuthenticated());

  // Listen for user updates from anywhere in the app
  useEffect(() => {
    const handleUserUpdate = (event: CustomEvent<User | null>) => {
      setUser(event.detail);
      setIsAuthenticated(!!event.detail && authStore.isAuthenticated());
    };

    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdate as EventListener);
    
    // Initial sync
    const storedUser = authStore.getUser();
    const hasToken = authStore.isAuthenticated();
    setUser(storedUser);
    setIsAuthenticated(hasToken && !!storedUser);

    return () => {
      window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdate as EventListener);
    };
  }, []);

  const login = useCallback((userData: User) => {
    authStore.setUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    const { authApi } = await import('./auth.api');
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Manual refresh - call /auth/me to get fresh user data
  const refreshUser = useCallback(async () => {
    const { authApi } = await import('./auth.api');
    try {
      setIsLoading(true);
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      setIsAuthenticated(true);
      return freshUser;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      try {
        const newToken = await authApi.refreshToken();
        if (newToken) {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          setIsAuthenticated(true);
          return freshUser;
        }
      } catch {
        // Both failed
      }
      authStore.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh token only
  const refreshToken = useCallback(async () => {
    const { authApi } = await import('./auth.api');
    try {
      const newToken = await authApi.refreshToken();
      return !!newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      authStore.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    refreshToken,
  };
}
