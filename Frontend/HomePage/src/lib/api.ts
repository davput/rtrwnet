const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8089';

// Base Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

// Request Interfaces
export interface SignUpRequest {
  isp_name: string;
  email: string;
  password: string;
  phone: string;
  plan_id: string;
  owner_name: string;
  use_trial: boolean;
}

// Response Data Interfaces
export interface SignUpData {
  tenant_id: string;
  user_id: string;
  order_id?: string;
  amount?: number;
  payment_url?: string;
  is_trial: boolean;
  trial_ends?: string;
  message: string;
}

export interface AuthData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenant_id: string;
  };
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_cycle: string;
  max_customers: number;
  max_users: number;
  features: Record<string, any>;
}

export interface BillingDashboard {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    email: string;
    phone: string;
    is_active: boolean;
  };
  subscription: {
    id: string;
    plan_id: string;
    plan_name: string;
    plan_slug: string;
    status: string;
    is_trial: boolean;
    start_date: string;
    end_date: string;
    next_billing_date: string;
    days_left: number;
    auto_renew: boolean;
    payment_method: string;
  };
  billing: {
    current_plan: string;
    monthly_price: number;
    currency: string;
    next_billing: string;
    payment_method: string;
    can_upgrade: boolean;
    can_downgrade: boolean;
    available_plans: Array<{
      id: string;
      name: string;
      slug: string;
      price: number;
      description: string;
      is_current: boolean;
    }>;
  };
  usage: {
    current_period_start: string;
    current_period_end: string;
    days_used: number;
    days_remaining: number;
  };
  invoices: Array<{
    id: string;
    invoice_no: string;
    amount: number;
    status: string;
    issued_date: string;
    due_date: string;
    paid_date?: string;
    download_url?: string;
  }>;
}

// API Client
export const api = {
  async getPlans(): Promise<Plan[]> {
    const response = await fetch(`${API_URL}/api/v1/public/plans`);
    const result: ApiResponse<{ plans: Plan[]; total: number }> = await response.json();

    if (!result.success || !result.data) {
      const error: any = new Error(result.error?.message || 'Failed to fetch plans');
      error.code = result.error?.code;
      error.details = result.error?.details;
      throw error;
    }

    return result.data.plans;
  },

  async signUp(data: SignUpRequest): Promise<SignUpData> {
    const response = await fetch(`${API_URL}/api/v1/public/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<SignUpData> = await response.json();

    if (!result.success || !result.data) {
      const error: any = new Error(result.error?.message || 'Registration failed');
      error.code = result.error?.code;
      error.details = result.error?.details;
      throw error;
    }

    return result.data;
  },

  async simpleLogin(username: string, password: string): Promise<AuthData> {
    const response = await fetch(`${API_URL}/api/v1/auth/simple-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result: ApiResponse<AuthData> = await response.json();

    if (!result.success || !result.data) {
      const error: any = new Error(result.error?.message || 'Login failed');
      error.code = result.error?.code;
      error.details = result.error?.details;
      throw error;
    }

    return result.data;
  },

  async getBillingDashboard(accessToken: string, tenantId: string): Promise<BillingDashboard> {
    const response = await fetch(`${API_URL}/api/v1/billing`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
      },
    });

    const result: ApiResponse<BillingDashboard> = await response.json();

    if (!result.success || !result.data) {
      const error: any = new Error(result.error?.message || 'Failed to fetch billing data');
      error.code = result.error?.code;
      error.details = result.error?.details;
      throw error;
    }

    return result.data;
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const result: ApiResponse<{ access_token: string; expires_in: number }> = await response.json();

    if (!result.success || !result.data) {
      const error: any = new Error(result.error?.message || 'Token refresh failed');
      error.code = result.error?.code;
      throw error;
    }

    return result.data;
  },

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const result: ApiResponse = await response.json();

    if (!result.success) {
      const error: any = new Error(result.error?.message || 'Logout failed');
      error.code = result.error?.code;
      throw error;
    }
  },
};
