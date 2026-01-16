import { authStore } from '@/features/auth/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8089/api/v1';

interface RequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  skipAuth?: boolean;
}

interface RefreshTokenResponse {
  success: boolean;
  data: {
    access_token: string;
    expires_in: number;
  };
}

class ApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = authStore.getToken();
    const tenantId = authStore.getTenantId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    return headers;
  }

  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }

    return url.toString();
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private async refreshToken(): Promise<string | null> {
    const refreshToken = authStore.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const data: RefreshTokenResponse = await response.json();
      if (data.success && data.data.access_token) {
        authStore.setToken(data.data.access_token);
        return data.data.access_token;
      }

      return null;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { method = 'GET', body, params, skipAuth = false } = config;

    const url = this.buildURL(endpoint, params);
    const headers = skipAuth ? { 'Content-Type': 'application/json' } : this.getAuthHeaders();

    // Check if body is FormData - don't set Content-Type (browser will set it with boundary)
    const isFormData = body instanceof FormData;
    if (isFormData) {
      delete headers['Content-Type'];
    }

    const fetchConfig: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      fetchConfig.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      let response = await fetch(url, fetchConfig);

      // Handle 401 Unauthorized - Try to refresh token
      if (response.status === 401 && !skipAuth) {
        // Check if we're already refreshing
        if (!this.isRefreshing) {
          this.isRefreshing = true;

          const newToken = await this.refreshToken();

          this.isRefreshing = false;

          if (newToken) {
            // Notify all waiting requests
            this.onRefreshed(newToken);

            // Retry the original request with new token
            const retryHeaders = {
              ...headers,
              'Authorization': `Bearer ${newToken}`,
            };

            response = await fetch(url, {
              ...fetchConfig,
              headers: retryHeaders,
            });
          } else {
            // Refresh failed - logout
            console.warn('Token refresh failed. Logging out...');
            authStore.clearAuth();
            window.location.href = '/login';
            throw new Error('Session expired. Please login again.');
          }
        } else {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            this.addRefreshSubscriber(async (token: string) => {
              try {
                const retryHeaders = {
                  ...headers,
                  'Authorization': `Bearer ${token}`,
                };

                const retryResponse = await fetch(url, {
                  ...fetchConfig,
                  headers: retryHeaders,
                });

                if (!retryResponse.ok) {
                  const errorData = await retryResponse.json().catch(() => ({}));
                  reject(new Error(errorData.error?.message || errorData.message || 'Request failed'));
                  return;
                }

                const data = await retryResponse.json();
                resolve(data as T);
              } catch (error) {
                reject(error);
              }
            });
          });
        }
      }

      // Handle 403 Forbidden - Check for subscription/trial expired
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData.error?.code || errorData.code;
        
        if (errorCode === 'SUB_4005' || errorCode === 'SUB_4002' || errorCode === 'SUB_4003') {
          console.warn('Subscription/Trial expired. Redirecting to subscription page...');
          window.location.href = '/subscription-required';
          throw new Error(errorData.error?.message || errorData.message || 'Subscription required');
        }
        
        throw new Error(errorData.error?.message || errorData.message || 'Access forbidden');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }
}

export const api = new ApiClient(API_BASE_URL);
