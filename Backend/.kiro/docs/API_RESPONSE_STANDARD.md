# API Response Standard - International Best Practices

## Overview

Semua API endpoint menggunakan format response yang konsisten mengikuti standar internasional REST API best practices.

---

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  },
  "meta": {
    // Optional metadata (pagination, etc)
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {
      // Optional error details
    }
  }
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate, etc) |
| 500 | Internal Server Error | Server error |

---

## Examples

### 1. Successful Login

**Request:**
```
POST /api/v1/auth/simple-login
```

```json
{
  "username": "admin@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
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
      "email": "admin@example.com",
      "name": "Admin Name",
      "role": "admin",
      "tenant_id": "tenant-uuid"
    }
  }
}
```

---

### 2. Validation Error

**Request:**
```
POST /api/v1/auth/simple-login
```

```json
{
  "username": "ad",
  "password": "123"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_2001",
    "message": "Validation failed",
    "details": {
      "username": "Must be at least 3 characters",
      "password": "Must be at least 6 characters"
    }
  }
}
```

---

### 3. Invalid Credentials

**Request:**
```
POST /api/v1/auth/simple-login
```

```json
{
  "username": "wrong@email.com",
  "password": "wrongpass"
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_1001",
    "message": "Invalid email or password"
  }
}
```

---

### 4. Successful Registration

**Request:**
```
POST /api/v1/auth/register
```

```json
{
  "tenant_id": "tenant-uuid",
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "admin"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user-uuid",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "admin",
    "tenant_id": "tenant-uuid",
    "message": "User registered successfully"
  }
}
```

---

### 5. Resource Not Found

**Request:**
```
GET /api/v1/billing
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "SUB_4001",
    "message": "Subscription not found"
  }
}
```

---

### 6. Inactive Tenant

**Request:**
```
POST /api/v1/auth/simple-login
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "TENANT_3002",
    "message": "Tenant is inactive"
  }
}
```

---

### 7. Successful Logout

**Request:**
```
POST /api/v1/auth/logout
```

```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 8. Get User Profile

**Request:**
```
GET /api/v1/auth/me
Headers: Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "admin",
      "tenant_id": "tenant-uuid"
    }
  }
}
```

---

### 9. List with Pagination

**Request:**
```
GET /api/v1/tenants?page=1&per_page=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tenants retrieved successfully",
  "data": [
    {
      "id": "tenant-1",
      "name": "Tenant 1",
      "subdomain": "tenant1"
    },
    {
      "id": "tenant-2",
      "name": "Tenant 2",
      "subdomain": "tenant2"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

---

### 10. Internal Server Error

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": {
    "code": "SRV_9001",
    "message": "Internal server error"
  }
}
```

---

## Frontend Integration

### JavaScript/TypeScript

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
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      // Handle error
      console.error(`API Error [${data.error?.code}]:`, data.error?.message);
      
      // Show user-friendly error
      if (data.error?.details) {
        Object.keys(data.error.details).forEach(field => {
          showFieldError(field, data.error.details[field]);
        });
      } else {
        showError(data.error?.message || 'An error occurred');
      }
      
      return data;
    }
    
    return data;
  } catch (error) {
    console.error('Network error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred'
      }
    };
  }
}

// Usage example
async function login(username: string, password: string) {
  const response = await apiCall<{
    access_token: string;
    user: User;
  }>('/api/v1/auth/simple-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (response.success && response.data) {
    // Store token
    localStorage.setItem('token', response.data.access_token);
    
    // Show success message
    showSuccess(response.message || 'Login successful');
    
    // Redirect
    window.location.href = '/dashboard';
  }
}
```

---

## Benefits

✅ **Consistent** - Same format across all endpoints
✅ **Predictable** - Easy to parse and handle
✅ **Informative** - Clear success/error indication
✅ **Standard** - Follows REST API best practices
✅ **Type-safe** - Easy to type in TypeScript
✅ **Frontend-friendly** - Simple to integrate

---

## Response Helper Functions

All handlers use these helper functions from `pkg/response/response.go`:

```go
// Success responses
response.OK(c, "message", data)           // 200
response.Created(c, "message", data)      // 201
response.NoContent(c)                     // 204

// Error responses
response.BadRequest(c, code, msg, details)      // 400
response.Unauthorized(c, code, msg)             // 401
response.Forbidden(c, code, msg)                // 403
response.NotFound(c, code, msg)                 // 404
response.Conflict(c, code, msg, details)        // 409
response.InternalServerError(c, code, msg)      // 500

// From AppError
response.ErrorFromAppError(c, appErr)
```

---

## Summary

✅ **Standard format** - `{success, message, data, error, meta}`
✅ **Clear status codes** - HTTP status codes yang tepat
✅ **Consistent errors** - Error format yang sama
✅ **Easy integration** - Mudah digunakan di frontend
✅ **Best practices** - Mengikuti standar internasional

**Ready to use!** 🚀
