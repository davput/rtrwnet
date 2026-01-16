# API Update Summary

## Overview

Frontend telah diupdate untuk menggunakan format API response baru sesuai dengan `FRONTEND_API_DOCUMENTATION.md`.

## Changes Made

### 1. API Client (`src/lib/api.ts`)

**New Response Format:**
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
```

**Updated Functions:**
- ✅ `getPlans()` - Returns `Plan[]` from `data.plans`
- ✅ `signUp()` - Returns `SignUpData` from `data`
- ✅ `simpleLogin()` - Returns `AuthData` from `data`
- ✅ `getBillingDashboard()` - Returns `BillingDashboard` from `data`
- ✅ `refreshToken()` - Returns token data from `data`
- ✅ `logout()` - Handles new response format

**Error Handling:**
```typescript
if (!result.success || !result.data) {
  const error: any = new Error(result.error?.message || 'Operation failed');
  error.code = result.error?.code;
  error.details = result.error?.details;
  throw error;
}
```

---

### 2. Login Page (`src/pages/Login.tsx`)

**Before:**
```typescript
const response = await fetch(`${API_URL}/api/v1/auth/simple-login`, {
  method: 'POST',
  body: JSON.stringify({ username, password })
});
const data = await response.json();
```

**After:**
```typescript
const data = await api.simpleLogin(formData.username, formData.password);
// data is already typed as AuthData
```

**Benefits:**
- Type-safe response
- Automatic error handling
- Cleaner code

---

### 3. Register Page (`src/pages/Register.tsx`)

**No changes needed** - Already using `api.signUp()` which has been updated internally.

**Response handling:**
```typescript
const response = await api.signUp({...});
// response is SignUpData with correct structure
```

---

### 4. Dashboard Page (`src/pages/Dashboard.tsx`)

**Before:**
```typescript
const response = await fetch(`${API_URL}/api/v1/billing`, {
  headers: { ... }
});
const data = await response.json();
setBillingData(data);
```

**After:**
```typescript
const billingData = await api.getBillingDashboard(accessToken!, tenantId!);
setBillingData(billingData);
// billingData is typed as BillingDashboard
```

**Updated Interface:**
```typescript
interface BillingDashboard {
  tenant: { ... };
  subscription: { ... };
  billing: {
    monthly_price: number;  // Changed from 'price'
    ...
  };
  usage: { ... };
  invoices: [ ... ];
}
```

---

## Response Format Examples

### Success Response

**Old Format:**
```json
{
  "access_token": "...",
  "user": { ... }
}
```

**New Format:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "...",
    "user": { ... }
  }
}
```

### Error Response

**Old Format:**
```json
{
  "error": "Invalid credentials"
}
```

**New Format:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_1001",
    "message": "Invalid credentials",
    "details": { ... }
  }
}
```

---

## API Endpoints Updated

### Public Endpoints

1. **GET /api/v1/public/plans**
   - Response: `ApiResponse<{ plans: Plan[]; total: number }>`
   - Access: `result.data.plans`

2. **POST /api/v1/public/signup**
   - Response: `ApiResponse<SignUpData>`
   - Access: `result.data`

### Auth Endpoints

3. **POST /api/v1/auth/simple-login**
   - Response: `ApiResponse<AuthData>`
   - Access: `result.data`

4. **POST /api/v1/auth/refresh**
   - Response: `ApiResponse<{ access_token: string }>`
   - Access: `result.data.access_token`

5. **POST /api/v1/auth/logout**
   - Response: `ApiResponse<null>`
   - Check: `result.success`

### Billing Endpoints

6. **GET /api/v1/billing**
   - Response: `ApiResponse<BillingDashboard>`
   - Access: `result.data`

---

## Type Safety

All API functions now return properly typed data:

```typescript
// Before (any type)
const data: any = await response.json();

// After (typed)
const data: AuthData = await api.simpleLogin(username, password);
const plans: Plan[] = await api.getPlans();
const billing: BillingDashboard = await api.getBillingDashboard(token, tenantId);
```

---

## Error Handling

Consistent error handling across all endpoints:

```typescript
try {
  const data = await api.simpleLogin(username, password);
  // Success
} catch (error: any) {
  console.log(error.code);     // e.g., "AUTH_1001"
  console.log(error.message);  // e.g., "Invalid credentials"
  console.log(error.details);  // Additional details if available
}
```

---

## Migration Checklist

- ✅ Updated `src/lib/api.ts` with new response format
- ✅ Updated `src/pages/Login.tsx` to use new API
- ✅ Updated `src/pages/Dashboard.tsx` to use new API
- ✅ Updated `BillingDashboard` interface
- ✅ All error handling uses new format
- ✅ Type safety improved across all API calls

---

## Testing

### Test Login
```typescript
// Should work with new format
const data = await api.simpleLogin('admin@test.com', 'password');
console.log(data.access_token);
console.log(data.user.name);
```

### Test Sign Up
```typescript
// Should work with new format
const result = await api.signUp({...});
console.log(result.tenant_id);
console.log(result.is_trial);
```

### Test Billing
```typescript
// Should work with new format
const billing = await api.getBillingDashboard(token, tenantId);
console.log(billing.subscription.plan_name);
console.log(billing.billing.monthly_price);
```

---

## Breaking Changes

### 1. Response Structure
- All responses now wrapped in `{ success, data, error }`
- Must access data via `result.data`

### 2. Billing Interface
- `billing.price` → `billing.monthly_price`
- `billing.billing_cycle` → removed (always monthly)
- Added `subscription.plan_name` field
- Added `usage` object
- Added `invoices` array

### 3. Error Format
- Errors now have `code`, `message`, and `details`
- Must check `result.success` instead of HTTP status

---

## Benefits

✅ **Consistent** - All endpoints use same format
✅ **Type-safe** - Full TypeScript support
✅ **Better errors** - Structured error responses
✅ **Cleaner code** - Less boilerplate
✅ **Future-proof** - Easy to extend

---

## Files Modified

1. `src/lib/api.ts` - Complete rewrite with new format
2. `src/pages/Login.tsx` - Use new `api.simpleLogin()`
3. `src/pages/Dashboard.tsx` - Use new `api.getBillingDashboard()`
4. `src/pages/Register.tsx` - Already compatible (no changes)

---

## Summary

Frontend sekarang menggunakan format API response baru yang konsisten:

**Old:**
```typescript
const response = await fetch(url);
const data = await response.json();
if (!response.ok) throw new Error(data.error);
```

**New:**
```typescript
const data = await api.method();
// Automatic error handling, typed response
```

**Ready to use!** 🚀
