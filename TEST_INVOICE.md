# Test Invoice Setelah Upgrade

## Yang Sudah Diimplementasikan

✅ Backend sekarang populate invoices dari `payment_transactions`
✅ Setiap upgrade yang create prorated transaction akan muncul sebagai invoice
✅ Invoice list auto-refresh setelah upgrade

## Cara Test

### 1. Restart Backend
```bash
cd Backend
go run cmd/api/main.go
```

### 2. Upgrade Paket
1. Login ke dashboard
2. Buka **Billing** → Tab **"Ubah Paket"**
3. Klik **"Upgrade"** ke paket yang lebih mahal
4. Konfirmasi upgrade

### 3. Cek Invoice
1. Klik tab **"Invoice"**
2. Seharusnya muncul invoice baru dengan:
   - No. Invoice: `ORD-20260112XXXXXX`
   - Jumlah: Rp XX.XXX (prorated amount)
   - Status: **Menunggu** (pending)
   - Tanggal: Hari ini

### 4. Verifikasi Database
```sql
SELECT 
  order_id,
  amount,
  status,
  created_at
FROM payment_transactions
WHERE tenant_id = 'your-tenant-id'
ORDER BY created_at DESC
LIMIT 5;
```

## Expected Result

**Sebelum Upgrade:**
- Invoice list: Kosong atau hanya invoice lama

**Setelah Upgrade:**
- Invoice list: Muncul invoice baru
- Status: Pending (badge kuning)
- Amount: Prorated amount (selisih harga × sisa hari / total hari)

## Contoh Perhitungan Prorata

```
Paket lama: Basic Rp 50.000/bulan
Paket baru: Professional Rp 150.000/bulan
Periode: 1 Jan - 31 Jan (31 hari)
Upgrade: 12 Jan (sisa 19 hari)

Prorata = (150.000 - 50.000) × (19/31)
        = 100.000 × 0.6129
        = Rp 61.290
```

## Troubleshooting

### Invoice tidak muncul?

**Check 1: Backend Log**
```
Prorated transaction created: tenant=xxx, amount=61290.00, order=ORD-xxx
```

**Check 2: Database**
```sql
SELECT * FROM payment_transactions 
WHERE tenant_id = 'xxx' 
AND status = 'pending'
ORDER BY created_at DESC;
```

**Check 3: API Response**
```
GET /api/v1/billing
Response:
{
  "invoices": [
    {
      "id": "uuid",
      "invoice_no": "ORD-20260112150405",
      "amount": 61290,
      "status": "pending",
      "issued_date": "2026-01-12T15:04:05Z"
    }
  ]
}
```

**Check 4: Frontend Console**
```
Billing data refreshed after subscription update
```

### Prorata amount = 0?

Kemungkinan:
- Sisa hari < 1 hari
- Selisih harga < Rp 1.000
- Subscription belum punya start_date/end_date

**Solution:**
- Pastikan subscription punya start_date dan end_date
- Minimum prorata: Rp 1.000

### Invoice status tidak update?

Invoice status hanya update setelah payment gateway callback.
Untuk test, bisa manual update:

```sql
UPDATE payment_transactions
SET status = 'paid'
WHERE order_id = 'ORD-xxx';
```

Lalu refresh halaman billing.

