const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8089/api/v1';

// Get token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  if (!token) {
    throw new Error('No authentication token found. Please login first.');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId || '',
    'Content-Type': 'application/json',
  };
};

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }
    
    return url.toString();
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params } = options;
    
    const url = this.buildURL(endpoint, params);
    const headers = getAuthHeaders();

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - Token expired
      if (response.status === 401) {
        console.warn('Token expired or invalid. Logging out...');
        
        // Clear auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('tenant_id');
        localStorage.removeItem('user');
        
        // Redirect to login
        window.location.href = '/login';
        
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, options: { params?: Record<string, any> } = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, ...options });
  }

  async put<T>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, ...options });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }

  async patch<T>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, ...options });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
