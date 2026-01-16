# Sign Up API - Standard Response Format

## Overview

Endpoint `/api/v1/public/signup` sekarang menggunakan standard response format yang konsisten.

---

## Endpoint

```
POST /api/v1/public/signup
```

---

## Request

```json
{
  "isp_name": "My ISP Jakarta",
  "subdomain": "myisp",
  "email": "admin@myisp.com",
  "password": "password123",
  "phone": "081234567890",
  "plan_id": "plan-uuid",
  "owner_name": "John Doe",
  "use_trial": true
}
```

### Validation Rules

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| isp_name | string | Yes | Min 3 characters |
| subdomain | string | Yes | Lowercase, alphanumeric, hyphens only, 3-63 chars |
| email | string | Yes | Valid email format |
| password | string | Yes | Min 6 characters |
| phone | string | Yes | Indonesian format (08xxx or +628xxx) |
| plan_id | string | Yes | Valid UUID |
| owner_name | string | Yes | Owner/admin name |
| use_trial | boolean | No | true = free trial, false = paid |

---

## Success Responses

### 1. Free Trial Sign Up

**Request:**
```json
{
  "isp_name": "Test ISP",
  "subdomain": "testisp",
  "email": "admin@testisp.com",
  "password": "test123",
  "phone": "081234567890",
  "plan_id": "plan-uuid",
  "owner_name": "Test Owner",
  "use_trial": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Sign up successful",
  "data": {
    "tenant_id": "tenant-uuid",
    "user_id": "user-uuid",
    "order_id": "",
    "amount": 0,
    "payment_url": "",
    "is_trial": true,
    "trial_ends": "2026-01-02",
    "message": "Your 7-day free trial has started! You can start using the platform immediately."
  }
}
```

---

### 2. Paid Sign Up

**Request:**
```json
{
  "isp_name": "Premium ISP",
  "subdomain": "premiumisp",
  "email": "admin@premiumisp.com",
  "password": "premium123",
  "phone": "081234567890",
  "plan_id": "plan-uuid",
  "owner_name": "Premium Owner",
  "use_trial": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Sign up successful",
  "data": {
    "tenant_id": "tenant-uuid",
    "user_id": "user-uuid",
    "order_id": "order-uuid",
    "amount": 299000,
    "payment_url": "https://payment-gateway.com/pay/order-uuid",
    "is_trial": false,
    "trial_ends": "",
    "message": "Please complete payment to activate your subscription."
  }
}
```

---

## Error Responses

### 1. Validation Error

**Request:**
```json
{
  "isp_name": "ab",
  "subdomain": "a",
  "email": "invalid-email",
  "password": "123"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VAL_2001",
    "message": "Validation failed",
    "details": {
      "error": "Invalid request data",
      "isp_name": "ISP name is required (min 3 characters)",
      "subdomain": "Subdomain is required (lowercase, alphanumeric, hyphens only)",
      "email": "Valid email is required",
      "password": "Password is required (min 6 characters)",
      "phone": "Phone number is required (Indonesian format)",
      "plan_id": "Plan ID is required",
      "owner_name": "Owner name is required"
    }
  }
}
```

---

### 2. Subdomain Already Taken

**Request:**
```json
{
  "isp_name": "Test ISP",
  "subdomain": "existing-subdomain",
  "email": "admin@test.com",
  "password": "test123",
  "phone": "081234567890",
  "plan_id": "plan-uuid",
  "owner_name": "Test Owner",
  "use_trial": true
}
```

**Response (409 Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "TENANT_3004",
    "message": "Subdomain is already taken",
    "details": {
      "subdomain": "The subdomain 'existing-subdomain' is already in use. Please choose another one."
    }
  }
}
```

---

### 3. Invalid Plan

**Request:**
```json
{
  "isp_name": "Test ISP",
  "subdomain": "testisp",
  "email": "admin@test.com",
  "password": "test123",
  "phone": "081234567890",
  "plan_id": "invalid-plan-id",
  "owner_name": "Test Owner",
  "use_trial": true
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "SUB_4004",
    "message": "Invalid subscription plan"
  }
}
```

---

### 4. Internal Server Error

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": {
    "code": "SRV_9001",
    "message": "Internal server error"
  }
}
```

---

## Frontend Integration

### JavaScript/TypeScript

```typescript
interface SignUpRequest {
  isp_name: string;
  subdomain: string;
  email: string;
  password: string;
  phone: string;
  plan_id: string;
  owner_name: string;
  use_trial: boolean;
}

interface SignUpResponse {
  tenant_id: string;
  user_id: string;
  order_id: string;
  amount: number;
  payment_url: string;
  is_trial: boolean;
  trial_ends: string;
  message: string;
}

async function signUp(data: SignUpRequest): Promise<ApiResponse<SignUpResponse>> {
  try {
    const response = await fetch('/api/v1/public/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result: ApiResponse<SignUpResponse> = await response.json();
    
    if (!result.success) {
      // Handle error
      console.error(`Sign up error [${result.error?.code}]:`, result.error?.message);
      
      // Show field-specific errors
      if (result.error?.details) {
        Object.keys(result.error.details).forEach(field => {
          showFieldError(field, result.error.details[field]);
        });
      }
      
      return result;
    }
    
    // Success
    console.log(result.message); // "Sign up successful"
    
    if (result.data?.is_trial) {
      // Free trial - redirect to dashboard
      showSuccess(`Trial activated! Valid until ${result.data.trial_ends}`);
      
      // Auto login and redirect
      await autoLogin(result.data.tenant_id, data.email, data.password);
      window.location.href = '/billing-dashboard';
    } else {
      // Paid - redirect to payment
      showSuccess('Please complete payment to activate your account');
      window.location.href = result.data?.payment_url || '/payment';
    }
    
    return result;
  } catch (error) {
    console.error('Network error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred'
      }
    };
  }
}

// Usage
const signUpData: SignUpRequest = {
  isp_name: 'My ISP',
  subdomain: 'myisp',
  email: 'admin@myisp.com',
  password: 'password123',
  phone: '081234567890',
  plan_id: selectedPlanId,
  owner_name: 'John Doe',
  use_trial: true
};

const result = await signUp(signUpData);
```

---

### React Component Example

```tsx
import React, { useState } from 'react';

const SignUpForm: React.FC = () => {
  const [formData, setFormData] = useState({
    isp_name: '',
    subdomain: '',
    email: '',
    password: '',
    phone: '',
    plan_id: '',
    owner_name: '',
    use_trial: true
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/v1/public/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        // Handle errors
        if (data.error?.details) {
          setErrors(data.error.details);
        } else {
          alert(data.error?.message || 'Sign up failed');
        }
        return;
      }
      
      // Success
      if (data.data.is_trial) {
        alert(`Trial activated! Valid until ${data.data.trial_ends}`);
        // Redirect to dashboard
        window.location.href = '/billing-dashboard';
      } else {
        // Redirect to payment
        window.location.href = data.data.payment_url;
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>ISP Name</label>
        <input
          type="text"
          value={formData.isp_name}
          onChange={(e) => setFormData({...formData, isp_name: e.target.value})}
        />
        {errors.isp_name && <span className="error">{errors.isp_name}</span>}
      </div>
      
      <div>
        <label>Subdomain</label>
        <input
          type="text"
          value={formData.subdomain}
          onChange={(e) => setFormData({...formData, subdomain: e.target.value})}
        />
        {errors.subdomain && <span className="error">{errors.subdomain}</span>}
      </div>
      
      {/* More fields... */}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
};
```

---

## Summary

✅ **Standard format** - Consistent dengan endpoint lain
✅ **Clear errors** - Error code dan message yang jelas
✅ **Field validation** - Detail error per field
✅ **Success message** - Message yang descriptive
✅ **Trial support** - Handle free trial dan paid signup
✅ **Frontend friendly** - Mudah diintegrasikan

**Ready to use!** 🚀
