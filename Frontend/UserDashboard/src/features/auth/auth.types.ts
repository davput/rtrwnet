// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string;
  isp_name?: string;
  avatar?: string;
  avatar_url?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token?: string;
    user: User;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
