# Frontend Integration Guide - Landing Page

## Overview

Guide ini khusus untuk **Landing Page** yang menangani:
- ✅ Register tenant baru
- ✅ Pilih paket subscription
- ✅ Free trial atau paid signup

**Dashboard tenant** ada di project terpisah dan tidak dibahas di sini.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Landing Page (FE)                        │
│  - Homepage                                                  │
│  - Pricing page (pilih paket)                               │
│  - Register page (sign up)                                  │
│  - Payment page (untuk paid)                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (This Project)                  │
│  - GET /api/v1/public/plans                                 │
│  - POST /api/v1/public/signup                               │
│  - POST /api/v1/public/payment/callback                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Dashboard Tenant (Separate FE)                  │
│  - Login page                                               │
│  - Dashboard                                                │
│  - Customer management                                      │
│  - etc.                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints untuk Landing Page

### 1. Get Available Plans

**Endpoint:** `GET /api/v1/public/plans`

**Purpose:** Tampilkan daftar paket subscription di pricing page

**Request:**
```javascript
// No authentication required
fetch('http://localhost:8089/api/v1/public/plans')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "plans": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Standard Plan",
      "slug": "standard",
      "description": "Perfect for small ISPs with up to 100 customers",
      "price": 299000,
      "billing_cycle": "monthly",
      "features": [
        "Up to 100 customers",
        "Basic reporting",
        "Email support",
        "Mobile app access"
      ],
      "max_customers": 100,
      "max_users": 3,
      "is_active": true
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "name": "Premium Plan",
      "slug": "premium",
      "description": "For growing ISPs with up to 500 customers",
      "price": 599000,
      "billing_cycle": "monthly",
      "features": [
        "Up to 500 customers",
        "Advanced reporting",
        "Priority support",
        "API access",
        "Custom branding"
      ],
      "max_customers": 500,
      "max_users": 10,
      "is_active": true
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440012",
      "name": "Enterprise Plan",
      "slug": "enterprise",
      "description": "For large ISPs with unlimited customers",
      "price": 1499000,
      "billing_cycle": "monthly",
      "features": [
        "Unlimited customers",
        "Advanced analytics",
        "24/7 support",
        "API access",
        "Custom branding",
        "Dedicated account manager"
      ],
      "max_customers": -1,
      "max_users": -1,
      "is_active": true
    }
  ]
}
```

---

### 2. Sign Up (Free Trial)

**Endpoint:** `POST /api/v1/public/signup`

**Purpose:** Register tenant baru dengan free trial 7 hari

**Request:**
```javascript
const signUpTrial = async (formData) => {
  const response = await fetch('http://localhost:8089/api/v1/public/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      isp_name: formData.ispName,
      subdomain: formData.subdomain,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      plan_id: formData.planId,
      owner_name: formData.ownerName,
      use_trial: true  // ← FREE TRIAL
    })
  });
  
  return await response.json();
};
```

**Request Body:**
```json
{
  "isp_name": "My ISP Network",
  "subdomain": "myisp",
  "email": "owner@myisp.com",
  "password": "secure123",
  "phone": "08123456789",
  "plan_id": "550e8400-e29b-41d4-a716-446655440010",
  "owner_name": "John Doe",
  "use_trial": true
}
```

**Response (Success - 201):**
```json
{
  "tenant_id": "abc123-def456-...",
  "user_id": "xyz789-uvw012-...",
  "is_trial": true,
  "trial_ends": "2026-01-02",
  "message": "Your 7-day free trial has started! You can start using the platform immediately."
}
```

**What to do after:**
```javascript
// Redirect ke dashboard tenant
window.location.href = `https://dashboard.yourdomain.com?tenant_id=${response.tenant_id}&email=${email}`;

// Atau tampilkan success message
showSuccessMessage('Trial started! Check your email for login instructions.');
```

---

### 3. Sign Up (Paid)

**Endpoint:** `POST /api/v1/public/signup`

**Purpose:** Register tenant baru dengan pembayaran

**Request:**
```javascript
const signUpPaid = async (formData) => {
  const response = await fetch('http://localhost:8089/api/v1/public/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      isp_name: formData.ispName,
      subdomain: formData.subdomain,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      plan_id: formData.planId,
      owner_name: formData.ownerName,
      use_trial: false  // ← PAID
    })
  });
  
  return await response.json();
};
```

**Request Body:**
```json
{
  "isp_name": "My ISP Network",
  "subdomain": "myisp",
  "email": "owner@myisp.com",
  "password": "secure123",
  "phone": "08123456789",
  "plan_id": "550e8400-e29b-41d4-a716-446655440010",
  "owner_name": "John Doe",
  "use_trial": false
}
```

**Response (Success - 201):**
```json
{
  "tenant_id": "abc123-def456-...",
  "user_id": "xyz789-uvw012-...",
  "order_id": "ORD-20260102-ABC123",
  "amount": 299000,
  "payment_url": "https://payment.example.com/pay/ORD-20260102-ABC123",
  "is_trial": false,
  "message": "Please complete payment within 24 hours to activate your account."
}
```

**What to do after:**
```javascript
// Redirect ke payment page
window.location.href = response.payment_url;

// Atau tampilkan payment info
showPaymentInfo({
  orderId: response.order_id,
  amount: response.amount,
  paymentUrl: response.payment_url
});
```

---

### 4. Payment Callback (Webhook)

**Endpoint:** `POST /api/v1/public/payment/callback`

**Purpose:** Handle payment notification dari payment gateway

**Note:** Ini dipanggil oleh payment gateway, bukan dari frontend

**Request (from Payment Gateway):**
```json
{
  "order_id": "ORD-20260102-ABC123",
  "status": "success",
  "amount": 299000,
  "payment_method": "bank_transfer",
  "transaction_id": "TRX-123456789"
}
```

**Response:**
```json
{
  "message": "Payment processed successfully"
}
```

---

## Frontend Implementation Examples

### React Example

#### 1. Pricing Page Component

```jsx
import React, { useState, useEffect } from 'react';

const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('http://localhost:8089/api/v1/public/plans');
      const data = await response.json();
      setPlans(data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId, isTrial) => {
    // Redirect ke register page dengan plan yang dipilih
    window.location.href = `/register?plan_id=${planId}&trial=${isTrial}`;
  };

  if (loading) return <div>Loading plans...</div>;

  return (
    <div className="pricing-page">
      <h1>Choose Your Plan</h1>
      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className="plan-card">
            <h2>{plan.name}</h2>
            <p className="price">Rp {plan.price.toLocaleString()}/month</p>
            <p className="description">{plan.description}</p>
            
            <ul className="features">
              {plan.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            
            <div className="actions">
              <button 
                onClick={() => handleSelectPlan(plan.id, true)}
                className="btn-trial"
              >
                Start Free Trial
              </button>
              <button 
                onClick={() => handleSelectPlan(plan.id, false)}
                className="btn-paid"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
```

---

#### 2. Register Page Component

```jsx
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan_id');
  const isTrial = searchParams.get('trial') === 'true';

  const [formData, setFormData] = useState({
    ispName: '',
    subdomain: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    ownerName: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8089/api/v1/public/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isp_name: formData.ispName,
          subdomain: formData.subdomain,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          plan_id: planId,
          owner_name: formData.ownerName,
          use_trial: isTrial
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Handle success
      if (data.is_trial) {
        // Trial: redirect to dashboard
        alert('Trial started! Redirecting to dashboard...');
        window.location.href = `https://dashboard.yourdomain.com?tenant_id=${data.tenant_id}&email=${formData.email}`;
      } else {
        // Paid: redirect to payment
        alert('Please complete payment to activate your account');
        window.location.href = data.payment_url;
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <h1>Register Your ISP</h1>
      <p className="subtitle">
        {isTrial ? '🎉 Start your 7-day free trial' : '💳 Subscribe now'}
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ISP Name *</label>
          <input
            type="text"
            name="ispName"
            value={formData.ispName}
            onChange={handleChange}
            required
            placeholder="e.g., My ISP Network"
          />
        </div>

        <div className="form-group">
          <label>Subdomain *</label>
          <input
            type="text"
            name="subdomain"
            value={formData.subdomain}
            onChange={handleChange}
            required
            placeholder="e.g., myisp"
            pattern="[a-z0-9-]+"
          />
          <small>Only lowercase letters, numbers, and hyphens</small>
        </div>

        <div className="form-group">
          <label>Owner Name *</label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            required
            placeholder="e.g., John Doe"
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="owner@myisp.com"
          />
        </div>

        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="08123456789"
          />
        </div>

        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="8"
            placeholder="Min. 8 characters"
          />
        </div>

        <div className="form-group">
          <label>Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Re-enter password"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-submit"
        >
          {loading ? 'Processing...' : (isTrial ? 'Start Free Trial' : 'Continue to Payment')}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
```

---

### Vue.js Example

#### Pricing Page (Vue 3)

```vue
<template>
  <div class="pricing-page">
    <h1>Choose Your Plan</h1>
    
    <div v-if="loading" class="loading">Loading plans...</div>
    
    <div v-else class="plans-grid">
      <div 
        v-for="plan in plans" 
        :key="plan.id" 
        class="plan-card"
      >
        <h2>{{ plan.name }}</h2>
        <p class="price">Rp {{ formatPrice(plan.price) }}/month</p>
        <p class="description">{{ plan.description }}</p>
        
        <ul class="features">
          <li v-for="(feature, idx) in plan.features" :key="idx">
            {{ feature }}
          </li>
        </ul>
        
        <div class="actions">
          <button 
            @click="selectPlan(plan.id, true)"
            class="btn-trial"
          >
            Start Free Trial
          </button>
          <button 
            @click="selectPlan(plan.id, false)"
            class="btn-paid"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const plans = ref([]);
const loading = ref(true);

const fetchPlans = async () => {
  try {
    const response = await fetch('http://localhost:8089/api/v1/public/plans');
    const data = await response.json();
    plans.value = data.plans;
  } catch (error) {
    console.error('Error fetching plans:', error);
  } finally {
    loading.value = false;
  }
};

const formatPrice = (price) => {
  return price.toLocaleString('id-ID');
};

const selectPlan = (planId, isTrial) => {
  router.push({
    name: 'register',
    query: { plan_id: planId, trial: isTrial }
  });
};

onMounted(() => {
  fetchPlans();
});
</script>
```

---

### Next.js Example

#### API Route for Server-Side

```typescript
// pages/api/plans.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('http://localhost:8089/api/v1/public/plans');
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
}
```

```typescript
// pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('http://localhost:8089/api/v1/public/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "subdomain already exists"
}
```

**Handle in frontend:**
```javascript
if (response.status === 400) {
  const data = await response.json();
  if (data.error.includes('subdomain')) {
    setError('Subdomain already taken. Please choose another.');
  } else if (data.error.includes('email')) {
    setError('Email already registered.');
  } else {
    setError(data.error);
  }
}
```

#### 404 Not Found
```json
{
  "error": "plan not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "internal server error"
}
```

---

## Validation Rules

### Frontend Validation

```javascript
const validateForm = (formData) => {
  const errors = {};

  // ISP Name
  if (!formData.ispName || formData.ispName.length < 3) {
    errors.ispName = 'ISP name must be at least 3 characters';
  }

  // Subdomain
  const subdomainRegex = /^[a-z0-9-]+$/;
  if (!formData.subdomain || !subdomainRegex.test(formData.subdomain)) {
    errors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
  }
  if (formData.subdomain.length < 3 || formData.subdomain.length > 20) {
    errors.subdomain = 'Subdomain must be 3-20 characters';
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email || !emailRegex.test(formData.email)) {
    errors.email = 'Invalid email address';
  }

  // Phone
  const phoneRegex = /^08\d{8,11}$/;
  if (!formData.phone || !phoneRegex.test(formData.phone)) {
    errors.phone = 'Phone must start with 08 and be 10-13 digits';
  }

  // Password
  if (!formData.password || formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  // Confirm Password
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};
```

---

## Environment Variables

### Frontend .env

```env
# API Base URL
REACT_APP_API_URL=http://localhost:8089
NEXT_PUBLIC_API_URL=http://localhost:8089
VITE_API_URL=http://localhost:8089

# Dashboard URL (separate project)
REACT_APP_DASHBOARD_URL=https://dashboard.yourdomain.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
VITE_DASHBOARD_URL=https://dashboard.yourdomain.com
```

---

## CORS Configuration

Backend sudah configured untuk accept requests dari frontend.

**Check `.env`:**
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,https://yourdomain.com
```

**Jika ada CORS error:**
1. Tambahkan frontend URL ke `CORS_ALLOWED_ORIGINS`
2. Restart backend server

---

## User Flow Diagram

### Free Trial Flow

```
Landing Page
    ↓
Pricing Page (pilih plan)
    ↓
Click "Start Free Trial"
    ↓
Register Form
    ↓
Submit (use_trial: true)
    ↓
Backend: Create tenant & user (active immediately)
    ↓
Success Response (tenant_id, trial_ends)
    ↓
Redirect to Dashboard (separate project)
    ↓
User can login & use platform
```

### Paid Flow

```
Landing Page
    ↓
Pricing Page (pilih plan)
    ↓
Click "Subscribe Now"
    ↓
Register Form
    ↓
Submit (use_trial: false)
    ↓
Backend: Create tenant & user (inactive)
    ↓
Success Response (payment_url, order_id)
    ↓
Redirect to Payment Gateway
    ↓
User completes payment
    ↓
Payment Gateway → Backend Webhook
    ↓
Backend: Activate tenant & user
    ↓
Email sent to user
    ↓
User can login to Dashboard
```

---

## Testing

### Test with Postman

Import collection: `postman/Free_Trial_Testing.postman_collection.json`

### Test with curl

```bash
# Get plans
curl http://localhost:8089/api/v1/public/plans

# Sign up trial
curl -X POST http://localhost:8089/api/v1/public/signup \
  -H "Content-Type: application/json" \
  -d '{
    "isp_name": "Test ISP",
    "subdomain": "testisp",
    "email": "test@test.com",
    "password": "test123",
    "phone": "08123456789",
    "plan_id": "PLAN_ID_HERE",
    "owner_name": "Test Owner",
    "use_trial": true
  }'
```

---

## Security Considerations

### 1. Input Sanitization
```javascript
// Sanitize subdomain
const sanitizeSubdomain = (subdomain) => {
  return subdomain
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 20);
};
```

### 2. Password Strength
```javascript
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers;
};
```

### 3. Rate Limiting
Backend sudah implement rate limiting. Frontend should handle 429 responses:

```javascript
if (response.status === 429) {
  setError('Too many requests. Please try again later.');
}
```

---

## Next Steps

### After Registration

**For Trial Users:**
```javascript
// Redirect to dashboard with tenant info
const redirectToDashboard = (tenantId, email) => {
  const dashboardUrl = process.env.REACT_APP_DASHBOARD_URL;
  window.location.href = `${dashboardUrl}/login?tenant_id=${tenantId}&email=${email}&trial=true`;
};
```

**For Paid Users:**
```javascript
// Redirect to payment
const redirectToPayment = (paymentUrl) => {
  window.location.href = paymentUrl;
};
```

### Email Notifications

Backend akan send email ke user dengan:
- Login credentials
- Dashboard URL
- Trial expiration date (for trial)
- Payment instructions (for paid)

---

## Summary

**Landing Page hanya handle:**
- ✅ Display pricing plans
- ✅ Register form
- ✅ Redirect to dashboard (trial) atau payment (paid)

**Dashboard (separate project) handle:**
- ✅ Login
- ✅ Tenant management
- ✅ Customer management
- ✅ All other features

**API Endpoints yang dipakai Landing:**
- `GET /api/v1/public/plans` - Get plans
- `POST /api/v1/public/signup` - Register

**Simple & clean separation!** 🎉
