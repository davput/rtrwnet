# API Endpoints Documentation

Base URL: `http://localhost:8080/api/v1`

## Authentication

### POST /auth/login
Login with email and password

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### POST /auth/refresh
Refresh access token

**Request:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "expires_in": 900
}
```

### POST /auth/logout
Logout and invalidate refresh token

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

## Customers

### GET /customers
List all customers with pagination

**Headers:**
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `status` (active, suspended, terminated)
- `search` (search by name, code, phone, email)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "customer_code": "CUST001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "08123456789",
      "address": "Jl. Example No. 123",
      "status": "active",
      "service_plan": {
        "id": "uuid",
        "name": "10 Mbps",
        "price": 150000
      },
      "monthly_fee": 150000,
      "due_date": 15
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

### GET /customers/:id
Get customer by ID

### POST /customers
Create new customer

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08123456789",
  "address": "Jl. Example No. 123",
  "service_plan_id": "uuid",
  "due_date": 15,
  "notes": "Optional notes"
}
```

### PUT /customers/:id
Update customer

### DELETE /customers/:id
Delete customer (soft delete)

### GET /customers/stats
Get customer statistics

**Response:**
```json
{
  "total": 100,
  "active": 85,
  "suspended": 10,
  "terminated": 5
}
```

## Service Plans

### GET /service-plans
List all service plans

**Query Parameters:**
- `active_only` (default: true)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "10 Mbps",
      "description": "Basic internet package",
      "speed_download": 10,
      "speed_upload": 10,
      "price": 150000,
      "is_active": true,
      "features": ["Unlimited quota", "24/7 support"]
    }
  ]
}
```

### GET /service-plans/:id
Get service plan by ID

### POST /service-plans
Create new service plan

**Request:**
```json
{
  "name": "10 Mbps",
  "description": "Basic internet package",
  "speed_download": 10,
  "speed_upload": 10,
  "price": 150000,
  "features": ["Unlimited quota", "24/7 support"]
}
```

### PUT /service-plans/:id
Update service plan

### DELETE /service-plans/:id
Delete service plan

### GET /service-plans/:id/advanced
Get advanced settings for service plan

### PUT /service-plans/:id/advanced
Update advanced settings

## Payments

### GET /payments
List all payments

**Query Parameters:**
- `customer_id`
- `status` (pending, paid, overdue)
- `from_date`
- `to_date`

### GET /payments/:id
Get payment by ID

### POST /payments
Create new payment

**Request:**
```json
{
  "customer_id": "uuid",
  "amount": 150000,
  "due_date": "2025-01-15T00:00:00Z",
  "payment_method": "transfer",
  "notes": "Payment for January 2025"
}
```

### PUT /payments/:id/status
Update payment status

**Request:**
```json
{
  "status": "paid",
  "payment_date": "2025-01-10T10:30:00Z"
}
```

## Devices

### GET /devices
List all devices

### GET /devices/:id
Get device by ID

### POST /devices
Create new device

**Request:**
```json
{
  "name": "Main Router",
  "type": "router",
  "ip_address": "192.168.1.1",
  "port": 8728,
  "username": "admin",
  "password": "password123",
  "location": "Server Room"
}
```

### PUT /devices/:id
Update device

### DELETE /devices/:id
Delete device

### GET /devices/:id/status
Check device status

## MikroTik Routers

### GET /mikrotik/routers
List all MikroTik routers

### GET /mikrotik/routers/:id
Get router by ID

### POST /mikrotik/routers
Create new router

### PUT /mikrotik/routers/:id
Update router

### DELETE /mikrotik/routers/:id
Delete router

## Tickets

### GET /tickets
List all tickets

**Query Parameters:**
- `customer_id`
- `status` (open, in_progress, resolved, closed)
- `priority` (low, medium, high, urgent)

### GET /tickets/:id
Get ticket by ID

### POST /tickets
Create new ticket

**Request:**
```json
{
  "customer_id": "uuid",
  "title": "Internet connection issue",
  "description": "Customer cannot connect to internet",
  "priority": "high"
}
```

### PUT /tickets/:id
Update ticket

### PUT /tickets/:id/status
Update ticket status

### PUT /tickets/:id/assign
Assign ticket to user

## Speed Boost

### GET /speed-boost
List all speed boost requests

### GET /speed-boost/:id
Get speed boost by ID

### POST /speed-boost
Create speed boost request

**Request:**
```json
{
  "customer_id": "uuid",
  "boost_plan_id": "uuid",
  "duration_days": 7,
  "notes": "Customer requested temporary upgrade"
}
```

### POST /speed-boost/:id/approve
Approve speed boost request

### POST /speed-boost/:id/reject
Reject speed boost request

**Request:**
```json
{
  "reason": "Insufficient payment"
}
```

## Monitoring

### GET /monitoring/customers/:id
Get customer monitoring data

**Query Parameters:**
- `period` (24h, 7d, 30d)

### GET /monitoring/network
Get network overview

### GET /monitoring/alerts
Get monitoring alerts

## Dashboard

### GET /dashboard/stats
Get dashboard statistics

**Response:**
```json
{
  "customers": {
    "total": 100,
    "active": 85,
    "suspended": 10,
    "terminated": 5
  },
  "revenue": {
    "current_month": 12750000,
    "previous_month": 11500000,
    "growth_percentage": 10.87
  },
  "tickets": {
    "open": 5,
    "in_progress": 3,
    "resolved": 20,
    "closed": 50
  },
  "network": {
    "total_bandwidth": 1000,
    "used_bandwidth": 750,
    "usage_percentage": 75
  }
}
```

## Audit Logs

### GET /audit-logs
Get audit logs

**Query Parameters:**
- `user_id`
- `action` (create, update, delete)
- `entity_type`
- `from_date`
- `to_date`

## Infrastructure

### GET /infrastructure
List all infrastructure items

**Query Parameters:**
- `type` (cable, router, switch, antenna, connector, tools)
- `location`

### GET /infrastructure/:id
Get infrastructure item by ID

### POST /infrastructure
Create new infrastructure item

**Request:**
```json
{
  "name": "UTP Cable Cat6",
  "type": "cable",
  "quantity": 1000,
  "unit": "meter",
  "location": "Warehouse A",
  "notes": "For new installations"
}
```

### PUT /infrastructure/:id
Update infrastructure item

### DELETE /infrastructure/:id
Delete infrastructure item (soft delete)

## Export & Reports

### GET /export/customers
Export customers to CSV/Excel

**Query Parameters:**
- `format` (csv, excel)

### GET /export/payments
Export payments to CSV/Excel

### POST /reports/revenue
Generate revenue report

**Request:**
```json
{
  "from_date": "2025-01-01",
  "to_date": "2025-01-31"
}
```

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation error",
  "details": {
    "field": "email",
    "error": "Invalid email format"
  }
}
```

### 401 Unauthorized
```json
{
  "code": "UNAUTHORIZED",
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "code": "FORBIDDEN",
  "message": "Forbidden"
}
```

### 404 Not Found
```json
{
  "code": "NOT_FOUND",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "code": "RATE_LIMIT",
  "message": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "code": "INTERNAL_ERROR",
  "message": "Internal server error"
}
```

## Authentication

Most endpoints require authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Multi-Tenant

For multi-tenant requests, include the tenant ID in the header:

```
X-Tenant-ID: <tenant_id>
```

Or use subdomain-based routing:
```
https://tenant1.rtrwnet.com/api/v1/customers
```

---

**Note**: This is a planned API structure. Implementation is in progress.
