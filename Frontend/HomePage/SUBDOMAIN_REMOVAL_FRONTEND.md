# Subdomain Removal - Frontend Implementation

## Overview

Frontend telah diupdate untuk menghapus subdomain sesuai dengan perubahan backend.

## Changes Made

### 1. API Interface (`src/lib/api.ts`)

**Before:**
```typescript
export interface SignUpRequest {
  isp_name: string;
  subdomain: string;  // REMOVED
  email: string;
  ...
}
```

**After:**
```typescript
export interface SignUpRequest {
  isp_name: string;
  email: string;  // Now unique identifier
  ...
}
```

---

### 2. Register Page (`src/pages/Register.tsx`)

#### Form State
**Before:**
```typescript
const [formData, setFormData] = useState({
  ispName: "",
  subdomain: "",  // REMOVED
  ownerName: "",
  email: "",
  ...
});
```

**After:**
```typescript
const [formData, setFormData] = useState({
  ispName: "",
  ownerName: "",
  email: "",
  ...
});
```

#### Validation
**Before:**
```typescript
if (formData.subdomain.length < 3 || formData.subdomain.length > 20) {
  errors.push("Subdomain harus 3-20 karakter");
}
if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
  errors.push("Subdomain hanya boleh huruf kecil, angka, dan tanda hubung");
}
```

**After:**
```typescript
// Subdomain validation removed
// Only email, phone, password validation remains
```

#### API Call
**Before:**
```typescript
await api.signUp({
  isp_name: formData.ispName,
  subdomain: formData.subdomain,  // REMOVED
  email: formData.email,
  ...
});
```

**After:**
```typescript
await api.signUp({
  isp_name: formData.ispName,
  email: formData.email,
  ...
});
```

#### Form JSX
**Before:**
```jsx
<div className="grid md:grid-cols-2 gap-4">
  <Input name="ispName" ... />
  <Input name="subdomain" ... />  {/* REMOVED */}
</div>
```

**After:**
```jsx
<Input name="ispName" ... />
{/* Subdomain field removed */}
```

---

### 3. Login Page (`src/pages/Login.tsx`)

#### Label & Placeholder
**Before:**
```jsx
<label>Email atau Subdomain</label>
<Input 
  type="text"
  placeholder="admin@isp.com atau subdomain"
/>
<small>Gunakan email atau subdomain tenant Anda</small>
```

**After:**
```jsx
<label>Email</label>
<Input 
  type="email"
  placeholder="admin@isp.com"
/>
{/* No helper text needed */}
```

---

### 4. Dashboard Page (`src/pages/Dashboard.tsx`)

#### Dashboard URL
**Before:**
```typescript
const dashboardUrl = "https://dashboard.yourdomain.com";
// or
const dashboardUrl = `https://${subdomain}.yourdomain.com`;
```

**After:**
```typescript
const dashboardUrl = "https://app.rtrwnet.com";
// Single URL for all tenants
```

---

### 5. Environment Variables

#### `.env`
**Before:**
```env
VITE_DASHBOARD_URL=https://dashboard.yourdomain.com
```

**After:**
```env
VITE_DASHBOARD_URL=https://app.rtrwnet.com
```

#### `.env.example`
**Before:**
```env
# Dashboard URL (separate project)
VITE_DASHBOARD_URL=https://dashboard.yourdomain.com
```

**After:**
```env
# Dashboard URL (all tenants use same URL)
VITE_DASHBOARD_URL=https://app.rtrwnet.com
```

---

## User Flow Changes

### Registration Flow

**Before:**
```
1. User enters:
   - ISP Name
   - Subdomain (unique)
   - Owner Name
   - Email
   - Phone
   - Password

2. Backend checks:
   - Subdomain uniqueness
   - Email format

3. Success:
   - Tenant created with subdomain
   - Dashboard: https://subdomain.rtrwnet.com
```

**After:**
```
1. User enters:
   - ISP Name
   - Owner Name
   - Email (unique)
   - Phone
   - Password

2. Backend checks:
   - Email uniqueness
   - Email format

3. Success:
   - Tenant created with email
   - Dashboard: https://app.rtrwnet.com
```

### Login Flow

**Before:**
```
1. User enters:
   - Username (email OR subdomain)
   - Password

2. Backend checks:
   - If email: find user by email
   - If subdomain: find tenant by subdomain, then admin user

3. Success:
   - Redirect to: https://subdomain.rtrwnet.com
```

**After:**
```
1. User enters:
   - Email (only)
   - Password

2. Backend checks:
   - Find user by email
   - Get tenant from user

3. Success:
   - Redirect to: https://app.rtrwnet.com
```

---

## Error Messages

### Registration Errors

**Before:**
```
- "Subdomain harus 3-20 karakter"
- "Subdomain hanya boleh huruf kecil, angka, dan tanda hubung"
- "Subdomain sudah digunakan"
```

**After:**
```
- "Email tidak valid"
- "Email sudah terdaftar"
```

### Login Errors

**Before:**
```
- "Email atau subdomain tidak ditemukan"
- "Periksa email/subdomain dan password Anda"
```

**After:**
```
- "Email tidak ditemukan"
- "Periksa email dan password Anda"
```

---

## Benefits

✅ **Simpler Form** - One less field to fill
✅ **Faster Registration** - Less validation needed
✅ **No Subdomain Conflicts** - Email is unique identifier
✅ **Standard Login** - Just email + password
✅ **Single Dashboard URL** - Easier to remember
✅ **Better UX** - Less confusion for users

---

## Testing

### Test Registration

1. Go to `/register`
2. Fill form (no subdomain field)
3. Submit
4. Should succeed with email as identifier

**Expected:**
- ✅ No subdomain field visible
- ✅ Email validation works
- ✅ Registration succeeds
- ✅ Redirect to dashboard

### Test Login

1. Go to `/login`
2. Enter email (not subdomain)
3. Enter password
4. Submit

**Expected:**
- ✅ Placeholder says "Email" only
- ✅ Input type is "email"
- ✅ Login succeeds
- ✅ Redirect to app.rtrwnet.com

### Test Dashboard

1. After login
2. Click "Buka Dashboard Tenant"

**Expected:**
- ✅ Redirects to `https://app.rtrwnet.com`
- ✅ Not subdomain-based URL

---

## Files Modified

1. ✅ `src/lib/api.ts` - Removed subdomain from SignUpRequest
2. ✅ `src/pages/Register.tsx` - Removed subdomain field & validation
3. ✅ `src/pages/Login.tsx` - Updated labels & placeholders
4. ✅ `src/pages/Dashboard.tsx` - Updated dashboard URL
5. ✅ `.env` - Updated VITE_DASHBOARD_URL
6. ✅ `.env.example` - Updated VITE_DASHBOARD_URL

---

## Migration Notes

### For Existing Users

If you have existing users with subdomains:
- They can still login with email
- Subdomain is no longer used
- All redirect to app.rtrwnet.com

### For New Users

- No subdomain field in registration
- Email is the unique identifier
- Dashboard URL is always app.rtrwnet.com

---

## Summary

**Removed:**
- ❌ Subdomain field from registration form
- ❌ Subdomain validation
- ❌ Subdomain sanitization
- ❌ Subdomain mention in login
- ❌ Subdomain-based dashboard URLs

**Updated:**
- ✅ Email is now unique identifier
- ✅ Login accepts email only
- ✅ Single dashboard URL for all tenants
- ✅ Simpler, cleaner forms
- ✅ Better user experience

**Dashboard URL:** `https://app.rtrwnet.com` 🚀
