# Alur Lengkap RT/RW Net SaaS Platform

## Overview Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│              RT/RW Net SaaS Platform                         │
│              (1 Aplikasi untuk Semua ISP)                    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ Tenant A│         │ Tenant B│         │ Tenant C│
   │ISP Mawar│         │ISP Melati│        │ISP Anggrek│
   └─────────┘         └─────────┘         └─────────┘
        │                   │                   │
    ┌───┴────┐          ┌───┴────┐          ┌───┴────┐
    │ Users  │          │ Users  │          │ Users  │
    │Customers│         │Customers│         │Customers│
    │Payments│          │Payments│          │Payments│
    │Devices │          │Devices │          │Devices │
    └────────┘          └────────┘          └────────┘
```

## Alur 1: Setup Platform (Super Admin)

### Step 1: Deploy Aplikasi

```bash
# 1. Setup infrastructure
docker-compose up -d  # PostgreSQL, Redis, RabbitMQ

# 2. Run migrations
psql -f migrations/*.up.sql

# 3. Start aplikasi
go run cmd/api/main.go
```

**Platform siap menerima tenant!** ✅

---

## Alur 2: Onboarding ISP Baru (Tenant)

### Step 1: Create Tenant (Super Admin/Platform Owner)

```powershell
# Platform owner membuat tenant untuk ISP baru
POST /api/v1/tenants
{
  "name": "ISP Jakarta Timur",
  "subdomain": "jakartimur"
}

# Response:
{
  "id": "tenant-123-uuid",
  "name": "ISP Jakarta Timur",
  "subdomain": "jakartimur",
  "is_active": true
}
```

**Tenant created!** ✅

### Step 2: Register Admin ISP

```powershell
# ISP owner register sebagai admin
POST /api/v1/auth/register
{
  "tenant_id": "tenant-123-uuid",
  "email": "admin@jakartimur.com",
  "password": "secure123",
  "name": "Admin Jakarta Timur",
  "role": "admin"
}
```

**Admin ISP created!** ✅

### Step 3: Admin Login

```powershell
POST /api/v1/auth/login
{
  "tenant_id": "tenant-123-uuid",
  "email": "admin@jakartimur.com",
  "password": "secure123"
}

# Response:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "user-uuid",
    "email": "admin@jakartimur.com",
    "role": "admin"
  }
}
```

**Admin logged in!** ✅

---

## Alur 3: Setup Operasional ISP (Admin ISP)

### Step 1: Tambah Tim Operator

```powershell
# Admin menambah operator
POST /api/v1/auth/register
Headers: 
  Authorization: Bearer <admin_token>
  X-Tenant-ID: tenant-123-uuid
Body:
{
  "tenant_id": "tenant-123-uuid",
  "email": "operator1@jakartimur.com",
  "password": "pass123",
  "name": "Operator 1",
  "role": "operator"
}

# Tambah teknisi
POST /api/v1/auth/register
{
  "tenant_id": "tenant-123-uuid",
  "email": "teknisi1@jakartimur.com",
  "password": "pass123",
  "name": "Teknisi 1",
  "role": "technician"
}
```

**Tim created!** ✅

### Step 2: Setup Paket Internet (Service Plans)

```powershell
# Buat paket 10 Mbps
POST /api/v1/service-plans
{
  "name": "Paket 10 Mbps",
  "description": "Internet basic 10 Mbps",
  "speed_download": 10,
  "speed_upload": 10,
  "price": 150000
}

# Buat paket 20 Mbps
POST /api/v1/service-plans
{
  "name": "Paket 20 Mbps",
  "speed_download": 20,
  "speed_upload": 20,
  "price": 250000
}
```

**Service plans created!** ✅

### Step 3: Setup MikroTik Router

```powershell
POST /api/v1/mikrotik/routers
{
  "name": "Router Utama",
  "host": "192.168.1.1",
  "port": 8728,
  "username": "admin",
  "password": "mikrotik123",
  "location": "Server Room"
}
```

**Router configured!** ✅

---

## Alur 4: Operasional Harian (Operator)

### Step 1: Operator Login

```powershell
POST /api/v1/auth/login
{
  "tenant_id": "tenant-123-uuid",
  "email": "operator1@jakartimur.com",
  "password": "pass123"
}
```

### Step 2: Tambah Pelanggan Baru

```powershell
POST /api/v1/customers
Headers:
  Authorization: Bearer <operator_token>
  X-Tenant-ID: tenant-123-uuid
Body:
{
  "name": "Budi Santoso",
  "email": "budi@email.com",
  "phone": "08123456789",
  "address": "Jl. Mawar No. 123",
  "service_plan_id": "plan-10mbps-uuid",
  "due_date": 15,
  "notes": "Pelanggan baru"
}

# System otomatis:
# 1. Generate customer code (CUST001)
# 2. Create PPPoE secret di MikroTik
# 3. Set status = active
```

**Customer created & activated!** ✅

### Step 3: Catat Pembayaran

```powershell
POST /api/v1/payments
{
  "customer_id": "customer-uuid",
  "amount": 150000,
  "payment_method": "transfer",
  "payment_date": "2025-12-26T10:00:00Z",
  "notes": "Pembayaran bulan Januari"
}

# System otomatis:
# 1. Set status = paid
# 2. Calculate next due_date
# 3. Send notification (if configured)
```

**Payment recorded!** ✅

### Step 4: Handle Tiket Support

```powershell
# Customer complain internet lambat
POST /api/v1/tickets
{
  "customer_id": "customer-uuid",
  "title": "Internet lambat",
  "description": "Internet sering putus sejak kemarin",
  "priority": "high"
}

# System otomatis:
# 1. Generate ticket number (TKT202512001)
# 2. Set status = open
# 3. Notify technician
```

**Ticket created!** ✅

---

## Alur 5: Teknisi Handle Tiket

### Step 1: Teknisi Login & Lihat Tiket

```powershell
GET /api/v1/tickets?status=open
Headers:
  Authorization: Bearer <teknisi_token>
  X-Tenant-ID: tenant-123-uuid
```

### Step 2: Update Status Tiket

```powershell
# Assign ke diri sendiri
PUT /api/v1/tickets/{id}/assign
{
  "user_id": "teknisi-uuid"
}

# Update status
PUT /api/v1/tickets/{id}/status
{
  "status": "in_progress"
}

# Setelah selesai
PUT /api/v1/tickets/{id}/status
{
  "status": "resolved"
}
```

**Ticket resolved!** ✅

---

## Alur 6: Monitoring & Analytics (Admin)

### Step 1: Dashboard Overview

```powershell
GET /api/v1/dashboard/stats
Headers:
  Authorization: Bearer <admin_token>
  X-Tenant-ID: tenant-123-uuid

# Response:
{
  "customers": {
    "total": 100,
    "active": 85,
    "suspended": 10,
    "terminated": 5
  },
  "revenue": {
    "current_month": 12750000,
    "previous_month": 11500000,
    "growth_percentage": 10.87
  },
  "tickets": {
    "open": 5,
    "in_progress": 3,
    "resolved": 20
  }
}
```

### Step 2: Monitoring Network

```powershell
GET /api/v1/monitoring/network
# Lihat bandwidth usage, device status, dll
```

### Step 3: Generate Reports

```powershell
POST /api/v1/reports/revenue
{
  "from_date": "2025-01-01",
  "to_date": "2025-01-31"
}

# Export customer data
GET /api/v1/export/customers?format=excel
```

---

## Alur 7: Customer Self-Service (Future)

### Customer Portal

```powershell
# Customer login
POST /api/v1/customer-portal/login
{
  "customer_code": "CUST001",
  "password": "customer123"
}

# Lihat tagihan
GET /api/v1/customer-portal/invoices

# Lihat usage
GET /api/v1/customer-portal/usage

# Request speed boost
POST /api/v1/customer-portal/speed-boost
{
  "boost_plan_id": "plan-20mbps-uuid",
  "duration_days": 7
}
```

---

## Alur 8: Automated Tasks (Background Jobs)

### Cron Jobs yang Berjalan Otomatis:

**1. Check Overdue Payments (Daily)**
```
Setiap hari jam 00:00:
- Cek payment yang melewati due_date
- Update status ke "overdue"
- Send email notification
- Suspend customer (optional)
```

**2. Check Expired Speed Boost (Hourly)**
```
Setiap jam:
- Cek speed boost yang expired
- Revert ke original plan
- Update MikroTik
- Notify customer
```

**3. Collect Monitoring Data (Every 5 minutes)**
```
Setiap 5 menit:
- Fetch data dari MikroTik
- Record bandwidth usage
- Check device status
- Generate alerts if needed
```

**4. Daily Backup (Daily)**
```
Setiap hari jam 02:00:
- Backup database
- Compress & encrypt
- Upload to storage
- Delete old backups (>30 days)
```

---

## Flow Diagram Lengkap

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM SETUP                            │
│  1. Deploy App → 2. Run Migrations → 3. Start Server        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   TENANT ONBOARDING                          │
│  1. Create Tenant → 2. Register Admin → 3. Admin Login      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    ISP SETUP                                 │
│  1. Add Team → 2. Create Plans → 3. Setup MikroTik         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 DAILY OPERATIONS                             │
│  1. Add Customers → 2. Record Payments → 3. Handle Tickets  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              MONITORING & ANALYTICS                          │
│  1. Dashboard → 2. Reports → 3. Network Monitoring          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                AUTOMATED TASKS                               │
│  Background jobs running 24/7                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Isolation per Tenant

```sql
-- Setiap query otomatis filter by tenant_id
SELECT * FROM customers WHERE tenant_id = 'tenant-123-uuid';
SELECT * FROM payments WHERE tenant_id = 'tenant-123-uuid';
SELECT * FROM tickets WHERE tenant_id = 'tenant-123-uuid';

-- Tenant A tidak bisa lihat data Tenant B
-- Tenant B tidak bisa lihat data Tenant C
-- Semua data terisolasi dengan aman
```

---

## Real-Time Features (WebSocket)

```javascript
// Connect to WebSocket
ws://localhost:8089/ws?token=<access_token>

// Events yang di-broadcast:
{
  "event": "customer:created",
  "data": { customer_data }
}

{
  "event": "payment:created",
  "data": { payment_data }
}

{
  "event": "ticket:updated",
  "data": { ticket_data }
}

{
  "event": "device:offline",
  "data": { device_data }
}
```

---

## Keuntungan Model SaaS

### Untuk Platform Owner:
✅ Satu aplikasi untuk banyak ISP
✅ Maintenance lebih mudah
✅ Update sekali untuk semua
✅ Recurring revenue dari subscription
✅ Scalable

### Untuk ISP (Tenant):
✅ No infrastructure cost
✅ Instant setup
✅ Auto updates
✅ Pay as you grow
✅ Professional tools

### Untuk End Customer:
✅ Better service
✅ Self-service portal
✅ Real-time monitoring
✅ Quick support

---

## Summary Alur Lengkap

1. **Platform Setup** → Deploy & configure
2. **Tenant Onboarding** → Create tenant & admin
3. **ISP Setup** → Add team, plans, devices
4. **Daily Operations** → Manage customers, payments, tickets
5. **Monitoring** → Dashboard, reports, analytics
6. **Automation** → Background jobs handle routine tasks
7. **Real-time** → WebSocket for live updates

**Platform siap operasional 24/7!** 🚀

---

Lihat juga:
- `CREATE_TENANT_GUIDE.md` - Cara membuat tenant
- `TEST_REGISTER.md` - Cara register user
- `TESTING_GUIDE.md` - Testing lengkap
- `docs/API_ENDPOINTS.md` - Semua API endpoints
