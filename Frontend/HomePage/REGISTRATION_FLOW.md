# Registration Flow - Updated

## New Flow After Registration

### User Journey

```
1. Landing Page
   ↓
2. Pricing Section (pilih paket)
   ↓
3. Click "Coba Gratis 7 Hari"
   ↓
4. Register Page (isi form)
   ↓
5. Submit Registration
   ↓
6. Backend: Create tenant & activate trial
   ↓
7. Success Response
   ↓
8. Redirect to /dashboard (in this app) ✨ NEW
   ↓
9. Dashboard shows:
   - Trial status (days remaining)
   - Billing information
   - Button to go to Tenant Dashboard
   ↓
10. Click "Buka Dashboard Tenant"
    ↓
11. Redirect to external Tenant Dashboard
    (https://dashboard.yourdomain.com)
```

---

## Pages Overview

### 1. Landing Page (`/`)
- Homepage dengan pricing
- User pilih paket
- Click CTA button

### 2. Register Page (`/register`)
- Form registrasi
- Validation
- Submit to API
- Show success toast

### 3. Dashboard Page (`/dashboard`) ✨ NEW
**Purpose:** Halaman transisi setelah registrasi berhasil

**Shows:**
- ✅ Success message
- ✅ Trial status (days remaining)
- ✅ Billing information
- ✅ Plan details
- ✅ Button to go to Tenant Dashboard

**URL Format:**
```
/dashboard?tenant_id=xxx&email=xxx&trial=true&trial_ends=2026-01-10
```

**Features:**
- Display trial countdown
- Show billing info (plan name, price)
- Show payment status
- Big CTA button to tenant dashboard
- Logout button

### 4. Tenant Dashboard (External)
**URL:** `https://dashboard.yourdomain.com`

**Purpose:** Main dashboard untuk manage customers, billing, network

**Not part of this project** - separate application

---

## Dashboard Page Details

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Aktivasi Berhasil" | [Logout]                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✓ Selamat! Akun Anda Sudah Aktif 🎉                   │
│  Trial 7 hari Anda telah dimulai...                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Status Trial                    [Aktif]        │    │
│  │                                                 │    │
│  │   ┌──────────┐  ┌──────────────────────┐     │    │
│  │   │    7     │  │ Trial berakhir:      │     │    │
│  │   │ Hari     │  │ 10 Januari 2026      │     │    │
│  │   └──────────┘  └──────────────────────┘     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Informasi Billing                              │    │
│  │                                                 │    │
│  │ Paket: Standard Plan      Rp 299K/bulan       │    │
│  │                                                 │    │
│  │ ⚠ Gratis selama trial                         │    │
│  │                                                 │    │
│  │ Status: Trial Aktif                            │    │
│  │ Metode Pembayaran: Belum diatur               │    │
│  │ Tagihan Berikutnya: 10 Januari 2026           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Siap Memulai?                                  │    │
│  │                                                 │    │
│  │ [Buka Dashboard Tenant →]                      │    │
│  │                                                 │    │
│  │ Dashboard URL:                                 │    │
│  │ https://dashboard.yourdomain.com               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ✓ Email konfirmasi telah dikirim                      │
│  ✓ Login dengan email dan password Anda                │
│  ✓ Hubungi support jika ada pertanyaan                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## API Integration

### Register API Call

**Request:**
```typescript
POST /api/v1/public/signup
{
  "isp_name": "My ISP",
  "subdomain": "myisp",
  "email": "owner@myisp.com",
  "password": "secure123",
  "phone": "08123456789",
  "plan_id": "550e8400-...",
  "owner_name": "John Doe",
  "use_trial": true
}
```

**Response:**
```typescript
{
  "tenant_id": "abc123-...",
  "user_id": "xyz789-...",
  "is_trial": true,
  "trial_ends": "2026-01-10",
  "message": "Your 7-day free trial has started!"
}
```

### Redirect After Success

**Old Flow:**
```typescript
// Redirect langsung ke external dashboard
window.location.href = `${DASHBOARD_URL}/login?tenant_id=...`;
```

**New Flow:**
```typescript
// Redirect ke dashboard page di app ini
navigate(`/dashboard?tenant_id=${tenant_id}&email=${email}&trial=true&trial_ends=${trial_ends}`);
```

---

## Dashboard Page Implementation

### Get Data from URL

```typescript
const [searchParams] = useSearchParams();

const tenantId = searchParams.get('tenant_id');
const email = searchParams.get('email');
const isTrial = searchParams.get('trial') === 'true';
const trialEnds = searchParams.get('trial_ends');
```

### Calculate Days Remaining

```typescript
const daysRemaining = tenantData?.trial_ends 
  ? Math.ceil((new Date(tenantData.trial_ends).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  : 0;
```

### Go to Tenant Dashboard

```typescript
const handleGoToDashboard = () => {
  const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL;
  window.location.href = `${dashboardUrl}?tenant_id=${tenantData.tenant_id}&email=${tenantData.email}`;
};
```

---

## Environment Variables

```env
# Landing page API
VITE_API_URL=http://localhost:8089

# External tenant dashboard URL
VITE_DASHBOARD_URL=https://dashboard.yourdomain.com
```

---

## Benefits of New Flow

### 1. Better UX
- User sees immediate success feedback
- Clear information about trial status
- Understand billing before going to dashboard

### 2. Clear Separation
- Landing page handles registration
- Dashboard page shows billing info
- Tenant dashboard handles operations

### 3. Flexibility
- Can add payment setup before going to dashboard
- Can show onboarding steps
- Can collect additional info

### 4. Better Tracking
- Track registration completion
- Track dashboard access
- Analytics on conversion

---

## Testing

### Test Registration Flow

1. **Start Registration**
   ```
   http://localhost:5173
   → Scroll to pricing
   → Click "Coba Gratis 7 Hari"
   ```

2. **Fill Form**
   ```
   ISP Name: Test ISP
   Subdomain: testisp
   Owner: Test Owner
   Email: test@test.com
   Phone: 08123456789
   Password: test1234
   ```

3. **Submit**
   ```
   → Should show success toast
   → Should redirect to /dashboard
   ```

4. **Check Dashboard**
   ```
   URL: /dashboard?tenant_id=xxx&email=test@test.com&trial=true&trial_ends=2026-01-10
   
   Should show:
   ✓ Success message
   ✓ Trial countdown (7 days)
   ✓ Billing info
   ✓ "Buka Dashboard Tenant" button
   ```

5. **Go to Tenant Dashboard**
   ```
   → Click "Buka Dashboard Tenant"
   → Should redirect to external dashboard
   → URL: https://dashboard.yourdomain.com?tenant_id=xxx&email=test@test.com
   ```

---

## Future Enhancements

### Possible Additions to Dashboard Page

1. **Payment Setup**
   - Add payment method before trial ends
   - Show payment options
   - Integrate with payment gateway

2. **Onboarding Steps**
   - Step 1: Setup profile
   - Step 2: Add payment method
   - Step 3: Go to dashboard

3. **Quick Actions**
   - Download mobile app
   - Watch tutorial video
   - Read documentation

4. **Notifications**
   - Trial expiration reminder
   - Payment due reminder
   - Feature announcements

---

## Summary

**Old Flow:**
```
Register → Success → Redirect to External Dashboard
```

**New Flow:**
```
Register → Success → Dashboard Page (billing info) → External Dashboard
```

**Key Changes:**
- ✅ Added intermediate dashboard page
- ✅ Shows trial status and billing
- ✅ Clear CTA to tenant dashboard
- ✅ Better user experience
- ✅ More flexible for future features

**Files Modified:**
- `src/pages/Dashboard.tsx` - New simplified dashboard
- `src/pages/Register.tsx` - Updated redirect logic
- `src/App.tsx` - Already has /dashboard route

**Ready to use!** 🚀
