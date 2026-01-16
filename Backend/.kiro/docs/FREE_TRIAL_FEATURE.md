# Free Trial Feature - 7 Hari Gratis

## Overview

User bisa mencoba platform **GRATIS selama 7 hari** tanpa perlu memasukkan kartu kredit atau melakukan pembayaran.

---

## How It Works

### 1. User Sign Up dengan Trial

```
User → Sign Up Form
     → Check "Start Free Trial" ✓
     → Submit
```

**Backend Process:**
```
1. Create tenant (is_active = TRUE)
2. Create admin user (is_active = TRUE)
3. Create subscription (status = "trial")
4. Set trial_end_date = today + 7 days
5. NO payment transaction created
6. Return success immediately
```

**Result:**
- ✅ Tenant active immediately
- ✅ User can login immediately
- ✅ Full access to all features
- ✅ No payment needed
- ⏰ 7 days to try

---

## API Usage

### Sign Up with Trial

```json
POST /api/v1/public/signup
{
  "isp_name": "My ISP",
  "subdomain": "myisp",
  "email": "owner@myisp.com",
  "password": "secure123",
  "phone": "08123456789",
  "plan_id": "plan-uuid",
  "owner_name": "Owner Name",
  "use_trial": true  ← Enable trial
}
```

**Response:**
```json
{
  "tenant_id": "tenant-uuid",
  "user_id": "user-uuid",
  "is_trial": true,
  "trial_ends": "2026-01-02",
  "message": "Your 7-day free trial has started! You can start using the platform immediately."
}
```

### Sign Up without Trial (Paid)

```json
POST /api/v1/public/signup
{
  "isp_name": "My ISP",
  "subdomain": "myisp",
  "email": "owner@myisp.com",
  "password": "secure123",
  "phone": "08123456789",
  "plan_id": "plan-uuid",
  "owner_name": "Owner Name",
  "use_trial": false  ← Paid immediately
}
```

**Response:**
```json
{
  "tenant_id": "tenant-uuid",
  "user_id": "user-uuid",
  "order_id": "ORD-123",
  "amount": 299000,
  "payment_url": "https://payment.com/...",
  "is_trial": false,
  "message": "Please complete payment within 24 hours to activate your account"
}
```

---

## Trial Lifecycle

```
Day 0: Sign Up
├─→ Status: trial
├─→ Active: true
└─→ Trial ends: Day 7

Day 1-6: Using Platform
├─→ Full access to all features
├─→ Dashboard shows "Trial ends in X days"
└─→ Email reminders sent

Day 7: Trial Expires
├─→ Status: expired
├─→ Active: false (suspended)
├─→ Show upgrade prompt
└─→ Cannot login until upgrade

After Payment:
├─→ Status: active
├─→ Active: true
├─→ Full access restored
└─→ Billing cycle starts
```

---

## Database Schema

### Subscription Status Values

```sql
-- Status progression
'trial'     → User in free trial (7 days)
'pending'   → Waiting for payment
'active'    → Paid & active
'expired'   → Trial/subscription ended
'suspended' → Payment failed or admin action
'cancelled' → User cancelled subscription
```

### Trial Subscription Example

```sql
SELECT 
    t.name as tenant_name,
    t.subdomain,
    t.is_active,
    ts.status,
    ts.start_date,
    ts.end_date,
    EXTRACT(DAY FROM (ts.end_date - NOW())) as days_remaining
FROM tenant_subscriptions ts
JOIN tenants t ON ts.tenant_id = t.id
WHERE ts.status = 'trial';
```

---

## Trial Expiration Cron Job (To Be Implemented)

```go
// Run daily at 00:00
func CheckExpiredTrials(ctx context.Context) {
    // Find trials that expired
    now := time.Now()
    
    var subscriptions []entity.TenantSubscription
    db.Where("status = ? AND end_date < ?", "trial", now).Find(&subscriptions)
    
    for _, sub := range subscriptions {
        // Update subscription status
        sub.Status = "expired"
        subscriptionRepo.Update(ctx, &sub)
        
        // Suspend tenant
        tenant, _ := tenantRepo.FindByID(ctx, sub.TenantID)
        tenant.IsActive = false
        tenantRepo.Update(ctx, tenant)
        
        // Get admin user
        users, _ := userRepo.FindAll(ctx, tenant.ID)
        adminUser := users[0] // First user is admin
        
        // Send email notification
        emailService.SendTrialExpiredEmail(
            adminUser.Email,
            tenant.Name,
            tenant.Subdomain,
        )
        
        logger.Info("Trial expired: tenant=%s", tenant.ID)
    }
}
```

---

## Email Notifications

### Day 0: Welcome Email
```
Subject: Welcome to RT/RW Net Platform! 🎉

Your 7-day free trial has started!

You can now:
✅ Add team members
✅ Create service plans
✅ Manage customers
✅ And much more!

Trial ends: January 2, 2026

Access your dashboard:
https://myisp.rtrwnet.com

[Get Started]
```

### Day 5: Reminder Email
```
Subject: Your trial ends in 2 days

Hi there,

Your free trial will end in 2 days (January 2, 2026).

To continue using RT/RW Net Platform, please upgrade to a paid plan.

[Upgrade Now]
```

### Day 7: Expiration Email
```
Subject: Your trial has ended

Your 7-day free trial has ended.

To continue using the platform, please upgrade to a paid plan.

[Upgrade Now]
```

---

## Upgrade from Trial

```powershell
# User clicks "Upgrade Now"
POST /api/v1/subscriptions/upgrade
Headers:
  Authorization: Bearer <token>
  X-Tenant-ID: <tenant_id>
Body:
{
  "plan_id": "plan-uuid",
  "payment_method": "credit_card"
}

# Response:
{
  "order_id": "ORD-123",
  "amount": 299000,
  "payment_url": "https://payment.com/..."
}

# After payment:
# - Subscription status: trial → active
# - Tenant remains active
# - Billing cycle starts
```

---

## Comparison

| Feature | Free Trial | Paid |
|---------|-----------|------|
| **Duration** | 7 days | 30 days (monthly) |
| **Payment** | Not required | Required upfront |
| **Activation** | Immediate | After payment |
| **Access** | Full features | Full features |
| **After Period** | Must upgrade | Auto-renew |
| **Risk** | Zero risk | Paid upfront |

---

## Benefits Summary

### Free Trial:
✅ **No payment needed**
✅ **Instant activation**
✅ **7 days to try**
✅ **Full features**
✅ **Easy upgrade**

### Paid:
✅ **No time limit**
✅ **Auto-renewal**
✅ **Priority support**
✅ **No interruption**

---

**Free Trial feature ready to use!** 🎉

Test dengan: `TEST_FREE_TRIAL.md`
