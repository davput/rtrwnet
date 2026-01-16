# API Quick Reference

Quick reference untuk frontend developers.

---

## Base URL

```
http://localhost:8089/api/v1
```

---

## Response Format

```typescript
// Success
{ success: true, message: string, data: any }

// Error
{ success: false, error: { code: string, message: string, details?: any } }
```

---

## Quick Start

### 1. Get Plans

```javascript
GET /public/plans

const plans = await fetch('/api/v1/public/plans')
  .then(r => r.json());
```

### 2. Sign Up

```javascript
POST /public/signup

const result = await fetch('/api/v1/public/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    isp_name: 'My ISP',
    subdomain: 'myisp',
    email: 'admin@myisp.com',
    password: 'password123',
    phone: '081234567890',
    plan_id: 'plan-uuid',
    owner_name: 'John Doe',
    use_trial: true
  })
}).then(r => r.json());

if (result.success) {
  if (result.data.is_trial) {
    // Redirect to dashboard
  } else {
    // Redirect to payment
    window.location.href = result.data.payment_url;
  }
}
```

### 3. Login

```javascript
POST /auth/simple-login

const result = await fetch('/api/v1/auth/simple-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin@myisp.com', // or 'myisp'
    password: 'password123'
  })
}).then(r => r.json());

if (result.success) {
  localStorage.setItem('access_token', result.data.access_token);
  localStorage.setItem('tenant_id', result.data.user.tenant_id);
}
```

### 4. Get Billing Dashboard

```javascript
GET /billing

const token = localStorage.getItem('access_token');
const tenantId = localStorage.getItem('tenant_id');

const billing = await fetch('/api/v1/billing', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId
  }
}).then(r => r.json());

if (billing.success) {
  console.log(billing.data);
}
```

---

## All Endpoints

### Public (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/plans` | Get subscription plans |
| POST | `/public/signup` | Sign up new tenant |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/simple-login` | Login (email or subdomain) |
| POST | `/auth/login` | Login (with tenant_id) |
| POST | `/auth/register` | Register new user |
| POST | `/auth/logout` | Logout |
| POST | `/auth/refresh` | Refresh token |
| GET | `/auth/me` | Get current user |

### Billing (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing` | Get billing dashboard |
| PUT | `/billing/subscription` | Update subscription |
| PUT | `/billing/settings` | Update tenant settings |
| POST | `/billing/cancel` | Cancel subscription |
| PUT | `/billing/payment-method` | Update payment method |

---

## Common Error Codes

| Code | Message | Action |
|------|---------|--------|
| AUTH_1001 | Invalid credentials | Show "Wrong email/password" |
| AUTH_1003 | Token expired | Refresh token or re-login |
| TENANT_3002 | Tenant inactive | Show "Account inactive" |
| TENANT_3004 | Subdomain taken | Show "Choose another subdomain" |
| VAL_2001 | Validation failed | Show field errors |

---

## Headers

### For Protected Endpoints

```javascript
headers: {
  'Authorization': `Bearer ${access_token}`,
  'X-Tenant-ID': tenant_id,
  'Content-Type': 'application/json'
}
```

---

## TypeScript Types

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}
```

---

## Example: Complete Login Flow

```typescript
async function login(username: string, password: string) {
  try {
    const response = await fetch('/api/v1/auth/simple-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data: ApiResponse<AuthResponse> = await response.json();
    
    if (!data.success) {
      // Handle error
      switch (data.error?.code) {
        case 'AUTH_1001':
          alert('Invalid email or password');
          break;
        case 'TENANT_3002':
          alert('Your account is inactive');
          break;
        case 'AUTH_1005':
          alert('Your user account is inactive');
          break;
        default:
          alert(data.error?.message || 'Login failed');
      }
      return null;
    }
    
    // Success - store tokens
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('refresh_token', data.data.refresh_token);
    localStorage.setItem('tenant_id', data.data.user.tenant_id);
    
    return data.data;
  } catch (error) {
    alert('Network error');
    return null;
  }
}

// Usage
const result = await login('admin@myisp.com', 'password123');
if (result) {
  window.location.href = '/dashboard';
}
```

---

## Testing with cURL

```bash
# Get plans
curl http://localhost:8089/api/v1/public/plans

# Sign up
curl -X POST http://localhost:8089/api/v1/public/signup \
  -H "Content-Type: application/json" \
  -d '{"isp_name":"Test","subdomain":"test","email":"test@test.com","password":"test123","phone":"081234567890","plan_id":"uuid","owner_name":"Test","use_trial":true}'

# Login
curl -X POST http://localhost:8089/api/v1/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@test.com","password":"test123"}'

# Get billing
curl http://localhost:8089/api/v1/billing \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID"
```

---

## Need More Details?

See full documentation: `FRONTEND_API_DOCUMENTATION.md`
