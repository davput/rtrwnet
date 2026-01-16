# API Integration - Quick Guide

## Setup

1. **Environment Variables**
   
   File `.env` sudah dibuat dengan konfigurasi:
   ```env
   VITE_API_URL=http://localhost:8089
   VITE_DASHBOARD_URL=https://dashboard.yourdomain.com
   ```

2. **API Service**
   
   File `src/lib/api.ts` berisi fungsi untuk:
   - `signUp()` - Registrasi tenant baru

## Pricing Strategy

**IMPORTANT:** Pricing sekarang menggunakan **static data** (hardcoded).

- ✅ No API call untuk display pricing
- ✅ Faster page load
- ✅ No backend dependency untuk pricing display
- ✅ Plan ID dikirim ke backend saat registrasi

**See:** `STATIC_PRICING.md` untuk detail lengkap.

## Komponen yang Sudah Diintegrasikan

### 1. PricingSection (`src/components/PricingSection.tsx`)

- **Static data** - Plans hardcoded di component
- No loading state
- No API call
- Instant display
- Pass plan ID ke register page

**Fitur:**
- ✅ Static plans display
- ✅ Format harga otomatis
- ✅ Pass plan data ke register page
- ✅ No backend dependency

**Update Plans:**
Edit `src/components/PricingSection.tsx` dan update array `plans`.

**IMPORTANT:** Plan IDs harus sama dengan database!

### 2. Register Page (`src/pages/Register.tsx`)

- Form registrasi lengkap dengan validasi
- Integrasi dengan API signup
- Support free trial dan paid signup
- Auto redirect setelah sukses

**Fitur:**
- ✅ Form validation (client-side)
- ✅ Subdomain sanitization
- ✅ Password visibility toggle
- ✅ Loading state saat submit
- ✅ Error handling dengan toast
- ✅ Auto redirect ke dashboard (trial) atau payment (paid)

### 3. Validation Helper (`src/lib/validation.ts`)

Fungsi helper untuk validasi:
- `validateSubdomain()` - Validasi subdomain
- `validateEmail()` - Validasi email
- `validatePhone()` - Validasi nomor telepon
- `validatePassword()` - Validasi password
- `sanitizeSubdomain()` - Sanitize input subdomain
- `formatPrice()` - Format harga ke IDR

## Flow Registrasi

### Free Trial Flow

```
1. User klik "Coba Gratis 7 Hari" di PricingSection
   ↓
2. Redirect ke /register dengan plan data
   ↓
3. User isi form registrasi
   ↓
4. Submit form → API POST /api/v1/public/signup (use_trial: true)
   ↓
5. Backend create tenant & user (active)
   ↓
6. Response: { tenant_id, user_id, is_trial: true, trial_ends, message }
   ↓
7. Redirect ke dashboard dengan query params
```

### Paid Flow (Coming Soon)

```
1. User klik "Subscribe Now" di PricingSection
   ↓
2. Redirect ke /register dengan plan data
   ↓
3. User isi form registrasi
   ↓
4. Submit form → API POST /api/v1/public/signup (use_trial: false)
   ↓
5. Backend create tenant & user (inactive)
   ↓
6. Response: { tenant_id, order_id, payment_url, amount, message }
   ↓
7. Redirect ke payment gateway
```

## Testing

### Test dengan Backend Lokal

1. Pastikan backend berjalan di `http://localhost:8089`
2. Jalankan frontend: `npm run dev`
3. Buka browser: `http://localhost:5173`
4. Scroll ke section Pricing
5. Klik "Coba Gratis 7 Hari"
6. Isi form registrasi
7. Submit

### Test tanpa Backend (Mock)

Jika backend belum ready, edit `src/lib/api.ts`:

```typescript
export const api = {
  async getPlans(): Promise<Plan[]> {
    // Mock data
    return [
      {
        id: "1",
        name: "Standard Plan",
        slug: "standard",
        description: "Perfect for small ISPs",
        price: 299000,
        billing_cycle: "monthly",
        features: ["Up to 100 customers", "Basic reporting"],
        max_customers: 100,
        max_users: 3,
        is_active: true,
      },
    ];
  },

  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    // Mock response
    return {
      tenant_id: "mock-tenant-id",
      user_id: "mock-user-id",
      is_trial: true,
      trial_ends: "2026-01-10",
      message: "Trial started successfully!",
    };
  },
};
```

## Error Handling

### Common Errors

1. **Subdomain already exists**
   ```json
   { "error": "subdomain already exists" }
   ```
   → Toast: "Subdomain sudah digunakan. Pilih yang lain."

2. **Email already registered**
   ```json
   { "error": "email already registered" }
   ```
   → Toast: "Email sudah terdaftar."

3. **Plan not found**
   ```json
   { "error": "plan not found" }
   ```
   → Toast: "Paket tidak ditemukan."

4. **Network error**
   → Toast: "Gagal terhubung ke server. Cek koneksi internet."

## CORS Configuration

Jika ada CORS error, pastikan backend sudah configure:

```env
# Backend .env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Next Steps

1. ✅ API service created
2. ✅ PricingSection integrated
3. ✅ Register page created
4. ✅ Validation helpers added
5. ⏳ Test dengan backend
6. ⏳ Implement payment flow
7. ⏳ Add loading skeleton untuk pricing
8. ⏳ Add success page setelah registrasi

## Troubleshooting

### Plans tidak muncul

1. Cek console browser untuk error
2. Cek network tab untuk request API
3. Pastikan backend running
4. Cek CORS configuration

### Registrasi gagal

1. Cek form validation
2. Cek network tab untuk request body
3. Cek response error dari backend
4. Cek console untuk error message

### Redirect tidak jalan

1. Cek environment variable `VITE_DASHBOARD_URL`
2. Cek response dari API (tenant_id, payment_url)
3. Cek console untuk error

## Support

Jika ada masalah, cek:
1. Console browser (F12)
2. Network tab untuk API calls
3. Backend logs
4. FRONTEND_INTEGRATION.md untuk detail API
