# Tenant Management API

## Endpoints

### 1. Create Tenant

```
POST /api/v1/tenants
```

**Request:**
```json
{
  "name": "ISP Jakarta Timur",
  "subdomain": "jakartimur"
}
```

**Response (201):**
```json
{
  "id": "uuid-generated",
  "name": "ISP Jakarta Timur",
  "subdomain": "jakartimur",
  "is_active": true,
  "message": "Tenant created successfully"
}
```

### 2. List All Tenants

```
GET /api/v1/tenants
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Demo ISP",
      "subdomain": "demo",
      "is_active": true
    },
    {
      "id": "uuid-2",
      "name": "ISP Jakarta Timur",
      "subdomain": "jakartimur",
      "is_active": true
    }
  ],
  "total": 2
}
```

### 3. Get Tenant by ID

```
GET /api/v1/tenants/:id
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Demo ISP",
  "subdomain": "demo",
  "is_active": true
}
```

### 4. Update Tenant

```
PUT /api/v1/tenants/:id
```

**Request:**
```json
{
  "name": "ISP Jakarta Timur Updated",
  "is_active": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "ISP Jakarta Timur Updated",
  "subdomain": "jakartimur",
  "is_active": true,
  "message": "Tenant updated successfully"
}
```

### 5. Delete Tenant

```
DELETE /api/v1/tenants/:id
```

**Response (200):**
```json
{
  "message": "Tenant deleted successfully"
}
```

## Examples

### Create New Tenant

```powershell
curl -X POST http://localhost:8089/api/v1/tenants `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"ISP Bandung Barat\",\"subdomain\":\"bandungbarat\"}'
```

### List All Tenants

```powershell
curl http://localhost:8089/api/v1/tenants
```

### Get Specific Tenant

```powershell
curl http://localhost:8089/api/v1/tenants/550e8400-e29b-41d4-a716-446655440000
```

### Update Tenant

```powershell
curl -X PUT http://localhost:8089/api/v1/tenants/550e8400-e29b-41d4-a716-446655440000 `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Demo ISP Updated\",\"is_active\":true\"}'
```

### Delete Tenant

```powershell
curl -X DELETE http://localhost:8089/api/v1/tenants/550e8400-e29b-41d4-a716-446655440000
```

## Validation Rules

- **name**: Required, tenant name
- **subdomain**: Required, 3-50 characters, unique, lowercase recommended
- **is_active**: Boolean, default true

## Error Responses

### 409 Conflict - Subdomain Exists
```json
{
  "code": "SUBDOMAIN_EXISTS",
  "message": "Subdomain already exists"
}
```

### 404 Not Found
```json
{
  "code": "NOT_FOUND",
  "message": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "details": "..."
}
```

## Complete Flow

### 1. Create Tenant
```powershell
$tenant = curl -X POST http://localhost:8089/api/v1/tenants `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"My ISP\",\"subdomain\":\"myisp\"}' | ConvertFrom-Json

Write-Host "Tenant ID: $($tenant.id)"
Write-Host "Subdomain: $($tenant.subdomain)"
```

### 2. Register First User (Admin)
```powershell
$user = curl -X POST http://localhost:8089/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d "{\"tenant_id\":\"$($tenant.id)\",\"email\":\"admin@myisp.com\",\"password\":\"admin123\",\"name\":\"Admin User\",\"role\":\"admin\"}" | ConvertFrom-Json

Write-Host "User created: $($user.email)"
```

### 3. Login
```powershell
$login = curl -X POST http://localhost:8089/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"tenant_id\":\"$($tenant.id)\",\"email\":\"admin@myisp.com\",\"password\":\"admin123\"}" | ConvertFrom-Json

Write-Host "Access Token: $($login.access_token)"
```

## Notes

⚠️ **Security Warning**: 
- In production, tenant management endpoints should be protected
- Only super admin should be able to create/delete tenants
- Consider adding authentication middleware

💡 **Best Practices**:
- Use lowercase for subdomain
- Subdomain should be URL-friendly (no spaces, special chars)
- Keep subdomain short and memorable
- Subdomain cannot be changed after creation

---

**Ready to create tenants!** 🏢
