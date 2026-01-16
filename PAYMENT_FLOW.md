# Payment Flow - RT RW Net SaaS

## Alur Pembayaran Invoice

### 1. User Klik "Bayar" di Invoice
Ketika user klik tombol bayar, tampilkan modal/halaman dengan rincian invoice.

**API Call:**
```
GET /api/v1/payment/{order_id}/details
Headers:
  Authorization: Bearer {token}
  X-Tenant-ID: {tenant_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice details retrieved successfully",
  "data": {
    "order_id": "ORD-20260112200635",
    "amount": 150000,
    "status": "pending",
    "tenant_name": "RT 01 RW 05",
    "tenant_email": "admin@rt01.com",
    "created_at": "2026-01-12T20:06:35Z"
  }
}
```

### 2. Tampilkan Pilihan Metode Pembayaran

**API Call:**
```
GET /api/v1/payment/methods
```

**Response:**
```json
{
  "success": true,
  "message": "Payment methods retrieved successfully",
  "data": [
    {
      "id": "bca_va",
      "name": "BCA Virtual Account",
      "type": "bank_transfer",
      "bank": "bca",
      "description": "Transfer via ATM/Mobile/Internet Banking BCA",
      "icon": "bca"
    },
    {
      "id": "bni_va",
      "name": "BNI Virtual Account",
      "type": "bank_transfer",
      "bank": "bni",
      "description": "Transfer via ATM/Mobile/Internet Banking BNI",
      "icon": "bni"
    },
    {
      "id": "gopay",
      "name": "GoPay",
      "type": "gopay",
      "description": "Bayar dengan GoPay atau scan QRIS",
      "icon": "gopay"
    }
  ]
}
```

### 3. User Pilih Metode Pembayaran

User memilih salah satu metode pembayaran (misalnya BCA VA).

### 4. Generate Payment Token & Tampilkan Instruksi

**API Call:**
```
POST /api/v1/payment/{order_id}/token
Headers:
  Authorization: Bearer {token}
  X-Tenant-ID: {tenant_id}
  Content-Type: application/json

Body:
{
  "payment_method": "bca_va"
}
```

**Response untuk Bank Transfer (VA):**
```json
{
  "success": true,
  "message": "Payment token created successfully",
  "data": {
    "order_id": "ORD-20260112200635",
    "transaction_id": "abc123xyz",
    "status": "pending",
    "amount": 150000,
    "payment_type": "bank_transfer",
    "va_numbers": [
      {
        "bank": "bca",
        "va_number": "70012345678"
      }
    ]
  }
}
```

**Response untuk GoPay/E-Wallet:**
```json
{
  "success": true,
  "message": "Payment token created successfully",
  "data": {
    "order_id": "ORD-20260112200635",
    "transaction_id": "abc123xyz",
    "status": "pending",
    "amount": 150000,
    "payment_type": "gopay",
    "qr_code_url": "https://api.midtrans.com/qr/...",
    "deeplink_url": "gojek://gopay/..."
  }
}
```

### 5. Tampilkan Instruksi Pembayaran

Berdasarkan response, tampilkan instruksi pembayaran:

**Untuk Bank Transfer (VA):**
- Tampilkan nomor VA
- Tampilkan jumlah yang harus dibayar
- Tampilkan instruksi transfer
- Tampilkan batas waktu pembayaran (24 jam)

**Untuk GoPay/E-Wallet:**
- Tampilkan QR Code
- Atau redirect ke deeplink
- Tampilkan batas waktu pembayaran (15 menit)

### 6. Cek Status Pembayaran

Polling status pembayaran setiap 5-10 detik:

**API Call:**
```
GET /api/v1/payment/{order_id}/status
Headers:
  Authorization: Bearer {token}
  X-Tenant-ID: {tenant_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "order_id": "ORD-20260112200635",
    "transaction_id": "abc123xyz",
    "status": "settlement",  // pending, settlement, expire, cancel
    "amount": 150000,
    "payment_type": "bank_transfer",
    "transaction_time": "2026-01-12T20:15:30Z",
    "fraud_status": "accept"
  }
}
```

### 7. Update UI Berdasarkan Status

- `pending` - Menunggu pembayaran
- `settlement` / `capture` - Pembayaran berhasil ✅
- `expire` - Pembayaran kadaluarsa ⏰
- `cancel` / `deny` - Pembayaran dibatalkan ❌

## Metode Pembayaran yang Tersedia

1. **BCA Virtual Account** (`bca_va`)
2. **BNI Virtual Account** (`bni_va`)
3. **BRI Virtual Account** (`bri_va`)
4. **Permata Virtual Account** (`permata_va`)
5. **Mandiri Bill Payment** (`mandiri_bill`)
6. **GoPay** (`gopay`)
7. **ShopeePay** (`shopeepay`)
8. **QRIS** (`qris`)

## Testing dengan Midtrans Sandbox

Untuk testing, gunakan Midtrans Sandbox:
- Semua VA akan generate nomor virtual account
- Untuk simulasi pembayaran, gunakan Midtrans Simulator
- Atau gunakan API Midtrans untuk update status manual

## Error Handling

- `TRANSACTION_NOT_FOUND` - Invoice tidak ditemukan
- `ALREADY_PAID` - Invoice sudah dibayar
- `INVALID_PAYMENT_METHOD` - Metode pembayaran tidak valid
- `PAYMENT_FAILED` - Gagal membuat payment (cek Midtrans credentials)
