# Implementation Plan

## Phase 1: Project Setup and Core Infrastructure

- [ ] 1. Initialize project structure and dependencies
- [ ] 1.1 Create Go module and project structure
  - Initialize Go module with `go mod init`
  - Create directory structure following clean architecture
  - Set up main.go entry point
  - _Requirements: All_

- [ ] 1.2 Install and configure core dependencies
  - Install Gin web framework
  - Install GORM and PostgreSQL driver
  - Install Redis client (go-redis)
  - Install JWT library (golang-jwt/jwt)
  - Install WebSocket library (gorilla/websocket)
  - Install validation library (go-playground/validator)
  - _Requirements: All_

- [ ] 1.3 Set up configuration management
  - Create config package for environment variables
  - Implement config loading from .env file
  - Add database connection configuration
  - Add Redis connection configuration
  - Add JWT secret configuration
  - _Requirements: All_

- [ ] 1.4 Set up database connection and migration system
  - Implement database connection with GORM
  - Set up connection pooling
  - Install golang-migrate
  - Create initial migration structure
  - _Requirements: 19.1, 19.3_

- [ ]* 1.5 Write unit tests for configuration and database setup
  - Test configuration loading
  - Test database connection
  - Test migration system
  - _Requirements: All_

## Phase 2: Multi-Tenant Infrastructure

- [ ] 2. Implement multi-tenant architecture
- [ ] 2.1 Create Tenant model and migration
  - Define Tenant entity with ID, name, subdomain, is_active
  - Create migration for tenants table
  - Add indexes for subdomain
  - _Requirements: 1.1_

- [ ] 2.2 Implement Tenant repository
  - Create TenantRepository interface
  - Implement CRUD operations for tenants
  - Implement FindBySubdomain method
  - _Requirements: 1.1_

- [ ] 2.3 Create tenant middleware
  - Implement TenantMiddleware to extract tenant from request
  - Support subdomain-based tenant resolution
  - Support header-based tenant resolution (X-Tenant-ID)
  - Inject tenant context into Gin context
  - _Requirements: 1.2, 1.3_

- [ ] 2.4 Implement tenant-scoped database queries
  - Create GORM scope for tenant filtering
  - Apply tenant scope to all queries automatically
  - _Requirements: 1.3_

- [ ]* 2.5 Write property test for tenant isolation
  - **Property 1: Tenant Data Isolation**
  - **Validates: Requirements 1.2, 1.3, 1.5**

- [ ]* 2.6 Write property test for tenant deletion
  - **Property 2: Tenant Deletion Isolation**
  - **Validates: Requirements 1.4**

## Phase 3: Authentication and Authorization

- [ ] 3. Implement authentication system
- [ ] 3.1 Create User model and migration
  - Define User entity with ID, tenant_id, email, password, name, role
  - Create migration for users table
  - Add unique index on (tenant_id, email)
  - _Requirements: 2.1_

- [ ] 3.2 Implement password hashing utilities
  - Create password hashing function using bcrypt
  - Create password verification function
  - Set bcrypt cost factor to 12
  - _Requirements: 2.1_

- [ ] 3.3 Implement JWT token generation and validation
  - Create token generation function with RS256
  - Create token validation function
  - Implement access token (15 min expiry)
  - Implement refresh token (7 days expiry)
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3.4 Create AuthService
  - Implement Login method
  - Implement Logout method
  - Implement RefreshToken method
  - Implement ValidateToken method
  - Store refresh tokens in Redis
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.5 Create authentication middleware
  - Extract JWT from Authorization header
  - Validate token
  - Load user from database
  - Inject user into context
  - _Requirements: 2.5_

- [ ] 3.6 Implement role-based authorization
  - Create authorization middleware
  - Check user role against required permissions
  - Return 403 for unauthorized access
  - _Requirements: 2.6, 2.7_


- [ ] 3.7 Create auth HTTP handlers
  - Implement POST /auth/login handler
  - Implement POST /auth/logout handler
  - Implement POST /auth/refresh handler
  - _Requirements: 2.1, 2.3, 2.4_

- [ ]* 3.8 Write property tests for authentication
  - **Property 3: Token Generation on Valid Credentials**
  - **Validates: Requirements 2.1**

- [ ]* 3.9 Write property test for token expiration
  - **Property 4: Expired Token Rejection**
  - **Validates: Requirements 2.2**

- [ ]* 3.10 Write property test for refresh token
  - **Property 5: Refresh Token Exchange**
  - **Validates: Requirements 2.3**

- [ ]* 3.11 Write property test for logout
  - **Property 6: Token Invalidation on Logout**
  - **Validates: Requirements 2.4**

- [ ]* 3.12 Write property test for authorization
  - **Property 7: Authorization Enforcement**
  - **Validates: Requirements 2.7**

## Phase 4: Customer Management

- [ ] 4. Implement customer management
- [ ] 4.1 Create Customer model and migration
  - Define Customer entity with all fields
  - Create migration for customers table
  - Add indexes for tenant_id, customer_code, status
  - Add soft delete support
  - _Requirements: 3.1, 3.7_

- [ ] 4.2 Implement customer code generator
  - Create function to generate unique customer codes
  - Format: CUST + sequential number
  - Ensure uniqueness within tenant
  - _Requirements: 3.1_

- [ ] 4.3 Create CustomerRepository
  - Implement Create method
  - Implement FindByID method
  - Implement FindAll with pagination
  - Implement Update method
  - Implement SoftDelete method
  - Implement search and filter methods
  - _Requirements: 3.1-3.8_

- [ ] 4.4 Create CustomerService
  - Implement Create with validation
  - Implement GetByID
  - Implement List with pagination and filters
  - Implement Update with validation
  - Implement Delete (soft delete)
  - Implement GetStatistics
  - _Requirements: 3.1-3.8_

- [ ] 4.5 Create customer HTTP handlers
  - Implement GET /customers (list with pagination)
  - Implement GET /customers/:id
  - Implement POST /customers
  - Implement PUT /customers/:id
  - Implement DELETE /customers/:id
  - Implement GET /customers/stats
  - _Requirements: 3.1-3.8_


- [ ]* 4.6 Write property test for customer code uniqueness
  - **Property 8: Customer Code Uniqueness**
  - **Validates: Requirements 3.1**

- [ ]* 4.7 Write property test for required field validation
  - **Property 9: Required Field Validation**
  - **Validates: Requirements 3.2**

- [ ]* 4.8 Write property test for pagination
  - **Property 10: Pagination Consistency**
  - **Validates: Requirements 3.3**

- [ ]* 4.9 Write property test for search
  - **Property 11: Search Result Accuracy**
  - **Validates: Requirements 3.4**

- [ ]* 4.10 Write property test for filtering
  - **Property 12: Filter Result Accuracy**
  - **Validates: Requirements 3.5**

- [ ]* 4.11 Write property test for soft delete
  - **Property 14: Soft Delete Preservation**
  - **Validates: Requirements 3.7**

- [ ]* 4.12 Write property test for statistics
  - **Property 15: Statistics Aggregation Accuracy**
  - **Validates: Requirements 3.8**

## Phase 5: Service Plan Management

- [ ] 5. Implement service plan management
- [ ] 5.1 Create ServicePlan model and migration
  - Define ServicePlan entity
  - Create migration for service_plans table
  - Add indexes for tenant_id, is_active
  - _Requirements: 4.1-4.3_

- [ ] 5.2 Create ServicePlanAdvancedSettings model and migration
  - Define ServicePlanAdvancedSettings entity
  - Create migration for service_plan_advanced_settings table
  - Add foreign key to service_plans
  - _Requirements: 4.7_

- [ ] 5.3 Create ServicePlanRepository
  - Implement CRUD operations
  - Implement FindActiveOnly method
  - Implement CheckCustomerUsage method
  - _Requirements: 4.1-4.6_

- [ ] 5.4 Create ServicePlanService
  - Implement Create with validation
  - Implement GetByID
  - Implement List (active only by default)
  - Implement Update
  - Implement Delete with customer check
  - Implement GetAdvancedSettings
  - Implement UpdateAdvancedSettings
  - _Requirements: 4.1-4.7_

- [ ] 5.5 Create service plan HTTP handlers
  - Implement GET /service-plans
  - Implement GET /service-plans/:id
  - Implement POST /service-plans
  - Implement PUT /service-plans/:id
  - Implement DELETE /service-plans/:id
  - Implement GET /service-plans/:id/advanced
  - Implement PUT /service-plans/:id/advanced
  - _Requirements: 4.1-4.7_

- [ ]* 5.6 Write property test for positive number validation
  - **Property 16: Positive Number Validation**
  - **Validates: Requirements 4.2, 4.3**

- [ ]* 5.7 Write property test for referential integrity on delete
  - **Property 17: Referential Integrity on Delete**
  - **Validates: Requirements 4.6**


## Phase 6: Payment Management

- [ ] 6. Implement payment tracking
- [ ] 6.1 Create Payment model and migration
  - Define Payment entity
  - Create migration for payments table
  - Add indexes for tenant_id, customer_id, status, due_date
  - _Requirements: 5.1-5.7_

- [ ] 6.2 Create PaymentRepository
  - Implement CRUD operations
  - Implement FindByCustomer method
  - Implement FindByStatus method
  - Implement FindByDateRange method
  - Implement FindOverdue method
  - _Requirements: 5.1-5.7_

- [ ] 6.3 Create PaymentService
  - Implement Create with validation
  - Implement GetByID
  - Implement List with filters
  - Implement UpdateStatus
  - Implement CheckOverduePayments (scheduled job)
  - Implement GenerateInvoice
  - _Requirements: 5.1-5.7_

- [ ] 6.4 Create payment HTTP handlers
  - Implement GET /payments
  - Implement GET /payments/:id
  - Implement POST /payments
  - Implement PUT /payments/:id/status
  - _Requirements: 5.1-5.3_

- [ ]* 6.5 Write property test for payment status auto-assignment
  - **Property 18: Payment Status Auto-Assignment**
  - **Validates: Requirements 5.3**

- [ ]* 6.6 Write property test for due date calculation
  - **Property 19: Due Date Calculation Consistency**
  - **Validates: Requirements 5.4**

- [ ]* 6.7 Write property test for overdue status update
  - **Property 20: Overdue Status Auto-Update**
  - **Validates: Requirements 5.6**

- [ ]* 6.8 Write property test for payment date recording
  - **Property 21: Payment Date Recording on Status Change**
  - **Validates: Requirements 5.7**

## Phase 7: Device Management

- [ ] 7. Implement device management
- [ ] 7.1 Create Device model and migration
  - Define Device entity
  - Create migration for devices table
  - Add indexes for tenant_id, status
  - _Requirements: 6.1-6.7_

- [ ] 7.2 Implement credential encryption utilities
  - Create encryption function using AES-256
  - Create decryption function
  - Store encryption key in environment variable
  - _Requirements: 6.3_

- [ ] 7.3 Create DeviceRepository
  - Implement CRUD operations
  - Encrypt passwords before save
  - Mask passwords in query results
  - _Requirements: 6.1-6.7_

- [ ] 7.4 Create DeviceService
  - Implement Create with validation
  - Implement GetByID (mask password)
  - Implement List (mask passwords)
  - Implement Update
  - Implement Delete with dependency check
  - Implement CheckStatus (ping/connect)
  - _Requirements: 6.1-6.7_

- [ ] 7.5 Create device HTTP handlers
  - Implement GET /devices
  - Implement GET /devices/:id
  - Implement POST /devices
  - Implement PUT /devices/:id
  - Implement DELETE /devices/:id
  - Implement GET /devices/:id/status
  - _Requirements: 6.1-6.7_


- [ ]* 7.6 Write property test for IP address validation
  - **Property 22: IP Address Format Validation**
  - **Validates: Requirements 6.2**

- [ ]* 7.7 Write property test for credential encryption
  - **Property 23: Credential Encryption**
  - **Validates: Requirements 6.3, 6.4**

- [ ]* 7.8 Write property test for device status update
  - **Property 24: Device Status Update on Unreachable**
  - **Validates: Requirements 6.6**

## Phase 8: MikroTik Integration

- [ ] 8. Implement MikroTik router integration
- [ ] 8.1 Create MikroTikRouter model and migration
  - Define MikroTikRouter entity
  - Create migration for mikrotik_routers table
  - Add indexes for tenant_id, is_active
  - _Requirements: 7.1-7.7_

- [ ] 8.2 Implement MikroTik API client
  - Create MikroTikClient interface
  - Implement Connect method
  - Implement ExecuteCommand method
  - Implement Close method
  - Use routeros library for API communication
  - _Requirements: 7.1-7.6_

- [ ] 8.3 Create MikroTikRouterRepository
  - Implement CRUD operations
  - Encrypt passwords before save
  - _Requirements: 7.1-7.4_

- [ ] 8.4 Create MikroTikService
  - Implement CreatePPPoESecret
  - Implement UpdatePPPoESecret
  - Implement DeletePPPoESecret
  - Implement DisablePPPoESecret
  - Implement EnablePPPoESecret
  - Implement GetActiveSession
  - Implement DisconnectSession
  - _Requirements: 7.2-7.6_

- [ ] 8.5 Implement operation queue for MikroTik operations
  - Create queue using RabbitMQ
  - Implement retry logic with exponential backoff
  - Implement dead letter queue for failed operations
  - _Requirements: 7.6_

- [ ] 8.6 Create MikroTik router HTTP handlers
  - Implement GET /mikrotik/routers
  - Implement GET /mikrotik/routers/:id
  - Implement POST /mikrotik/routers
  - Implement PUT /mikrotik/routers/:id
  - Implement DELETE /mikrotik/routers/:id
  - _Requirements: 7.1-7.4_

- [ ]* 8.7 Write property test for PPPoE secret creation
  - **Property 25: PPPoE Secret Creation on Customer Activation**
  - **Validates: Requirements 7.2**

- [ ]* 8.8 Write property test for PPPoE profile update
  - **Property 26: PPPoE Profile Update on Plan Change**
  - **Validates: Requirements 7.3**

- [ ]* 8.9 Write property test for PPPoE secret disable
  - **Property 27: PPPoE Secret Disable on Suspension**
  - **Validates: Requirements 7.4**

- [ ]* 8.10 Write property test for PPPoE secret removal
  - **Property 28: PPPoE Secret Removal on Termination**
  - **Validates: Requirements 7.5**

- [ ]* 8.11 Write property test for operation queueing
  - **Property 29: Operation Queueing on Connection Failure**
  - **Validates: Requirements 7.6**


## Phase 9: Ticketing System

- [ ] 9. Implement support ticket management
- [ ] 9.1 Create Ticket model and migration
  - Define Ticket entity
  - Create migration for tickets table
  - Add indexes for tenant_id, customer_id, status, priority
  - _Requirements: 8.1-8.7_

- [ ] 9.2 Create ticket number generator
  - Generate unique ticket numbers
  - Format: TKT + year + month + sequential
  - _Requirements: 8.2_

- [ ] 9.3 Create TicketRepository
  - Implement CRUD operations
  - Implement FindByCustomer method
  - Implement FindByStatus method
  - Implement FindByPriority method
  - _Requirements: 8.1-8.6_

- [ ] 9.4 Implement ticket status state machine
  - Define valid status transitions
  - Validate transitions on update
  - Reject invalid transitions
  - _Requirements: 8.4_

- [ ] 9.5 Create TicketService
  - Implement Create with validation
  - Implement GetByID
  - Implement List with filters
  - Implement Update
  - Implement UpdateStatus with validation
  - Implement AssignTo
  - _Requirements: 8.1-8.6_

- [ ] 9.6 Create ticket HTTP handlers
  - Implement GET /tickets
  - Implement GET /tickets/:id
  - Implement POST /tickets
  - Implement PUT /tickets/:id
  - Implement PUT /tickets/:id/status
  - Implement PUT /tickets/:id/assign
  - _Requirements: 8.1-8.4_

- [ ]* 9.7 Write property test for ticket initial state
  - **Property 30: Ticket Initial State**
  - **Validates: Requirements 8.2**

- [ ]* 9.8 Write property test for status transitions
  - **Property 31: Ticket Status Transition Validation**
  - **Validates: Requirements 8.4**

- [ ]* 9.9 Write property test for resolution timestamp
  - **Property 32: Resolution Timestamp Recording**
  - **Validates: Requirements 8.6**

## Phase 10: Speed Boost Management

- [ ] 10. Implement speed boost feature
- [ ] 10.1 Create SpeedBoost model and migration
  - Define SpeedBoost entity
  - Create migration for speed_boost_requests table
  - Add indexes for tenant_id, customer_id, status
  - _Requirements: 9.1-9.7_

- [ ] 10.2 Create SpeedBoostRepository
  - Implement CRUD operations
  - Implement FindByCustomer method
  - Implement FindByStatus method
  - Implement FindExpired method
  - _Requirements: 9.1-9.6_

- [ ] 10.3 Implement price calculation logic
  - Calculate price based on duration and plan difference
  - Consider pro-rated pricing
  - _Requirements: 9.2_

- [ ] 10.4 Create SpeedBoostService
  - Implement CreateRequest with validation
  - Implement GetByID
  - Implement List with filters
  - Implement Approve (update MikroTik)
  - Implement Reject
  - Implement Activate
  - Implement CheckExpiredBoosts (scheduled job)
  - _Requirements: 9.1-9.6_

- [ ] 10.5 Create speed boost HTTP handlers
  - Implement GET /speed-boost
  - Implement GET /speed-boost/:id
  - Implement POST /speed-boost
  - Implement POST /speed-boost/:id/approve
  - Implement POST /speed-boost/:id/reject
  - Implement POST /speed-boost/:id/activate
  - _Requirements: 9.1-9.4_


- [ ]* 10.6 Write property test for price calculation
  - **Property 33: Speed Boost Price Calculation**
  - **Validates: Requirements 9.2**

- [ ]* 10.7 Write property test for date calculation
  - **Property 34: Speed Boost Date Calculation**
  - **Validates: Requirements 9.4**

- [ ]* 10.8 Write property test for auto-expiration
  - **Property 35: Speed Boost Auto-Expiration**
  - **Validates: Requirements 9.5**

- [ ]* 10.9 Write property test for rejection reason
  - **Property 36: Rejection Reason Recording**
  - **Validates: Requirements 9.6**

## Phase 11: Monitoring and Analytics

- [ ] 11. Implement monitoring system
- [ ] 11.1 Create MonitoringData model and migration
  - Define MonitoringData entity
  - Create migration for monitoring_data table
  - Add indexes for tenant_id, customer_id, timestamp
  - Add time-based partitioning for large datasets
  - _Requirements: 10.1-10.7_

- [ ] 11.2 Create MonitoringRepository
  - Implement Create method
  - Implement FindByCustomer method
  - Implement FindByTimeRange method
  - Implement AggregateByPeriod method
  - _Requirements: 10.1-10.7_

- [ ] 11.3 Create MonitoringService
  - Implement GetCustomerMonitoring
  - Implement GetNetworkOverview
  - Implement RecordBandwidthUsage
  - Implement GenerateAlert
  - Implement GetAlerts
  - _Requirements: 10.1-10.7_

- [ ] 11.4 Implement monitoring data collection worker
  - Create background worker to collect data from MikroTik
  - Schedule collection every 5 minutes
  - Store data in monitoring_data table
  - _Requirements: 10.1_

- [ ] 11.5 Create monitoring HTTP handlers
  - Implement GET /monitoring/customers/:id
  - Implement GET /monitoring/network
  - Implement GET /monitoring/alerts
  - _Requirements: 10.1, 10.2_

- [ ]* 11.6 Write property test for bandwidth aggregation
  - **Property 37: Bandwidth Aggregation Accuracy**
  - **Validates: Requirements 10.3**

- [ ]* 11.7 Write property test for network overview
  - **Property 38: Network Overview Calculation**
  - **Validates: Requirements 10.4**

- [ ]* 11.8 Write property test for alert generation on threshold
  - **Property 39: Alert Generation on Threshold Breach**
  - **Validates: Requirements 10.5**

- [ ]* 11.9 Write property test for alert generation on offline
  - **Property 40: Alert Generation on Device Offline**
  - **Validates: Requirements 10.6**

## Phase 12: Dashboard and Statistics

- [ ] 12. Implement dashboard API
- [ ] 12.1 Create DashboardService
  - Implement GetStatistics method
  - Calculate customer counts by status
  - Calculate revenue for current and previous month
  - Calculate revenue growth percentage
  - Count tickets by status
  - Calculate network bandwidth usage
  - _Requirements: 11.1-11.5_

- [ ] 12.2 Implement caching for dashboard statistics
  - Cache statistics in Redis with 5-minute TTL
  - Implement cache invalidation on data changes
  - _Requirements: 11.6, 11.7_

- [ ] 12.3 Create dashboard HTTP handler
  - Implement GET /dashboard/stats
  - _Requirements: 11.1-11.5_


- [ ]* 12.4 Write property test for revenue calculation
  - **Property 41: Revenue Calculation Accuracy**
  - **Validates: Requirements 11.2**

- [ ]* 12.5 Write property test for revenue growth
  - **Property 42: Revenue Growth Calculation**
  - **Validates: Requirements 11.3**

- [ ]* 12.6 Write property test for bandwidth percentage
  - **Property 43: Bandwidth Usage Percentage Calculation**
  - **Validates: Requirements 11.5**

- [ ]* 12.7 Write property test for cache expiration
  - **Property 44: Cache Expiration Refresh**
  - **Validates: Requirements 11.7**

## Phase 13: Audit Logging

- [ ] 13. Implement audit trail system
- [ ] 13.1 Create AuditLog model and migration
  - Define AuditLog entity
  - Create migration for audit_logs table
  - Add indexes for tenant_id, user_id, entity_type, timestamp
  - _Requirements: 12.1-12.7_

- [ ] 13.2 Create AuditLogRepository
  - Implement Create method (no update/delete)
  - Implement FindAll with filters
  - _Requirements: 12.1-12.7_

- [ ] 13.3 Create AuditLogService
  - Implement Log method
  - Implement GetLogs method with filters
  - _Requirements: 12.1-12.5_

- [ ] 13.4 Implement audit logging middleware
  - Intercept all create/update/delete operations
  - Capture old and new values
  - Record user, IP, timestamp
  - Log asynchronously to avoid performance impact
  - _Requirements: 12.1-12.4_

- [ ] 13.5 Implement audit log immutability
  - Prevent update operations on audit_logs table
  - Prevent delete operations on audit_logs table
  - Return error if attempted
  - _Requirements: 12.7_

- [ ] 13.6 Create audit log HTTP handler
  - Implement GET /audit-logs
  - _Requirements: 12.5_

- [ ]* 13.7 Write property test for audit log creation
  - **Property 45: Audit Log Creation on CRUD Operations**
  - **Validates: Requirements 12.1, 12.2, 12.3**

- [ ]* 13.8 Write property test for audit log completeness
  - **Property 46: Audit Log Completeness**
  - **Validates: Requirements 12.4**

- [ ]* 13.9 Write property test for audit log immutability
  - **Property 47: Audit Log Immutability**
  - **Validates: Requirements 12.7**

## Phase 14: Infrastructure Management

- [ ] 14. Implement infrastructure inventory
- [ ] 14.1 Create InfrastructureItem model and migration
  - Define InfrastructureItem entity
  - Create migration for infrastructure_items table
  - Add indexes for tenant_id, type, location
  - Add soft delete support
  - _Requirements: 13.1-13.7_

- [ ] 14.2 Create InfrastructureRepository
  - Implement CRUD operations
  - Implement FindByType method
  - Implement FindByLocation method
  - Implement SoftDelete method
  - _Requirements: 13.1-13.7_

- [ ] 14.3 Create InfrastructureService
  - Implement Create with validation
  - Implement GetByID
  - Implement List with filters
  - Implement Update (track quantity changes in audit)
  - Implement Delete (soft delete)
  - Implement CheckLowStock
  - _Requirements: 13.1-13.7_

- [ ] 14.4 Create infrastructure HTTP handlers
  - Implement GET /infrastructure
  - Implement GET /infrastructure/:id
  - Implement POST /infrastructure
  - Implement PUT /infrastructure/:id
  - Implement DELETE /infrastructure/:id
  - _Requirements: 13.1-13.4_


- [ ]* 14.5 Write property test for quantity change audit
  - **Property 48: Quantity Change Audit Tracking**
  - **Validates: Requirements 13.3**

- [ ]* 14.6 Write property test for low stock alert
  - **Property 49: Low Stock Alert Generation**
  - **Validates: Requirements 13.5**

## Phase 15: Security and Rate Limiting

- [ ] 15. Implement security features
- [ ] 15.1 Implement rate limiting middleware
  - Create rate limiter using Redis
  - Set global limit: 1000 req/min per IP
  - Set user limit: 100 req/min per user
  - Set login limit: 5 attempts/min per IP
  - Return 429 when limit exceeded
  - _Requirements: 14.1, 14.2_

- [ ] 15.2 Implement IP blocking for suspicious activity
  - Detect patterns: rapid failed logins, unusual access patterns
  - Block IP temporarily (1 hour)
  - Store blocked IPs in Redis
  - _Requirements: 14.3_

- [ ] 15.3 Implement input validation and sanitization
  - Create validation middleware
  - Validate all input using struct tags
  - Sanitize string inputs to prevent XSS
  - Use parameterized queries (GORM) to prevent SQL injection
  - _Requirements: 14.4, 14.5_

- [ ] 15.4 Implement CORS middleware
  - Configure allowed origins from environment
  - Set allowed methods and headers
  - _Requirements: 14.7_

- [ ]* 15.5 Write property test for rate limit enforcement
  - **Property 50: Rate Limit Enforcement**
  - **Validates: Requirements 14.1**

- [ ]* 15.6 Write property test for IP blocking
  - **Property 51: IP Blocking on Suspicious Activity**
  - **Validates: Requirements 14.3**

- [ ]* 15.7 Write property test for SQL injection prevention
  - **Property 52: SQL Injection Prevention**
  - **Validates: Requirements 14.4**

- [ ]* 15.8 Write property test for XSS prevention
  - **Property 53: XSS Prevention**
  - **Validates: Requirements 14.5**

## Phase 16: Backup and Recovery

- [ ] 16. Implement backup system
- [ ] 16.1 Create backup service
  - Implement CreateBackup method
  - Compress backup using gzip
  - Encrypt backup using AES-256
  - Store backup with timestamp filename
  - _Requirements: 15.1-15.7_

- [ ] 16.2 Implement scheduled backup job
  - Create cron job for daily backups
  - Run at 2 AM server time
  - Retain backups for 30 days
  - Delete old backups automatically
  - _Requirements: 15.1, 15.3_

- [ ] 16.3 Implement backup failure notification
  - Send email to administrators on failure
  - Include error details in notification
  - _Requirements: 15.4_

- [ ] 16.4 Implement restore functionality
  - Create RestoreBackup method
  - Validate backup integrity before restore
  - Verify checksum
  - Decrypt and decompress backup
  - _Requirements: 15.7_

- [ ] 16.5 Create backup HTTP handlers
  - Implement POST /backup/create (manual trigger)
  - Implement GET /backup/list
  - Implement POST /backup/restore
  - _Requirements: 15.5_

- [ ]* 16.6 Write property test for backup compression and encryption
  - **Property 54: Backup Compression and Encryption**
  - **Validates: Requirements 15.2**

- [ ]* 16.7 Write property test for backup failure notification
  - **Property 55: Backup Failure Notification**
  - **Validates: Requirements 15.4**

- [ ]* 16.8 Write property test for backup integrity validation
  - **Property 56: Backup Integrity Validation**
  - **Validates: Requirements 15.7**


## Phase 17: WebSocket Real-time Updates

- [ ] 17. Implement WebSocket support
- [ ] 17.1 Create WebSocket hub
  - Implement Hub with client management
  - Implement Register/Unregister methods
  - Implement Broadcast method
  - Implement BroadcastToTenant method
  - Implement BroadcastToUser method
  - _Requirements: 16.1-16.7_

- [ ] 17.2 Create WebSocket client handler
  - Implement WebSocket upgrade handler
  - Implement authentication using JWT
  - Implement message reading/writing
  - Implement ping/pong for connection health
  - _Requirements: 16.6_

- [ ] 17.3 Implement event broadcasting
  - Broadcast customer:created on customer creation
  - Broadcast payment:created on payment creation
  - Broadcast ticket:created/updated on ticket changes
  - Broadcast device:status on device status change
  - Broadcast monitoring:update on monitoring data
  - _Requirements: 16.1-16.5_

- [ ] 17.4 Implement WebSocket resource cleanup
  - Clean up on client disconnect
  - Remove from hub
  - Close connections properly
  - _Requirements: 16.7_

- [ ] 17.5 Create WebSocket endpoint
  - Implement GET /ws
  - _Requirements: 16.1-16.7_

- [ ]* 17.6 Write property test for event broadcasting
  - **Property 57: Event Broadcasting on Entity Changes**
  - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**

- [ ]* 17.7 Write property test for resource cleanup
  - **Property 58: WebSocket Resource Cleanup**
  - **Validates: Requirements 16.7**

## Phase 18: Email Notifications

- [ ] 18. Implement email notification system
- [ ] 18.1 Create email service
  - Implement SendEmail method
  - Implement SendTemplateEmail method
  - Configure SMTP settings from environment
  - Support multiple email providers (SMTP, SendGrid, etc.)
  - _Requirements: 17.1-17.7_

- [ ] 18.2 Create email templates
  - Create template for overdue payment notification
  - Create template for ticket creation notification
  - Create template for speed boost approval
  - Create template for device offline alert
  - Support variable substitution in templates
  - _Requirements: 17.1-17.4, 17.5_

- [ ] 18.3 Implement email queue
  - Create queue using RabbitMQ
  - Implement QueueEmail method
  - Implement email worker to process queue
  - _Requirements: 17.6_

- [ ] 18.4 Implement email retry logic
  - Retry failed emails up to 3 times
  - Use exponential backoff between retries
  - Move to dead letter queue after 3 failures
  - _Requirements: 17.7_

- [ ] 18.5 Integrate email notifications with events
  - Send email on payment overdue
  - Send email on ticket creation
  - Send email on speed boost approval
  - Send email on device offline
  - _Requirements: 17.1-17.4_

- [ ]* 18.6 Write property test for email notification on events
  - **Property 59: Email Notification on Events**
  - **Validates: Requirements 17.1, 17.2, 17.3, 17.4**

- [ ]* 18.7 Write property test for email retry
  - **Property 60: Email Retry on Failure**
  - **Validates: Requirements 17.7**

## Phase 19: Data Export and Reporting

- [ ] 19. Implement export and reporting
- [ ] 19.1 Create export service
  - Implement ExportToCSV method
  - Implement ExportToExcel method
  - Support customer data export
  - Support payment data export
  - Support ticket data export
  - _Requirements: 18.1-18.7_

- [ ] 19.2 Implement report generation
  - Create revenue report generator
  - Create customer growth report generator
  - Create payment report generator
  - Support date range filtering
  - _Requirements: 18.3, 18.4_


- [ ] 19.3 Implement async report generation for large datasets
  - Queue report generation jobs
  - Process in background worker
  - Notify user when complete
  - Store generated reports temporarily
  - _Requirements: 18.5_

- [ ] 19.4 Implement permission enforcement for exports
  - Check user permissions before export
  - Filter data by tenant
  - Respect role-based access control
  - _Requirements: 18.7_

- [ ] 19.5 Create export HTTP handlers
  - Implement GET /export/customers
  - Implement GET /export/payments
  - Implement GET /export/tickets
  - Implement POST /reports/revenue
  - Implement POST /reports/customer-growth
  - Implement POST /reports/payments
  - _Requirements: 18.1-18.4_

- [ ]* 19.6 Write property test for export completeness
  - **Property 61: Export Data Completeness**
  - **Validates: Requirements 18.2**

- [ ]* 19.7 Write property test for date range filtering
  - **Property 62: Export Date Range Filtering**
  - **Validates: Requirements 18.3**

- [ ]* 19.8 Write property test for permission enforcement
  - **Property 63: Export Permission Enforcement**
  - **Validates: Requirements 18.7**

## Phase 20: API Documentation

- [ ] 20. Implement API documentation
- [ ] 20.1 Set up Swagger/OpenAPI
  - Install swaggo/swag
  - Configure Swagger in main.go
  - Set up Swagger UI endpoint at /swagger
  - _Requirements: 20.1-20.7_

- [ ] 20.2 Add Swagger annotations to all handlers
  - Document all endpoints with @Summary, @Description
  - Document request bodies with @Param
  - Document responses with @Success, @Failure
  - Include example requests and responses
  - _Requirements: 20.1, 20.2, 20.3_

- [ ] 20.3 Document authentication flow
  - Document login endpoint
  - Document token refresh endpoint
  - Document logout endpoint
  - Include JWT token usage examples
  - _Requirements: 20.4_

- [ ] 20.4 Document WebSocket events
  - Create separate documentation for WebSocket
  - List all event types
  - Include event payload examples
  - _Requirements: 20.5_

- [ ] 20.5 Generate and serve Swagger documentation
  - Run swag init to generate docs
  - Serve Swagger UI at /swagger/index.html
  - Enable interactive API testing
  - _Requirements: 20.6_

## Phase 21: Testing and Quality Assurance

- [ ] 21. Comprehensive testing
- [ ] 21.1 Set up testing infrastructure
  - Configure testcontainers for PostgreSQL
  - Configure testcontainers for Redis
  - Set up test database migrations
  - Create test data fixtures

- [ ] 21.2 Write integration tests for all API endpoints
  - Test authentication endpoints
  - Test customer endpoints
  - Test service plan endpoints
  - Test payment endpoints
  - Test device endpoints
  - Test MikroTik router endpoints
  - Test ticket endpoints
  - Test speed boost endpoints
  - Test monitoring endpoints
  - Test dashboard endpoints
  - Test audit log endpoints
  - Test infrastructure endpoints

- [ ] 21.3 Set up CI/CD pipeline
  - Configure GitHub Actions or GitLab CI
  - Run tests on every commit
  - Run linting (golangci-lint)
  - Check code coverage (minimum 80%)
  - Build Docker image
  - Deploy to staging on main branch

- [ ] 21.4 Perform load testing
  - Use k6 or Apache JMeter
  - Test with 1000 concurrent users
  - Identify performance bottlenecks
  - Optimize slow queries

- [ ] 21.5 Perform security testing
  - Test authentication and authorization
  - Test input validation
  - Test rate limiting
  - Test SQL injection prevention
  - Test XSS prevention

## Phase 22: Deployment and Operations

- [ ] 22. Prepare for production deployment
- [ ] 22.1 Create Docker configuration
  - Create Dockerfile for application
  - Create docker-compose.yml for local development
  - Include PostgreSQL, Redis, RabbitMQ services
  - Configure environment variables

- [ ] 22.2 Create Kubernetes manifests (optional)
  - Create deployment manifests
  - Create service manifests
  - Create ingress configuration
  - Configure auto-scaling

- [ ] 22.3 Set up monitoring and logging
  - Configure Prometheus metrics
  - Set up Grafana dashboards
  - Configure log aggregation (ELK or Loki)
  - Set up alerting rules

- [ ] 22.4 Create deployment documentation
  - Document environment variables
  - Document database migration process
  - Document backup and restore procedures
  - Document scaling procedures

- [ ] 22.5 Perform production deployment
  - Deploy to production environment
  - Run database migrations
  - Verify all services are running
  - Monitor for errors

## Final Checkpoint

- [ ] 23. Final verification
  - Ensure all tests pass
  - Verify all API endpoints work correctly
  - Verify WebSocket connections work
  - Verify email notifications work
  - Verify MikroTik integration works
  - Verify backup and restore works
  - Review security configurations
  - Review performance metrics
  - Ask the user if questions arise
