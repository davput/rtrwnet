# How to Get Plan IDs from Database

## Problem

Frontend menggunakan plan IDs yang tidak ada di database:
```
ERROR: Failed to find plan: Resource not found
Plan ID: 550e8400-e29b-41d4-a716-446655440010
```

## Solution

### Step 1: Query Database untuk Plan IDs

Jalankan query ini di database Anda:

```sql
SELECT 
    id,
    name,
    slug,
    price,
    billing_cycle,
    is_active
FROM subscription_plans
WHERE is_active = true
ORDER BY price ASC;
```

**Expected Output:**
```
id                                   | name           | slug       | price  | billing_cycle | is_active
-------------------------------------|----------------|------------|--------|---------------|----------
abc123-def456-...                    | Standard Plan  | standard   | 299000 | monthly       | true
def456-ghi789-...                    | Premium Plan   | premium    | 599000 | monthly       | true
ghi789-jkl012-...                    | Enterprise Plan| enterprise | 1499000| monthly       | true
```

### Step 2: Copy Real IDs ke Frontend

Edit file: `src/components/PricingSection.tsx`

**Find this section:**
```typescript
const plans = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010", // ← WRONG ID
    name: "Standard Plan",
    // ...
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011", // ← WRONG ID
    name: "Premium Plan",
    // ...
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012", // ← WRONG ID
    name: "Enterprise Plan",
    // ...
  }
];
```

**Replace with real IDs from database:**
```typescript
const plans = [
  {
    id: "abc123-def456-...", // ← REAL ID from database
    name: "Standard Plan",
    // ...
  },
  {
    id: "def456-ghi789-...", // ← REAL ID from database
    name: "Premium Plan",
    // ...
  },
  {
    id: "ghi789-jkl012-...", // ← REAL ID from database
    name: "Enterprise Plan",
    // ...
  }
];
```

### Step 3: Verify Plan Details Match

Pastikan detail plan di frontend sesuai dengan database:

**Check:**
- ✅ Plan name sama
- ✅ Price sama
- ✅ Billing cycle sama
- ✅ Plan is_active = true

### Step 4: Test Registration

1. Refresh frontend
2. Click "Coba Gratis 7 Hari"
3. Fill registration form
4. Submit
5. Check backend logs - should NOT show "plan not found"

## Alternative: Create Plans in Database

Jika database masih kosong, Anda bisa insert plans dengan IDs yang sudah ada di frontend:

```sql
-- Insert Standard Plan
INSERT INTO subscription_plans (
    id,
    name,
    slug,
    description,
    price,
    billing_cycle,
    max_customers,
    max_users,
    is_active,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440010',
    'Standard Plan',
    'standard',
    'Perfect for small ISPs with up to 100 customers',
    299000,
    'monthly',
    100,
    3,
    true,
    NOW(),
    NOW()
);

-- Insert Premium Plan
INSERT INTO subscription_plans (
    id,
    name,
    slug,
    description,
    price,
    billing_cycle,
    max_customers,
    max_users,
    is_active,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440011',
    'Premium Plan',
    'premium',
    'For growing ISPs with up to 500 customers',
    599000,
    'monthly',
    500,
    10,
    true,
    NOW(),
    NOW()
);

-- Insert Enterprise Plan
INSERT INTO subscription_plans (
    id,
    name,
    slug,
    description,
    price,
    billing_cycle,
    max_customers,
    max_users,
    is_active,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440012',
    'Enterprise Plan',
    'enterprise',
    'For large ISPs with unlimited customers',
    1499000,
    'monthly',
    -1,
    -1,
    true,
    NOW(),
    NOW()
);
```

**Note:** Adjust column names sesuai dengan schema database Anda.

## Quick Check

### Verify Plan Exists

```sql
SELECT id, name FROM subscription_plans 
WHERE id = '550e8400-e29b-41d4-a716-446655440010';
```

**If returns 0 rows:** Plan tidak ada, perlu insert atau update frontend ID

**If returns 1 row:** Plan ada, cek apakah `is_active = true`

### Check All Active Plans

```sql
SELECT id, name, is_active FROM subscription_plans;
```

## Common Issues

### Issue 1: UUID Format Different

**Error:** Invalid UUID format

**Solution:** 
- PostgreSQL uses UUID format: `550e8400-e29b-41d4-a716-446655440010`
- MySQL might use different format
- Check your database UUID format

### Issue 2: Plan Inactive

**Error:** Plan not found (but exists in database)

**Solution:**
```sql
UPDATE subscription_plans 
SET is_active = true 
WHERE id = 'YOUR-PLAN-ID';
```

### Issue 3: Wrong Column Names

**Error:** Column not found

**Solution:** Check your database schema:
```sql
DESCRIBE subscription_plans;
-- or
\d subscription_plans  -- PostgreSQL
```

## Testing After Fix

### Test 1: Check Backend Logs

Submit registration and check logs:

**Before Fix:**
```
ERROR: Failed to find plan: Resource not found
```

**After Fix:**
```
INFO: Plan found: Standard Plan
INFO: Tenant created successfully
```

### Test 2: Check Database

After successful registration:

```sql
SELECT 
    t.id,
    t.subdomain,
    t.subscription_plan_id,
    sp.name as plan_name
FROM tenants t
JOIN subscription_plans sp ON t.subscription_plan_id = sp.id
ORDER BY t.created_at DESC
LIMIT 1;
```

Should show newly created tenant with correct plan.

## Summary

**Choose one approach:**

### Option A: Update Frontend (Recommended)
1. Query database untuk plan IDs
2. Copy real IDs ke `src/components/PricingSection.tsx`
3. Test registration

### Option B: Insert Plans to Database
1. Run SQL insert statements above
2. Adjust column names if needed
3. Test registration

**Both approaches work!** Choose based on your preference.

## Need Help?

If still getting errors:

1. **Check backend logs** - Full error message
2. **Check database schema** - Column names
3. **Check plan IDs** - Exact match required
4. **Check is_active** - Must be true
5. **Check UUID format** - Database-specific

---

**Quick Fix Command:**

```bash
# Get plan IDs from database
psql -U your_user -d your_database -c "SELECT id, name FROM subscription_plans WHERE is_active = true;"

# Copy IDs and update src/components/PricingSection.tsx
```
