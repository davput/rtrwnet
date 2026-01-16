# Plan ID Fix - UUID Mismatch

## Problem

Error saat registrasi:
```
ERROR: invalid input syntax for type uuid: "starter" (SQLSTATE 22P02)
{
  success: false,
  error: {
    code: "SUB_4004",
    message: "Invalid subscription plan"
  }
}
```

## Root Cause

Plan IDs di `PricingSection.tsx` tidak sesuai dengan database.

**Before (Wrong):**
```typescript
{
  id: "8a956a8f-ee32-45cd-9df6-8bf4f2f5f052", // Wrong UUID
  name: "Basic Plan",
  ...
}
```

**Database (Correct):**
```sql
id: '550e8400-e29b-41d4-a716-446655440010'
name: 'Standard Plan'
```

## Solution

Updated `src/components/PricingSection.tsx` dengan UUID yang benar dari `seed_plans.sql`:

```typescript
const plans = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010", // ✅ Correct UUID
    name: "Standard Plan",
    slug: "standard",
    price: 299000,
    ...
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011", // ✅ Correct UUID
    name: "Premium Plan",
    slug: "premium",
    price: 599000,
    ...
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012", // ✅ Correct UUID
    name: "Enterprise Plan",
    slug: "enterprise",
    price: 1499000,
    ...
  }
];
```

## Verification

### Check Database

```sql
SELECT id, name, slug FROM subscription_plans WHERE is_active = true;
```

**Expected:**
```
id                                   | name           | slug
-------------------------------------|----------------|----------
550e8400-e29b-41d4-a716-446655440010 | Standard Plan  | standard
550e8400-e29b-41d4-a716-446655440011 | Premium Plan   | premium
550e8400-e29b-41d4-a716-446655440012 | Enterprise Plan| enterprise
```

### Check Frontend

```typescript
// src/components/PricingSection.tsx
const plans = [
  { id: "550e8400-e29b-41d4-a716-446655440010", ... }, // ✅ Match
  { id: "550e8400-e29b-41d4-a716-446655440011", ... }, // ✅ Match
  { id: "550e8400-e29b-41d4-a716-446655440012", ... }, // ✅ Match
];
```

## Testing

1. **Refresh frontend**
2. **Go to pricing section**
3. **Click "Coba Gratis 7 Hari"**
4. **Fill registration form**
5. **Submit**
6. **Should succeed** ✅

## Important Notes

### Always Keep in Sync

Frontend plan IDs **MUST** match database plan IDs:

```
Frontend (PricingSection.tsx)  ←→  Database (subscription_plans)
         UUID                  =          UUID
```

### How to Update

**If you change database:**
1. Run SQL to get new UUIDs
2. Update `PricingSection.tsx` with new UUIDs

**If you change frontend:**
1. Copy UUIDs from `PricingSection.tsx`
2. Update `seed_plans.sql` with same UUIDs
3. Re-run SQL script

### Quick Check Command

```sql
-- Get all plan IDs from database
SELECT id, name FROM subscription_plans ORDER BY price;
```

Copy these IDs to frontend.

## Files Modified

- ✅ `src/components/PricingSection.tsx` - Updated plan IDs
- ✅ `PLAN_ID_FIX.md` - This documentation

## Summary

**Problem:** Plan IDs mismatch between frontend and database
**Solution:** Updated frontend IDs to match `seed_plans.sql`
**Result:** Registration now works correctly ✅

**Remember:** Always keep plan IDs in sync!
