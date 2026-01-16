# 📊 Dashboard API Documentation

API untuk mengelola dashboard RT RW Net - customer management, billing pelanggan, service plans, dan statistics.

---

## Base URL

```
Development: http://localhost:8089/api/v1
Production: https://api.rtrwnet.com/api/v1
```

## Authentication

Semua endpoint dashboard memerlukan authentication:

```http
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
```

---

## 📈 Dashboard Overview

### Get Dashboard Overview

```http
GET /dashboard/overview
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    "statistics": {
      "total_customers": 150,
      "active_customers": 140,
      "suspended_customers": 10,
      "new_customers_month": 5,
      "total_revenue": 45000000,
      "monthly_revenue": 42000000,
      "pending_payments": 15,
      "overdue_payments": 5
    },
    "revenue": {
      "this_month": 42000000,
      "last_month": 40000000,
      "growth": 5.0,
      "collected": 38000000,
      "pending": 3000000,
      "overdue": 1000000,
      "collection_rate": 90.48
    },
    "recent": {
      "recent_payments": [
        {
          "id": "payment-uuid",
          "customer_name": "John Doe",
          "customer_code": "CUST001",
          "amount": 300000,
          "payment_date": "2025-12-27T10:00:00Z",
          "payment_method": "transfer"
        }
      ],
      "recent_customers": [
        {
          "id": "customer-uuid",
          "name": "Jane Smith",
          "customer_code": "CUST150",
          "service_plan": "Paket 10 Mbps",
          "installation_date": "2025-12-25T00:00:00Z",
          "status": "active"
        }
      ],
      "alerts": [
        {
          "type": "overdue",
          "message": "Overdue payments need attention",
          "count": 5,
          "severity": "error",
          "date": "2025-12-27T10:00:00Z"
        }
      ]
    },
    "charts": {
      "revenue_chart": [],
      "customer_chart": [],
      "payment_status": {}
    }
  }
}
```

---

## 👥 Customer Management

### List Customers

```http
GET /dashboard/customers?page=1&per_page=20&status=active&search=john
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by name, code, phone
- `status` (optional): Filter by status (active, suspended, terminated)
- `service_plan_id` (optional): Filter by service plan
- `sort_by` (optional): Sort field (name, customer_code, installation_date)
- `sort_order` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": {
    "customers": [
      {
        "id": "customer-uuid",
        "customer_code": "CUST001",
        "name": "John Doe",
        "phone": "081234567890",
        "address": "Jl. Merdeka No. 123",
        "service_plan": "Paket 10 Mbps",
        "monthly_fee": 300000,
        "status": "active",
        "installation_date": "2025-01-15T00:00:00Z",
        "last_payment": "2025-12-01T00:00:00Z",
        "payment_status": "paid"
      }
    ],
    "total": 150,
    "page": 1,
    "per_page": 20
  }
}
```

### Get Customer Detail

```http
GET /dashboard/customers/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Customer detail retrieved successfully",
  "data": {
    "id": "customer-uuid",
    "customer_code": "CUST001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "address": "Jl. Merdeka No. 123",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "service_plan": {
      "id": "plan-uuid",
      "name": "Paket 10 Mbps",
      "speed_download": 10,
      "speed_upload": 5,
      "price": 300000
    },
    "status": "active",
    "installation_date": "2025-01-15T00:00:00Z",
    "due_date": 15,
    "monthly_fee": 300000,
    "notes": "Customer notes here",
    "payment_history": [
      {
        "id": "payment-uuid",
        "amount": 300000,
        "payment_date": "2025-12-01T00:00:00Z",
        "due_date": "2025-12-15T00:00:00Z",
        "status": "paid",
        "payment_method": "transfer",
        "notes": ""
      }
    ],
    "statistics": {
      "total_payments": 12,
      "paid_payments": 11,
      "pending_payments": 1,
      "overdue_payments": 0,
      "total_paid": 3300000,
      "total_pending": 300000,
      "on_time_rate": 91.67
    }
  }
}
```

### Create Customer

```http
POST /dashboard/customers
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "address": "Jl. Merdeka No. 123",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "service_plan_id": "plan-uuid",
  "installation_date": "2025-12-27T00:00:00Z",
  "due_date": 15,
  "monthly_fee": 300000,
  "notes": "Customer notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "customer-uuid",
    "customer_code": "CUST151",
    ...
  }
}
```

### Update Customer

```http
PUT /dashboard/customers/:id
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john@example.com",
  "phone": "081234567890",
  "address": "Jl. Merdeka No. 123",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "service_plan_id": "plan-uuid",
  "due_date": 15,
  "monthly_fee": 300000,
  "status": "active",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer updated successfully"
}
```

### Delete Customer

```http
DELETE /dashboard/customers/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

---

## 💰 Payment Management

### List Payments

```http
GET /dashboard/payments?page=1&per_page=20&status=pending&month=12&year=2025
```

**Query Parameters:**
- `page` (optional): Page number
- `per_page` (optional): Items per page
- `status` (optional): Filter by status (pending, paid, overdue)
- `customer_id` (optional): Filter by customer
- `month` (optional): Filter by month (1-12)
- `year` (optional): Filter by year
- `sort_by` (optional): Sort field (due_date, payment_date, amount)
- `sort_order` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": {
    "payments": [
      {
        "id": "payment-uuid",
        "customer_id": "customer-uuid",
        "customer_name": "John Doe",
        "customer_code": "CUST001",
        "amount": 300000,
        "payment_date": "2025-12-01T00:00:00Z",
        "due_date": "2025-12-15T00:00:00Z",
        "status": "paid",
        "payment_method": "transfer",
        "days_overdue": 0
      }
    ],
    "total": 150,
    "page": 1,
    "per_page": 20
  }
}
```

### Record Payment

```http
POST /dashboard/payments
```

**Request Body:**
```json
{
  "customer_id": "customer-uuid",
  "amount": 300000,
  "payment_date": "2025-12-27T10:00:00Z",
  "payment_method": "transfer",
  "notes": "Payment via BCA"
}
```

**Payment Methods:**
- `transfer` - Bank transfer
- `cash` - Cash payment
- `e-wallet` - E-wallet (GoPay, OVO, etc)

**Response:**
```json
{
  "success": true,
  "message": "Payment recorded successfully"
}
```

---

## 📦 Service Plan Management

### List Service Plans

```http
GET /dashboard/service-plans
```

**Response:**
```json
{
  "success": true,
  "message": "Service plans retrieved successfully",
  "data": {
    "plans": [
      {
        "id": "plan-uuid",
        "name": "Paket 10 Mbps",
        "description": "Internet cepat untuk keluarga",
        "speed_download": 10,
        "speed_upload": 5,
        "price": 300000,
        "is_active": true,
        "customer_count": 45
      }
    ],
    "total": 5
  }
}
```

### Create Service Plan

```http
POST /dashboard/service-plans
```

**Request Body:**
```json
{
  "name": "Paket 20 Mbps",
  "description": "Internet super cepat",
  "speed_download": 20,
  "speed_upload": 10,
  "price": 500000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service plan created successfully",
  "data": {
    "id": "plan-uuid",
    "name": "Paket 20 Mbps",
    ...
  }
}
```

### Update Service Plan

```http
PUT /dashboard/service-plans/:id
```

**Request Body:**
```json
{
  "name": "Paket 20 Mbps Updated",
  "description": "Internet super cepat",
  "speed_download": 20,
  "speed_upload": 10,
  "price": 500000,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service plan updated successfully"
}
```

### Delete Service Plan

```http
DELETE /dashboard/service-plans/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Service plan deleted successfully"
}
```

**Error (if plan has customers):**
```json
{
  "success": false,
  "error": {
    "code": "PLAN_HAS_CUSTOMERS",
    "message": "Cannot delete plan with active customers"
  }
}
```

---

## 📊 Complete Example: Dashboard Flow

### 1. Login & Get Token

```javascript
const loginResponse = await fetch('/api/v1/auth/simple-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin@myisp.com',
    password: 'password123'
  })
});

const { data } = await loginResponse.json();
const token = data.access_token;
const tenantId = data.user.tenant_id;
```

### 2. Get Dashboard Overview

```javascript
const overviewResponse = await fetch('/api/v1/dashboard/overview', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId
  }
});

const overview = await overviewResponse.json();
console.log('Total Customers:', overview.data.statistics.total_customers);
console.log('Monthly Revenue:', overview.data.revenue.this_month);
```

### 3. List Customers

```javascript
const customersResponse = await fetch('/api/v1/dashboard/customers?page=1&per_page=20&status=active', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId
  }
});

const customers = await customersResponse.json();
console.log('Customers:', customers.data.customers);
```

### 4. Create New Customer

```javascript
const newCustomer = {
  name: 'John Doe',
  phone: '081234567890',
  address: 'Jl. Merdeka No. 123',
  service_plan_id: 'plan-uuid',
  installation_date: '2025-12-27T00:00:00Z',
  due_date: 15,
  monthly_fee: 300000
};

const createResponse = await fetch('/api/v1/dashboard/customers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newCustomer)
});

const created = await createResponse.json();
console.log('Customer Code:', created.data.customer_code);
```

### 5. Record Payment

```javascript
const payment = {
  customer_id: 'customer-uuid',
  amount: 300000,
  payment_date: new Date().toISOString(),
  payment_method: 'transfer',
  notes: 'Payment via BCA'
};

const paymentResponse = await fetch('/api/v1/dashboard/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payment)
});

const result = await paymentResponse.json();
console.log('Payment recorded:', result.message);
```

---

## 🎨 TypeScript Types

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
  recent: {
    recent_payments: RecentPayment[];
    recent_customers: RecentCustomer[];
    alerts: Alert[];
  };
  charts: {
    revenue_chart: ChartData[];
    customer_chart: ChartData[];
    payment_status: ChartData;
  };
}

interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  service_plan: ServicePlan;
  status: 'active' | 'suspended' | 'terminated';
  installation_date: string;
  due_date: number;
  monthly_fee: number;
  notes?: string;
  payment_history?: Payment[];
  statistics?: CustomerStatistics;
}

interface Payment {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_code?: string;
  amount: number;
  payment_date?: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_method?: 'transfer' | 'cash' | 'e-wallet';
  notes?: string;
  days_overdue?: number;
}

interface ServicePlan {
  id: string;
  name: string;
  description?: string;
  speed_download: number;
  speed_upload: number;
  price: number;
  is_active: boolean;
  customer_count?: number;
}
```

---

## 🔒 Error Codes

### Customer Errors
- `CUST_5001`: Customer not found
- `CUST_5002`: Customer code already exists
- `CUST_5003`: Invalid customer status

### Payment Errors
- `PAY_6001`: Payment not found
- `PAY_6002`: Invalid payment amount
- `PAY_6003`: Payment already recorded

### Service Plan Errors
- `PLAN_7001`: Service plan not found
- `PLAN_7002`: Plan has active customers (cannot delete)
- `PLAN_7003`: Invalid plan configuration

---

## 📝 Notes

### Customer Code Generation
- Format: `CUST001`, `CUST002`, etc.
- Auto-generated saat create customer
- Unique per tenant

### Payment Status
- `pending`: Belum dibayar
- `paid`: Sudah dibayar
- `overdue`: Terlambat bayar (melewati due date)

### Customer Status
- `active`: Aktif, internet berjalan
- `suspended`: Ditangguhkan (biasanya karena belum bayar)
- `terminated`: Berhenti berlangganan

### Due Date
- Tanggal jatuh tempo pembayaran (1-31)
- Contoh: 15 = setiap tanggal 15

---

## 🚀 Quick Start

1. **Login** untuk mendapatkan token
2. **Get Overview** untuk melihat statistik dashboard
3. **List Customers** untuk melihat daftar pelanggan
4. **Create Customer** untuk menambah pelanggan baru
5. **Record Payment** untuk mencatat pembayaran

---

## 📚 Related Documentation

- [Frontend API Documentation](FRONTEND_API_DOCUMENTATION_V2.md)
- [API Response Standard](API_RESPONSE_STANDARD.md)
- [Authentication Guide](../TEST_SIMPLE_LOGIN.md)

---

**Status**: ✅ Ready to use

**Version**: 1.0.0

**Last Updated**: December 27, 2025
