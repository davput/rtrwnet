import { authStore } from '@/features/auth/auth.store';
import type { LoginCredentials, LoginResponse } from '@/features/auth/auth.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8089/api/v1';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/simple-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend API tidak tersedia atau belum running');
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || result.message || 'Login failed');
    }

    // Save auth data
    authStore.setToken(result.data.access_token);
    if (result.data.refresh_token) {
      authStore.setRefreshToken(result.data.refresh_token);
    }
    authStore.setTenantId(result.data.user.tenant_id);
    authStore.setUser(result.data.user);

    return result;
  },

  async logout(): Promise<void> {
    try {
      const token = authStore.getToken();
      const refreshToken = authStore.getRefreshToken();

      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authStore.clearAuth();
    }
  },

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = authStore.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const result = await response.json();

      if (result.data?.access_token) {
        authStore.setToken(result.data.access_token);
        if (result.data?.refresh_token) {
          authStore.setRefreshToken(result.data.refresh_token);
        }
        return result.data.access_token;
      }

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      authStore.clearAuth();
      return null;
    }
  },
};
