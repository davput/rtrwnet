# Remove Subdomain - Implementation Summary

## ✅ Subdomain Dihapus Sepenuhnya

Subdomain sudah dihapus dari sistem. Dashboard sekarang di **app.rtrwnet.com** untuk semua tenant.

---

## Key Changes

### 1. Database Schema

**Before:**
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE NOT NULL,  -- REMOVED
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);
```

**After:**
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,  -- Now required and unique
    is_active BOOLEAN DEFAULT true
);
```

**Migration:** `migrations/000010_remove_subdomain_column.up.sql`

---

### 2. Tenant Entity

**Before:**
```go
type Tenant struct {
    ID        string
    Name      string
    Email     string
    Subdomain string  // REMOVED
    IsActive  bool
}
```

**After:**
```go
type Tenant struct {
    ID        string
    Name      string
    Email     string  // Unique per tenant
    IsActive  bool
}
```

---

### 3. Sign Up Request

**Before:**
```json
{
  "isp_name": "My ISP",
  "subdomain": "myisp",  // REMOVED
  "email": "admin@myisp.com",
  "password": "password123",
  ...
}
```

**After:**
```json
{
  "isp_name": "My ISP",
  "email": "admin@myisp.com",  // Must be unique
  "password": "password123",
  ...
}
```

---

### 4. Login

**Before:**
```json
{
  "username": "myisp",  // Could be subdomain
  "password": "password123"
}
```

**After:**
```json
{
  "username": "admin@myisp.com",  // Must be email
  "password": "password123"
}
```

---

### 5. Dashboard URL

**Before:**
- Each tenant: `https://tenant1.rtrwnet.com`
- Each tenant: `https://tenant2.rtrwnet.com`

**After:**
- All tenants: `https://app.rtrwnet.com`
- Tenant identified by login email

---

## Files Changed

### 1. Entity
- `internal/domain/entity/tenant.go` ✅
  - Removed `Subdomain` field

### 2. Repository Interface
- `internal/domain/repository/tenant_repository.go` ✅
  - Removed `FindBySubdomain()`
  - Kept `FindByEmail()`

### 3. Repository Implementation
- `internal/repository/postgres/tenant_repository.go` ✅
  - Removed `FindBySubdomain()` implementation
  - Kept `FindByEmail()` implementation

### 4. DTO
- `internal/delivery/http/dto/subscription_dto.go` ✅
  - Removed `Subdomain` from `SignUpRequest`

### 5. Service
- `internal/usecase/subscription_service.go` ✅
  - Removed `Subdomain` from `SignUpRequest`
  - Changed validation from subdomain to email
  - Check email uniqueness instead of subdomain

### 6. Handler
- `internal/delivery/http/handler/subscription_handler.go` ✅
  - Removed subdomain validation
  - Updated error messages

### 7. Migrations
- `migrations/000010_remove_subdomain_column.up.sql` ✅
- `migrations/000010_remove_subdomain_column.down.sql` ✅

---

## API Changes

### Sign Up

**Endpoint:** `POST /public/signup`

**Request:**
```json
{
  "isp_name": "My ISP Jakarta",
  "email": "admin@myisp.com",
  "password": "password123",
  "phone": "081234567890",
  "plan_id": "plan-uuid",
  "owner_name": "John Doe",
  "use_trial": true
}
```

**Success Response:**
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

**Error (Email exists):**
```json
{
  "success": false,
  "error": {
    "code": "TENANT_3005",
    "message": "Email is already registered",
    "details": {
      "email": "The email 'admin@myisp.com' is already registered. Please use another email or login."
    }
  }
}
```

---

### Login

**Endpoint:** `POST /auth/simple-login`

**Request:**
```json
{
  "username": "admin@myisp.com",
  "password": "password123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "...",
    "user": {
      "email": "admin@myisp.com",
      "tenant_id": "tenant-uuid"
    }
  }
}
```

---

## Benefits

✅ **Simpler** - No subdomain to manage
✅ **Unique Email** - One email per tenant
✅ **Single Dashboard** - All tenants use app.rtrwnet.com
✅ **Standard Login** - Just email + password
✅ **Less Confusion** - No need to remember subdomain
✅ **Easier Deployment** - No wildcard DNS needed

---

## Migration Steps

### 1. Backup Database

```bash
pg_dump -U postgres rtrwnet_saas > backup_before_subdomain_removal.sql
```

### 2. Run Migrations

```bash
# Migration 9: Add email unique
psql -U postgres -d rtrwnet_saas -f migrations/000009_remove_subdomain_add_email_unique.up.sql

# Migration 10: Remove subdomain
psql -U postgres -d rtrwnet_saas -f migrations/000010_remove_subdomain_column.up.sql
```

### 3. Update Existing Data

```sql
-- Ensure all tenants have email
UPDATE tenants t
SET email = u.email
FROM users u
WHERE u.tenant_id = t.id
  AND u.role = 'admin'
  AND t.email IS NULL;
```

### 4. Test

```bash
# Test sign up
curl -X POST http://localhost:8089/api/v1/public/signup \
  -H "Content-Type: application/json" \
  -d '{"isp_name":"Test","email":"test@test.com","password":"test123","phone":"081234567890","plan_id":"uuid","owner_name":"Test","use_trial":true}'

# Test login
curl -X POST http://localhost:8089/api/v1/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@test.com","password":"test123"}'
```

---

## Frontend Changes

### Sign Up Form

**Before:**
```html
<input name="subdomain" placeholder="myisp" required />
```

**After:**
```html
<!-- Subdomain field removed -->
```

### Login Form

**Before:**
```html
<input name="username" placeholder="Email or subdomain" />
```

**After:**
```html
<input name="username" type="email" placeholder="Email" />
```

### Dashboard URL

**Before:**
```javascript
window.location.href = `https://${subdomain}.rtrwnet.com/dashboard`;
```

**After:**
```javascript
window.location.href = 'https://app.rtrwnet.com/dashboard';
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| TENANT_3005 | Email already registered | Email is already used |
| VAL_2002 | Invalid email format | Email format invalid |
| AUTH_1001 | Invalid email or password | Login failed |

---

## Summary

✅ **Subdomain removed** - No longer in database or API
✅ **Email unique** - One email per tenant
✅ **Simple login** - Just email + password
✅ **Single dashboard** - app.rtrwnet.com for all
✅ **Migrations ready** - SQL scripts included
✅ **Documentation updated** - All docs reflect changes

**Dashboard URL:** `https://app.rtrwnet.com` 🚀
