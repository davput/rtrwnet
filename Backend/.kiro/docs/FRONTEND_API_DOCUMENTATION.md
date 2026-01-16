# Frontend API Documentation

## Base URL

```
Development: http://localhost:8089/api/v1
Production: https://api.rtrwnet.com/api/v1
```

---

## Response Format

Semua endpoint menggunakan format response yang konsisten:

### Success Response
```typescript
{
  success: true,
  message: string,
  data?: any,
  meta?: {
    page?: number,
    per_page?: number,
    total?: number,
    total_pages?: number
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: Record<string, any>
  }
}
```

---

## TypeScript Interfaces

```typescript
// Base Response
interface ApiResponse<T = any> {
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

// User
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'technician' | 'viewer';
  tenant_id: string;
}

// Tenant
interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
}

// Subscription Plan
interface SubscriptionPlan {
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

// Auth Response
interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// Sign Up Response
interface SignUpResponse {
  tenant_id: string;
  user_id: string;
  order_id: string;
  amount: number;
  payment_url: string;
  is_trial: boolean;
  trial_ends: string;
  message: string;
}

// Billing Dashboard
interface BillingDashboard {
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
```

---

## API Endpoints

### 1. Public Endpoints (No Auth Required)

#### Get Subscription Plans

```typescript
GET /public/plans

Response: ApiResponse<{
  plans: SubscriptionPlan[];
  total: number;
}>
```

**Example:**
```typescript
const response = await fetch('/api/v1/public/plans');
const data: ApiResponse = await response.json();

if (data.success) {
  const plans = data.data.plans;
  console.log(`Found ${data.data.total} plans`);
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Plans retrieved successfully",
  "data": {
    "plans": [
      {
        "id": "plan-uuid",
        "name": "Standard",
        "slug": "standard",
        "description": "Perfect for small ISPs",
        "price": 299000,
        "billing_cycle": "monthly",
        "max_customers": 100,
        "max_users": 5,
        "features": {
          "customer_management": true,
          "billing": true,
          "reports": true
        }
      }
    ],
    "total": 3
  }
}
```

---

#### Sign Up

```typescript
POST /public/signup

Request: {
  isp_name: string;
  subdomain: string;
  email: string;
  password: string;
  phone: string;
  plan_id: string;
  owner_name: string;
  use_trial: boolean;
}

Response: ApiResponse<SignUpResponse>
```

**Example:**
```typescript
const signUpData = {
  isp_name: 'My ISP Jakarta',
  subdomain: 'myisp',
  email: 'admin@myisp.com',
  password: 'password123',
  phone: '081234567890',
  plan_id: 'plan-uuid',
  owner_name: 'John Doe',
  use_trial: true
};

const response = await fetch('/api/v1/public/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(signUpData)
});

const data: ApiResponse<SignUpResponse> = await response.json();

if (data.success) {
  if (data.data.is_trial) {
    // Free trial - redirect to dashboard
    console.log(`Trial ends: ${data.data.trial_ends}`);
    window.location.href = '/billing-dashboard';
  } else {
    // Paid - redirect to payment
    window.location.href = data.data.payment_url;
  }
}
```

**Success Response (Trial):**
```json
{
  "success": true,
  "message": "Sign up successful",
  "data": {
    "tenant_id": "tenant-uuid",
    "user_id": "user-uuid",
    "is_trial": true,
    "trial_ends": "2026-01-02",
    "message": "Your 7-day free trial has started!"
  }
}
```

**Error Response (Subdomain Taken):**
```json
{
  "success": false,
  "error": {
    "code": "TENANT_3004",
    "message": "Subdomain is already taken",
    "details": {
      "subdomain": "The subdomain 'myisp' is already in use."
    }
  }
}
```

---

### 2. Authentication Endpoints

#### Simple Login (Recommended)

```typescript
POST /auth/simple-login

Request: {
  username: string;  // email or subdomain
  password: string;
}

Response: ApiResponse<AuthResponse>
```

**Example:**
```typescript
// Login with email
const loginData = {
  username: 'admin@myisp.com',
  password: 'password123'
};

// OR login with subdomain
const loginData = {
  username: 'myisp',
  password: 'password123'
};

const response = await fetch('/api/v1/auth/simple-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData)
});

const data: ApiResponse<AuthResponse> = await response.json();

if (data.success) {
  // Store tokens
  localStorage.setItem('access_token', data.data.access_token);
  localStorage.setItem('refresh_token', data.data.refresh_token);
  localStorage.setItem('tenant_id', data.data.user.tenant_id);
  
  // Redirect
  window.location.href = '/dashboard';
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 900,
    "user": {
      "id": "user-uuid",
      "email": "admin@myisp.com",
      "name": "John Doe",
      "role": "admin",
      "tenant_id": "tenant-uuid"
    }
  }
}
```

**Error Responses:**
```json
// Invalid credentials
{
  "success": false,
  "error": {
    "code": "AUTH_1001",
    "message": "Invalid email or password"
  }
}

// Inactive tenant
{
  "success": false,
  "error": {
    "code": "TENANT_3002",
    "message": "Tenant is inactive"
  }
}

// Inactive user
{
  "success": false,
  "error": {
    "code": "AUTH_1005",
    "message": "User account is inactive"
  }
}
```

---

#### Standard Login (With Tenant ID)

```typescript
POST /auth/login

Request: {
  tenant_id: string;
  email: string;
  password: string;
}

Response: ApiResponse<AuthResponse>
```

---

#### Register User

```typescript
POST /auth/register

Request: {
  tenant_id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'operator' | 'technician' | 'viewer';
}

Response: ApiResponse<{
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
}>
```

---

#### Refresh Token

```typescript
POST /auth/refresh

Request: {
  refresh_token: string;
}

Response: ApiResponse<{
  access_token: string;
  expires_in: number;
}>
```

**Example:**
```typescript
const refreshToken = localStorage.getItem('refresh_token');

const response = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token: refreshToken })
});

const data = await response.json();

if (data.success) {
  localStorage.setItem('access_token', data.data.access_token);
}
```

---

#### Logout

```typescript
POST /auth/logout

Headers: {
  Authorization: Bearer <access_token>
}

Request: {
  refresh_token: string;
}

Response: ApiResponse<null>
```

---

#### Get Current User

```typescript
GET /auth/me

Headers: {
  Authorization: Bearer <access_token>
  X-Tenant-ID: <tenant_id>
}

Response: ApiResponse<{
  user: User;
}>
```

---

### 3. Billing Endpoints (Auth Required)

#### Get Billing Dashboard

```typescript
GET /billing

Headers: {
  Authorization: Bearer <access_token>
  X-Tenant-ID: <tenant_id>
}

Response: ApiResponse<BillingDashboard>
```

**Example:**
```typescript
const token = localStorage.getItem('access_token');
const tenantId = localStorage.getItem('tenant_id');

const response = await fetch('/api/v1/billing', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId
  }
});

const data: ApiResponse<BillingDashboard> = await response.json();

if (data.success) {
  const billing = data.data;
  console.log(`Plan: ${billing.billing.current_plan}`);
  console.log(`Status: ${billing.subscription.status}`);
  console.log(`Days left: ${billing.subscription.days_left}`);
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Billing dashboard retrieved successfully",
  "data": {
    "tenant": {
      "id": "tenant-uuid",
      "name": "My ISP",
      "subdomain": "myisp",
      "is_active": true
    },
    "subscription": {
      "plan_name": "Standard",
      "status": "trial",
      "is_trial": true,
      "days_left": 5,
      "auto_renew": true
    },
    "billing": {
      "current_plan": "Standard",
      "monthly_price": 299000,
      "currency": "IDR",
      "available_plans": [...]
    },
    "usage": {
      "days_used": 2,
      "days_remaining": 5
    },
    "invoices": []
  }
}
```

---

#### Update Subscription

```typescript
PUT /billing/subscription

Headers: {
  Authorization: Bearer <access_token>
  X-Tenant-ID: <tenant_id>
}

Request: {
  plan_id: string;
  payment_method?: string;
  auto_renew?: boolean;
}

Response: ApiResponse<null>
```

**Example:**
```typescript
const updateData = {
  plan_id: 'new-plan-uuid',
  auto_renew: true
};

const response = await fetch('/api/v1/billing/subscription', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});

const data = await response.json();

if (data.success) {
  alert('Subscription updated successfully!');
}
```

---

#### Update Tenant Settings

```typescript
PUT /billing/settings

Headers: {
  Authorization: Bearer <access_token>
  X-Tenant-ID: <tenant_id>
}

Request: {
  name?: string;
  email?: string;
  phone?: string;
}

Response: ApiResponse<null>
```

---

#### Cancel Subscription

```typescript
POST /billing/cancel

Headers: {
  Authorization: Bearer <access_token>
  X-Tenant-ID: <tenant_id>
}

Request: {
  reason?: string;
}

Response: ApiResponse<null>
```

---

#### Update Payment Method

```typescript
PUT /billing/payment-method

Headers: {
  Authorization: Bearer <access_token>
  X-Tenant-ID: <tenant_id>
}

Request: {
  payment_method: string;
  card_number?: string;
  card_holder?: string;
  expiry_month?: number;
  expiry_year?: number;
}

Response: ApiResponse<null>
```

---

## Error Codes Reference

### Authentication (1xxx)
- `AUTH_1001`: Invalid credentials
- `AUTH_1002`: Unauthorized
- `AUTH_1003`: Token expired
- `AUTH_1004`: Invalid token
- `AUTH_1005`: User inactive
- `AUTH_1006`: User not found

### Validation (2xxx)
- `VAL_2001`: Validation failed
- `VAL_2002`: Invalid email
- `VAL_2003`: Invalid phone
- `VAL_2004`: Invalid subdomain
- `VAL_2005`: Weak password
- `VAL_2006`: Invalid input

### Tenant (3xxx)
- `TENANT_3001`: Tenant not found
- `TENANT_3002`: Tenant inactive
- `TENANT_3003`: Tenant exists
- `TENANT_3004`: Subdomain taken

### Subscription (4xxx)
- `SUB_4001`: Subscription not found
- `SUB_4002`: Subscription expired
- `SUB_4003`: Subscription cancelled
- `SUB_4004`: Invalid plan
- `SUB_4005`: Trial already used

### Server (9xxx)
- `SRV_9001`: Internal server error
- `SRV_9002`: Database error
- `SRV_9003`: Cache error

---

## Helper Functions

### API Client

```typescript
class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }
  
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (includeAuth) {
      const token = localStorage.getItem('access_token');
      const tenantId = localStorage.getItem('tenant_id');
      
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantId) headers['X-Tenant-ID'] = tenantId;
    }
    
    return headers;
  }
  
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(includeAuth),
          ...options.headers
        }
      });
      
      const data: ApiResponse<T> = await response.json();
      
      // Handle token expiration
      if (!data.success && data.error?.code === 'AUTH_1003') {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request
          return this.request(endpoint, options, includeAuth);
        }
      }
      
      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred'
        }
      };
    }
  }
  
  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    
    const response = await this.request<{ access_token: string }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      }
    );
    
    if (response.success && response.data) {
      localStorage.setItem('access_token', response.data.access_token);
      return true;
    }
    
    return false;
  }
  
  // Public endpoints
  async getPlans() {
    return this.request<{ plans: SubscriptionPlan[]; total: number }>(
      '/public/plans'
    );
  }
  
  async signUp(data: any) {
    return this.request<SignUpResponse>(
      '/public/signup',
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
  }
  
  // Auth endpoints
  async simpleLogin(username: string, password: string) {
    return this.request<AuthResponse>(
      '/auth/simple-login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }
    );
  }
  
  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.request(
      '/auth/logout',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      },
      true
    );
  }
  
  async getMe() {
    return this.request<{ user: User }>(
      '/auth/me',
      {},
      true
    );
  }
  
  // Billing endpoints
  async getBillingDashboard() {
    return this.request<BillingDashboard>(
      '/billing',
      {},
      true
    );
  }
  
  async updateSubscription(data: any) {
    return this.request(
      '/billing/subscription',
      {
        method: 'PUT',
        body: JSON.stringify(data)
      },
      true
    );
  }
}

// Usage
const api = new ApiClient();

// Login
const loginResult = await api.simpleLogin('admin@myisp.com', 'password123');
if (loginResult.success) {
  localStorage.setItem('access_token', loginResult.data.access_token);
}

// Get billing
const billingResult = await api.getBillingDashboard();
if (billingResult.success) {
  console.log(billingResult.data);
}
```

---

## Complete Example: Sign Up Flow

```typescript
import React, { useState } from 'react';

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState({
    isp_name: '',
    subdomain: '',
    email: '',
    password: '',
    phone: '',
    plan_id: '',
    owner_name: '',
    use_trial: true
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    const response = await fetch('/api/v1/public/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data: ApiResponse<SignUpResponse> = await response.json();
    
    if (!data.success) {
      // Handle errors
      if (data.error?.details) {
        setErrors(data.error.details);
      } else {
        alert(data.error?.message);
      }
      setLoading(false);
      return;
    }
    
    // Success
    if (data.data.is_trial) {
      // Auto login for trial users
      await autoLogin(
        data.data.tenant_id,
        formData.email,
        formData.password
      );
      window.location.href = '/billing-dashboard';
    } else {
      // Redirect to payment
      window.location.href = data.data.payment_url;
    }
  };
  
  const autoLogin = async (
    tenantId: string,
    email: string,
    password: string
  ) => {
    const response = await fetch('/api/v1/auth/simple-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      localStorage.setItem('tenant_id', tenantId);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
};
```

---

## Testing

### cURL Examples

```bash
# Get plans
curl http://localhost:8089/api/v1/public/plans

# Sign up
curl -X POST http://localhost:8089/api/v1/public/signup \
  -H "Content-Type: application/json" \
  -d '{
    "isp_name": "Test ISP",
    "subdomain": "testisp",
    "email": "admin@test.com",
    "password": "test123",
    "phone": "081234567890",
    "plan_id": "plan-uuid",
    "owner_name": "Test Owner",
    "use_trial": true
  }'

# Simple login
curl -X POST http://localhost:8089/api/v1/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@test.com",
    "password": "test123"
  }'

# Get billing (with auth)
curl http://localhost:8089/api/v1/billing \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```

---

## Summary

✅ **Consistent format** - Semua endpoint menggunakan format yang sama
✅ **Type-safe** - TypeScript interfaces lengkap
✅ **Error handling** - Error codes yang jelas
✅ **Helper functions** - API client siap pakai
✅ **Complete examples** - Contoh implementasi lengkap

**Ready for frontend integration!** 🚀
