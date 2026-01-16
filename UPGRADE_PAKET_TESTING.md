# Testing Guide - Upgrade Paket

## Prerequisites
1. Backend running di `localhost:8089`
2. Frontend running di `localhost:8080`
3. User sudah login dengan subscription aktif
4. Database PostgreSQL running

## Test Scenario 1: Upgrade dari Basic ke Professional

### Step 1: Cek Paket Saat Ini
1. Login ke dashboard
2. Buka menu **Billing**
3. Lihat "Paket Saat Ini" → Harus menampilkan **Basic**
4. Catat limit saat ini (misal: 2 pelanggan, 2 user)

### Step 2: Buka Halaman Upgrade
1. Klik tab **"Ubah Paket"**
2. Lihat 3 paket: Basic, Professional, Enterprise
3. Paket Basic harus ada badge **"Aktif"**
4. Paket Professional harus ada tombol **"Upgrade"** dengan icon ↗

### Step 3: Klik Upgrade
1. Klik tombol **"Upgrade"** di paket Professional
2. Dialog konfirmasi muncul dengan info:
   - Title: "Upgrade Paket"
   - Dari: Basic → Professional
   - Harga baru: Rp 150.000/bulan
   - Limit pelanggan: 50
   - Limit user: 10
   - Info biru: "💡 Upgrade akan langsung aktif..."

### Step 4: Konfirmasi Upgrade
1. Klik tombol **"Ya, Ubah Paket"**
2. Loading spinner muncul
3. Toast notification muncul: "✅ Upgrade Berhasil!"

### Step 5: Verifikasi Perubahan

#### A. UI Auto-Refresh
- Badge "Aktif" pindah ke paket Professional
- Tombol Professional berubah jadi "Paket Aktif" (disabled)
- Tombol Basic berubah jadi "Pilih Paket"

#### B. Billing Overview
- Klik tab "Invoice" lalu kembali ke overview
- "Paket Saat Ini" berubah jadi **Professional**
- Harga berubah jadi **Rp 150.000/bulan**

#### C. Plan Limits
- Buka menu **Pelanggan**
- Banner limit berubah:
  - Dari: "3 dari 2 pelanggan (150%)" 
  - Ke: "3 dari 50 pelanggan (6%)"
- Tombol "Tambah Pelanggan" aktif kembali (tidak disabled)

#### D. Database Check
```sql
-- Cek subscription
SELECT plan_id, status FROM tenant_subscriptions 
WHERE tenant_id = 'your-tenant-id';
-- Harus menunjukkan plan_id = professional

-- Cek transaction prorata (jika ada)
SELECT order_id, amount, status FROM payment_transactions 
WHERE tenant_id = 'your-tenant-id' 
ORDER BY created_at DESC LIMIT 1;
-- Harus ada transaction baru dengan amount prorata
```

#### E. Console Logs
Buka Browser Console, harus ada:
```
Upgrading to plan: uuid-professional
Upgrade successful, refreshing data...
Billing data refreshed after subscription update
```

#### F. Network Tab
1. Request: `PUT /api/v1/billing/subscription`
   - Status: 200 OK
   - Body: `{ "plan_id": "uuid-professional" }`

2. Request: `GET /api/v1/billing` (auto-refetch)
   - Status: 200 OK
   - Response: `subscription.plan_name = "Professional"`

3. Request: `GET /api/v1/plan-limits` (auto-refetch)
   - Status: 200 OK
   - Response: `max_customers = 50`

## Test Scenario 2: Downgrade dari Professional ke Basic

### Step 1-3: Same as above

### Step 4: Dialog Konfirmasi
- Title: "Downgrade Paket"
- Warning kuning: "⚠️ Downgrade akan berlaku di periode berikutnya..."
- Harga baru: Rp 50.000/bulan
- Limit pelanggan: 2 (WARNING: Anda punya 3!)

### Step 5: Verifikasi
- Paket berubah ke Basic
- Jika pelanggan > 2, banner merah muncul: "Batas pelanggan tercapai"
- Tombol "Tambah Pelanggan" disabled

## Test Scenario 3: Upgrade dari Trial

### Prerequisites
- User baru dengan status trial

### Expected Behavior
- Upgrade langsung aktif
- Status berubah: trial → active
- Start date = sekarang
- End date = sekarang + 30 hari
- Tidak ada prorata (full price)

## Troubleshooting

### Issue: Paket tidak berubah setelah upgrade
**Check:**
1. Console log: Ada error?
2. Network tab: Response 200 OK?
3. Database: Data berubah?
4. React Query DevTools: Cache ter-invalidate?

**Solution:**
- Refresh halaman manual
- Clear browser cache
- Restart backend
- Check backend logs

### Issue: Tombol disabled terus
**Check:**
- `usePlanLimits` context ter-load?
- API `/plan-limits` return data?
- `canAddCustomer()` return true/false?

**Solution:**
- Check console untuk error
- Verify API response
- Check limit calculation logic

### Issue: Dialog tidak muncul
**Check:**
- `isConfirmOpen` state
- `selectedPlan` state
- AlertDialog component imported?

**Solution:**
- Check component imports
- Verify state management
- Check console errors

## Success Criteria

✅ Dialog konfirmasi muncul dengan info lengkap
✅ API call berhasil (200 OK)
✅ Database ter-update
✅ UI auto-refresh tanpa reload
✅ Badge "Aktif" pindah ke paket baru
✅ Limit banner update otomatis
✅ Toast notification muncul
✅ Tombol state berubah sesuai
✅ Tidak ada error di console
✅ Tidak ada warning DOM nesting

## Notes

- Prorata hanya untuk upgrade (harga naik)
- Downgrade tidak ada refund
- Trial to paid tidak ada prorata
- Same plan hanya update settings
- Minimum prorata amount: Rp 1.000

