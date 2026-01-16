# Authentication API Documentation

API untuk autentikasi pengguna pada sistem ISP Management.

## Base URL
```
http://localhost:8089/api/v1
```

---

## Endpoints

### 1. Simple Login (Recommended)
Login menggunakan email dan password tanpa perlu tenant ID. Sistem akan otomatis mencari tenant berdasarkan email.

**Endpoint:** `POST /auth/simple-login`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Email pengguna |
| password | string | Yes | Password (min 6 karakter) |

**Request:**
```bash
curl -X POST "http://localhost:8089/api/v1/auth/simple-login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@example.com",
    "password": "password123"
  }'
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    },
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "ISP Maju Jaya",
      "subdomain": ""
    }
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": {
    "code": "AUTH_1001"
  }
}
```

---

### 2. Standard Login (with Tenant ID)
Login menggunakan tenant ID, email, dan password. Digunakan jika sudah mengetahui tenant ID.

**Endpoint:** `POST /auth/login`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tenant_id | string (UUID) | Yes | Tenant ID |
| email | string | Yes | Email pengguna |
| password | string | Yes | Password (min 6 karakter) |

**Request:**
```bash
curl -X POST "http://localhost:8089/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    },
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "ISP Maju Jaya",
      "subdomain": ""
    }
  }
}
```

---

### 3. Register User
Mendaftarkan user baru dalam tenant yang sudah ada.

**Endpoint:** `POST /auth/register`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tenant_id | string (UUID) | Yes | Tenant ID |
| email | string | Yes | Email pengguna (unique per tenant) |
| password | string | Yes | Password (min 6 karakter) |
| name | string | Yes | Nama lengkap |
| role | string | Yes | Role: `admin`, `operator`, `technician`, `viewer` |

**Request:**
```bash
curl -X POST "http://localhost:8089/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "operator@example.com",
    "password": "password123",
    "name": "Operator User",
    "role": "operator"
  }'
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "operator@example.com",
    "name": "Operator User",
    "role": "operator",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
    "message": "User registered successfully"
  }
}
```

**Response Error (409):**
```json
{
  "success": false,
  "message": "User already exists",
  "error": {
    "code": "RES_6002"
  }
}
```

---

### 4. Refresh Token
Mendapatkan access token baru menggunakan refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refresh_token | string | Yes | Refresh token dari login |

**Request:**
```bash
curl -X POST "http://localhost:8089/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token",
  "error": {
    "code": "AUTH_1004"
  }
}
```

---

### 5. Logout
Logout dan invalidate refresh token.

**Endpoint:** `POST /auth/logout`

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer {access_token}` |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refresh_token | string | No | Refresh token untuk di-invalidate |

**Request:**
```bash
curl -X POST "http://localhost:8089/api/v1/auth/logout" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

### 6. Get Current User (Me)
Mendapatkan informasi user yang sedang login.

**Endpoint:** `GET /auth/me`

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer {access_token}` |
| X-Tenant-ID | Yes | Tenant ID |

**Request:**
```bash
curl -X GET "http://localhost:8089/api/v1/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440001"
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_1001 | 401 | Invalid email or password |
| AUTH_1002 | 401 | Unauthorized access |
| AUTH_1003 | 401 | Token has expired |
| AUTH_1004 | 401 | Invalid token |
| AUTH_1005 | 403 | User account is inactive |
| VAL_2001 | 400 | Validation failed |
| VAL_2005 | 400 | Invalid password |
| VAL_2006 | 400 | Missing required field |
| TENANT_3001 | 404 | Tenant not found |
| TENANT_3002 | 403 | Tenant is inactive |
| RES_6002 | 409 | User already exists |
| SRV_9001 | 500 | Internal server error |

---

## User Roles

| Role | Description |
|------|-------------|
| `admin` | Full access ke semua fitur |
| `operator` | Manage customers, payments, tickets |
| `technician` | Manage devices, infrastructure, tickets |
| `viewer` | Read-only access |

---

## Token Information

| Token Type | Expiry | Description |
|------------|--------|-------------|
| Access Token | 15 menit | Digunakan untuk akses API |
| Refresh Token | 7 hari | Digunakan untuk mendapatkan access token baru |

---

## Authentication Flow

### 1. Login Flow
```
┌─────────┐          ┌─────────┐          ┌─────────┐
│ Client  │          │   API   │          │   DB    │
└────┬────┘          └────┬────┘          └────┬────┘
     │                    │                    │
     │ POST /auth/simple-login                 │
     │ {username, password}                    │
     │───────────────────>│                    │
     │                    │ Find user by email │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │ Verify password    │
     │                    │                    │
     │ {access_token,     │                    │
     │  refresh_token,    │                    │
     │  user, tenant}     │                    │
     │<───────────────────│                    │
     │                    │                    │
```

### 2. API Request Flow
```
┌─────────┐          ┌─────────┐          ┌─────────┐
│ Client  │          │   API   │          │   DB    │
└────┬────┘          └────┬────┘          └────┬────┘
     │                    │                    │
     │ GET /customers     │                    │
     │ Authorization: Bearer {token}           │
     │ X-Tenant-ID: {tenant_id}                │
     │───────────────────>│                    │
     │                    │ Validate token     │
     │                    │ Extract tenant     │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │ {customers data}   │                    │
     │<───────────────────│                    │
     │                    │                    │
```

### 3. Token Refresh Flow
```
┌─────────┐          ┌─────────┐
│ Client  │          │   API   │
└────┬────┘          └────┬────┘
     │                    │
     │ Access token expired
     │                    │
     │ POST /auth/refresh │
     │ {refresh_token}    │
     │───────────────────>│
     │                    │
     │ {new access_token, │
     │  new refresh_token}│
     │<───────────────────│
     │                    │
```

---

## Example: Complete Auth Flow

### 1. Login
```bash
# Login dengan email dan password
curl -X POST "http://localhost:8089/api/v1/auth/simple-login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@isp-maju.com",
    "password": "admin123"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "access_token": "eyJhbG...",
#     "refresh_token": "eyJhbG...",
#     "expires_in": 900,
#     "user": {...},
#     "tenant": {"id": "tenant-123", ...}
#   }
# }
```

### 2. Access Protected API
```bash
# Gunakan access_token dan tenant_id dari response login
curl -X GET "http://localhost:8089/api/v1/customers" \
  -H "Authorization: Bearer eyJhbG..." \
  -H "X-Tenant-ID: tenant-123"
```

### 3. Refresh Token (when access token expired)
```bash
curl -X POST "http://localhost:8089/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbG..."
  }'
```

### 4. Logout
```bash
curl -X POST "http://localhost:8089/api/v1/auth/logout" \
  -H "Authorization: Bearer eyJhbG..." \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbG..."
  }'
```

---

## Security Best Practices

1. **Simpan token dengan aman** - Gunakan httpOnly cookies atau secure storage
2. **Jangan expose refresh token** - Simpan di tempat yang aman
3. **Refresh token sebelum expired** - Implementasi auto-refresh
4. **Logout saat tidak digunakan** - Invalidate token saat logout
5. **Gunakan HTTPS** - Selalu gunakan HTTPS di production
