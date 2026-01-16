# 📖 OpenAPI Documentation Guide

## Overview

API documentation menggunakan **OpenAPI 3.0** specification yang dapat digunakan untuk:
- Generate API client code
- Interactive API testing
- API documentation website
- Contract testing

---

## 📄 OpenAPI File

**Location:** `docs/openapi.yaml`

**Format:** YAML (OpenAPI 3.0.3)

---

## 🚀 Quick Start

### 1. View Documentation Online

#### Option A: Swagger UI (Recommended)

**Online Viewer:**
1. Buka https://editor.swagger.io/
2. File → Import File → pilih `docs/openapi.yaml`
3. Documentation akan muncul di sebelah kanan

**Local Swagger UI:**
```bash
# Install swagger-ui
npm install -g swagger-ui-watcher

# Run
swagger-ui-watcher docs/openapi.yaml
```

Buka: http://localhost:8000

#### Option B: Redoc

**Online:**
```bash
npx @redocly/cli preview-docs docs/openapi.yaml
```

Buka: http://localhost:8080

#### Option C: VS Code Extension

Install extension: **OpenAPI (Swagger) Editor**
- Buka `docs/openapi.yaml`
- Klik icon preview di kanan atas

---

### 2. Test API Interactively

**Swagger UI** memungkinkan testing langsung:

1. Buka Swagger UI (online atau local)
2. Klik endpoint yang ingin ditest
3. Klik **"Try it out"**
4. Isi parameters/body
5. Klik **"Execute"**
6. Lihat response

**Example: Test Login**
```yaml
POST /auth/simple-login
Body:
{
  "username": "admin@myisp.com",
  "password": "password123"
}
```

---

### 3. Generate API Client

#### JavaScript/TypeScript

```bash
# Install generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g typescript-axios \
  -o frontend/src/api-client

# Generate JavaScript client
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g javascript \
  -o frontend/src/api-client
```

**Usage:**
```typescript
import { DefaultApi } from './api-client';

const api = new DefaultApi();

// Login
const response = await api.authSimpleLoginPost({
  username: 'admin@myisp.com',
  password: 'password123'
});

console.log(response.data.access_token);
```

#### Go Client

```bash
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g go \
  -o client/go
```

#### Python Client

```bash
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g python \
  -o client/python
```

---

### 4. Generate TypeScript Types

```bash
# Install
npm install -g openapi-typescript

# Generate types
openapi-typescript docs/openapi.yaml --output frontend/src/types/api.ts
```

**Usage:**
```typescript
import type { paths } from './types/api';

type LoginRequest = paths['/auth/simple-login']['post']['requestBody']['content']['application/json'];
type LoginResponse = paths['/auth/simple-login']['post']['responses']['200']['content']['application/json'];

const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch('/api/v1/auth/simple-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

---

## 🔧 Tools & Integrations

### Postman

**Import OpenAPI to Postman:**
1. Buka Postman
2. Import → Upload Files
3. Pilih `docs/openapi.yaml`
4. Collection akan dibuat otomatis

### Insomnia

**Import to Insomnia:**
1. Buka Insomnia
2. Create → Import From → File
3. Pilih `docs/openapi.yaml`

### VS Code REST Client

**Create `.http` file from OpenAPI:**
```bash
# Install
npm install -g openapi-to-http

# Generate
openapi-to-http docs/openapi.yaml > api.http
```

---

## 📝 OpenAPI Structure

### Basic Structure

```yaml
openapi: 3.0.3
info:
  title: API Title
  version: 1.0.0
servers:
  - url: http://localhost:8089/api/v1
paths:
  /endpoint:
    get:
      summary: Description
      responses:
        '200':
          description: Success
components:
  schemas:
    Model:
      type: object
      properties:
        field: string
```

### Key Sections

1. **info** - API metadata
2. **servers** - Base URLs
3. **paths** - API endpoints
4. **components** - Reusable schemas
5. **security** - Auth schemes

---

## 🎯 Available Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /public/plans` - Get subscription plans
- `POST /public/signup` - Sign up new tenant

### Authentication
- `POST /auth/simple-login` - Login with email
- `POST /auth/login` - Login with tenant ID
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Billing (Protected)
- `GET /billing` - Get billing dashboard
- `PUT /billing/subscription` - Update subscription
- `POST /billing/cancel` - Cancel subscription

---

## 🔐 Authentication

### Bearer Token

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**In Swagger UI:**
1. Klik **"Authorize"** button (🔒)
2. Masukkan token: `Bearer <your_token>`
3. Klik **"Authorize"**
4. Semua request akan include token

### Tenant ID

**Header:**
```
X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440000
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
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

## 🧪 Testing Examples

### cURL

```bash
# Get plans
curl http://localhost:8089/api/v1/public/plans

# Sign up
curl -X POST http://localhost:8089/api/v1/public/signup \
  -H "Content-Type: application/json" \
  -d '{
    "isp_name": "My ISP",
    "email": "admin@myisp.com",
    "password": "password123",
    "phone": "081234567890",
    "plan_id": "plan-uuid",
    "owner_name": "John Doe",
    "use_trial": true
  }'

# Login
curl -X POST http://localhost:8089/api/v1/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@myisp.com",
    "password": "password123"
  }'

# Get billing (with auth)
curl http://localhost:8089/api/v1/billing \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```

### JavaScript Fetch

```javascript
// Login
const login = async () => {
  const response = await fetch('http://localhost:8089/api/v1/auth/simple-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@myisp.com',
      password: 'password123'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('tenant_id', data.data.user.tenant_id);
  }
};

// Get billing
const getBilling = async () => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  const response = await fetch('http://localhost:8089/api/v1/billing', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    }
  });
  
  return response.json();
};
```

---

## 🔄 Updating Documentation

### When to Update

Update `docs/openapi.yaml` when:
- Adding new endpoints
- Changing request/response format
- Adding new fields
- Changing validation rules
- Updating error codes

### Validation

**Validate OpenAPI spec:**
```bash
# Install validator
npm install -g @apidevtools/swagger-cli

# Validate
swagger-cli validate docs/openapi.yaml
```

**Online validator:**
https://apitools.dev/swagger-parser/online/

---

## 📚 Resources

### Documentation
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Redoc](https://redocly.com/redoc/)

### Tools
- [Swagger Editor](https://editor.swagger.io/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Postman](https://www.postman.com/)

### VS Code Extensions
- OpenAPI (Swagger) Editor
- REST Client
- Thunder Client

---

## 🎉 Summary

✅ **OpenAPI spec:** `docs/openapi.yaml`

✅ **View online:** https://editor.swagger.io/

✅ **Generate client:** `openapi-generator-cli`

✅ **Test API:** Swagger UI / Postman

✅ **TypeScript types:** `openapi-typescript`

**Happy API Development!** 🚀
