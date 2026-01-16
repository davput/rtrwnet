# Design Document

## Overview

RT/RW Net SaaS Backend adalah platform multi-tenant untuk manajemen ISP yang dibangun dengan Go (Golang), menggunakan Gin framework untuk REST API, GORM untuk ORM, PostgreSQL sebagai database utama, Redis untuk caching dan session management, dan RabbitMQ untuk message queue. Sistem ini dirancang untuk scalability, security, dan maintainability dengan arsitektur clean architecture.

### Technology Stack

- **Language**: Go 1.21+
- **Web Framework**: Gin
- **ORM**: GORM
- **Database**: PostgreSQL 14+ (primary), MySQL 8+ (alternative)
- **Cache**: Redis 7+
- **Message Queue**: RabbitMQ 3.12+
- **Authentication**: JWT (golang-jwt/jwt)
- **WebSocket**: gorilla/websocket
- **Email**: gomail
- **Documentation**: Swagger (swaggo/swag)
- **Testing**: testify, gomock
- **Migration**: golang-migrate

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway / Nginx                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   RT/RW Net SaaS Backend  │   │   RT/RW Net SaaS Backend  │
│      (Instance 1)         │   │      (Instance 2)         │
└───────────────────────────┘   └───────────────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
        ┌─────────────────────────────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────┐                    ┌──────────────────┐
│   PostgreSQL     │                    │      Redis       │
│   (Primary DB)   │                    │   (Cache/Session)│
└──────────────────┘                    └──────────────────┘
        │
        ▼
┌──────────────────┐
│   PostgreSQL     │
│   (Replica)      │
└──────────────────┘

        ┌─────────────────────────────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────┐                    ┌──────────────────┐
│    RabbitMQ      │                    │  MikroTik API    │
│  (Message Queue) │                    │   Integration    │
└──────────────────┘                    └──────────────────┘
```

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (HTTP Handlers, WebSocket Handlers, Middleware)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Use Case Layer                          │
│  (Business Logic, Service Orchestration)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  (Entities, Domain Logic, Interfaces)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  (Database, External APIs, Message Queue, Cache)            │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Multi-Tenant Middleware

**Purpose**: Identify tenant context and enforce data isolation

```go
type TenantMiddleware interface {
    ExtractTenant(c *gin.Context) (*Tenant, error)
    InjectTenantContext(c *gin.Context, tenant *Tenant)
}

type TenantResolver interface {
    ResolveTenantBySubdomain(subdomain string) (*Tenant, error)
    ResolveTenantByHeader(tenantID string) (*Tenant, error)
    ResolveTenantByToken(token string) (*Tenant, error)
}
```

**Implementation Strategy**:
- Extract tenant from subdomain (e.g., `tenant1.rtrwnet.com`)
- Extract tenant from custom header (`X-Tenant-ID`)
- Extract tenant from JWT token claims
- Store tenant context in Gin context for downstream use

### 2. Authentication Service

**Purpose**: Handle user authentication and JWT token management

```go
type AuthService interface {
    Login(email, password string) (*AuthResponse, error)
    Logout(refreshToken string) error
    RefreshToken(refreshToken string) (*AuthResponse, error)
    ValidateToken(token string) (*TokenClaims, error)
    GenerateTokenPair(user *User) (*TokenPair, error)
}

type AuthResponse struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    ExpiresIn    int64  `json:"expires_in"`
    User         *User  `json:"user"`
}

type TokenClaims struct {
    UserID   string `json:"user_id"`
    TenantID string `json:"tenant_id"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}
```

### 3. Customer Service

**Purpose**: Manage customer lifecycle and data

```go
type CustomerService interface {
    Create(ctx context.Context, req *CreateCustomerRequest) (*Customer, error)
    GetByID(ctx context.Context, id string) (*Customer, error)
    List(ctx context.Context, filter *CustomerFilter) (*PaginatedCustomers, error)
    Update(ctx context.Context, id string, req *UpdateCustomerRequest) (*Customer, error)
    Delete(ctx context.Context, id string) error
    GetStatistics(ctx context.Context) (*CustomerStatistics, error)
    GenerateCustomerCode(ctx context.Context) (string, error)
}

type CustomerRepository interface {
    Create(ctx context.Context, customer *Customer) error
    FindByID(ctx context.Context, id string) (*Customer, error)
    FindAll(ctx context.Context, filter *CustomerFilter) ([]*Customer, int64, error)
    Update(ctx context.Context, customer *Customer) error
    SoftDelete(ctx context.Context, id string) error
    CountByStatus(ctx context.Context) (*CustomerStatistics, error)
}
```

### 4. Service Plan Service

**Purpose**: Manage internet service plans and pricing

```go
type ServicePlanService interface {
    Create(ctx context.Context, req *CreateServicePlanRequest) (*ServicePlan, error)
    GetByID(ctx context.Context, id string) (*ServicePlan, error)
    List(ctx context.Context, activeOnly bool) ([]*ServicePlan, error)
    Update(ctx context.Context, id string, req *UpdateServicePlanRequest) (*ServicePlan, error)
    Delete(ctx context.Context, id string) error
    GetAdvancedSettings(ctx context.Context, planID string) (*ServicePlanAdvancedSettings, error)
    UpdateAdvancedSettings(ctx context.Context, planID string, req *UpdateAdvancedSettingsRequest) error
}
```

### 5. Payment Service

**Purpose**: Handle payment tracking and billing

```go
type PaymentService interface {
    Create(ctx context.Context, req *CreatePaymentRequest) (*Payment, error)
    GetByID(ctx context.Context, id string) (*Payment, error)
    List(ctx context.Context, filter *PaymentFilter) ([]*Payment, error)
    UpdateStatus(ctx context.Context, id string, status PaymentStatus) error
    CheckOverduePayments(ctx context.Context) error
    GenerateInvoice(ctx context.Context, customerID string, month time.Time) (*Invoice, error)
}
```

### 6. MikroTik Integration Service

**Purpose**: Integrate with MikroTik routers for customer provisioning

```go
type MikroTikService interface {
    CreatePPPoESecret(ctx context.Context, customer *Customer, plan *ServicePlan) error
    UpdatePPPoESecret(ctx context.Context, customer *Customer, plan *ServicePlan) error
    DeletePPPoESecret(ctx context.Context, customerCode string) error
    DisablePPPoESecret(ctx context.Context, customerCode string) error
    EnablePPPoESecret(ctx context.Context, customerCode string) error
    GetActiveSession(ctx context.Context, customerCode string) (*PPPoESession, error)
    DisconnectSession(ctx context.Context, sessionID string) error
}

type MikroTikClient interface {
    Connect(host string, port int, username, password string) error
    ExecuteCommand(command string, params map[string]string) ([]map[string]string, error)
    Close() error
}
```

### 7. Ticket Service

**Purpose**: Manage customer support tickets

```go
type TicketService interface {
    Create(ctx context.Context, req *CreateTicketRequest) (*Ticket, error)
    GetByID(ctx context.Context, id string) (*Ticket, error)
    List(ctx context.Context, filter *TicketFilter) ([]*Ticket, error)
    Update(ctx context.Context, id string, req *UpdateTicketRequest) (*Ticket, error)
    UpdateStatus(ctx context.Context, id string, status TicketStatus) error
    AssignTo(ctx context.Context, id string, userID string) error
    AddComment(ctx context.Context, ticketID string, comment *TicketComment) error
}
```

### 8. Monitoring Service

**Purpose**: Monitor customer bandwidth and network performance

```go
type MonitoringService interface {
    GetCustomerMonitoring(ctx context.Context, customerID string, period string) (*CustomerMonitoring, error)
    GetNetworkOverview(ctx context.Context) (*NetworkOverview, error)
    RecordBandwidthUsage(ctx context.Context, data *BandwidthData) error
    GenerateAlert(ctx context.Context, alert *Alert) error
    GetAlerts(ctx context.Context, filter *AlertFilter) ([]*Alert, error)
}
```

### 9. Speed Boost Service

**Purpose**: Manage temporary speed upgrades

```go
type SpeedBoostService interface {
    CreateRequest(ctx context.Context, req *CreateSpeedBoostRequest) (*SpeedBoost, error)
    GetByID(ctx context.Context, id string) (*SpeedBoost, error)
    List(ctx context.Context, filter *SpeedBoostFilter) ([]*SpeedBoost, error)
    Approve(ctx context.Context, id string) error
    Reject(ctx context.Context, id string, reason string) error
    Activate(ctx context.Context, id string) error
    CheckExpiredBoosts(ctx context.Context) error
}
```

### 10. Audit Log Service

**Purpose**: Track all user actions for compliance

```go
type AuditLogService interface {
    Log(ctx context.Context, log *AuditLog) error
    GetLogs(ctx context.Context, filter *AuditLogFilter) ([]*AuditLog, error)
}

type AuditLogger interface {
    LogCreate(ctx context.Context, entityType, entityID string, data interface{}) error
    LogUpdate(ctx context.Context, entityType, entityID string, oldData, newData interface{}) error
    LogDelete(ctx context.Context, entityType, entityID string, data interface{}) error
}
```

### 11. WebSocket Hub

**Purpose**: Manage WebSocket connections and broadcast events

```go
type WebSocketHub interface {
    Register(client *WebSocketClient)
    Unregister(client *WebSocketClient)
    Broadcast(event *WebSocketEvent)
    BroadcastToTenant(tenantID string, event *WebSocketEvent)
    BroadcastToUser(userID string, event *WebSocketEvent)
}

type WebSocketEvent struct {
    Event     string      `json:"event"`
    Data      interface{} `json:"data"`
    Timestamp time.Time   `json:"timestamp"`
}
```

### 12. Email Service

**Purpose**: Send email notifications

```go
type EmailService interface {
    SendEmail(to, subject, body string) error
    SendTemplateEmail(to, templateName string, data interface{}) error
    QueueEmail(email *Email) error
}

type EmailQueue interface {
    Enqueue(email *Email) error
    Dequeue() (*Email, error)
    ProcessQueue() error
}
```

### 13. Cache Service

**Purpose**: Cache frequently accessed data

```go
type CacheService interface {
    Get(key string, dest interface{}) error
    Set(key string, value interface{}, expiration time.Duration) error
    Delete(key string) error
    Clear(pattern string) error
}
```

### 14. Message Queue Service

**Purpose**: Handle asynchronous tasks

```go
type MessageQueueService interface {
    Publish(queue string, message interface{}) error
    Subscribe(queue string, handler MessageHandler) error
    PublishDelayed(queue string, message interface{}, delay time.Duration) error
}

type MessageHandler func(message []byte) error
```

## Data Models

### Core Entities

```go
// Tenant represents an ISP operator
type Tenant struct {
    ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    Name      string    `gorm:"not null"`
    Subdomain string    `gorm:"uniqueIndex;not null"`
    IsActive  bool      `gorm:"default:true"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

// User represents system users
type User struct {
    ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID  string    `gorm:"type:uuid;not null;index"`
    Email     string    `gorm:"uniqueIndex:idx_tenant_email;not null"`
    Password  string    `gorm:"not null"` // bcrypt hashed
    Name      string    `gorm:"not null"`
    Role      string    `gorm:"not null"` // admin, operator, technician, viewer
    IsActive  bool      `gorm:"default:true"`
    CreatedAt time.Time
    UpdatedAt time.Time
    Tenant    Tenant `gorm:"foreignKey:TenantID"`
}

// Customer represents internet customers
type Customer struct {
    ID               string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID         string    `gorm:"type:uuid;not null;index"`
    CustomerCode     string    `gorm:"uniqueIndex:idx_tenant_code;not null"`
    Name             string    `gorm:"not null"`
    Email            string    `gorm:"index"`
    Phone            string    `gorm:"not null"`
    Address          string    `gorm:"not null"`
    Latitude         float64
    Longitude        float64
    ServicePlanID    string    `gorm:"type:uuid;not null"`
    Status           string    `gorm:"not null;default:'active'"` // active, suspended, terminated
    InstallationDate time.Time
    DueDate          int       `gorm:"not null;default:15"` // day of month
    MonthlyFee       float64   `gorm:"not null"`
    Notes            string    `gorm:"type:text"`
    CreatedAt        time.Time
    UpdatedAt        time.Time
    DeletedAt        *time.Time `gorm:"index"`
    Tenant           Tenant     `gorm:"foreignKey:TenantID"`
    ServicePlan      ServicePlan `gorm:"foreignKey:ServicePlanID"`
}

// ServicePlan represents internet packages
type ServicePlan struct {
    ID            string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID      string    `gorm:"type:uuid;not null;index"`
    Name          string    `gorm:"not null"`
    Description   string    `gorm:"type:text"`
    SpeedDownload int       `gorm:"not null"` // in Mbps
    SpeedUpload   int       `gorm:"not null"` // in Mbps
    Price         float64   `gorm:"not null"`
    IsActive      bool      `gorm:"default:true"`
    Features      string    `gorm:"type:jsonb"` // JSON array
    CreatedAt     time.Time
    UpdatedAt     time.Time
    Tenant        Tenant `gorm:"foreignKey:TenantID"`
}

// ServicePlanAdvancedSettings for MikroTik configuration
type ServicePlanAdvancedSettings struct {
    ID             string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    ServicePlanID  string  `gorm:"type:uuid;uniqueIndex;not null"`
    BurstEnabled   bool    `gorm:"default:false"`
    BurstLimit     int     // in Mbps
    BurstThreshold int     // in Mbps
    BurstTime      int     // in seconds
    Priority       int     `gorm:"default:8"`
    MaxConnections int
    AddressPool    string
    DNSServers     string  `gorm:"type:jsonb"` // JSON array
    TransparentProxy bool  `gorm:"default:false"`
    QueueType      string  `gorm:"default:'pcq'"`
    ParentQueue    string
    ServicePlan    ServicePlan `gorm:"foreignKey:ServicePlanID"`
}

// Payment represents customer payments
type Payment struct {
    ID            string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID      string    `gorm:"type:uuid;not null;index"`
    CustomerID    string    `gorm:"type:uuid;not null;index"`
    Amount        float64   `gorm:"not null"`
    PaymentDate   *time.Time
    DueDate       time.Time `gorm:"not null"`
    Status        string    `gorm:"not null;default:'pending'"` // pending, paid, overdue
    PaymentMethod string    // transfer, cash, e-wallet
    Notes         string    `gorm:"type:text"`
    CreatedAt     time.Time
    UpdatedAt     time.Time
    Tenant        Tenant   `gorm:"foreignKey:TenantID"`
    Customer      Customer `gorm:"foreignKey:CustomerID"`
}

// Device represents network devices
type Device struct {
    ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID   string    `gorm:"type:uuid;not null;index"`
    Name       string    `gorm:"not null"`
    Type       string    `gorm:"not null"` // olt, router, switch, ap
    IPAddress  string    `gorm:"not null"`
    Port       int       `gorm:"default:8728"`
    Username   string
    Password   string    // encrypted
    Location   string
    Status     string    `gorm:"default:'unknown'"` // online, offline, unknown
    LastSeen   *time.Time
    CreatedAt  time.Time
    UpdatedAt  time.Time
    Tenant     Tenant `gorm:"foreignKey:TenantID"`
}

// MikroTikRouter represents MikroTik routers
type MikroTikRouter struct {
    ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID  string    `gorm:"type:uuid;not null;index"`
    Name      string    `gorm:"not null"`
    Host      string    `gorm:"not null"`
    Port      int       `gorm:"default:8728"`
    Username  string    `gorm:"not null"`
    Password  string    `gorm:"not null"` // encrypted
    Location  string
    IsActive  bool      `gorm:"default:true"`
    CreatedAt time.Time
    UpdatedAt time.Time
    Tenant    Tenant `gorm:"foreignKey:TenantID"`
}

// Ticket represents support tickets
type Ticket struct {
    ID          string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID    string    `gorm:"type:uuid;not null;index"`
    CustomerID  string    `gorm:"type:uuid;not null;index"`
    TicketNumber string   `gorm:"uniqueIndex:idx_tenant_ticket;not null"`
    Title       string    `gorm:"not null"`
    Description string    `gorm:"type:text;not null"`
    Status      string    `gorm:"not null;default:'open'"` // open, in_progress, resolved, closed
    Priority    string    `gorm:"not null;default:'medium'"` // low, medium, high, urgent
    AssignedTo  *string   `gorm:"type:uuid"`
    ResolvedAt  *time.Time
    CreatedAt   time.Time
    UpdatedAt   time.Time
    Tenant      Tenant   `gorm:"foreignKey:TenantID"`
    Customer    Customer `gorm:"foreignKey:CustomerID"`
    AssignedUser *User   `gorm:"foreignKey:AssignedTo"`
}

// SpeedBoost represents temporary speed upgrades
type SpeedBoost struct {
    ID            string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID      string    `gorm:"type:uuid;not null;index"`
    CustomerID    string    `gorm:"type:uuid;not null;index"`
    CurrentPlanID string    `gorm:"type:uuid;not null"`
    BoostPlanID   string    `gorm:"type:uuid;not null"`
    DurationDays  int       `gorm:"not null"`
    Price         float64   `gorm:"not null"`
    Status        string    `gorm:"not null;default:'pending'"` // pending, approved, rejected, active, expired
    RequestDate   time.Time `gorm:"not null"`
    StartDate     *time.Time
    EndDate       *time.Time
    Notes         string    `gorm:"type:text"`
    RejectionReason string  `gorm:"type:text"`
    CreatedAt     time.Time
    UpdatedAt     time.Time
    Tenant        Tenant      `gorm:"foreignKey:TenantID"`
    Customer      Customer    `gorm:"foreignKey:CustomerID"`
    CurrentPlan   ServicePlan `gorm:"foreignKey:CurrentPlanID"`
    BoostPlan     ServicePlan `gorm:"foreignKey:BoostPlanID"`
}

// AuditLog represents system audit trail
type AuditLog struct {
    ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID   string    `gorm:"type:uuid;not null;index"`
    UserID     string    `gorm:"type:uuid;not null;index"`
    Action     string    `gorm:"not null"` // create, update, delete
    EntityType string    `gorm:"not null;index"` // customer, payment, device, etc
    EntityID   string    `gorm:"not null"`
    Changes    string    `gorm:"type:jsonb"` // JSON object
    IPAddress  string
    Timestamp  time.Time `gorm:"not null;index"`
    Tenant     Tenant    `gorm:"foreignKey:TenantID"`
    User       User      `gorm:"foreignKey:UserID"`
}

// MonitoringData represents bandwidth monitoring
type MonitoringData struct {
    ID            string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID      string    `gorm:"type:uuid;not null;index"`
    CustomerID    string    `gorm:"type:uuid;not null;index"`
    DownloadSpeed float64   // in Mbps
    UploadSpeed   float64   // in Mbps
    Latency       int       // in ms
    PacketLoss    float64   // percentage
    DataUsage     int64     // in bytes
    Timestamp     time.Time `gorm:"not null;index"`
    Tenant        Tenant    `gorm:"foreignKey:TenantID"`
    Customer      Customer  `gorm:"foreignKey:CustomerID"`
}

// InfrastructureItem represents inventory
type InfrastructureItem struct {
    ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    TenantID  string    `gorm:"type:uuid;not null;index"`
    Name      string    `gorm:"not null"`
    Type      string    `gorm:"not null"` // cable, router, switch, antenna, connector, tools
    Quantity  int       `gorm:"not null"`
    Unit      string    `gorm:"not null"` // meter, piece, set
    Location  string
    Notes     string    `gorm:"type:text"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt *time.Time `gorm:"index"`
    Tenant    Tenant     `gorm:"foreignKey:TenantID"`
}
```

## Error Handling

### Error Types

```go
type AppError struct {
    Code    string      `json:"code"`
    Message string      `json:"message"`
    Details interface{} `json:"details,omitempty"`
    Status  int         `json:"-"`
}

func (e *AppError) Error() string {
    return e.Message
}

// Predefined errors
var (
    ErrUnauthorized     = &AppError{Code: "UNAUTHORIZED", Message: "Unauthorized", Status: 401}
    ErrForbidden        = &AppError{Code: "FORBIDDEN", Message: "Forbidden", Status: 403}
    ErrNotFound         = &AppError{Code: "NOT_FOUND", Message: "Resource not found", Status: 404}
    ErrValidation       = &AppError{Code: "VALIDATION_ERROR", Message: "Validation error", Status: 400}
    ErrDuplicateEntry   = &AppError{Code: "DUPLICATE_ENTRY", Message: "Duplicate entry", Status: 409}
    ErrInternalServer   = &AppError{Code: "INTERNAL_ERROR", Message: "Internal server error", Status: 500}
    ErrRateLimitExceeded = &AppError{Code: "RATE_LIMIT", Message: "Rate limit exceeded", Status: 429}
)
```

### Error Handler Middleware

```go
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        
        if len(c.Errors) > 0 {
            err := c.Errors.Last().Err
            
            if appErr, ok := err.(*AppError); ok {
                c.JSON(appErr.Status, appErr)
                return
            }
            
            // Log unexpected errors
            log.Error().Err(err).Msg("Unexpected error")
            c.JSON(500, ErrInternalServer)
        }
    }
}
```

## Testing Strategy

### Unit Testing

Unit tests will cover:
- Service layer business logic
- Repository layer database operations
- Utility functions and helpers
- Validation logic

**Framework**: `testify` for assertions, `gomock` for mocking

**Example**:
```go
func TestCustomerService_Create(t *testing.T) {
    // Setup
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()
    
    mockRepo := mock.NewMockCustomerRepository(ctrl)
    service := NewCustomerService(mockRepo)
    
    // Test case
    req := &CreateCustomerRequest{
        Name: "John Doe",
        Phone: "08123456789",
        // ...
    }
    
    mockRepo.EXPECT().
        Create(gomock.Any(), gomock.Any()).
        Return(nil)
    
    // Execute
    customer, err := service.Create(context.Background(), req)
    
    // Assert
    assert.NoError(t, err)
    assert.NotNil(t, customer)
    assert.Equal(t, "John Doe", customer.Name)
}
```

### Integration Testing

Integration tests will cover:
- API endpoint testing with real database (test container)
- MikroTik integration testing
- WebSocket connection testing
- Email sending testing

**Framework**: `testcontainers-go` for database containers

### Property-Based Testing

Property-based tests will verify:
- Customer code generation uniqueness
- Payment calculation correctness
- Date range filtering consistency
- Pagination logic correctness

**Framework**: `gopter` for property-based testing

**Library**: `gopter` (https://github.com/leanovate/gopter)

**Configuration**: Each property test will run minimum 100 iterations

**Tagging**: Each property test will include comment: `// Feature: rtrwnet-saas-backend, Property X: [property description]`



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Redundancies Identified:**
- Properties 1.2, 1.3, and 1.5 all test tenant isolation - can be combined into comprehensive tenant isolation property
- Multiple validation properties (3.2, 4.1, 5.1, etc.) follow same pattern - can be generalized
- Multiple filtering properties (3.4, 3.5, 5.5, etc.) test same behavior - can be combined
- WebSocket broadcasting properties (16.1-16.5) follow same pattern - can be combined

**Consolidated Properties:**

### Multi-Tenant Isolation Properties

**Property 1: Tenant Data Isolation**
*For any* authenticated user and any database query, the results SHALL only contain data belonging to that user's tenant, and no data from other tenants SHALL be accessible.
**Validates: Requirements 1.2, 1.3, 1.5**

**Property 2: Tenant Deletion Isolation**
*For any* tenant deletion operation, all data associated with that tenant SHALL be removed, and no data from other tenants SHALL be affected.
**Validates: Requirements 1.4**

### Authentication Properties

**Property 3: Token Generation on Valid Credentials**
*For any* valid username and password combination, the authentication system SHALL generate both an access token and a refresh token.
**Validates: Requirements 2.1**

**Property 4: Expired Token Rejection**
*For any* expired JWT access token, any API request using that token SHALL be rejected with 401 status code.
**Validates: Requirements 2.2**

**Property 5: Refresh Token Exchange**
*For any* valid refresh token, the system SHALL generate a new valid access token.
**Validates: Requirements 2.3**

**Property 6: Token Invalidation on Logout**
*For any* logout operation, the associated refresh token SHALL become invalid and subsequent use SHALL be rejected.
**Validates: Requirements 2.4**

**Property 7: Authorization Enforcement**
*For any* user attempting an action without proper permissions, the system SHALL return 403 Forbidden status.
**Validates: Requirements 2.7**

### Customer Management Properties

**Property 8: Customer Code Uniqueness**
*For any* set of customers created within a tenant, all customer codes SHALL be unique.
**Validates: Requirements 3.1**

**Property 9: Required Field Validation**
*For any* entity creation request (customer, service plan, payment, device, ticket, infrastructure item), if required fields are missing, the system SHALL reject the request with validation error.
**Validates: Requirements 3.2, 4.1, 5.1, 6.1, 8.1, 13.1**

**Property 10: Pagination Consistency**
*For any* paginated list request, the total count of items across all pages SHALL equal the total count returned in pagination metadata.
**Validates: Requirements 3.3**

**Property 11: Search Result Accuracy**
*For any* search query on customers, all returned results SHALL contain the search term in at least one of the searchable fields (name, customer code, phone, email).
**Validates: Requirements 3.4**

**Property 12: Filter Result Accuracy**
*For any* filter criteria applied to any entity list (customers, payments, tickets, etc.), all returned results SHALL match the filter criteria.
**Validates: Requirements 3.5, 5.5, 8.3, 10.2, 12.5, 13.4**

**Property 13: Referential Integrity on Update**
*For any* update operation that references another entity (e.g., customer referencing service_plan_id), the referenced entity SHALL exist, or the update SHALL be rejected.
**Validates: Requirements 3.6, 8.5**

**Property 14: Soft Delete Preservation**
*For any* soft delete operation on customers or infrastructure items, the entity SHALL remain in the database with a deleted_at timestamp, and SHALL not appear in default queries.
**Validates: Requirements 3.7, 13.7**

**Property 15: Statistics Aggregation Accuracy**
*For any* statistics calculation (customer counts, revenue, tickets), the sum of individual category counts SHALL equal the total count.
**Validates: Requirements 3.8, 11.1, 11.4**

### Service Plan Properties

**Property 16: Positive Number Validation**
*For any* numeric field that represents speed, price, quantity, or amount, the system SHALL reject non-positive values.
**Validates: Requirements 4.2, 4.3, 5.2, 13.2**

**Property 17: Referential Integrity on Delete**
*For any* entity deletion where other entities depend on it (e.g., service plan with customers, device with dependencies), the deletion SHALL be prevented.
**Validates: Requirements 4.6, 6.7**

### Payment Properties

**Property 18: Payment Status Auto-Assignment**
*For any* payment creation with a payment_date provided, the status SHALL be automatically set to "paid".
**Validates: Requirements 5.3**

**Property 19: Due Date Calculation Consistency**
*For any* payment created for a customer, the due_date SHALL be calculated based on the customer's billing cycle day.
**Validates: Requirements 5.4**

**Property 20: Overdue Status Auto-Update**
*For any* payment where current date exceeds due_date and status is "pending", the status SHALL be automatically updated to "overdue".
**Validates: Requirements 5.6**

**Property 21: Payment Date Recording on Status Change**
*For any* payment status update to "paid", if payment_date is not set, it SHALL be set to the current timestamp.
**Validates: Requirements 5.7**

### Device Management Properties

**Property 22: IP Address Format Validation**
*For any* device creation or update with an ip_address field, the value SHALL be in valid IPv4 or IPv6 format, or the operation SHALL be rejected.
**Validates: Requirements 6.2**

**Property 23: Credential Encryption**
*For any* device or router with password credentials, the password SHALL be encrypted before storage and SHALL never be returned in plain text in API responses.
**Validates: Requirements 6.3, 6.4**

**Property 24: Device Status Update on Unreachable**
*For any* device that fails connectivity check, the status SHALL be updated to "offline" and last_seen timestamp SHALL be recorded.
**Validates: Requirements 6.6**

### MikroTik Integration Properties

**Property 25: PPPoE Secret Creation on Customer Activation**
*For any* customer activation, a corresponding PPPoE secret SHALL be created on the assigned MikroTik router.
**Validates: Requirements 7.2**

**Property 26: PPPoE Profile Update on Plan Change**
*For any* customer service plan change, the PPPoE profile on MikroTik SHALL be updated to reflect the new plan settings.
**Validates: Requirements 7.3**

**Property 27: PPPoE Secret Disable on Suspension**
*For any* customer suspension, the PPPoE secret on MikroTik SHALL be disabled.
**Validates: Requirements 7.4**

**Property 28: PPPoE Secret Removal on Termination**
*For any* customer termination, the PPPoE secret SHALL be removed from MikroTik.
**Validates: Requirements 7.5**

**Property 29: Operation Queueing on Connection Failure**
*For any* MikroTik operation that fails due to connection error, the operation SHALL be queued for retry.
**Validates: Requirements 7.6**

### Ticketing Properties

**Property 30: Ticket Initial State**
*For any* newly created ticket, the status SHALL be "open" and a unique ticket number SHALL be assigned.
**Validates: Requirements 8.2**

**Property 31: Ticket Status Transition Validation**
*For any* ticket status update, the transition SHALL follow valid state machine rules (open → in_progress → resolved → closed), or the update SHALL be rejected.
**Validates: Requirements 8.4**

**Property 32: Resolution Timestamp Recording**
*For any* ticket status update to "resolved", the resolved_at timestamp SHALL be set to the current time.
**Validates: Requirements 8.6**

### Speed Boost Properties

**Property 33: Speed Boost Price Calculation**
*For any* speed boost request, the price SHALL be calculated based on the duration in days and the difference between current plan and boost plan prices.
**Validates: Requirements 9.2**

**Property 34: Speed Boost Date Calculation**
*For any* approved speed boost, the start_date SHALL be set to current date and end_date SHALL be calculated as start_date plus duration_days.
**Validates: Requirements 9.4**

**Property 35: Speed Boost Auto-Expiration**
*For any* active speed boost where current date exceeds end_date, the customer's service plan SHALL automatically revert to the original plan.
**Validates: Requirements 9.5**

**Property 36: Rejection Reason Recording**
*For any* speed boost rejection, the rejection reason SHALL be recorded in the database.
**Validates: Requirements 9.6**

### Monitoring Properties

**Property 37: Bandwidth Aggregation Accuracy**
*For any* bandwidth usage calculation over a time period, the aggregated value SHALL equal the sum of individual data points within that period.
**Validates: Requirements 10.3**

**Property 38: Network Overview Calculation**
*For any* network overview request, the total bandwidth SHALL equal the sum of all customer bandwidth allocations.
**Validates: Requirements 10.4**

**Property 39: Alert Generation on Threshold Breach**
*For any* bandwidth usage exceeding the configured threshold, an alert SHALL be generated.
**Validates: Requirements 10.5**

**Property 40: Alert Generation on Device Offline**
*For any* device status change to "offline", an alert SHALL be generated.
**Validates: Requirements 10.6**

### Dashboard Properties

**Property 41: Revenue Calculation Accuracy**
*For any* revenue calculation for a given month, the total SHALL equal the sum of all payments with status "paid" in that month.
**Validates: Requirements 11.2**

**Property 42: Revenue Growth Calculation**
*For any* revenue growth percentage calculation, the value SHALL equal ((current_month - previous_month) / previous_month) * 100.
**Validates: Requirements 11.3**

**Property 43: Bandwidth Usage Percentage Calculation**
*For any* network bandwidth usage percentage, the value SHALL equal (used_bandwidth / total_bandwidth) * 100.
**Validates: Requirements 11.5**

**Property 44: Cache Expiration Refresh**
*For any* cached dashboard statistics, when cache expires (after 5 minutes), the next request SHALL fetch fresh data from the database.
**Validates: Requirements 11.7**

### Audit Logging Properties

**Property 45: Audit Log Creation on CRUD Operations**
*For any* create, update, or delete operation on any entity, an audit log entry SHALL be created with action type, entity type, entity ID, and changes.
**Validates: Requirements 12.1, 12.2, 12.3**

**Property 46: Audit Log Completeness**
*For any* audit log entry, the fields user_id, IP address, and timestamp SHALL be populated.
**Validates: Requirements 12.4**

**Property 47: Audit Log Immutability**
*For any* attempt to modify or delete an audit log entry, the operation SHALL be rejected.
**Validates: Requirements 12.7**

### Infrastructure Properties

**Property 48: Quantity Change Audit Tracking**
*For any* infrastructure item quantity update, an audit log entry SHALL be created recording the old and new quantity values.
**Validates: Requirements 13.3**

**Property 49: Low Stock Alert Generation**
*For any* infrastructure item where quantity falls below the minimum threshold, a low stock alert SHALL be generated.
**Validates: Requirements 13.5**

### Security Properties

**Property 50: Rate Limit Enforcement**
*For any* client making more than 100 requests per minute, subsequent requests SHALL be rejected with 429 status code.
**Validates: Requirements 14.1**

**Property 51: IP Blocking on Suspicious Activity**
*For any* detected suspicious activity pattern, the source IP address SHALL be temporarily blocked.
**Validates: Requirements 14.3**

**Property 52: SQL Injection Prevention**
*For any* input containing SQL injection patterns, the input SHALL be sanitized or rejected before database execution.
**Validates: Requirements 14.4**

**Property 53: XSS Prevention**
*For any* input containing XSS attack patterns, the input SHALL be sanitized before storage or display.
**Validates: Requirements 14.5**

### Backup Properties

**Property 54: Backup Compression and Encryption**
*For any* database backup operation, the resulting backup file SHALL be both compressed and encrypted.
**Validates: Requirements 15.2**

**Property 55: Backup Failure Notification**
*For any* backup operation that fails, a notification SHALL be sent to all administrators.
**Validates: Requirements 15.4**

**Property 56: Backup Integrity Validation**
*For any* restore operation, the backup file integrity SHALL be validated before restoration begins.
**Validates: Requirements 15.7**

### WebSocket Properties

**Property 57: Event Broadcasting on Entity Changes**
*For any* entity creation or update (customer, payment, ticket, device status, monitoring data), a corresponding WebSocket event SHALL be broadcast to connected clients.
**Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**

**Property 58: WebSocket Resource Cleanup**
*For any* WebSocket client disconnection, all associated resources (memory, connections) SHALL be cleaned up.
**Validates: Requirements 16.7**

### Email Notification Properties

**Property 59: Email Notification on Events**
*For any* configured event (overdue payment, ticket creation, speed boost approval, device offline), an email notification SHALL be sent to the appropriate recipient.
**Validates: Requirements 17.1, 17.2, 17.3, 17.4**

**Property 60: Email Retry on Failure**
*For any* email sending failure, the system SHALL retry sending up to 3 times before marking as failed.
**Validates: Requirements 17.7**

### Export Properties

**Property 61: Export Data Completeness**
*For any* data export operation, all relevant fields for the exported entity type SHALL be included in the export file.
**Validates: Requirements 18.2**

**Property 62: Export Date Range Filtering**
*For any* report generation with date range filter, only data within the specified date range SHALL be included.
**Validates: Requirements 18.3**

**Property 63: Export Permission Enforcement**
*For any* data export operation, only data that the user has permission to access SHALL be included in the export.
**Validates: Requirements 18.7**

### Migration Properties

**Property 64: Migration Rollback Safety**
*For any* migration rollback operation, the database schema SHALL be reverted to the state before the migration was applied.
**Validates: Requirements 19.4**



## Security Considerations

### 1. Authentication Security
- Passwords hashed using bcrypt with cost factor 12
- JWT tokens signed with RS256 (RSA with SHA-256)
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Refresh tokens stored in Redis with automatic expiration
- Token rotation on refresh to prevent token reuse

### 2. Authorization
- Role-Based Access Control (RBAC) with 4 roles:
  - **Admin**: Full access to all features
  - **Operator**: Manage customers, payments, tickets
  - **Technician**: View customers, manage tickets, view devices
  - **Viewer**: Read-only access to all data
- Permission checks at both API and service layer
- Tenant isolation enforced at middleware level

### 3. Data Protection
- All sensitive data (passwords, API keys) encrypted at rest using AES-256
- Database connections use TLS/SSL
- API communications over HTTPS only in production
- Personal data (customer info) encrypted in backups
- Audit logs for all data access and modifications

### 4. Input Validation
- All input validated using struct tags and custom validators
- SQL injection prevention through parameterized queries (GORM)
- XSS prevention through input sanitization
- CSRF protection for state-changing operations
- File upload validation (type, size, content)

### 5. Rate Limiting
- Global rate limit: 1000 requests per minute per IP
- Authenticated user rate limit: 100 requests per minute
- Login endpoint rate limit: 5 attempts per minute per IP
- Exponential backoff on repeated failures
- IP blocking after suspicious activity detection

## Performance Optimization

### 1. Database Optimization
- Indexes on frequently queried fields (tenant_id, customer_code, email, status)
- Composite indexes for multi-column queries
- Database connection pooling (max 100 connections)
- Read replicas for read-heavy operations
- Query optimization with EXPLAIN ANALYZE

### 2. Caching Strategy
- Redis caching for:
  - Dashboard statistics (5 minutes TTL)
  - Service plans (1 hour TTL)
  - User sessions (token expiration TTL)
  - Frequently accessed customer data (10 minutes TTL)
- Cache invalidation on data updates
- Cache warming for critical data

### 3. Asynchronous Processing
- RabbitMQ for:
  - Email sending
  - MikroTik provisioning operations
  - Report generation
  - Backup operations
  - Monitoring data collection
- Worker pools for parallel processing
- Dead letter queue for failed operations

### 4. API Response Optimization
- Pagination for all list endpoints (default 10, max 100 items)
- Field selection to return only requested fields
- Response compression (gzip)
- ETags for conditional requests
- Lazy loading for related entities

## Deployment Architecture

### Development Environment
```
- Single server setup
- PostgreSQL on same server
- Redis on same server
- No load balancer
- Hot reload for development
```

### Staging Environment
```
- 2 application servers
- PostgreSQL primary + 1 replica
- Redis cluster (3 nodes)
- Nginx load balancer
- SSL certificates
```

### Production Environment
```
- 4+ application servers (auto-scaling)
- PostgreSQL primary + 2 replicas
- Redis cluster (6 nodes - 3 primary, 3 replica)
- RabbitMQ cluster (3 nodes)
- Nginx load balancer with SSL
- CDN for static assets
- Monitoring and alerting (Prometheus + Grafana)
- Log aggregation (ELK stack)
```

## Monitoring and Observability

### 1. Application Metrics
- Request rate, latency, error rate
- Database query performance
- Cache hit/miss ratio
- Queue depth and processing time
- Active WebSocket connections

### 2. Business Metrics
- Customer growth rate
- Revenue trends
- Ticket resolution time
- Payment collection rate
- Network bandwidth utilization

### 3. Logging
- Structured logging with JSON format
- Log levels: DEBUG, INFO, WARN, ERROR, FATAL
- Request/response logging with correlation IDs
- Error stack traces
- Audit trail logging

### 4. Alerting
- High error rate (> 5%)
- Slow response time (> 1s p95)
- Database connection pool exhaustion
- High memory usage (> 80%)
- Failed backup operations
- Device offline alerts

## API Versioning Strategy

- URL-based versioning: `/api/v1/`, `/api/v2/`
- Maintain backward compatibility for at least 2 versions
- Deprecation warnings in response headers
- 6-month deprecation period before removal
- Version-specific documentation

## Database Migration Strategy

### Migration Tools
- golang-migrate for schema migrations
- Versioned migration files with up/down scripts
- Migration tracking in `schema_migrations` table

### Migration Process
1. Create migration file with timestamp prefix
2. Test migration on development database
3. Review migration in code review
4. Apply to staging environment
5. Verify data integrity
6. Apply to production during maintenance window
7. Monitor for issues
8. Rollback plan ready

### Migration Best Practices
- Never modify existing migrations
- Always provide rollback (down) migration
- Test with production-like data volume
- Use transactions where possible
- Avoid data migrations in schema migrations
- Separate data migrations into dedicated scripts

## Third-Party Integrations

### 1. MikroTik API
- Connection pooling for multiple routers
- Retry logic with exponential backoff
- Circuit breaker pattern for failing routers
- Async operation queue for provisioning
- Health check monitoring

### 2. Email Service
- SMTP configuration for custom email server
- Support for SendGrid, Mailgun, AWS SES
- Email templates with variable substitution
- Bounce and complaint handling
- Email delivery tracking

### 3. Payment Gateway (Future)
- Integration with Midtrans, Xendit, or Stripe
- Webhook handling for payment notifications
- Payment reconciliation
- Refund processing

### 4. SMS Gateway (Future)
- Integration for SMS notifications
- OTP for two-factor authentication
- Payment reminders via SMS

## Scalability Considerations

### Horizontal Scaling
- Stateless application servers
- Session data in Redis (shared state)
- Load balancing with sticky sessions for WebSocket
- Database read replicas for read scaling
- Sharding strategy for multi-region deployment

### Vertical Scaling
- Optimize database queries
- Increase server resources (CPU, RAM)
- Database connection pool tuning
- Cache size optimization

### Data Partitioning
- Tenant-based partitioning for large deployments
- Time-based partitioning for monitoring data
- Archive old data to separate storage

## Disaster Recovery

### Backup Strategy
- Automated daily full database backups
- Hourly incremental backups
- Backup retention: 30 days
- Backup stored in multiple locations
- Encrypted backups
- Regular restore testing

### Recovery Procedures
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour
- Documented recovery procedures
- Regular disaster recovery drills
- Failover to backup region capability

## Development Workflow

### Code Organization
```
rtrwnet-saas-backend/
├── cmd/
│   ├── api/           # API server entry point
│   ├── worker/        # Background worker entry point
│   └── migrate/       # Migration tool entry point
├── internal/
│   ├── domain/        # Domain entities and interfaces
│   ├── usecase/       # Business logic / use cases
│   ├── delivery/      # HTTP handlers, WebSocket handlers
│   ├── repository/    # Database implementations
│   ├── middleware/    # HTTP middleware
│   └── infrastructure/# External services (email, cache, queue)
├── pkg/               # Shared packages
│   ├── auth/          # Authentication utilities
│   ├── validator/     # Input validation
│   ├── logger/        # Logging utilities
│   └── errors/        # Error definitions
├── migrations/        # Database migrations
├── docs/              # API documentation
├── tests/             # Integration tests
└── scripts/           # Deployment and utility scripts
```

### Development Standards
- Go modules for dependency management
- golangci-lint for code linting
- gofmt for code formatting
- Code coverage minimum 80%
- All public functions documented
- Unit tests for all business logic
- Integration tests for API endpoints

### Git Workflow
- Feature branch workflow
- Branch naming: `feature/`, `bugfix/`, `hotfix/`
- Pull request required for main branch
- Code review by at least 1 developer
- CI/CD pipeline runs on all PRs
- Semantic versioning for releases

## Future Enhancements

### Phase 1 (Current)
- Core customer management
- Service plan management
- Payment tracking
- MikroTik integration
- Basic monitoring

### Phase 2 (Next 3 months)
- Advanced reporting and analytics
- Mobile app API support
- Customer self-service portal
- Automated billing and invoicing
- SMS notifications

### Phase 3 (Next 6 months)
- Multi-region deployment
- Advanced network topology visualization
- AI-powered network optimization
- Predictive maintenance
- Customer behavior analytics

### Phase 4 (Next 12 months)
- White-label solution for resellers
- Marketplace for third-party integrations
- Advanced automation workflows
- IoT device management
- 5G network support
