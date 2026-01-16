# Payment Testing Guide

## Alur Payment yang Baru

### 1. Akses Billing Page
- Login ke User Dashboard
- Klik menu "Billing"
- Lihat daftar invoice di tab "Invoice"

### 2. Klik "Bayar" pada Invoice Pending
- Akan muncul dialog konfirmasi dengan rincian invoice
- Klik "Lanjut Bayar"

### 3. Halaman Payment - Step 1: Pilih Metode Pembayaran
Akan tampil:
- **Rincian Pembayaran**: Tenant, email, tanggal, total
- **Pilihan Metode Pembayaran**:
  - ✅ BCA Virtual Account
  - ✅ BNI Virtual Account
  - ✅ BRI Virtual Account
  - ✅ Permata Virtual Account
  - ✅ Mandiri Bill Payment
  - ✅ GoPay
  - ✅ ShopeePay
  - ✅ QRIS

- Pilih salah satu metode
- Klik "Lanjutkan Pembayaran"

### 4. Halaman Payment - Step 2: Instruksi Pembayaran

**Untuk Bank Transfer (VA):**
- Tampil nomor Virtual Account
- Tombol copy untuk salin nomor VA
- Instruksi transfer

**Untuk GoPay/E-Wallet:**
- Tampil QR Code
- Tombol "Buka di Aplikasi" (deeplink)
- Instruksi scan QR

**Untuk Mandiri Bill:**
- Tampil Biller Code
- Tampil Bill Key
- Tombol copy untuk masing-masing

### 5. Cek Status Pembayaran
- Klik tombol "Cek Status Pembayaran"
- Jika sudah dibayar, akan redirect ke Billing page
- Jika belum, tampil notifikasi "Menunggu Pembayaran"

## Testing dengan Midtrans Sandbox

### Simulasi Pembayaran

1. **Buat Invoice/Order** dari billing page
2. **Pilih metode pembayaran** (misal: BCA VA)
3. **Dapatkan VA number** dari halaman instruksi
4. **Simulasi pembayaran** menggunakan Midtrans Dashboard:
   - Login ke https://dashboard.sandbox.midtrans.com
   - Atau gunakan API untuk update status manual

### Simulasi dengan Midtrans Simulator

Untuk testing tanpa login dashboard:
1. Gunakan Midtrans Payment Simulator
2. Masukkan order_id
3. Pilih status yang diinginkan (settlement/pending/expire)

### Test Cases

#### Test Case 1: BCA Virtual Account
1. Pilih "BCA Virtual Account"
2. Klik "Lanjutkan Pembayaran"
3. Verifikasi VA number tampil
4. Copy VA number
5. Simulasi pembayaran
6. Klik "Cek Status Pembayaran"
7. Verifikasi redirect ke billing jika berhasil

#### Test Case 2: GoPay
1. Pilih "GoPay"
2. Klik "Lanjutkan Pembayaran"
3. Verifikasi QR Code tampil
4. Verifikasi tombol "Buka di Aplikasi" ada
5. Test deeplink (akan buka GoPay app jika di mobile)

#### Test Case 3: Duplicate Order ID
1. Buat payment untuk order yang sama 2x
2. Verifikasi tidak error 406
3. Verifikasi return data payment yang sudah ada

#### Test Case 4: Back Navigation
1. Di step "Pilih Metode", klik back → ke billing
2. Di step "Instruksi", klik back → ke pilih metode
3. Pilih metode lain, verifikasi instruksi berubah

## API Endpoints yang Digunakan

```
GET  /api/v1/payment/methods
GET  /api/v1/payment/{order_id}/details
POST /api/v1/payment/{order_id}/token
GET  /api/v1/payment/{order_id}/status
```

## Expected Behavior

### Success Flow
1. User pilih metode → Loading → Tampil instruksi
2. User bayar → Cek status → Status settlement → Redirect billing
3. Invoice status berubah dari "pending" → "paid"

### Error Handling
- **Invalid order_id**: Tampil error "Transaction not found"
- **Already paid**: Tampil error "Transaction already paid"
- **Invalid payment method**: Tampil error "Invalid payment method"
- **Midtrans error**: Tampil error message dari Midtrans

## Troubleshooting

### Error: "Failed to create payment"
- Cek Midtrans credentials di Backend/.env
- Cek backend log untuk detail error
- Pastikan amount > 0 dan format valid

### Error: "Transaction not found"
- Pastikan order_id valid
- Cek database apakah transaction ada
- Cek tenant_id sesuai dengan user yang login

### Payment tidak terkonfirmasi
- Cek Midtrans webhook sudah setup
- Cek backend log untuk webhook notification
- Manual update status via Midtrans dashboard

## Notes

- Semua amount dalam IDR (Rupiah)
- Amount harus integer (tidak ada desimal)
- VA number expire dalam 24 jam
- E-wallet (GoPay, ShopeePay) expire dalam 15 menit
- Status polling bisa dilakukan setiap 5-10 detik
