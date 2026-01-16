# Design Document - ISP Management System

## Overview

The ISP Management System is a comprehensive multi-tenant SaaS platform designed for Internet Service Providers to manage their operations. The system follows Clean Architecture principles with clear separation between domain logic, business rules, and infrastructure concerns. It provides RESTful APIs for managing customers, service plans, payments, network infrastructure, devices, monitoring data, support tickets, speed boost requests, and audit logging.

The system is built using Go with Gin web framework, PostgreSQL database, and follows repository pattern for data access. It integrates with Mikrotik routers via API for automated bandwidth management and supports real-time monitoring data collection.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway / Router                     │
│                  (Gin, Middleware, CORS)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Handlers Layer                       │
│  (Customer, ServicePlan, Payment, Ticket, Device, etc.)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Use Case / Service Layer                  │
│     (Business Logic, Validation, Orchestration)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                          │
│        (Data Access, Query Building, Transactions)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│              (Multi-tenant data with isolation)              │
└─────────────────────────────────────────────────────────────┘

External Integrations:
┌──────────────────┐         ┌──────────────────┐
│  Mikrotik API    │◄────────┤  Integration     │
│  (Bandwidth Mgmt)│         │  Service Layer   │
└──────────────────┘         └──────────────────┘
```

### Layer Responsibilities

1. **HTTP Handlers**: Request/response handling, input validation, authentication/authorization
2. **Use Case Services**: Business logic, orchestration, transaction management
3. **Repository**: Data persistence, query optimization, database operations
4. **Domain Models**: Core business entities and value objects
5. **Integration Services**: External API communication (Mikrotik, monitoring systems)

### Multi-Tenant Architecture

All database tables include implicit tenant_id filtering through middleware context. Every request must include tenant authentication, and all queries automatically filter by tenant_id to ensure data isolation.

## Components and Interfaces

### 1. Customer Management Component

**Entities:**
- Customer: Core customer entity with personal info, service details, network config
- CustomerFilter: Query filter for searching and filtering customers

**Repository Interface:**
```go
type CustomerRepository interface {
    Create(ctx context.Context, tenantID string, customer *Customer) error
    Update(ctx context.Context, tenantID string, customer *Customer) error
    GetByID(ctx context.Context, tenantID string, customerID string) (*Customer, error)
    GetByCustomerCode(ctx context.Context, tenantID string, code string) (*Customer, error)
    List(ctx context.Context, tenantID string, filter CustomerFilter) ([]*Customer, int, error)
    Delete(ctx context.Context, tenantID string, customerID string) error
    UpdateOutstandingBalance(ctx context.Context, tenantID string, customerID string, amount float64) error
    GetCustomersWithDuePayments(ctx context.Context, tenantID string) ([]*Customer, error)
}
```

**Service Interface:**
```go
type CustomerService interface {
    CreateCustomer(ctx context.Context, tenantID string, req *CreateCustomerRequest) (*Customer, error)
    UpdateCustomer(ctx context.Context, tenantID string, customerID string, req *UpdateCustomerRequest) (*Customer, error)
    GetCustomerByID(ctx context.Context, tenantID string, customerID string) (*Customer, error)
    ListCustomers(ctx context.Context, tenantID string, page, perPage int, search, status string) ([]*Customer, int, error)
    DeleteCustomer(ctx context.Context, tenantID string, customerID string) error
    ActivateCustomer(ctx context.Context, tenantID string, customerID string, activationDate time.Time) error
    TerminateCustomer(ctx context.Context, tenantID string, customerID string, terminationDate time.Time, reason string) error
    ChangeServicePlan(ctx context.Context, tenantID string, customerID string, newPlanID string, effectiveDate time.Time, reason string) error
}
```

### 2. Service Plan Management Component

**Entities:**
- ServicePlan: Basic service plan with bandwidth and pricing
- ServicePlanAdvanced: Advanced configuration (burst, FUP, QoS, Mikrotik)
- ServicePlanChangelog: Audit trail for plan changes

**Repository Interface:**
```go
type ServicePlanRepository interface {
    Create(ctx context.Context, tenantID string, plan *ServicePlan) error
    Update(ctx context.Context, tenantID string, plan *ServicePlan) error
    GetByID(ctx context.Context, tenantID string, planID string) (*ServicePlan, error)
    List(ctx context.Context, tenantID string, filter ServicePlanFilter) ([]*ServicePlan, int, error)
    Delete(ctx context.Context, tenantID string, planID string) error
    CreateAdvanced(ctx context.Context, tenantID string, advanced *ServicePlanAdvanced) error
    UpdateAdvanced(ctx context.Context, tenantID string, advanced *ServicePlanAdvanced) error
    GetAdvancedByPlanID(ctx context.Context, tenantID string, planID string) (*ServicePlanAdvanced, error)
    CreateChangelog(ctx context.Context, tenantID string, changelog *ServicePlanChangelog) error
    GetChangelogByPlanID(ctx context.Context, tenantID string, planID string) ([]*ServicePlanChangelog, error)
}
```

**Service Interface:**
```go
type ServicePlanService interface {
    CreateServicePlan(ctx context.Context, tenantID string, req *CreateServicePlanRequest) (*ServicePlan, error)
    UpdateServicePlan(ctx context.Context, tenantID string, planID string, req *UpdateServicePlanRequest) (*ServicePlan, error)
    GetServicePlanByID(ctx context.Context, tenantID string, planID string) (*ServicePlanDetail, error)
    ListServicePlans(ctx context.Context, tenantID string, page, perPage int, search string, isActive *bool) ([]*ServicePlan, int, error)
    DeleteServicePlan(ctx context.Context, tenantID string, planID string) error
    ToggleServicePlanStatus(ctx context.Context, tenantID string, planID string) (*ServicePlan, error)
    CreateAdvancedConfig(ctx context.Context, tenantID string, planID string, req *CreateAdvancedConfigRequest) error
    UpdateAdvancedConfig(ctx context.Context, tenantID string, planID string, req *UpdateAdvancedConfigRequest) error
}
```

### 3. Payment Management Component

**Entities:**
- Payment: Payment record with amount, method, period

**Repository Interface:**
```go
type PaymentRepository interface {
    Create(ctx context.Context, tenantID string, payment *Payment) error
    GetByID(ctx context.Context, tenantID string, paymentID string) (*Payment, error)
    List(ctx context.Context, tenantID string, filter PaymentFilter) ([]*Payment, int, error)
    Delete(ctx context.Context, tenantID string, paymentID string) error
    GetPaymentsByCustomer(ctx context.Context, tenantID string, customerID string) ([]*Payment, error)
    GetTotalRevenueByPeriod(ctx context.Context, tenantID string, startDate, endDate time.Time) (float64, error)
}
```

**Service Interface:**
```go
type PaymentService interface {
    RecordPayment(ctx context.Context, tenantID string, req *RecordPaymentRequest) (*Payment, error)
    GetPaymentByID(ctx context.Context, tenantID string, paymentID string) (*Payment, error)
    ListPayments(ctx context.Context, tenantID string, page, perPage int, customerID, status, dateFrom, dateTo string) ([]*Payment, int, error)
    DeletePayment(ctx context.Context, tenantID string, paymentID string) error
    GenerateReceipt(ctx context.Context, tenantID string, paymentID string) (string, error)
    GetCustomerPaymentHistory(ctx context.Context, tenantID string, customerID string) ([]*Payment, error)
}
```

### 4. Ticket Management Component

**Entities:**
- Ticket: Support ticket with status tracking
- TicketActivity: Activity log for ticket actions

**Repository Interface:**
```go
type TicketRepository interface {
    Create(ctx context.Context, tenantID string, ticket *Ticket) error
    Update(ctx context.Context, tenantID string, ticket *Ticket) error
    GetByID(ctx context.Context, tenantID string, ticketID string) (*Ticket, error)
    GetByTicketNumber(ctx context.Context, tenantID string, ticketNumber string) (*Ticket, error)
    List(ctx context.Context, tenantID string, filter TicketFilter) ([]*Ticket, int, error)
    Delete(ctx context.Context, tenantID string, ticketID string) error
    CreateActivity(ctx context.Context, tenantID string, activity *TicketActivity) error
    GetActivitiesByTicketID(ctx context.Context, tenantID string, ticketID string) ([]*TicketActivity, error)
}
```

**Service Interface:**
```go
type TicketService interface {
    CreateTicket(ctx context.Context, tenantID string, req *CreateTicketRequest) (*Ticket, error)
    UpdateTicket(ctx context.Context, tenantID string, ticketID string, req *UpdateTicketRequest) (*Ticket, error)
    GetTicketByID(ctx context.Context, tenantID string, ticketID string) (*TicketDetail, error)
    ListTickets(ctx context.Context, tenantID string, page, perPage int, filter TicketFilter) ([]*Ticket, int, error)
    AssignTicket(ctx context.Context, tenantID string, ticketID string, assignedTo string) error
    ResolveTicket(ctx context.Context, tenantID string, ticketID string, resolutionNotes string) error
    CloseTicket(ctx context.Context, tenantID string, ticketID string) error
}
```

### 5. Network Infrastructure Component

**Entities:**
- OLT: Optical Line Terminal
- ODC: Optical Distribution Cabinet
- ODP: Optical Distribution Point

**Repository Interface:**
```go
type InfrastructureRepository interface {
    // OLT operations
    CreateOLT(ctx context.Context, tenantID string, olt *OLT) error
    UpdateOLT(ctx context.Context, tenantID string, olt *OLT) error
    GetOLTByID(ctx context.Context, tenantID string, oltID string) (*OLT, error)
    ListOLTs(ctx context.Context, tenantID string, isActive *bool) ([]*OLT, error)
    DeleteOLT(ctx context.Context, tenantID string, oltID string) error
    
    // ODC operations
    CreateODC(ctx context.Context, tenantID string, odc *ODC) error
    UpdateODC(ctx context.Context, tenantID string, odc *ODC) error
    GetODCByID(ctx context.Context, tenantID string, odcID string) (*ODC, error)
    ListODCs(ctx context.Context, tenantID string, oltID string, isActive *bool) ([]*ODC, error)
    DeleteODC(ctx context.Context, tenantID string, odcID string) error
    
    // ODP operations
    CreateODP(ctx context.Context, tenantID string, odp *ODP) error
    UpdateODP(ctx context.Context, tenantID string, odp *ODP) error
    GetODPByID(ctx context.Context, tenantID string, odpID string) (*ODP, error)
    ListODPs(ctx context.Context, tenantID string, odcID string, isActive *bool) ([]*ODP, error)
    DeleteODP(ctx context.Context, tenantID string, odpID string) error
}
```

### 6. Device Management Component

**Entities:**
- Device: Network device with Mikrotik integration support

**Repository Interface:**
```go
type DeviceRepository interface {
    Create(ctx context.Context, tenantID string, device *Device) error
    Update(ctx context.Context, tenantID string, device *Device) error
    GetByID(ctx context.Context, tenantID string, deviceID string) (*Device, error)
    GetBySerialNumber(ctx context.Context, tenantID string, serialNumber string) (*Device, error)
    List(ctx context.Context, tenantID string, filter DeviceFilter) ([]*Device, int, error)
    Delete(ctx context.Context, tenantID string, deviceID string) error
    UpdateConnectionStatus(ctx context.Context, tenantID string, deviceID string, status string) error
    GetMikrotikDevices(ctx context.Context, tenantID string) ([]*Device, error)
}
```

**Service Interface:**
```go
type DeviceService interface {
    CreateDevice(ctx context.Context, tenantID string, req *CreateDeviceRequest) (*Device, error)
    UpdateDevice(ctx context.Context, tenantID string, deviceID string, req *UpdateDeviceRequest) (*Device, error)
    GetDeviceByID(ctx context.Context, tenantID string, deviceID string) (*Device, error)
    ListDevices(ctx context.Context, tenantID string, page, perPage int, filter DeviceFilter) ([]*Device, int, error)
    DeleteDevice(ctx context.Context, tenantID string, deviceID string) error
    TestMikrotikConnection(ctx context.Context, tenantID string, deviceID string) (bool, error)
    SyncMikrotikQueues(ctx context.Context, tenantID string, deviceID string) error
}
```

### 7. Monitoring Component

**Entities:**
- MonitoringData: Time-series monitoring metrics

**Repository Interface:**
```go
type MonitoringRepository interface {
    Create(ctx context.Context, tenantID string, data *MonitoringData) error
    GetByCustomerID(ctx context.Context, tenantID string, customerID string, startDate, endDate time.Time) ([]*MonitoringData, error)
    GetLatestByCustomerID(ctx context.Context, tenantID string, customerID string) (*MonitoringData, error)
    List(ctx context.Context, tenantID string, filter MonitoringFilter) ([]*MonitoringData, int, error)
    DeleteOldData(ctx context.Context, tenantID string, beforeDate time.Time) error
}
```

**Service Interface:**
```go
type MonitoringService interface {
    RecordMonitoringData(ctx context.Context, tenantID string, req *RecordMonitoringRequest) error
    GetCustomerMonitoring(ctx context.Context, tenantID string, customerID string, startDate, endDate time.Time) ([]*MonitoringData, error)
    GetCustomerCurrentStatus(ctx context.Context, tenantID string, customerID string) (*MonitoringData, error)
    ListMonitoringData(ctx context.Context, tenantID string, page, perPage int, filter MonitoringFilter) ([]*MonitoringData, int, error)
}
```

### 8. Speed Boost Component

**Entities:**
- SpeedBoostRequest: Customer request for temporary speed increase
- SpeedBoostHistory: Historical record of active boosts

**Repository Interface:**
```go
type SpeedBoostRepository interface {
    CreateRequest(ctx context.Context, tenantID string, request *SpeedBoostRequest) error
    UpdateRequest(ctx context.Context, tenantID string, request *SpeedBoostRequest) error
    GetRequestByID(ctx context.Context, tenantID string, requestID string) (*SpeedBoostRequest, error)
    ListRequests(ctx context.Context, tenantID string, filter SpeedBoostFilter) ([]*SpeedBoostRequest, int, error)
    CreateHistory(ctx context.Context, tenantID string, history *SpeedBoostHistory) error
    GetActiveBoostByCustomerID(ctx context.Context, tenantID string, customerID string) (*SpeedBoostHistory, error)
    DeactivateExpiredBoosts(ctx context.Context, tenantID string) error
}
```

**Service Interface:**
```go
type SpeedBoostService interface {
    CreateRequest(ctx context.Context, tenantID string, req *CreateSpeedBoostRequest) (*SpeedBoostRequest, error)
    ApproveRequest(ctx context.Context, tenantID string, requestID string, approvedBy string) error
    RejectRequest(ctx context.Context, tenantID string, requestID string, rejectedBy string, reason string) error
    ActivateBoost(ctx context.Context, tenantID string, requestID string) error
    DeactivateBoost(ctx context.Context, tenantID string, customerID string) error
    ListRequests(ctx context.Context, tenantID string, page, perPage int, filter SpeedBoostFilter) ([]*SpeedBoostRequest, int, error)
    GetActiveBoost(ctx context.Context, tenantID string, customerID string) (*SpeedBoostHistory, error)
}
```

### 9. Audit Logging Component

**Entities:**
- AuditLog: System activity audit trail

**Repository Interface:**
```go
type AuditLogRepository interface {
    Create(ctx context.Context, tenantID string, log *AuditLog) error
    GetByID(ctx context.Context, tenantID string, logID string) (*AuditLog, error)
    List(ctx context.Context, tenantID string, filter AuditLogFilter) ([]*AuditLog, int, error)
    GetByCustomerID(ctx context.Context, tenantID string, customerID string) ([]*AuditLog, error)
}
```

**Service Interface:**
```go
type AuditLogService interface {
    LogAction(ctx context.Context, tenantID string, req *LogActionRequest) error
    GetAuditLogs(ctx context.Context, tenantID string, page, perPage int, filter AuditLogFilter) ([]*AuditLog, int, error)
    GetCustomerAuditLogs(ctx context.Context, tenantID string, customerID string) ([]*AuditLog, error)
}
```

### 10. Mikrotik Integration Service

**Service Interface:**
```go
type MikrotikService interface {
    Connect(ctx context.Context, host string, port string, username string, password string) error
    Disconnect() error
    CreateQueue(ctx context.Context, queueName string, targetIP string, maxUpload int, maxDownload int) error
    UpdateQueue(ctx context.Context, queueName string, maxUpload int, maxDownload int) error
    DeleteQueue(ctx context.Context, queueName string) error
    GetQueueList(ctx context.Context) ([]MikrotikQueue, error)
    TestConnection(ctx context.Context) (bool, error)
}
```

## Data Models

### Customer Model
```go
type Customer struct {
    ID                  string
    TenantID            string
    CustomerCode        string
    FullName            string
    NIK                 string
    Phone               string
    Email               string
    PhotoURL            string
    Address             string
    RT                  string
    RW                  string
    Kelurahan           string
    Kecamatan           string
    City                string
    PostalCode          string
    Latitude            float64
    Longitude           float64
    HousePhotoURL       string
    Status              string // pending_activation, active, suspended, terminated
    ServicePlanID       string
    ActivationDate      time.Time
    TerminationDate     time.Time
    MonthlyFee          float64
    DueDate             time.Time
    LastPaymentDate     time.Time
    OutstandingBalance  float64
    ODPID               string
    ODCID               string
    OLTID               string
    OLTPort             string
    ONUSerial           string
    PPPoEUsername       string
    PPPoEPassword       string
    CreatedAt           time.Time
    UpdatedAt           time.Time
}
```

### ServicePlan Model
```go
type ServicePlan struct {
    ID                string
    TenantID          string
    Name              string
    Description       string
    BandwidthDownload int
    BandwidthUpload   int
    MonthlyPrice      float64
    IsActive          bool
    CreatedAt         time.Time
}

type ServicePlanAdvanced struct {
    ID                      string
    ServicePlanID           string
    BurstRateDownload       int
    BurstRateUpload         int
    BurstThreshold          int
    BurstTime               int
    IsUnlimited             bool
    MonthlyQuotaGB          int
    FUPThresholdGB          int
    SpeedAfterFUPDownload   int
    SpeedAfterFUPUpload     int
    DurationDays            int
    BillingCycle            string
    GracePeriodDays         int
    ConnectionMode          string
    VLANID                  int
    IPPool                  string
    MaxDevices              int
    AreaCoverage            []string
    TimeRestrictions        json.RawMessage
    QoSPriority             int
    QueueType               string
    TrafficShaping          json.RawMessage
    Addons                  json.RawMessage
    MikrotikQueueConfig     json.RawMessage
    AutoApplyToMikrotik     bool
    QueueNameTemplate       string
    CreatedAt               time.Time
    UpdatedAt               time.Time
}
```

### Payment Model
```go
type Payment struct {
    ID              string
    TenantID        string
    CustomerID      string
    PaymentDate     time.Time
    Amount          float64
    PaymentMethod   string // cash, transfer, e-wallet, credit_card
    PaymentFor      string // monthly_subscription, installation, speed_boost, other
    PeriodMonth     int
    PeriodYear      int
    ReferenceNumber string
    Notes           string
    ReceiptURL      string
    ProcessedBy     string
    CreatedAt       time.Time
}
```

### Ticket Model
```go
type Ticket struct {
    ID              string
    TenantID        string
    TicketNumber    string
    CustomerID      string
    Title           string
    Description     string
    Category        string // technical, billing, complaint, request
    Priority        string // low, medium, high, urgent
    Status          string // open, in_progress, resolved, closed
    AssignedTo      string
    ResolvedAt      time.Time
    ResolutionNotes string
    CreatedAt       time.Time
    UpdatedAt       time.Time
}

type TicketActivity struct {
    ID           string
    TicketID     string
    ActivityType string // created, assigned, status_changed, commented, resolved
    Description  string
    PerformedBy  string
    CreatedAt    time.Time
}
```

### Device Model
```go
type Device struct {
    ID                      string
    TenantID                string
    DeviceName              string
    DeviceType              string // router, onu, switch, access_point
    SerialNumber            string
    MACAddress              string
    Brand                   string
    Model                   string
    FirmwareVersion         string
    IPAddress               string
    SubnetMask              string
    Gateway                 string
    Location                string
    Latitude                float64
    Longitude               float64
    Status                  string // online, offline, maintenance
    LastSeen                time.Time
    CustomerID              string
    ParentDeviceID          string
    InstallationDate        time.Time
    WarrantyUntil           time.Time
    PurchasePrice           int
    Notes                   string
    MikrotikUsername        string
    MikrotikPasswordEncrypted string
    MikrotikPort            string
    MikrotikAPIEnabled      bool
    IsDefaultMikrotik       bool
    ConnectionStatus        string
    LastConnectedAt         time.Time
    CreatedAt               time.Time
    UpdatedAt               time.Time
}
```

### MonitoringData Model
```go
type MonitoringData struct {
    ID             string
    TenantID       string
    CustomerID     string
    Timestamp      time.Time
    DownloadSpeed  float64
    UploadSpeed    float64
    DownloadUsage  int64
    UploadUsage    int64
    ONUStatus      string
    SignalStrength float64
    Temperature    float64
    Uptime         int64
    IsOnline       bool
    LastSeen       time.Time
    CreatedAt      time.Time
}
```

### SpeedBoost Models
```go
type SpeedBoostRequest struct {
    ID                    string
    TenantID              string
    CustomerID            string
    RequestedSpeedDownload int
    RequestedSpeedUpload   int
    DurationHours         int
    PricePerHour          int
    TotalPrice            int
    Status                string // pending, approved, rejected, activated, expired
    RequestedAt           time.Time
    ApprovedAt            time.Time
    RejectedAt            time.Time
    ActivatedAt           time.Time
    ExpiresAt             time.Time
    ApprovedBy            string
    RejectedBy            string
    RejectionReason       string
    CustomerNotes         string
    AdminNotes            string
    CreatedAt             time.Time
    UpdatedAt             time.Time
}

type SpeedBoostHistory struct {
    ID                    string
    TenantID              string
    CustomerID            string
    RequestID             string
    OriginalSpeedDownload int
    OriginalSpeedUpload   int
    BoostedSpeedDownload  int
    BoostedSpeedUpload    int
    StartedAt             time.Time
    ExpiresAt             time.Time
    EndedAt               time.Time
    IsActive              bool
    CreatedAt             time.Time
}
```

### AuditLog Model
```go
type AuditLog struct {
    ID          string
    TenantID    string
    CustomerID  string
    Action      string
    Category    string // customer, payment, ticket, service_plan, device, system
    Description string
    OldValue    string
    NewValue    string
    PerformedBy string
    IPAddress   string
    CreatedAt   time.Time
}
```

### Infrastructure Models
```go
type OLT struct {
    ID              string
    TenantID        string
    Name            string
    IPAddress       string
    SNMPCommunity   string
    TelnetUsername  string
    TelnetPassword  string
    Location        string
    Vendor          string
    IsActive        bool
    CreatedAt       time.Time
}

type ODC struct {
    ID        string
    TenantID  string
    Name      string
    OLTID     string
    Location  string
    Latitude  float64
    Longitude float64
    Capacity  int
    IsActive  bool
    CreatedAt time.Time
}

type ODP struct {
    ID        string
    TenantID  string
    Name      string
    ODCID     string
    Location  string
    Latitude  float64
    Longitude float64
    Capacity  int
    IsActive  bool
    CreatedAt time.Time
}
```

## Error Handling

### Error Types

1. **Validation Errors**: Invalid input data, format errors
2. **Not Found Errors**: Resource doesn't exist
3. **Conflict Errors**: Duplicate data, constraint violations
4. **Authorization Errors**: Insufficient permissions, tenant mismatch
5. **External Service Errors**: Mikrotik API failures, network errors
6. **Database Errors**: Connection issues, transaction failures

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### Error Handling Strategy

1. All errors are wrapped with context using `fmt.Errorf`
2. Repository layer returns domain-specific errors
3. Service layer translates errors to business errors
4. Handler layer converts errors to HTTP responses
5. All errors are logged with appropriate severity
6. Sensitive information is never exposed in error messages
7. Transaction rollback on any error in multi-step operations

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and methods in isolation:

- **Repository Tests**: Mock database connections, test query building and data mapping
- **Service Tests**: Mock repository dependencies, test business logic and validation
- **Handler Tests**: Mock service dependencies, test request/response handling
- **Utility Tests**: Test helper functions, formatters, validators

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using a Go PBT library (gopter or rapid):

- **Test Configuration**: Each property test runs minimum 100 iterations
- **Test Tagging**: Each PBT test includes comment: `// Feature: isp-management-system, Property {number}: {property_text}`
- **Generator Strategy**: Smart generators that constrain to valid input space

Each correctness property from the design will be implemented as a single property-based test.

### Integration Testing

Integration tests will verify component interactions:

- Database integration tests with test containers
- API endpoint tests with real HTTP requests
- Mikrotik integration tests with mock API server
- Multi-tenant isolation tests

### Test Coverage Goals

- Unit test coverage: >80%
- Critical business logic: 100%
- Property-based tests for all correctness properties
- Integration tests for all API endpoints



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Customer Management Properties

**Property 1: Customer code uniqueness**
*For any* two customers created in the system, their customer codes must be unique within the same tenant.
**Validates: Requirements 1.1**

**Property 2: Customer update timestamp consistency**
*For any* customer update operation, the updated_at timestamp must be greater than or equal to the created_at timestamp.
**Validates: Requirements 1.2**

**Property 3: Customer pagination correctness**
*For any* customer list query with pagination parameters, the total count of items across all pages must equal the total number of customers matching the filter criteria.
**Validates: Requirements 1.3**

**Property 4: Customer detail completeness**
*For any* customer retrieved by ID, all required fields (id, customer_code, full_name, phone, address, status) must be non-empty in the response.
**Validates: Requirements 1.4**

**Property 5: Customer deletion referential integrity**
*For any* customer deletion, all related records (payments, tickets, mo