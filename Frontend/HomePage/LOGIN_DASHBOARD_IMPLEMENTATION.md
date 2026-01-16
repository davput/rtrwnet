# Login & Dashboard Implementation

## Overview

Implementasi fitur login dan dashboard sesuai dengan dokumen `TEST_SIMPLE_LOGIN.md`.

## Features Implemented

### 1. Simple Login (`/login`)

**Endpoint:** `POST /api/v1/auth/simple-login`

**Features:**
- ✅ Login dengan email atau subdomain
- ✅ Password visibility toggle
- ✅ Loading state
- ✅ Error handling dengan toast
- ✅ Store tokens di sessionStorage
- ✅ Auto redirect ke dashboard

**Form Fields:**
- Username (email atau subdomain)
- Password

**Login Methods:**
1. **Email:** `admin@isp.com`
2. **Subdomain:** `myisp` (akan login sebagai admin)

---

### 2. Billing Dashboard (`/dashboard`)

**Endpoint:** `GET /api/v1/billing`

**Features:**
- ✅ Fetch billing data dari API
- ✅ Display trial status (days remaining)
- ✅ Display billing information
- ✅ Display subscription status
- ✅ Button to go to tenant dashboard
- ✅ Logout functionality
- ✅ Support both registration flow dan login flow

**Data Displayed:**
- Trial status & countdown
- Current plan & price
- Subscription status
- Tenant information
- Payment status

---

## User Flows

### Flow 1: Registration → Dashboard

```
1. User register di /register
   ↓
2. Backend create tenant & activate trial
   ↓
3. Response: { tenant_id, trial_ends, ... }
   ↓
4. Redirect to /dashboard?tenant_id=xxx&email=xxx&trial=true&trial_ends=xxx
   ↓
5. Dashboard shows registration success data
   ↓
6. User clicks "Buka Dashboard Tenant"
   ↓
7. Redirect to external tenant dashboard
```

### Flow 2: Login → Dashboard

```
1. User goes to /login
   ↓
2. Enter username (email or subdomain) & password
   ↓
3. Submit to POST /api/v1/auth/simple-login
   ↓
4. Response: { access_token, user, tenant, ... }
   ↓
5. Store tokens in sessionStorage
   ↓
6. Redirect to /dashboard
   ↓
7. Dashboard fetches billing data from GET /api/v1/billing
   ↓
8. Display billing information
   ↓
9. User clicks "Buka Dashboard Tenant"
   ↓
10. Redirect to external tenant dashboard
```

---

## API Integration

### Login API

**Request:**
```typescript
POST /api/v1/auth/simple-login
Content-Type: application/json

{
  "username": "admin@isp.com",  // or "subdomain"
  "password": "password123"
}
```

**Response:**
```typescript
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 900,
  "user": {
    "id": "user-uuid",
    "email": "admin@isp.com",
    "name": "Admin Name",
    "role": "admin",
    "tenant_id": "tenant-uuid"
  },
  "tenant": {
    "id": "tenant-uuid",
    "name": "ISP Name",
    "subdomain": "subdomain"
  }
}
```

### Billing API

**Request:**
```typescript
GET /api/v1/billing
Authorization: Bearer {access_token}
X-Tenant-ID: {tenant_id}
```

**Response:**
```typescript
{
  "tenant": {
    "id": "tenant-uuid",
    "name": "ISP Name",
    "subdomain": "subdomain"
  },
  "billing": {
    "current_plan": "Standard Plan",
    "price": 299000,
    "billing_cycle": "monthly"
  },
  "subscription": {
    "status": "trial",
    "is_trial": true,
    "trial_ends": "2026-01-10",
    "days_left": 7
  }
}
```

---

## Session Storage

Data yang disimpan setelah login:

```typescript
sessionStorage.setItem('access_token', data.access_token);
sessionStorage.setItem('refresh_token', data.refresh_token);
sessionStorage.setItem('tenant_id', data.user.tenant_id);
sessionStorage.setItem('user_email', data.user.email);
sessionStorage.setItem('user_name', data.user.name);
```

---

## Components

### Login Page (`src/pages/Login.tsx`)

**State:**
```typescript
const [formData, setFormData] = useState({
  username: "",
  password: "",
});
const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
```

**Key Functions:**
- `handleSubmit()` - Submit login form
- `handleChange()` - Update form data

### Dashboard Page (`src/pages/Dashboard.tsx`)

**State:**
```typescript
const [loading, setLoading] = useState(true);
const [billingData, setBillingData] = useState<BillingData | null>(null);
```

**Key Functions:**
- `loadBillingData()` - Fetch billing data from API
- `handleLogout()` - Clear session and redirect
- `handleGoToDashboard()` - Redirect to tenant dashboard

---

## Error Handling

### Login Errors

**Invalid Credentials (401):**
```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "status": 401
}
```

**Inactive Tenant (403):**
```json
{
  "code": "TENANT_INACTIVE",
  "message": "Tenant is inactive",
  "status": 403
}
```

**Frontend Handling:**
```typescript
catch (error: any) {
  toast({
    title: "Login Gagal",
    description: error.message || "Periksa username dan password Anda",
    variant: "destructive",
  });
}
```

### Dashboard Errors

**Unauthorized (401):**
- Redirect to login page

**Failed to Fetch:**
- Show error message
- Don't redirect (allow retry)

---

## Testing

### Test Login with Email

```bash
# 1. Register first (if not exists)
curl -X POST http://localhost:8089/api/v1/public/signup \
  -H "Content-Type: application/json" \
  -d '{
    "isp_name": "Test ISP",
    "subdomain": "testisp",
    "email": "admin@testisp.com",
    "password": "test123",
    "phone": "08123456789",
    "plan_id": "550e8400-e29b-41d4-a716-446655440010",
    "owner_name": "Test Owner",
    "use_trial": true
  }'

# 2. Login with email
curl -X POST http://localhost:8089/api/v1/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@testisp.com",
    "password": "test123"
  }'
```

### Test Login with Subdomain

```bash
curl -X POST http://localhost:8089/api/v1/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testisp",
    "password": "test123"
  }'
```

### Test Billing Dashboard

```bash
# Get access token from login response
ACCESS_TOKEN="eyJhbGc..."
TENANT_ID="tenant-uuid"

curl -X GET http://localhost:8089/api/v1/billing \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"
```

---

## Frontend Testing

### Test Login Flow

1. Open `http://localhost:5173/login`
2. Enter username: `admin@testisp.com` or `testisp`
3. Enter password: `test123`
4. Click "Login"
5. Should redirect to `/dashboard`
6. Should show billing information

### Test Dashboard

1. After login, should see:
   - ✅ Trial countdown (if trial active)
   - ✅ Billing information
   - ✅ Subscription status
   - ✅ "Buka Dashboard Tenant" button

2. Click "Buka Dashboard Tenant"
   - Should redirect to external dashboard
   - URL: `https://dashboard.yourdomain.com?tenant_id=xxx&email=xxx`

### Test Logout

1. Click "Keluar" button
2. Should clear sessionStorage
3. Should redirect to homepage

---

## Security

### Token Storage

- Tokens stored in `sessionStorage` (not localStorage)
- Cleared on logout
- Cleared on browser close

### API Headers

```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'X-Tenant-ID': tenantId,
}
```

### Protected Routes

Dashboard checks for:
1. Access token in sessionStorage
2. If not found, redirect to login
3. If token invalid, show error

---

## Environment Variables

```env
VITE_API_URL=http://localhost:8089
VITE_DASHBOARD_URL=https://dashboard.yourdomain.com
```

---

## Files Modified/Created

### Created:
- `src/pages/Login.tsx` - Login page with simple login
- `src/pages/Dashboard.tsx` - Dashboard with billing info

### Updated:
- `src/pages/Register.tsx` - Redirect to dashboard after registration

### Documentation:
- `LOGIN_DASHBOARD_IMPLEMENTATION.md` - This file

---

## Comparison: Old vs New

### Old Login
- Dummy login (demo@demo.com)
- No API integration
- Redirect to select-plan

### New Login
- Real API integration
- Simple login (email or subdomain)
- Store tokens
- Redirect to dashboard

### Old Dashboard
- Mock data only
- No API integration
- Complex profile display

### New Dashboard
- Fetch from billing API
- Real-time data
- Support both registration and login flow
- Simpler, focused on billing

---

## Next Steps

### Immediate
1. ✅ Test login with backend
2. ✅ Test dashboard with billing API
3. ✅ Verify token storage
4. ✅ Test logout

### Future Enhancements
1. Add refresh token logic
2. Add "Remember Me" functionality
3. Add forgot password
4. Add email verification
5. Add 2FA support

---

## Summary

**Login:**
- Simple login dengan username (email/subdomain) + password
- API: `POST /api/v1/auth/simple-login`
- Store tokens di sessionStorage
- Redirect ke dashboard

**Dashboard:**
- Fetch billing data dari API
- API: `GET /api/v1/billing`
- Display trial status & billing info
- Button ke tenant dashboard external

**Ready to test!** 🚀
