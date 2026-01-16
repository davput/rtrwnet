# Self-Service SaaS Flow - RT/RW Net Platform

## Overview

Model bisnis dimana **ISP owner** bisa langsung:
1. ✅ Sign up sendiri
2. ✅ Pilih paket subscription
3. ✅ Bayar online
4. ✅ Langsung dapat akses platform

**No manual approval needed!** 🚀

---

## Alur Lengkap Self-Service

```
┌─────────────────────────────────────────────────────────────┐
│                    Landing Page                              │
│  https://rtrwnet-saas.com                                    │
│                                                              │
│  [Pricing] [Features] [Demo] [Sign Up]                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Step 1: Sign Up                             │
│  User mengisi form:                                          │
│  • ISP Name                                                  │
│  • Subdomain (e.g., "jakartimur")                            │
│  • Email                                                     │
│  • Password                                                  │
│  • Phone                                                     │
│                                                              │
│  [Create Account]                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Step 2: Choose Plan                         │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  BASIC   │  │ STANDARD │  │ PREMIUM  │                 │
│  │          │  │          │  │          │                 │
│  │ 50 cust  │  │ 200 cust │  │ Unlimited│                 │
│  │ 2 users  │  │ 10 users │  │ Unlimited│                 │
│  │          │  │          │  │          │                 │
│  │ Rp 99K   │  │ Rp 299K  │  │ Rp 999K  │                 │
│  │ /month   │  │ /month   │  │ /month   │                 │
│  │          │  │          │  │          │                 │
│  │ [Select] │  │ [Select] │  │ [Select] │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Step 3: Payment                             │
│                                                              │
│  Order Summary:                                              │
│  • Plan: Standard                                            │
│  • Price: Rp 299,000/month                                   │
│  • Billing: Monthly                                          │
│                                                              │
│  Payment Method:                                             │
│  ○ Credit Card                                               │
│  ○ Bank Transfer                                             │
│  ○ E-Wallet (GoPay, OVO, Dana)                               │
│                                                              │
│  [Complete Payment]                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Step 4: Activation                          │
│                                                              │
│  ✅ Payment Confirmed!                                       │
│  ✅ Tenant Created                                           │
│  ✅ Admin Account Activated                                  │
│  ✅ Database Initialized                                     │
│                                                              │
│  Your platform is ready!                                     │
│  Access: https://jakartimur.rtrwnet.com                     │
│                                                              │
│  [Go to Dashboard]                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Step 5: Onboarding                          │
│                                                              │
│  Welcome to RT/RW Net Platform! 👋                          │
│                                                              │
│  Quick Setup:                                                │
│  1. ✅ Add your team members                                 │
│  2. ✅ Create service plans                                  │
│  3. ✅ Setup MikroTik router                                 │
│  4. ✅ Add your first customer                               │
│                                                              │
│  [Start Setup Wizard]                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints yang Dibutuhkan

### 1. Public Sign Up Endpoint

```
POST /api/v1/public/signup
```

**Request:**
```json
{
  "isp_name": "ISP Jakarta Timur",
  "subdomain": "jakartimur",
  "email": "owner@jakartimur.com",
  "password": "secure123",
  "phone": "08123456789",
  "plan_id": "plan-standard-uuid"
}
```

**Response:**
```json
{
  "tenant_id": "tenant-uuid",
  "user_id": "user-uuid",
  "payment_url": "https://payment.gateway.com/invoice/xxx",
  "message": "Please complete payment to activate your account"
}
```

### 2. Payment Callback Endpoint

```
POST /api/v1/webhooks/payment
```

**Request (from payment gateway):**
```json
{
  "order_id": "ORDER-123",
  "tenant_id": "tenant-uuid",
  "status": "paid",
  "amount": 299000,
  "payment_method": "credit_card"
}
```

**Action:**
- Activate tenant
- Send welcome email
- Initialize default data

### 3. Subscription Plans Endpoint

```
GET /api/v1/public/plans
```

**Response:**
```json
{
  "plans": [
    {
      "id": "plan-basic-uuid",
      "name": "Basic",
      "price": 99000,
      "billing_cycle": "monthly",
      "features": {
        "max_customers": 50,
        "max_users": 2,
        "support": "email"
      }
    },
    {
      "id": "plan-standard-uuid",
      "name": "Standard",
      "price": 299000,
      "billing_cycle": "monthly",
      "features": {
        "max_customers": 200,
        "max_users": 10,
        "support": "priority"
      }
    },
    {
      "id": "plan-premium-uuid",
      "name": "Premium",
      "price": 999000,
      "billing_cycle": "monthly",
      "features": {
        "max_customers": -1,
        "max_users": -1,
        "support": "24/7"
      }
    }
  ]
}
```

---

## Database Schema Tambahan

### Subscription Plans Table

```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly
    max_customers INTEGER, -- -1 = unlimited
    max_users INTEGER,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO subscription_plans (name, slug, price, billing_cycle, max_customers, max_users, features) VALUES
('Basic', 'basic', 99000, 'monthly', 50, 2, '{"support": "email", "storage": "5GB"}'),
('Standard', 'standard', 299000, 'monthly', 200, 10, '{"support": "priority", "storage": "20GB"}'),
('Premium', 'premium', 999000, 'monthly', -1, -1, '{"support": "24/7", "storage": "unlimited"}');
```

### Tenant Subscriptions Table

```sql
CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL, -- pending, active, suspended, cancelled
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    next_billing_date TIMESTAMP,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payment Transactions Table

```sql
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subscription_id UUID REFERENCES tenant_subscriptions(id),
    order_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- pending, paid, failed, refunded
    payment_method VARCHAR(50),
    payment_gateway VARCHAR(50), -- midtrans, xendit, stripe
    gateway_transaction_id VARCHAR(255),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Complete Flow Implementation

### Step 1: User Sign Up

```javascript
// Frontend
const signUp = async () => {
  const response = await fetch('/api/v1/public/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      isp_name: 'ISP Jakarta Timur',
      subdomain: 'jakartimur',
      email: 'owner@jakartimur.com',
      password: 'secure123',
      phone: '08123456789',
      plan_id: 'plan-standard-uuid'
    })
  });
  
  const data = await response.json();
  
  // Redirect to payment
  window.location.href = data.payment_url;
};
```

### Step 2: Backend Process Sign Up

```go
// SignUp handler
func (h *PublicHandler) SignUp(c *gin.Context) {
    var req SignUpRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // 1. Create tenant (status = pending)
    tenant := &entity.Tenant{
        Name:      req.ISPName,
        Subdomain: req.Subdomain,
        IsActive:  false, // Not active until payment
    }
    tenantRepo.Create(ctx, tenant)
    
    // 2. Create admin user
    hashedPassword, _ := auth.HashPassword(req.Password)
    user := &entity.User{
        TenantID: tenant.ID,
        Email:    req.Email,
        Password: hashedPassword,
        Name:     req.ISPName + " Admin",
        Role:     "admin",
        IsActive: false, // Not active until payment
    }
    userRepo.Create(ctx, user)
    
    // 3. Create subscription (status = pending)
    subscription := &entity.TenantSubscription{
        TenantID: tenant.ID,
        PlanID:   req.PlanID,
        Status:   "pending",
    }
    subscriptionRepo.Create(ctx, subscription)
    
    // 4. Create payment order
    plan, _ := planRepo.FindByID(ctx, req.PlanID)
    orderID := generateOrderID()
    
    transaction := &entity.PaymentTransaction{
        TenantID:       tenant.ID,
        SubscriptionID: subscription.ID,
        OrderID:        orderID,
        Amount:         plan.Price,
        Status:         "pending",
    }
    transactionRepo.Create(ctx, transaction)
    
    // 5. Generate payment URL (Midtrans/Xendit)
    paymentURL := paymentGateway.CreateInvoice(orderID, plan.Price, user.Email)
    
    c.JSON(201, gin.H{
        "tenant_id":   tenant.ID,
        "user_id":     user.ID,
        "payment_url": paymentURL,
        "message":     "Please complete payment to activate",
    })
}
```

### Step 3: Payment Gateway Callback

```go
// Payment webhook handler
func (h *WebhookHandler) PaymentCallback(c *gin.Context) {
    var webhook PaymentWebhook
    if err := c.ShouldBindJSON(&webhook); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Verify webhook signature
    if !paymentGateway.VerifySignature(webhook) {
        c.JSON(401, gin.H{"error": "Invalid signature"})
        return
    }
    
    if webhook.Status == "paid" {
        // 1. Update transaction
        transaction, _ := transactionRepo.FindByOrderID(ctx, webhook.OrderID)
        transaction.Status = "paid"
        transaction.PaidAt = time.Now()
        transactionRepo.Update(ctx, transaction)
        
        // 2. Activate subscription
        subscription, _ := subscriptionRepo.FindByID(ctx, transaction.SubscriptionID)
        subscription.Status = "active"
        subscription.StartDate = time.Now()
        subscription.EndDate = time.Now().AddDate(0, 1, 0) // +1 month
        subscription.NextBillingDate = time.Now().AddDate(0, 1, 0)
        subscriptionRepo.Update(ctx, subscription)
        
        // 3. Activate tenant
        tenant, _ := tenantRepo.FindByID(ctx, transaction.TenantID)
        tenant.IsActive = true
        tenantRepo.Update(ctx, tenant)
        
        // 4. Activate user
        users, _ := userRepo.FindAll(ctx, tenant.ID)
        for _, user := range users {
            user.IsActive = true
            userRepo.Update(ctx, user)
        }
        
        // 5. Initialize default data
        initializeDefaultData(tenant.ID)
        
        // 6. Send welcome email
        emailService.SendWelcomeEmail(user.Email, tenant)
        
        logger.Info("Tenant activated: %s", tenant.ID)
    }
    
    c.JSON(200, gin.H{"status": "ok"})
}
```

### Step 4: Initialize Default Data

```go
func initializeDefaultData(tenantID string) {
    // Create default service plans
    plans := []entity.ServicePlan{
        {
            TenantID:      tenantID,
            Name:          "10 Mbps",
            SpeedDownload: 10,
            SpeedUpload:   10,
            Price:         150000,
            IsActive:      true,
        },
        {
            TenantID:      tenantID,
            Name:          "20 Mbps",
            SpeedDownload: 20,
            SpeedUpload:   20,
            Price:         250000,
            IsActive:      true,
        },
    }
    
    for _, plan := range plans {
        servicePlanRepo.Create(ctx, &plan)
    }
    
    // Create sample data for demo
    // ...
}
```

---

## Pricing Page Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>RT/RW Net SaaS - Pricing</title>
</head>
<body>
    <h1>Choose Your Plan</h1>
    
    <div class="pricing-cards">
        <!-- Basic Plan -->
        <div class="card">
            <h2>Basic</h2>
            <p class="price">Rp 99,000<span>/month</span></p>
            <ul>
                <li>✅ Up to 50 customers</li>
                <li>✅ 2 team members</li>
                <li>✅ Email support</li>
                <li>✅ 5GB storage</li>
                <li>✅ Basic reports</li>
            </ul>
            <button onclick="selectPlan('basic')">Get Started</button>
        </div>
        
        <!-- Standard Plan -->
        <div class="card featured">
            <div class="badge">Most Popular</div>
            <h2>Standard</h2>
            <p class="price">Rp 299,000<span>/month</span></p>
            <ul>
                <li>✅ Up to 200 customers</li>
                <li>✅ 10 team members</li>
                <li>✅ Priority support</li>
                <li>✅ 20GB storage</li>
                <li>✅ Advanced reports</li>
                <li>✅ MikroTik integration</li>
            </ul>
            <button onclick="selectPlan('standard')">Get Started</button>
        </div>
        
        <!-- Premium Plan -->
        <div class="card">
            <h2>Premium</h2>
            <p class="price">Rp 999,000<span>/month</span></p>
            <ul>
                <li>✅ Unlimited customers</li>
                <li>✅ Unlimited team members</li>
                <li>✅ 24/7 support</li>
                <li>✅ Unlimited storage</li>
                <li>✅ Custom reports</li>
                <li>✅ API access</li>
                <li>✅ White label option</li>
            </ul>
            <button onclick="selectPlan('premium')">Get Started</button>
        </div>
    </div>
    
    <script>
        function selectPlan(planSlug) {
            // Redirect to sign up with selected plan
            window.location.href = `/signup?plan=${planSlug}`;
        }
    </script>
</body>
</html>
```

---

## Recurring Billing (Auto-Renewal)

```go
// Cron job: Check subscriptions to renew (daily)
func CheckSubscriptionsToRenew() {
    // Find subscriptions expiring in 3 days
    subscriptions := subscriptionRepo.FindExpiringIn(3)
    
    for _, sub := range subscriptions {
        // Create renewal invoice
        plan := planRepo.FindByID(sub.PlanID)
        orderID := generateOrderID()
        
        transaction := &entity.PaymentTransaction{
            TenantID:       sub.TenantID,
            SubscriptionID: sub.ID,
            OrderID:        orderID,
            Amount:         plan.Price,
            Status:         "pending",
        }
        transactionRepo.Create(ctx, transaction)
        
        // Send invoice email
        tenant := tenantRepo.FindByID(sub.TenantID)
        user := userRepo.FindAdminByTenant(sub.TenantID)
        
        paymentURL := paymentGateway.CreateInvoice(orderID, plan.Price, user.Email)
        
        emailService.SendRenewalInvoice(user.Email, tenant, paymentURL)
    }
}
```

---

## Summary Alur Self-Service

1. **User Sign Up** → Isi form ISP name, subdomain, email, password
2. **Choose Plan** → Pilih Basic/Standard/Premium
3. **Payment** → Bayar via payment gateway (Midtrans/Xendit)
4. **Auto Activation** → Setelah payment confirmed:
   - ✅ Tenant activated
   - ✅ Admin account activated
   - ✅ Default data initialized
   - ✅ Welcome email sent
5. **Onboarding** → Setup wizard untuk first-time setup
6. **Start Using** → Langsung bisa manage customers!

**Fully automated, no manual approval!** 🚀

---

## Next Steps untuk Implementasi

1. ✅ Buat subscription plans table
2. ✅ Buat tenant_subscriptions table
3. ✅ Buat payment_transactions table
4. ✅ Implement public signup endpoint
5. ✅ Integrate payment gateway (Midtrans/Xendit)
6. ✅ Implement webhook handler
7. ✅ Create pricing page
8. ✅ Setup recurring billing cron job

Mau saya implementasikan fitur-fitur ini? 🚀
