// Auth API
import type { LoginCredentials, LoginResponse, User } from './auth.types';
import { authStore } from './auth.store';

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

  /**
   * Get current user profile from /auth/me
   * Used to validate token and get fresh user data
   */
  async getMe(): Promise<User> {
    const token = authStore.getToken();
    const tenantId = authStore.getTenantId();

    if (!token) {
      throw new Error('No access token available');
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      // Token might be expired, try to refresh
      if (response.status === 401) {
        const newToken = await this.refreshToken();
        if (newToken) {
          // Retry with new token
          const retryHeaders: Record<string, string> = {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          };
          if (tenantId) {
            retryHeaders['X-Tenant-ID'] = tenantId;
          }
          
          const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: retryHeaders,
          });

          if (!retryResponse.ok) {
            throw new Error('Failed to get user profile after token refresh');
          }

          const retryResult = await retryResponse.json();
          const user = retryResult.data?.user || retryResult.data;
          authStore.setUser(user);
          return user;
        }
      }
      throw new Error('Failed to get user profile');
    }

    const result = await response.json();
    // Backend returns { success, message, data: { user: {...} } }
    const user = result.data?.user || result.data;
    
    // Update stored user data with fresh data from server
    authStore.setUser(user);
    if (user.tenant_id) {
      authStore.setTenantId(user.tenant_id);
    }

    return user;
  },

  /**
   * Refresh access token using refresh token
   * Returns new access token or null if refresh failed
   */
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
        // Refresh token is invalid or expired
        authStore.clearAuth();
        throw new Error('Failed to refresh token');
      }

      const result = await response.json();

      if (result.data?.access_token) {
        // Save new tokens
        authStore.setToken(result.data.access_token);
        
        // Update refresh token if provided (token rotation)
        if (result.data?.refresh_token) {
          authStore.setRefreshToken(result.data.refresh_token);
        }

        // Update user data if provided
        if (result.data?.user) {
          authStore.setUser(result.data.user);
          if (result.data.user.tenant_id) {
            authStore.setTenantId(result.data.user.tenant_id);
          }
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

  /**
   * Validate current session by calling /auth/me
   * Returns true if session is valid, false otherwise
   */
  async validateSession(): Promise<boolean> {
    try {
      const token = authStore.getToken();
      if (!token) {
        return false;
      }

      await this.getMe();
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  },
};
