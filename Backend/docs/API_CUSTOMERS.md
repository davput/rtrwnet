# Customer API Documentation

API untuk mengelola data pelanggan (customers) pada sistem ISP Management.

## Base URL
```
http://localhost:8089/api/v1
```

## Authentication
Semua endpoint memerlukan:
- **Authorization Header**: `Bearer {access_token}`
- **X-Tenant-ID Header**: `{tenant_id}`

---

## Endpoints

### 1. List Customers
Mendapatkan daftar pelanggan dengan pagination dan filter.

**Endpoint:** `GET /customers`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Nomor halaman (default: 1) |
| per_page | integer | No | Jumlah data per halaman (default: 10, max: 100) |
| search | string | No | Pencarian berdasarkan nama, kode, phone, email |
| status | string | No | Filter status: `active`, `suspended`, `terminated` |
| service_plan_id | string | No | Filter berdasarkan service plan ID |
| sort_by | string | No | Sorting: `name`, `customer_code`, `installation_date` |
| sort_order | string | No | Urutan: `asc`, `desc` |

**Request:**
```bash
curl -X GET "http://localhost:8089/api/v1/customers?page=1&per_page=10&status=active" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: {tenant_id}"
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": {
    "customers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "customer_code": "CUST-001",
        "name": "John Doe",
        "phone": "081234567890",
        "address": "Jl. Sudirman No. 1, Jakarta",
        "service_plan": "Paket 10 Mbps",
        "monthly_fee": 150000,
        "status": "active",
        "installation_date": "2024-01-15T00:00:00Z",
        "last_payment": "2024-12-01T10:30:00Z",
        "payment_status": "paid"
      }
    ],
    "total": 50,
    "page": 1,
    "per_page": 10
  }
}
```

---

### 2. Get Customer Detail
Mendapatkan detail lengkap pelanggan termasuk riwayat pembayaran.

**Endpoint:** `GET /customers/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Customer ID |

**Request:**
```bash
curl -X GET "http://localhost:8089/api/v1/customers/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: {tenant_id}"
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Customer detail retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_code": "CUST-001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "address": "Jl. Sudirman No. 1, Jakarta",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "service_plan": {
      "id": "plan-001",
      "name": "Paket 10 Mbps",
      "speed_download": 10,
      "speed_upload": 5,
      "price": 150000
    },
    "status": "active",
    "installation_date": "2024-01-15T00:00:00Z",
    "due_date": 15,
    "monthly_fee": 150000,
    "notes": "Pelanggan prioritas",
    "payment_history": [
      {
        "id": "pay-001",
        "amount": 150000,
        "payment_date": "2024-12-01T10:30:00Z",
        "due_date": "2024-12-15T00:00:00Z",
        "status": "paid",
        "payment_method": "transfer",
        "notes": ""
      }
    ],
    "statistics": {
      "total_payments": 12,
      "paid_payments": 11,
      "pending_payments": 1,
      "overdue_payments": 0,
      "total_paid": 1650000,
      "total_pending": 150000,
      "on_time_rate": 91.67
    }
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Customer not found",
  "error": {
    "code": "RES_6001"
  }
}
```

---

### 3. Create Customer
Membuat pelanggan baru.

**Endpoint:** `POST /customers`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Nama pelanggan |
| email | string | No | Email pelanggan (format valid) |
| phone | string | Yes | Nomor telepon |
| address | string | Yes | Alamat lengkap |
| latitude | float | No | Koordinat latitude |
| longitude | float | No | Koordinat longitude |
| service_plan_id | string | Yes | ID service plan |
| installation_date | datetime | Yes | Tanggal instalasi (ISO 8601) |
| due_date | integer | Yes | Tanggal jatuh tempo (1-31) |
| monthly_fee | float | Yes | Biaya bulanan |
| notes | string | No | Catatan tambahan |

**Request:**
```bash
curl -X POST "http://localhost:8089/api/v1/customers" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: {tenant_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "081234567891",
    "address": "Jl. Gatot Subroto No. 10, Jakarta",
    "latitude": -6.2350,
    "longitude": 106.8200,
    "service_plan_id": "550e8400-e29b-41d4-a716-446655440001",
    "installation_date": "2024-12-20T00:00:00Z",
    "due_date": 20,
    "monthly_fee": 200000,
    "notes": "Pelanggan baru"
  }'
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "customer_code": "CUST-002",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "081234567891",
    "address": "Jl. Gatot Subroto No. 10, Jakarta",
    "latitude": -6.2350,
    "longitude": 106.8200,
    "service_plan_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "active",
    "installation_date": "2024-12-20T00:00:00Z",
    "due_date": 20,
    "monthly_fee": 200000,
    "notes": "Pelanggan baru",
    "created_at": "2024-12-20T10:00:00Z",
    "updated_at": "2024-12-20T10:00:00Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VAL_2001",
    "details": {
      "error": "Invalid request data"
    }
  }
}
```

---

### 4. Update Customer
Mengupdate data pelanggan.

**Endpoint:** `PUT /customers/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Customer ID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Nama pelanggan |
| email | string | No | Email pelanggan |
| phone | string | Yes | Nomor telepon |
| address | string | Yes | Alamat lengkap |
| latitude | float | No | Koordinat latitude |
| longitude | float | No | Koordinat longitude |
| service_plan_id | string | Yes | ID service plan |
| due_date | integer | Yes | Tanggal jatuh tempo (1-31) |
| monthly_fee | float | Yes | Biaya bulanan |
| status | string | Yes | Status: `active`, `suspended`, `terminated` |
| notes | string | No | Catatan tambahan |

**Request:**
```bash
curl -X PUT "http://localhost:8089/api/v1/customers/550e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: {tenant_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith Updated",
    "email": "jane.updated@example.com",
    "phone": "081234567891",
    "address": "Jl. Gatot Subroto No. 15, Jakarta",
    "latitude": -6.2350,
    "longitude": 106.8200,
    "service_plan_id": "550e8400-e29b-41d4-a716-446655440001",
    "due_date": 25,
    "monthly_fee": 250000,
    "status": "active",
    "notes": "Upgrade paket"
  }'
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Customer updated successfully",
  "data": null
}
```

---

### 5. Delete Customer
Menghapus pelanggan (soft delete).

**Endpoint:** `DELETE /customers/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Customer ID |

**Request:**
```bash
curl -X DELETE "http://localhost:8089/api/v1/customers/550e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: {tenant_id}"
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Customer deleted successfully",
  "data": null
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VAL_2001 | 400 | Validation failed |
| AUTH_1002 | 401 | Unauthorized access |
| RES_6001 | 404 | Customer not found |
| RES_6003 | 409 | Conflict (duplicate data) |
| SRV_9001 | 500 | Internal server error |

---

## Customer Status

| Status | Description |
|--------|-------------|
| `active` | Pelanggan aktif, layanan berjalan normal |
| `suspended` | Pelanggan ditangguhkan (misal: belum bayar) |
| `terminated` | Pelanggan berhenti berlangganan |

---

## Payment Status

| Status | Description |
|--------|-------------|
| `paid` | Pembayaran sudah lunas |
| `pending` | Menunggu pembayaran |
| `overdue` | Pembayaran terlambat |

---

## Example: Complete Customer Flow

### 1. Create Customer
```bash
# Create new customer
curl -X POST "http://localhost:8089/api/v1/customers" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: tenant-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi Santoso",
    "phone": "081234567890",
    "address": "Jl. Merdeka No. 1",
    "service_plan_id": "plan-10mbps",
    "installation_date": "2024-12-20T00:00:00Z",
    "due_date": 15,
    "monthly_fee": 150000
  }'
```

### 2. List Active Customers
```bash
# Get active customers
curl -X GET "http://localhost:8089/api/v1/customers?status=active&page=1&per_page=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: tenant-123"
```

### 3. Search Customer
```bash
# Search by name or phone
curl -X GET "http://localhost:8089/api/v1/customers?search=budi" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: tenant-123"
```

### 4. Suspend Customer
```bash
# Update status to suspended
curl -X PUT "http://localhost:8089/api/v1/customers/customer-123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Tenant-ID: tenant-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi Santoso",
    "phone": "081234567890",
    "address": "Jl. Merdeka No. 1",
    "service_plan_id": "plan-10mbps",
    "due_date": 15,
    "monthly_fee": 150000,
    "status": "suspended",
    "notes": "Belum bayar 2 bulan"
  }'
```
