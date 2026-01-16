# Error Codes Reference

Dokumentasi kode error yang digunakan dalam API backend.

## Format Response Error

```json
{
  "success": false,
  "error": {
    "code": "VAL_2001",
    "message": "Validation failed",
    "details": {
      "fields": {
        "name": "Name wajib diisi",
        "email": "Format email tidak valid"
      },
      "count": 2
    }
  }
}
```

## Kategori Error Codes

### Authentication Errors (AUTH_1xxx)

| Code | HTTP Status | Message | Deskripsi |
|------|-------------|---------|-----------|
| AUTH_1001 | 401 | Invalid email or password | Email atau password salah |
| AUTH_1002 | 401 | Unauthorized access | Akses tidak diizinkan |
| AUTH_1003 | 401 | Token has expired | Token sudah kadaluarsa |
| AUTH_1004 | 401 | Invalid token | Token tidak valid |
| AUTH_1005 | 403 | User account is inactive | Akun user tidak aktif |

### Validation Errors (VAL_2xxx)

| Code | HTTP Status | Message | Deskripsi |
|------|-------------|---------|-----------|
| VAL_2001 | 400 | Validation failed | Validasi gagal (dengan detail field) |
| VAL_2002 | 400 | Invalid JSON format | Format JSON tidak valid |
| VAL_2003 | 400 | Required field is missing | Field wajib tidak ada |
| VAL_2004 | 400 | Invalid field value | Nilai field tidak valid |
| VAL_2005 | 400 | Invalid query parameter | Query parameter tidak valid |
| VAL_2006 | 400 | Invalid request data | Data request tidak valid |

### Tenant Errors (TENANT_3xxx)

| Code | HTTP Status | Message | Deskripsi |
|------|-------------|---------|-----------|
| TENANT_3001 | 404 | Tenant not found | Tenant tidak ditemukan |
| TENANT_3002 | 403 | Tenant is inactive | Tenant tidak aktif |
| TENANT_3004 | 409 | Subdomain is already taken | Subdomain sudah digunakan |

### Subscription Errors (SUB_4xxx)

| Code | HTTP Status | Message | Deskripsi |
|------|-------------|---------|-----------|
| SUB_4001 | 404 | Subscription not found | Subscription tidak ditemukan |
| SUB_4002 | 403 | Subscription has expired | Subscription sudah kadaluarsa |
| SUB_4004 | 400 | Invalid subscription plan | Plan subscription tidak valid |

### Customer Errors (CUST_5xxx)

| Code | HTTP Status | Message | Deskripsi |
|------|-------------|---------|-----------|
| CUST_5001 | 404 | Customer not found | Pelanggan tidak ditemukan |
| CUST_5002 | 409 | Customer code already exists | Kode pelanggan sudah ada |
| CUST_5003 | 409 | Phone number already registered | Nomor telepon sudah terdaftar |
| CUST_5004 | 409 | Email already registered | Email sudah terdaftar |
| CUST_5005 | 409 | Cannot delete customer with payment history | Tidak bisa hapus pelanggan yang punya riwayat pembayaran |
| CUST_5006 | 400 | Invalid customer status | Status pelanggan tidak valid |

### Resource Errors (RES_6xxx)

| Code | HTTP Status | Message | Deskripsi |
|------|-------------|---------|-----------|
| RES_6001 | 404 | Resource not found | Resource tidak ditemukan |
| RES_6002 | 409 | Resource already exists | Resource sudah ada |
| RES_6003 | 409 | Resource conflict | Konflik resource |

### Service Plan Errors (PLAN_7xxx)

| Code | HTTP Status | Message | Deskripsi |
|------|-------------|---------|-----------|
| PLAN_7001 | 404 | Service plan not found | Paket layanan tidak ditemukan |
| PLAN_7002 | 409 | Service plan is in use by customers | Paket layanan sedang digunakan pelanggan |
| PLAN_7003 | 409 | Service plan name already exists | Nama paket layanan sudah ada |

### Payment Errors (PAY_8xxx)

| Code | HTTP Status | Message | Deskripsi |
|------|-------------|---------|-----------|
| PAY_8001 | 404 | Payment not found | Pembayaran tidak ditemukan |
| PAY_8002 | 409 | Payment already marked as paid | Pembayaran sudah ditandai lunas |
| PAY_8003 | 400 | Invalid payment amount | Jumlah pembayaran tidak valid |
| PAY_8004 | 400 | Invalid payment method | Metode pembayaran tidak valid |

### Server Errors (SRV_9xxx)

| Code | HTTP Status | Message | Deskripsi |
|------|-------------|---------|-----------|
| SRV_9001 | 500 | Internal server error | Error internal server |
| SRV_9002 | 500 | Database error | Error database |

### Other Errors

| Code | HTTP Status | Message | Deskripsi |
|------|-------------|---------|-----------|
| RATE_LIMIT | 429 | Rate limit exceeded | Batas request terlampaui |
| FORBIDDEN | 403 | Forbidden | Akses ditolak |

## Contoh Response Error

### Validation Error dengan Detail Field

```json
{
  "success": false,
  "error": {
    "code": "VAL_2001",
    "message": "Validation failed",
    "details": {
      "fields": {
        "name": "Name wajib diisi",
        "phone": "Phone minimal 10 karakter",
        "email": "Format email tidak valid",
        "due_date": "DueDate harus salah satu dari: 1-31"
      },
      "count": 4
    }
  }
}
```

### Customer Not Found

```json
{
  "success": false,
  "error": {
    "code": "CUST_5001",
    "message": "Customer not found",
    "details": {
      "customer_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

### Duplicate Entry

```json
{
  "success": false,
  "error": {
    "code": "CUST_5003",
    "message": "Phone number already registered",
    "details": {
      "field": "phone",
      "value": "081234567890"
    }
  }
}
```

### Authentication Error

```json
{
  "success": false,
  "error": {
    "code": "AUTH_1003",
    "message": "Token has expired",
    "details": {}
  }
}
```
