# Payment Integration Guide - Midtrans Core API

## ✅ Implementasi Selesai!

### Backend
1. ✅ Payment Handler (`payment_handler.go`)
2. ✅ Payment Service (`payment_service.go`)
3. ✅ Midtrans Client dengan CreateCharge method
4. ✅ Config Midtrans di `.env`
5. ✅ Routes: `POST /payment/:order_id/token` & `GET /payment/:order_id/status`

### Frontend
1. ✅ Payment API (`payment.api.ts`)
2. ✅ Payment Page (`PaymentPage.tsx`)
3. ✅ Invoice List dengan tombol "Bayar"
4. ✅ Dialog konfirmasi pembayaran
5. ✅ Route `/payment/:orderID`

---

## 🚀 Cara Testing

### 1. Setup Midtrans Sandbox

Credentials sudah ada di `Backend/.env`:
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-Fz1hvChGfUryoGGPSKWPo1sf
MIDTRANS_CLIENT_KEY=SB-Mid-client-mdWVbehXnLBDR0mn
MIDTRANS_IS_PRODUCTION=false
```

### 2. Restart Backend

```bash
cd Backend
go run cmd/api/main.go
```

### 3. Test Flow

#### A. Upgrade Paket (Create Invoice)
1. Login ke dashboard
2. Buka **Billing** → Tab **"Ubah Paket"**
3. Klik **"Upgrade"** ke paket Professional
4. Konfirmasi upgrade
5. Invoice prorata otomatis dibuat

#### B. Bayar Invoice
1. Klik tab **"Invoice"**
2. Lihat invoice pending dengan badge kuning
3. Klik tombol **"Bayar"**
4. Dialog konfirmasi muncul
5. Klik **"Lanjut Bayar"**
6. Redirect ke halaman payment

#### C. Halaman Payment
Halaman payment akan menampilkan:
- Total pembayaran
- Metode pembayaran (GoPay/VA/QRIS)
- QR Code (untuk GoPay/QRIS)
- Virtual Account Number (untuk Bank Transfer)
- Tombol "Cek Status Pembayaran"

### 4. Test Payment Methods

#### GoPay (Default)
```
1. QR Code akan muncul
2. Scan dengan aplikasi GoPay
3. Atau klik "Buka di Aplikasi GoPay"
4. Selesaikan pembayaran
5. Klik "Cek Status Pembayaran"
```

#### Bank Transfer (VA)
Untuk test VA, ubah payment_type di backend:
```go
// payment_service.go line 60
PaymentType: "bank_transfer", // Ganti dari "gopay"
BankTransfer: &payment.BankTransferDetail{
    Bank: "bca", // bca, bni, bri, mandiri, permata
},
```

Restart backend, lalu:
```
1. Nomor VA akan muncul
2. Copy nomor VA
3. Transfer dari mobile banking
4. Klik "Cek Status Pembayaran"
```

---

## 📋 API Endpoints

### Create Payment Token
```http
POST /api/v1/payment/:order_id/token
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}

Response:
{
  "success": true,
  "data": {
    "order_id": "ORD-20260112150405",
    "transaction_id": "xxx",
    "status": "pending",
    "amount": 66666.67,
    "payment_type": "gopay",
    "qr_code_url": "https://...",
    "deeplink_url": "gojek://..."
  }
}
```

### Get Payment Status
```http
GET /api/v1/payment/:order_id/status
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}

Response:
{
  "success": true,
  "data": {
    "order_id": "ORD-20260112150405",
    "transaction_id": "xxx",
    "status": "settlement",
    "amount": 66666.67,
    "payment_type": "gopay",
    "transaction_time": "2026-01-12 15:04:05",
    "fraud_status": "accept"
  }
}
```

---

## 🔄 Payment Status Flow

```
pending → capture/settlement → PAID ✅
pending → deny/cancel/expire → FAILED ❌
```

**Status Mapping:**
- `pending` → Menunggu pembayaran
- `capture` / `settlement` → Pembayaran berhasil
- `deny` / `cancel` / `expire` → Pembayaran gagal

---

## 🎨 UI Components

### Payment Page Features
1. **Amount Card** - Menampilkan total pembayaran
2. **QR Code** - Untuk GoPay/QRIS (auto-generated)
3. **Virtual Account** - Untuk bank transfer dengan copy button
4. **Deeplink** - Tombol buka aplikasi GoPay
5. **Status Checker** - Button untuk cek status real-time
6. **Auto-redirect** - Setelah payment sukses, redirect ke billing

### Invoice List Features
1. **Tombol "Bayar"** - Hanya muncul untuk status pending
2. **Dialog Konfirmasi** - Preview invoice sebelum bayar
3. **Badge Status** - Pending (kuning), Paid (hijau), Failed (merah)

---

## 🐛 Troubleshooting

### Invoice tidak muncul?
**Check:**
1. Backend log: "Prorated transaction created"
2. Database: `SELECT * FROM payment_transactions WHERE tenant_id = 'xxx'`
3. API response: `GET /api/v1/billing` → invoices array

### Payment token gagal dibuat?
**Check:**
1. Midtrans credentials di `.env`
2. Backend log: "Failed to create Midtrans charge"
3. Network tab: Response dari Midtrans API

### Status tidak update?
**Check:**
1. Midtrans Sandbox Dashboard
2. Transaction status di Midtrans
3. Backend log: "Failed to get Midtrans status"

### QR Code tidak muncul?
**Check:**
1. Payment type = "gopay"
2. Response dari Midtrans ada `actions` array
3. QR code URL valid

---

## 🔐 Security Notes

1. **Server Key** - Hanya di backend, NEVER di frontend
2. **Client Key** - Bisa di frontend untuk Snap UI (optional)
3. **Webhook** - Perlu implement untuk auto-update status
4. **Signature** - Verify Midtrans callback signature

---

## 🚧 Next Steps (Optional)

1. **Webhook Handler** - Auto-update status dari Midtrans
2. **Payment Method Selection** - User pilih metode (GoPay/VA/QRIS)
3. **Snap UI Integration** - Gunakan Midtrans Snap untuk UI yang lebih lengkap
4. **Email Notification** - Kirim email setelah payment sukses
5. **Payment History** - Halaman riwayat pembayaran lengkap

---

## 📞 Support

**Midtrans Sandbox:**
- Dashboard: https://dashboard.sandbox.midtrans.com
- Docs: https://docs.midtrans.com
- Test Cards: https://docs.midtrans.com/docs/testing-payment

**Test Payment:**
- GoPay: Gunakan simulator di Midtrans Dashboard
- VA: Transfer ke nomor VA yang di-generate
- Status: Bisa manual update di Midtrans Dashboard

---

## ✨ Summary

Sistem payment sudah fully integrated dengan Midtrans Core API:
- ✅ Upgrade paket → Create prorated invoice
- ✅ Invoice list → Tombol bayar
- ✅ Payment page → QR Code / VA
- ✅ Status checker → Real-time verification
- ✅ Auto-redirect → Setelah payment sukses

**Ready to use!** 🎉
