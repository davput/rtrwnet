# API Error Codes & Validation

## Overview

Semua API endpoint memiliki validasi lengkap dan error codes yang jelas untuk memudahkan debugging dan handling di frontend.

---

## Error Response Format

```json
{
  "code": "AUTH_1001",
  "message": "Invalid email or password",
  "details": {
    "field": "Additional error details"
  }
}
```

---

## Error Code Categories

### 1xxx - Authentication Errors

| Code | Message | Status | Description |
|------|---------|--------|-------------|
| AUTH_1001 | Invalid email or password | 401 | Login credentials are incorrect |
| AUTH_1002 | Unauthorized access | 401 | No valid authentication token |
| AUTH_1003 | Token has expired | 401 | JWT token has expired |
| AUTH_1004 | Invalid token | 401 | JWT token is malformed or invalid |
| AUTH_1005 | User account is inactive | 403 | User account has been deactivated |
| AUTH_1006 | User not found | 404 | User does not exist |

### 2xxx - Validation Errors

| Code | Message | Status | Description |
|------|---------|--------|-------------|
| VAL_2001 | Validation failed | 400 | Request validation failed |
| VAL_2002 | Invalid email format | 400 | Email format is invalid |
| VAL_2003 | Invalid phone number | 400 | Phone number format is invalid |
| VAL_2004 | Invalid subdomain | 400 | Subdomain format is invalid |
| VAL_2005 | Password is too weak | 400 | Password doesn't meet requirements |
| VAL_2006 | Invalid input data | 400 | General input validation error |

### 3xxx - Tenant Errors

| Code | Message | Status | Description |
|------|---------|--------|-------------|
| TENANT_3001 | Tenant not found | 404 | Tenant does not exist |
| TENANT_3002 | Tenant is inactive | 403 | Tenant account is inactive |
| TENANT_3003 | Tenant already exists | 409 | Tenant with same data exists |
| TENANT_3004 | Subdomain is already taken | 409 | Subdomain is not available |

### 4xxx - Subscription Errors

| Code | Message | Status | Description |
|------|---------|--------|-------------|
| SUB_4001 | Subscription not found | 404 | No subscription found |
| SUB_4002 | Subscription has expired | 403 | Subscription period ended |
| SUB_4003 | Subscription cancelled | 403 | Subscription was cancelled |
| SUB_4004 | Invalid subscription plan | 400 | Plan ID is invalid |
| SUB_4005 | Trial already used | 400 | Free trial already claimed |

### 5xxx - Payment Errors

| Code | Message | Status | Description |
|------|---------|--------|-------------|
| PAY_5001 | Payment failed | 400 | Payment processing failed |
| PAY_5002 | Payment is pending | 202 | Payment is being processed |
| PAY_5003 | Invalid payment method | 400 | Payment method is invalid |

### 6xxx - Resource Errors

| Code | Message | Status | Description |
|------|---------|--------|-------------|
| RES_6001 | Resource not found | 404 | Requested resource not found |
| RES_6002 | Resource already exists | 409 | Resource with same ID exists |
| RES_6003 | Resource conflict | 409 | Resource state conflict |

### 9xxx - Server Errors

| Code | Message | Status | Description |
|------|---------|--------|-------------|
| SRV_9001 | Internal server error | 500 | Unexpected server error |
| SRV_9002 | Database error | 500 | Database operation failed |
| SRV_9003 | Cache error | 500 | Cache operation failed |

---

## Validation Rules

### Email
- Must be valid email format
- Example: `user@example.com`

### Password
- Minimum 6 characters
- For strong password: 8+ chars with uppercase, lowercase, and number
- Example: `MyPass123`

### Phone (Indonesian)
- Format: `08xxxxxxxxxx` (10-13 digits)
- Or: `+628xxxxxxxxxx`
- Or: `628xxxxxxxxxx`
- Example: `081234567890`

### Subdomain
- Only lowercase letters, numbers, and hyphens
- Must start with a letter
- Must not end with hyphen
- Length: 3-63 characters
- Example: `my-isp-jakarta`

### UUID
- Must be valid UUID v4 format
- Example: `550e8400-e29b-41d4-a716-446655440000`

---

## API Endpoint Validations

### POST /api/v1/auth/simple-login

**Request:**
```json
{
  "username": "admin@example.com",
  "password": "password123"
}
```

**Validation:**
- `username`: required, min 3 characters (email or subdomain)
- `password`: required, min 6 characters

**Possible Errors:**
```json
// Missing fields
{
  "code": "VAL_2001",
  "message": "Validation failed",
  "details": {
    "error": "Username and password are required",
    "username": "Must be at least 3 characters",
    "password": "Must be at least 6 characters"
  }
}

// Invalid credentials
{
  "code": "AUTH_1001",
  "message": "Invalid email or password"
}

// Inactive tenant
{
  "code": "TENANT_3002",
  "message": "Tenant is inactive"
}

// Inactive user
{
  "code": "AUTH_1005",
  "message": "User account is inactive"
}
```

---

### POST /api/v1/auth/login

**Request:**
```json
{
  "tenant_id": "uuid",
  "email": "admin@example.com",
  "password": "password123"
}
```

**Validation:**
- `tenant_id`: required, must be valid UUID
- `email`: required, must be valid email
- `password`: required, min 6 characters

**Possible Errors:**
```json
// Missing tenant_id
{
  "code": "VAL_2006",
  "message": "Missing tenant_id",
  "details": {
    "tenant_id": "Tenant ID is required for standard login. Use /auth/simple-login for login without tenant ID"
  }
}

// Invalid tenant
{
  "code": "TENANT_3001",
  "message": "Tenant not found"
}
```

---

### POST /api/v1/auth/register

**Request:**
```json
{
  "tenant_id": "uuid",
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "admin"
}
```

**Validation:**
- `tenant_id`: required, must be valid UUID
- `email`: required, must be valid email
- `password`: required, min 6 characters
- `name`: required
- `role`: required, must be one of: admin, operator, technician, viewer

**Possible Errors:**
```json
// Validation failed
{
  "code": "VAL_2001",
  "message": "Validation failed",
  "details": {
    "error": "Invalid request data",
    "role": "Must be one of: admin, operator, technician, viewer"
  }
}

// User already exists
{
  "code": "RES_6002",
  "message": "Resource already exists",
  "details": {
    "email": "User with this email already exists"
  }
}
```

---

### POST /api/v1/public/signup

**Request:**
```json
{
  "isp_name": "My ISP",
  "subdomain": "myisp",
  "email": "admin@myisp.com",
  "password": "password123",
  "phone": "081234567890",
  "plan_id": "uuid",
  "owner_name": "Owner Name",
  "use_trial": true
}
```

**Validation:**
- `isp_name`: required, min 3 characters
- `subdomain`: required, must match subdomain format
- `email`: required, must be valid email
- `password`: required, min 6 characters
- `phone`: required, must be valid Indonesian phone
- `plan_id`: required, must be valid UUID
- `owner_name`: required
- `use_trial`: optional boolean

**Possible Errors:**
```json
// Invalid subdomain
{
  "code": "VAL_2004",
  "message": "Invalid subdomain",
  "details": {
    "subdomain": "Subdomain must contain only lowercase letters, numbers, and hyphens"
  }
}

// Subdomain taken
{
  "code": "TENANT_3004",
  "message": "Subdomain is already taken"
}

// Invalid phone
{
  "code": "VAL_2003",
  "message": "Invalid phone number",
  "details": {
    "phone": "Must be a valid Indonesian phone number (08xxx or +628xxx)"
  }
}

// Invalid plan
{
  "code": "SUB_4004",
  "message": "Invalid subscription plan"
}
```

---

### GET /api/v1/billing

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Possible Errors:**
```json
// Missing token
{
  "code": "AUTH_1002",
  "message": "Unauthorized access"
}

// Token expired
{
  "code": "AUTH_1003",
  "message": "Token has expired"
}

// No subscription
{
  "code": "SUB_4001",
  "message": "Subscription not found"
}
```

---

### PUT /api/v1/billing/subscription

**Request:**
```json
{
  "plan_id": "uuid",
  "payment_method": "credit_card",
  "auto_renew": true
}
```

**Validation:**
- `plan_id`: required, must be valid UUID
- `payment_method`: optional
- `auto_renew`: optional boolean

**Possible Errors:**
```json
// Invalid plan
{
  "code": "SUB_4004",
  "message": "Invalid subscription plan"
}

// Subscription expired
{
  "code": "SUB_4002",
  "message": "Subscription has expired"
}
```

---

## Frontend Error Handling Example

### JavaScript

```javascript
async function login(username, password) {
    try {
        const response = await fetch('/api/v1/auth/simple-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Handle specific error codes
            switch (data.code) {
                case 'AUTH_1001':
                    showError('Email atau password salah');
                    break;
                case 'TENANT_3002':
                    showError('Akun tenant tidak aktif. Hubungi support.');
                    break;
                case 'AUTH_1005':
                    showError('Akun user tidak aktif. Hubungi admin.');
                    break;
                case 'VAL_2001':
                    // Show validation details
                    if (data.details) {
                        Object.keys(data.details).forEach(field => {
                            showFieldError(field, data.details[field]);
                        });
                    }
                    break;
                default:
                    showError(data.message || 'Terjadi kesalahan');
            }
            return null;
        }
        
        return data;
    } catch (error) {
        showError('Terjadi kesalahan jaringan');
        return null;
    }
}

function showError(message) {
    // Display error to user
    document.getElementById('error').textContent = message;
}

function showFieldError(field, message) {
    // Display field-specific error
    const fieldElement = document.getElementById(field + '-error');
    if (fieldElement) {
        fieldElement.textContent = message;
    }
}
```

---

## Summary

✅ **Error codes** - Setiap error punya code unik (AUTH_1001, VAL_2001, dll)
✅ **Clear messages** - Pesan error yang jelas dan actionable
✅ **Validation details** - Detail field mana yang error
✅ **Consistent format** - Format response yang konsisten
✅ **Frontend friendly** - Mudah di-handle di frontend

**Ready to use!** 🚀
