# Register API Documentation

## Endpoint

```
POST /api/v1/auth/register
```

## Description

Register a new user in the system. This is a public endpoint that doesn't require authentication.

## Request

### Headers
```
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenant_id | string | Yes | UUID of the tenant |
| email | string | Yes | User email (must be valid email format) |
| password | string | Yes | User password (minimum 6 characters) |
| name | string | Yes | User full name |
| role | string | Yes | User role: `admin`, `operator`, `technician`, or `viewer` |

### Example Request

```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@demo.com",
  "password": "password123",
  "name": "New User",
  "role": "operator"
}
```

## Response

### Success Response (201 Created)

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440003",
  "email": "newuser@demo.com",
  "name": "New User",
  "role": "operator",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "User registered successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "details": "Key: 'RegisterRequest.Email' Error:Field validation for 'Email' failed on the 'email' tag"
}
```

#### 404 Not Found - Tenant Not Found
```json
{
  "code": "INVALID_TENANT",
  "message": "Tenant not found"
}
```

#### 409 Conflict - User Already Exists
```json
{
  "code": "USER_EXISTS",
  "message": "User with this email already exists"
}
```

#### 500 Internal Server Error
```json
{
  "code": "INTERNAL_ERROR",
  "message": "Internal server error"
}
```

## User Roles

| Role | Description |
|------|-------------|
| `admin` | Full access to all features |
| `operator` | Manage customers, payments, tickets |
| `technician` | View customers, manage tickets, view devices |
| `viewer` | Read-only access to all data |

## Example Usage

### Using cURL

```bash
curl -X POST http://localhost:8089/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@demo.com",
    "password": "password123",
    "name": "New User",
    "role": "operator"
  }'
```

### Using PowerShell

```powershell
$body = @{
    tenant_id = "550e8400-e29b-41d4-a716-446655440000"
    email = "newuser@demo.com"
    password = "password123"
    name = "New User"
    role = "operator"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8089/api/v1/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### Using JavaScript (Fetch)

```javascript
fetch('http://localhost:8089/api/v1/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'newuser@demo.com',
    password: 'password123',
    name: 'New User',
    role: 'operator'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Validation Rules

1. **Email**: Must be valid email format
2. **Password**: Minimum 6 characters
3. **Role**: Must be one of: `admin`, `operator`, `technician`, `viewer`
4. **Tenant ID**: Must be valid UUID and tenant must exist
5. **Email Uniqueness**: Email must be unique within the tenant

## Security Notes

1. Password is automatically hashed using bcrypt with cost factor 12
2. User is created with `is_active = true` by default
3. Email uniqueness is enforced per tenant (same email can exist in different tenants)
4. Password is never returned in the response

## After Registration

After successful registration, the user can login using the `/api/v1/auth/login` endpoint with their email and password.

## Testing

### Test with Demo Tenant

```bash
# Register new user
curl -X POST http://localhost:8089/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@demo.com",
    "password": "test123456",
    "name": "Test User",
    "role": "viewer"
  }'

# Login with new user
curl -X POST http://localhost:8089/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@demo.com",
    "password": "test123456"
  }'
```

---

**Note**: This endpoint is public and doesn't require authentication. In production, you may want to add additional security measures like CAPTCHA or email verification.
