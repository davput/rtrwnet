# Static Pricing Configuration

## Overview

PricingSection sekarang menggunakan **static data** (hardcoded) untuk menampilkan paket. Tidak ada API call untuk fetch plans. Hanya **plan ID** yang dikirim ke backend saat registrasi.

## Why Static?

1. **Faster Load** - Tidak perlu wait API response
2. **No Dependencies** - Frontend tidak depend on backend untuk pricing display
3. **Simpler** - Lebih mudah maintain dan update
4. **Better UX** - Instant display, no loading state
5. **SEO Friendly** - Content langsung available untuk crawlers

## Configuration

### Plan IDs

**PENTING:** ID di frontend **HARUS** sama dengan ID di database!

**File:** `src/components/PricingSection.tsx`

```typescript
const plans = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010", // ← ID dari database
    name: "Standard Plan",
    price: 299000,
    // ...
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011", // ← ID dari database
    name: "Premium Plan",
    price: 599000,
    // ...
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012", // ← ID dari database
    name: "Enterprise Plan",
    price: 1499000,
    // ...
  }
];
```

## How to Update Plans

### 1. Update Plan Details

Edit `src/components/PricingSection.tsx`:

```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440010",
  name: "Standard Plan",           // ← Update name
  slug: "standard",
  description: "...",               // ← Update description
  price: 299000,                    // ← Update price (in Rupiah)
  billing_cycle: "monthly",         // monthly or yearly
  features: [                       // ← Update features list
    "Up to 100 customers",
    "Basic reporting",
    // ...
  ],
  popular: false                    // ← Set true for "Most Popular" badge
}
```

### 2. Add New Plan

```typescript
const plans = [
  // ... existing plans
  {
    id: "NEW-UUID-FROM-DATABASE",   // ← Get from database
    name: "New Plan",
    slug: "new-plan",
    description: "Description here",
    price: 399000,
    billing_cycle: "monthly",
    features: [
      "Feature 1",
      "Feature 2",
    ],
    popular: false
  }
];
```

### 3. Remove Plan

Simply delete the plan object from the array.

### 4. Change Popular Plan

Set `popular: true` on the plan you want to highlight:

```typescript
{
  id: "...",
  name: "Premium Plan",
  // ...
  popular: true  // ← This will show "Paling Populer" badge
}
```

## Registration Flow

### 1. User Clicks "Coba Gratis 7 Hari"

Plan data dikirim via React Router state:

```typescript
<Link
  to="/register"
  state={{ 
    plan: { 
      id: plan.id,        // ← Plan ID untuk backend
      name: plan.name,    // ← Display name
      price: plan.price   // ← Display price
    } 
  }}
>
  Coba Gratis 7 Hari
</Link>
```

### 2. Register Page Receives Plan Data

```typescript
const location = useLocation();
const planData = location.state?.plan;

// planData = {
//   id: "550e8400-e29b-41d4-a716-446655440010",
//   name: "Standard Plan",
//   price: 299000
// }
```

### 3. Submit to Backend

```typescript
await api.signUp({
  // ... other fields
  plan_id: planData?.id,  // ← Send plan ID to backend
  use_trial: true
});
```

### 4. Backend Validates Plan ID

Backend akan:
1. Check apakah `plan_id` exists di database
2. Validate plan is active
3. Create tenant dengan plan tersebut

## Database Sync

### Get Plan IDs from Database

```sql
SELECT id, name, slug, price FROM subscription_plans WHERE is_active = true;
```

**Output:**
```
id                                   | name           | slug       | price
-------------------------------------|----------------|------------|--------
550e8400-e29b-41d4-a716-446655440010 | Standard Plan  | standard   | 299000
550e8400-e29b-41d4-a716-446655440011 | Premium Plan   | premium    | 599000
550e8400-e29b-41d4-a716-446655440012 | Enterprise Plan| enterprise | 1499000
```

### Update Frontend IDs

Copy IDs dari database ke `src/components/PricingSection.tsx`:

```typescript
const plans = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010", // ← From database
    name: "Standard Plan",
    // ...
  }
];
```

## Price Formatting

Prices are stored in **Rupiah** (full amount):

```typescript
price: 299000  // Rp 299.000
```

Display formatting:

```typescript
const formatPrice = (price: number) => {
  return (price / 1000).toFixed(0);  // 299000 → "299"
};

// Display: Rp 299K/bulan
```

## Features List

Features adalah array of strings:

```typescript
features: [
  "Up to 100 customers",
  "Basic reporting",
  "Email support",
  "Mobile app access"
]
```

Each feature akan ditampilkan dengan checkmark icon.

## Styling

### Popular Badge

Plan dengan `popular: true` akan:
- Show "Paling Populer" badge di atas card
- Larger scale (scale-105 md:scale-110)
- Primary border color
- Shadow effect

### Card Hover

All cards have:
- Hover shadow effect
- Translate up on hover
- Border color change

### Animations

- Staggered entrance animation
- Smooth transitions
- Scroll-triggered visibility

## Testing

### Test Plan Display

1. Open homepage
2. Scroll to pricing section
3. Verify:
   - ✅ 3 plans displayed
   - ✅ Prices formatted correctly
   - ✅ Features list complete
   - ✅ Popular badge on correct plan
   - ✅ Animations work

### Test Registration Flow

1. Click "Coba Gratis 7 Hari"
2. Verify:
   - ✅ Redirects to /register
   - ✅ Plan name shows in badge
   - ✅ Form loads correctly

3. Fill form and submit
4. Check network tab:
   - ✅ POST request includes correct `plan_id`
   - ✅ Backend accepts the ID

### Test with Different Plans

1. Click button on each plan
2. Verify correct plan data passed
3. Submit registration
4. Verify backend creates tenant with correct plan

## Troubleshooting

### Plan ID not found in database

**Error from backend:**
```json
{
  "error": "plan not found"
}
```

**Solution:**
1. Check plan ID di frontend matches database
2. Verify plan is active in database
3. Update frontend ID if needed

### Price not displaying correctly

**Issue:** Shows "NaN" or wrong format

**Solution:**
1. Verify price is number, not string
2. Check formatPrice function
3. Ensure price in Rupiah (not thousands)

### Features not showing

**Issue:** Features list empty or error

**Solution:**
1. Verify features is array
2. Check for typos in features array
3. Ensure no null/undefined values

## Migration from API-based

If you previously used API to fetch plans:

### Before (API-based)
```typescript
const [plans, setPlans] = useState<Plan[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchPlans = async () => {
    const data = await api.getPlans();
    setPlans(data);
    setLoading(false);
  };
  fetchPlans();
}, []);
```

### After (Static)
```typescript
const plans = [
  { id: "...", name: "...", /* ... */ },
  { id: "...", name: "...", /* ... */ },
];
// No loading, no API call
```

## Benefits

✅ **Performance**
- Instant display
- No API latency
- No loading state

✅ **Reliability**
- No API dependency
- No network errors
- Always available

✅ **Simplicity**
- Easy to update
- No API maintenance
- Clear data structure

✅ **SEO**
- Content immediately available
- Better crawlability
- Faster indexing

## When to Use API-based Instead

Consider API-based pricing if:
- Plans change frequently (daily/weekly)
- Different pricing per region
- A/B testing different prices
- Dynamic pricing based on user
- Need real-time price updates

For most cases, **static pricing is better**.

## Summary

- ✅ Plans are hardcoded in component
- ✅ No API call for pricing display
- ✅ Plan ID sent to backend on registration
- ✅ Backend validates plan ID
- ✅ Simpler, faster, more reliable

**Remember:** Keep frontend plan IDs in sync with database!
