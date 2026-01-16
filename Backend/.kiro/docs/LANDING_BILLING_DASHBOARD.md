# Landing Page - Login & Billing Dashboard

## Overview

User bisa login di landing page dan mengakses billing dashboard untuk:
- Melihat status subscription (trial/active/expired)
- Upgrade/downgrade plan
- Update payment method
- Manage tenant settings
- View invoices
- Cancel subscription

---

## API Endpoints

### 1. Login (Already Exists)

```
POST /api/v1/auth/login
```

**Request:**
```json
{
  "tenant_id": "tenant-uuid",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 900,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin"
  }
}
```

---

### 2. Get Billing Dashboard

```
GET /api/v1/billing
```

**Headers:**
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
```

**Response:**
```json
{
  "tenant": {
    "id": "tenant-uuid",
    "name": "ISP Jakarta",
    "subdomain": "jakarta",
    "email": "admin@isp.com",
    "phone": "08123456789",
    "is_active": true
  },
  "subscription": {
    "id": "sub-uuid",
    "plan_id": "plan-uuid",
    "plan_name": "Standard",
    "plan_slug": "standard",
    "status": "trial",
    "is_trial": true,
    "start_date": "2025-12-26T10:00:00Z",
    "end_date": "2026-01-02T10:00:00Z",
    "next_billing_date": "2026-01-02T10:00:00Z",
    "days_left": 5,
    "auto_renew": true,
    "payment_method": ""
  },
  "billing": {
    "current_plan": "Standard",
    "monthly_price": 299000,
    "currency": "IDR",
    "next_billing": "2026-01-02",
    "payment_method": "",
    "can_upgrade": true,
    "can_downgrade": true,
    "available_plans": [
      {
        "id": "plan-1",
        "name": "Basic",
        "slug": "basic",
        "price": 199000,
        "description": "For small ISPs",
        "is_current": false
      },
      {
        "id": "plan-2",
        "name": "Standard",
        "slug": "standard",
        "price": 299000,
        "description": "Most popular",
        "is_current": true
      },
      {
        "id": "plan-3",
        "name": "Premium",
        "slug": "premium",
        "price": 499000,
        "description": "For large ISPs",
        "is_current": false
      }
    ]
  },
  "usage": {
    "current_period_start": "2025-12-26T10:00:00Z",
    "current_period_end": "2026-01-02T10:00:00Z",
    "days_used": 2,
    "days_remaining": 5
  },
  "invoices": [
    {
      "id": "inv-1",
      "invoice_no": "INV-2025-001",
      "amount": 299000,
      "status": "paid",
      "issued_date": "2025-12-26T10:00:00Z",
      "due_date": "2026-01-02T10:00:00Z",
      "paid_date": "2025-12-26T10:30:00Z",
      "download_url": "/invoices/inv-1/download"
    }
  ]
}
```

---

### 3. Update Subscription (Upgrade/Downgrade)

```
PUT /api/v1/billing/subscription
```

**Headers:**
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
Content-Type: application/json
```

**Request:**
```json
{
  "plan_id": "new-plan-uuid",
  "payment_method": "credit_card",
  "auto_renew": true
}
```

**Response:**
```json
{
  "message": "Subscription updated successfully"
}
```

---

### 4. Update Tenant Settings

```
PUT /api/v1/billing/settings
```

**Headers:**
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "New ISP Name",
  "email": "newemail@isp.com",
  "phone": "08199999999"
}
```

**Response:**
```json
{
  "message": "Settings updated successfully"
}
```

---

### 5. Cancel Subscription

```
POST /api/v1/billing/cancel
```

**Headers:**
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
Content-Type: application/json
```

**Request:**
```json
{
  "reason": "Too expensive"
}
```

**Response:**
```json
{
  "message": "Subscription cancelled successfully"
}
```

---

### 6. Update Payment Method

```
PUT /api/v1/billing/payment-method
```

**Headers:**
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
Content-Type: application/json
```

**Request:**
```json
{
  "payment_method": "credit_card",
  "card_number": "4111111111111111",
  "card_holder": "John Doe",
  "expiry_month": 12,
  "expiry_year": 2026
}
```

**Response:**
```json
{
  "message": "Payment method updated successfully"
}
```

---

## Frontend Implementation

### Landing Page - Login Section

```html
<!-- Login Form on Landing Page -->
<div class="login-section">
  <h2>Already have an account?</h2>
  <form id="loginForm">
    <input type="text" id="tenantId" placeholder="Tenant ID" required />
    <input type="email" id="email" placeholder="Email" required />
    <input type="password" id="password" placeholder="Password" required />
    <button type="submit">Login to Dashboard</button>
  </form>
</div>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_id: document.getElementById('tenantId').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('tenant_id', document.getElementById('tenantId').value);
    window.location.href = '/billing-dashboard';
  } else {
    alert('Login failed: ' + data.message);
  }
});
</script>
```

---

### Billing Dashboard Page

```javascript
import React, { useEffect, useState } from 'react';

const BillingDashboard = () => {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const tenantId = localStorage.getItem('tenant_id');

      const response = await fetch('/api/v1/billing', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBilling(data);
      }
    } catch (error) {
      console.error('Failed to load billing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    const token = localStorage.getItem('access_token');
    const tenantId = localStorage.getItem('tenant_id');

    const response = await fetch('/api/v1/billing/subscription', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan_id: planId,
        auto_renew: true
      })
    });

    if (response.ok) {
      alert('Plan upgraded successfully!');
      loadBillingData();
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!billing) return <div>Error loading billing data</div>;

  return (
    <div className="billing-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Billing Dashboard</h1>
        <p>{billing.tenant.name}</p>
      </header>

      {/* Subscription Status */}
      <section className="subscription-status">
        <div className="status-card">
          <h2>Current Plan</h2>
          <div className="plan-info">
            <h3>{billing.billing.current_plan}</h3>
            <p className="price">
              Rp {billing.billing.monthly_price.toLocaleString()}/month
            </p>
            <span className={`status-badge ${billing.subscription.status}`}>
              {billing.subscription.is_trial ? 'Free Trial' : billing.subscription.status}
            </span>
          </div>
          
          {billing.subscription.is_trial && (
            <div className="trial-warning">
              <p>⏰ Trial ends in {billing.subscription.days_left} days</p>
              <p>Upgrade now to continue using the platform</p>
            </div>
          )}
        </div>

        {/* Usage */}
        <div className="usage-card">
          <h3>Usage This Period</h3>
          <div className="usage-bar">
            <div 
              className="usage-progress" 
              style={{
                width: `${(billing.usage.days_used / (billing.usage.days_used + billing.usage.days_remaining)) * 100}%`
              }}
            />
          </div>
          <p>{billing.usage.days_used} days used / {billing.usage.days_remaining} days remaining</p>
        </div>
      </section>

      {/* Available Plans */}
      <section className="available-plans">
        <h2>Available Plans</h2>
        <div className="plans-grid">
          {billing.billing.available_plans.map(plan => (
            <div 
              key={plan.id} 
              className={`plan-card ${plan.is_current ? 'current' : ''}`}
            >
              <h3>{plan.name}</h3>
              <p className="plan-price">
                Rp {plan.price.toLocaleString()}/month
              </p>
              <p className="plan-description">{plan.description}</p>
              
              {plan.is_current ? (
                <button className="btn-current" disabled>Current Plan</button>
              ) : (
                <button 
                  className="btn-upgrade"
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {plan.price > billing.billing.monthly_price ? 'Upgrade' : 'Downgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Invoices */}
      <section className="invoices">
        <h2>Recent Invoices</h2>
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {billing.invoices.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.invoice_no}</td>
                <td>Rp {invoice.amount.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${invoice.status}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>{new Date(invoice.issued_date).toLocaleDateString()}</td>
                <td>
                  {invoice.download_url && (
                    <a href={invoice.download_url} className="btn-download">
                      Download
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Settings */}
      <section className="settings">
        <h2>Tenant Settings</h2>
        <form onSubmit={handleUpdateSettings}>
          <div className="form-group">
            <label>ISP Name</label>
            <input 
              type="text" 
              defaultValue={billing.tenant.name}
              name="name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              defaultValue={billing.tenant.email}
              name="email"
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input 
              type="tel" 
              defaultValue={billing.tenant.phone}
              name="phone"
            />
          </div>
          <button type="submit" className="btn-save">Save Changes</button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="danger-zone">
        <h2>Danger Zone</h2>
        <button 
          className="btn-cancel"
          onClick={handleCancelSubscription}
        >
          Cancel Subscription
        </button>
      </section>
    </div>
  );
};

const handleUpdateSettings = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');

  const response = await fetch('/api/v1/billing/settings', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone')
    })
  });

  if (response.ok) {
    alert('Settings updated successfully!');
  }
};

const handleCancelSubscription = async () => {
  if (!confirm('Are you sure you want to cancel your subscription?')) {
    return;
  }

  const reason = prompt('Please tell us why you are cancelling:');
  
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');

  const response = await fetch('/api/v1/billing/cancel', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });

  if (response.ok) {
    alert('Subscription cancelled');
    window.location.reload();
  }
};

export default BillingDashboard;
```

---

## CSS Styling

```css
.billing-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.subscription-status {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.status-card, .usage-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.plan-info {
  text-align: center;
  padding: 2rem 0;
}

.price {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.trial {
  background: #fff3cd;
  color: #856404;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.trial-warning {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 1rem;
  margin-top: 1rem;
}

.usage-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
}

.usage-progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.plan-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  text-align: center;
  transition: all 0.3s ease;
}

.plan-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
}

.plan-card.current {
  border-color: #28a745;
  background: #f8fff9;
}

.btn-upgrade, .btn-current {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-upgrade {
  background: #667eea;
  color: white;
}

.btn-current {
  background: #28a745;
  color: white;
  cursor: not-allowed;
}

.invoices-table {
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 1rem;
}

.invoices-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
}

.invoices-table td {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
}

.danger-zone {
  background: #fff5f5;
  border: 2px solid #fc8181;
  border-radius: 12px;
  padding: 2rem;
  margin-top: 3rem;
}

.btn-cancel {
  background: #dc3545;
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
```

---

## Complete Test Flow

```powershell
Write-Host "=== Landing Billing Dashboard Test ===" -ForegroundColor Cyan

# 1. Get plans
$plans = curl http://localhost:8089/api/v1/public/plans | ConvertFrom-Json
$plan = $plans.plans | Where-Object { $_.slug -eq "standard" }

# 2. Sign up with trial
$signup = curl -X POST http://localhost:8089/api/v1/public/signup `
  -H "Content-Type: application/json" `
  -d "{`"isp_name`":`"Billing Test ISP`",`"subdomain`":`"billtest`",`"email`":`"bill@test.com`",`"password`":`"bill123`",`"phone`":`"08666666666`",`"plan_id`":`"$($plan.id)`",`"owner_name`":`"Billing Owner`",`"use_trial`":true}" | ConvertFrom-Json

Write-Host "✓ Signed up: $($signup.tenant_id)" -ForegroundColor Green

# 3. Login
$login = curl -X POST http://localhost:8089/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d "{`"tenant_id`":`"$($signup.tenant_id)`",`"email`":`"bill@test.com`",`"password`":`"bill123`"}" | ConvertFrom-Json

Write-Host "✓ Logged in" -ForegroundColor Green

# 4. Get billing dashboard
$billing = curl -X GET http://localhost:8089/api/v1/billing `
  -H "Authorization: Bearer $($login.access_token)" `
  -H "X-Tenant-ID: $($signup.tenant_id)" | ConvertFrom-Json

Write-Host "`n=== BILLING DASHBOARD ===" -ForegroundColor Yellow
Write-Host "Tenant: $($billing.tenant.name)" -ForegroundColor White
Write-Host "Plan: $($billing.billing.current_plan)" -ForegroundColor White
Write-Host "Status: $($billing.subscription.status)" -ForegroundColor White
Write-Host "Days Left: $($billing.subscription.days_left)" -ForegroundColor White
Write-Host "Available Plans: $($billing.billing.available_plans.Count)" -ForegroundColor White

# 5. Update settings
curl -X PUT http://localhost:8089/api/v1/billing/settings `
  -H "Authorization: Bearer $($login.access_token)" `
  -H "X-Tenant-ID: $($signup.tenant_id)" `
  -H "Content-Type: application/json" `
  -d '{"name":"Updated ISP Name","email":"updated@test.com"}' | ConvertFrom-Json

Write-Host "✓ Settings updated" -ForegroundColor Green

Write-Host "`n=== Test Complete! ===" -ForegroundColor Green
```

---

## Summary

✅ **Login di landing page** - User bisa login dengan tenant_id + email + password
✅ **Billing dashboard** - GET /api/v1/billing
✅ **Upgrade/downgrade plan** - PUT /api/v1/billing/subscription
✅ **Update settings** - PUT /api/v1/billing/settings
✅ **Cancel subscription** - POST /api/v1/billing/cancel
✅ **Update payment** - PUT /api/v1/billing/payment-method
✅ **View invoices** - Included in billing dashboard
✅ **Usage tracking** - Days used/remaining

**Ready to implement!** 🚀
