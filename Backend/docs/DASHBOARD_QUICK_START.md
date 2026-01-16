# 🚀 Dashboard API Quick Start

Quick reference untuk frontend developer yang ingin integrate dengan Dashboard API.

---

## Base URL

```
http://localhost:8089/api/v1
```

---

## Authentication

Semua dashboard endpoint butuh authentication:

```javascript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'X-Tenant-ID': tenantId,
  'Content-Type': 'application/json'
};
```

---

## Quick Examples

### 1. Login & Get Token

```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:8089/api/v1/auth/simple-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('tenant_id', data.data.user.tenant_id);
    return data.data;
  }
  
  throw new Error(data.error.message);
};

// Usage
const user = await login('admin@myisp.com', 'password123');
```

### 2. Get Dashboard Overview

```javascript
const getDashboard = async () => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  const response = await fetch('http://localhost:8089/api/v1/dashboard/overview', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    }
  });
  
  const data = await response.json();
  return data.data;
};

// Usage
const dashboard = await getDashboard();
console.log('Total Customers:', dashboard.statistics.total_customers);
console.log('Monthly Revenue:', dashboard.revenue.this_month);
```

### 3. List Customers

```javascript
const getCustomers = async (page = 1, search = '', status = '') => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  const params = new URLSearchParams({
    page,
    per_page: 20,
    ...(search && { search }),
    ...(status && { status })
  });
  
  const response = await fetch(
    `http://localhost:8089/api/v1/dashboard/customers?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
      }
    }
  );
  
  const data = await response.json();
  return data.data;
};

// Usage
const customers = await getCustomers(1, 'john', 'active');
```

### 4. Create Customer

```javascript
const createCustomer = async (customerData) => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  const response = await fetch('http://localhost:8089/api/v1/dashboard/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(customerData)
  });
  
  const data = await response.json();
  return data.data;
};

// Usage
const newCustomer = await createCustomer({
  name: 'John Doe',
  phone: '081234567890',
  address: 'Jl. Merdeka No. 123',
  service_plan_id: 'plan-uuid',
  installation_date: new Date().toISOString(),
  due_date: 15,
  monthly_fee: 300000
});
```

### 5. Record Payment

```javascript
const recordPayment = async (paymentData) => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  const response = await fetch('http://localhost:8089/api/v1/dashboard/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });
  
  return await response.json();
};

// Usage
await recordPayment({
  customer_id: 'customer-uuid',
  amount: 300000,
  payment_date: new Date().toISOString(),
  payment_method: 'transfer',
  notes: 'Payment via BCA'
});
```

---

## Complete API Client

```javascript
class DashboardAPI {
  constructor(baseURL = 'http://localhost:8089/api/v1') {
    this.baseURL = baseURL;
  }
  
  getHeaders() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'X-Tenant-ID': localStorage.getItem('tenant_id'),
      'Content-Type': 'application/json'
    };
  }
  
  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    });
    
    return await response.json();
  }
  
  // Auth
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/simple-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('tenant_id', data.data.user.tenant_id);
    }
    
    return data;
  }
  
  // Dashboard
  async getOverview() {
    return this.request('/dashboard/overview');
  }
  
  // Customers
  async getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/dashboard/customers?${query}`);
  }
  
  async getCustomer(id) {
    return this.request(`/dashboard/customers/${id}`);
  }
  
  async createCustomer(data) {
    return this.request('/dashboard/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async updateCustomer(id, data) {
    return this.request(`/dashboard/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async deleteCustomer(id) {
    return this.request(`/dashboard/customers/${id}`, {
      method: 'DELETE'
    });
  }
  
  // Payments
  async getPayments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/dashboard/payments?${query}`);
  }
  
  async recordPayment(data) {
    return this.request('/dashboard/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  // Service Plans
  async getServicePlans() {
    return this.request('/dashboard/service-plans');
  }
  
  async createServicePlan(data) {
    return this.request('/dashboard/service-plans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async updateServicePlan(id, data) {
    return this.request(`/dashboard/service-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async deleteServicePlan(id) {
    return this.request(`/dashboard/service-plans/${id}`, {
      method: 'DELETE'
    });
  }
}

// Usage
const api = new DashboardAPI();

// Login
await api.login('admin@myisp.com', 'password123');

// Get dashboard
const dashboard = await api.getOverview();

// Get customers
const customers = await api.getCustomers({ page: 1, per_page: 20 });

// Create customer
const newCustomer = await api.createCustomer({
  name: 'John Doe',
  phone: '081234567890',
  address: 'Jl. Merdeka No. 123',
  service_plan_id: 'plan-uuid',
  installation_date: new Date().toISOString(),
  due_date: 15,
  monthly_fee: 300000
});
```

---

## TypeScript Types

```typescript
interface DashboardOverview {
  statistics: {
    total_customers: number;
    active_customers: number;
    suspended_customers: number;
    new_customers_month: number;
    total_revenue: number;
    monthly_revenue: number;
    pending_payments: number;
    overdue_payments: number;
  };
  revenue: {
    this_month: number;
    last_month: number;
    growth: number;
    collected: number;
    pending: number;
    overdue: number;
    collection_rate: number;
  };
}

interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  service_plan: string;
  monthly_fee: number;
  status: 'active' | 'suspended' | 'terminated';
  installation_date: string;
  payment_status: 'paid' | 'pending' | 'overdue';
}

interface Payment {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_code: string;
  amount: number;
  payment_date?: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_method?: 'transfer' | 'cash' | 'e-wallet';
}

interface ServicePlan {
  id: string;
  name: string;
  description: string;
  speed_download: number;
  speed_upload: number;
  price: number;
  is_active: boolean;
  customer_count: number;
}
```

---

## Error Handling

```javascript
const handleAPIError = (error) => {
  if (error.error) {
    switch (error.error.code) {
      case 'AUTH_1003':
        // Token expired, refresh or re-login
        window.location.href = '/login';
        break;
      case 'TENANT_3002':
        alert('Tenant is inactive');
        break;
      case 'VAL_2001':
        // Validation error
        console.error('Validation errors:', error.error.details);
        break;
      default:
        alert(error.error.message);
    }
  }
};

// Usage
try {
  const customers = await api.getCustomers();
  if (!customers.success) {
    handleAPIError(customers);
  }
} catch (err) {
  console.error('Network error:', err);
}
```

---

## React Hook Example

```typescript
import { useState, useEffect } from 'react';

const useDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const api = new DashboardAPI();
        const result = await api.getOverview();
        
        if (result.success) {
          setDashboard(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, []);
  
  return { dashboard, loading, error };
};

// Usage in component
const DashboardPage = () => {
  const { dashboard, loading, error } = useDashboard();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Total Customers: {dashboard.statistics.total_customers}</p>
      <p>Monthly Revenue: Rp {dashboard.revenue.this_month.toLocaleString()}</p>
    </div>
  );
};
```

---

## Common Queries

### Search Customers
```javascript
api.getCustomers({ search: 'john', page: 1 })
```

### Filter by Status
```javascript
api.getCustomers({ status: 'active', page: 1 })
```

### Filter Payments by Month
```javascript
api.getPayments({ month: 12, year: 2025, status: 'pending' })
```

### Sort Customers
```javascript
api.getCustomers({ 
  sort_by: 'name', 
  sort_order: 'asc' 
})
```

---

## Testing Checklist

- [ ] Login successful
- [ ] Dashboard overview loads
- [ ] Customer list loads with pagination
- [ ] Customer search works
- [ ] Customer filter by status works
- [ ] Create customer successful
- [ ] Update customer successful
- [ ] Delete customer successful
- [ ] Payment list loads
- [ ] Record payment successful
- [ ] Service plans load
- [ ] Error handling works
- [ ] Token refresh works

---

## Need Help?

- **Full API Docs:** `docs/DASHBOARD_API.md`
- **Project Structure:** `docs/PROJECT_STRUCTURE.md`
- **Server:** `http://localhost:8089`

---

**Ready to build your frontend!** 🚀
