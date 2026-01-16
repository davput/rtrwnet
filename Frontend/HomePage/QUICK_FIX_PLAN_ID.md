# Quick Fix - Plan ID Not Found

## Error
```
ERROR: Failed to find plan: Resource not found
Plan ID: 550e8400-e29b-41d4-a716-446655440010
```

## Root Cause
Frontend menggunakan plan IDs yang tidak ada di database.

## Quick Fix (Choose One)

### Option 1: Insert Plans to Database (Fastest)

**Step 1:** Run SQL script
```bash
# PostgreSQL
psql -U your_user -d your_database -f seed_plans.sql

# Or copy-paste SQL from seed_plans.sql to your database client
```

**Step 2:** Verify plans created
```sql
SELECT id, name FROM subscription_plans WHERE is_active = true;
```

**Step 3:** Test registration
- Refresh frontend
- Try register again
- Should work now ✅

---

### Option 2: Update Frontend IDs

**Step 1:** Get real plan IDs from database
```sql
SELECT id, name, price FROM subscription_plans WHERE is_active = true ORDER BY price;
```

**Step 2:** Copy IDs and edit `src/components/PricingSection.tsx`

Find:
```typescript
const plans = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010", // ← Replace this
```

Replace with real ID from database:
```typescript
const plans = [
  {
    id: "YOUR-REAL-ID-FROM-DATABASE", // ← Paste here
```

**Step 3:** Save and test

---

## Recommended: Option 1

**Why?**
- Faster (just run SQL)
- No code changes needed
- IDs already match frontend
- Can reuse SQL for other environments

**Run this:**
```bash
# Navigate to project root
cd /path/to/project

# Run SQL
psql -U postgres -d your_database -f seed_plans.sql
```

**Done!** ✅

---

## Verify Fix

### Test Registration Flow

1. Open frontend: `http://localhost:5173`
2. Scroll to pricing section
3. Click "Coba Gratis 7 Hari"
4. Fill form:
   - ISP Name: Test ISP
   - Subdomain: testisp
   - Owner Name: Test Owner
   - Email: test@test.com
   - Phone: 08123456789
   - Password: test1234
5. Submit

### Check Backend Logs

**Before Fix:**
```
ERROR: Failed to find plan: Resource not found
```

**After Fix:**
```
INFO: Plan found: Standard Plan
INFO: Creating tenant...
INFO: Tenant created successfully
```

### Check Database

```sql
-- Check if tenant was created
SELECT 
    t.subdomain,
    t.subscription_plan_id,
    sp.name as plan_name
FROM tenants t
JOIN subscription_plans sp ON t.subscription_plan_id = sp.id
WHERE t.subdomain = 'testisp';
```

Should return:
```
subdomain | subscription_plan_id                 | plan_name
----------|--------------------------------------|-------------
testisp   | 550e8400-e29b-41d4-a716-446655440010 | Standard Plan
```

---

## Files Provided

- `seed_plans.sql` - SQL script to insert plans
- `GET_PLAN_IDS.md` - Detailed guide
- `QUICK_FIX_PLAN_ID.md` - This file

---

## Still Not Working?

### Check 1: Database Connection
```bash
psql -U your_user -d your_database -c "SELECT 1;"
```

### Check 2: Table Exists
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'subscription_plans';
```

### Check 3: Column Names
```sql
\d subscription_plans  -- PostgreSQL
-- or
DESCRIBE subscription_plans;  -- MySQL
```

### Check 4: UUID Format
```sql
SELECT id FROM subscription_plans LIMIT 1;
```

If UUID format different, update both frontend and SQL script.

---

## Summary

**Fastest Fix:**
1. Run `seed_plans.sql`
2. Test registration
3. Done! ✅

**Time:** < 2 minutes
