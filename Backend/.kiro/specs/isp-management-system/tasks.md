# Implementation Plan - ISP Management System

## Phase 1: Core Customer & Service Plan Management (Already Implemented)

- [x] 1. Set up project structure and core interfaces
  - Created directory structure for models, services, repositories, and API components
  - Defined domain entities and repository interfaces
  - Set up database migrations
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Implement customer management
  - Created Customer entity with all required fields
  - Implemented CustomerRepository with CRUD operations
  - Integrated customer management into dashboard service and handler
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 3. Implement service plan management
  - Created ServicePlan entity with basic and advanced configurations
  - Implemented ServicePlanRepository
  - Integrated service plan management into dashboard
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Implement payment management
  - Created Payment entity
  - Implemented PaymentRepository with filtering and aggregation
  - Integrated payment recording and tracking into dashboard
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

## Phase 2: Ticket Management System

- [x] 5. Implement ticket repository and service
- [x] 5.1 Create ticket repository interface and implementation
  - Implement TicketRepository in internal/domain/repository/ticket_repository.go
  - Implement PostgreSQL ticket repository in internal/repository/postgres/ticket_repository.go
  - Include methods: Create, Update, GetByID, GetByTicketNumber, List, Delete
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 5.2 Create ticket activity repository
  - Implement TicketActivityRepository methods: CreateActivity, GetActivitiesByTicketID
  - Add to ticket repository implementation
  - _Requirements: 4.7_

- [x] 5.3 Implement ticket service
  - Create TicketService in internal/usecase/ticket_service.go
  - Implement business logic: CreateTicket, UpdateTicket, AssignTicket, ResolveTicket, CloseTicket
  - Generate unique ticket numbers
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 5.4 Create ticket handler and routes
  - Create TicketHandler in internal/delivery/http/handler/ticket_handler.go
  - Implement HTTP handlers for all ticket operations
  - Add ticket routes to router
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 5.5 Write property test for ticket number uniqueness
  - **Property 1: Ticket number uniqueness**
  - **Validates: Requirements 4.1**

- [ ]* 5.6 Write property test for ticket status transitions
  - **Property 2: Ticket status transition validity**
  - **Validates: Requirements 4.2, 4.4_

- [ ]* 5.7 Write unit tests for ticket service
  - Test ticket creation with validation
  - Test ticket assignment and resolution
  - Test ticket activity logging
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

## Phase 3: Network Infrastructure Management

- [x] 6. Implement infrastructure repository and service
- [x] 6.1 Create infrastructure repository interfaces
  - Create InfrastructureRepository in internal/domain/repository/infrastructure_repository.go
  - Define methods for OLT, ODC, and ODP operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6.2 Implement PostgreSQL infrastructure repository
  - Create infrastructure_repository.go in internal/repository/postgres/
  - Implement OLT operations: CreateOLT, UpdateOLT, GetOLTByID, ListOLTs, DeleteOLT
  - Implement ODC operations: CreateODC, UpdateODC, GetODCByID, ListODCs, DeleteODC
  - Implement ODP operations: CreateODP, UpdateODP, GetODPByID, ListODPs, DeleteODP
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 6.3 Create database migrations for infrastructure tables
  - Create migration for OLT table
  - Create migration for ODC table with OLT foreign key
  - Create migration for ODP table with ODC foreign key
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6.4 Implement infrastructure service
  - Create InfrastructureService in internal/usecase/infrastructure_service.go
  - Implement business logic for hierarchical infrastructure management
  - Add validation for capacity and relationships
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 6.5 Create infrastructure handler and routes
  - Create InfrastructureHandler in internal/delivery/http/handler/infrastructure_handler.go
  - Implement HTTP handlers for OLT, ODC, ODP operations
  - Add infrastructure routes to router
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ]* 6.6 Write property test for infrastructure hierarchy
  - **Property 3: Infrastructure hierarchy consistency**
  - **Validates: Requirements 5.2, 5.3, 5.5**

- [ ]* 6.7 Write unit tests for infrastructure service
  - Test OLT/ODC/ODP creation and relationships
  - Test capacity validation
  - Test hierarchical queries
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

## Phase 4: Device Management & Mikrotik Integration

- [x] 7. Implement device repository and service
- [x] 7.1 Create device repository interface and implementation
  - Create DeviceRepository in internal/domain/repository/device_repository.go
  - Implement PostgreSQL device repository in internal/repository/postgres/device_repository.go
  - Include methods: Create, Update, GetByID, GetBySerialNumber, List, Delete, UpdateConnectionStatus, GetMikrotikDevices
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 7.2 Create database migration for devices table
  - Create migration with all device fields including Mikrotik-specific fields
  - Add indexes for serial_number, MAC address, and customer_id
  - _Requirements: 6.1, 6.2_

- [x] 7.3 Implement device service
  - Create DeviceService in internal/usecase/device_service.go
  - Implement device CRUD operations
  - Add password encryption for Mikrotik credentials
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 12.7_

- [x] 7.4 Implement Mikrotik integration service
  - Create MikrotikService in internal/usecase/mikrotik_service.go
  - Implement Mikrotik API client for connection, queue management
  - Add methods: Connect, Disconnect, CreateQueue, UpdateQueue, DeleteQueue, GetQueueList, TestConnection
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 7.5 Integrate Mikrotik automation with service plans
  - Add auto-apply logic when service plan changes
  - Implement queue configuration from service plan templates
  - Add retry logic with exponential backoff for failures
  - _Requirements: 12.2, 12.3, 12.4, 12.5_

- [x] 7.6 Create device handler and routes
  - Create DeviceHandler in internal/delivery/http/handler/device_handler.go
  - Implement HTTP handlers for device operations
  - Add Mikrotik test connection endpoint
  - Add device routes to router
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 12.6_

- [ ]* 7.7 Write property test for device serial number uniqueness
  - **Property 4: Device serial number uniqueness**
  - **Validates: Requirements 6.1**

- [ ]* 7.8 Write property test for Mikrotik password encryption
  - **Property 5: Mikrotik credentials encryption**
  - **Validates: Requirements 12.7**

- [ ]* 7.9 Write unit tests for device service and Mikrotik integration
  - Test device CRUD operations
  - Test Mikrotik connection and queue management
  - Test password encryption/decryption
  - Test auto-apply queue configuration
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

## Phase 5: Monitoring Data Collection

- [ ] 8. Implement monitoring repository and service
- [ ] 8.1 Create monitoring repository interface and implementation
  - Create MonitoringRepository in internal/domain/repository/monitoring_repository.go
  - Implement PostgreSQL monitoring repository in internal/repository/postgres/monitoring_repository.go
  - Include methods: Create, GetByCustomerID, GetLatestByCustomerID, List, DeleteOldData
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 8.2 Create database migration for monitoring_data table
  - Create migration with time-series optimized indexes
  - Add composite index on (tenant_id, customer_id, timestamp)
  - _Requirements: 7.1, 7.6_

- [ ] 8.3 Implement monitoring service
  - Create MonitoringService in internal/usecase/monitoring_service.go
  - Implement data recording and retrieval
  - Add time-series aggregation for trends
  - Implement threshold checking for alerts
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 8.4 Create monitoring handler and routes
  - Create MonitoringHandler in internal/delivery/http/handler/monitoring_handler.go
  - Implement HTTP handlers for recording and querying monitoring data
  - Add customer monitoring dashboard endpoint
  - Add monitoring routes to router
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.5 Write property test for monitoring timestamp ordering
  - **Property 6: Monitoring data timestamp consistency**
  - **Validates: Requirements 7.6**

- [ ]* 8.6 Write unit tests for monitoring service
  - Test data recording and retrieval
  - Test time-series queries
  - Test threshold detection
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

## Phase 6: Speed Boost Management

- [ ] 9. Implement speed boost repository and service
- [ ] 9.1 Create speed boost repository interfaces
  - Create SpeedBoostRepository in internal/domain/repository/speed_boost_repository.go
  - Define methods for requests and history
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 9.2 Implement PostgreSQL speed boost repository
  - Create speed_boost_repository.go in internal/repository/postgres/
  - Implement methods: CreateRequest, UpdateRequest, GetRequestByID, ListRequests
  - Implement methods: CreateHistory, GetActiveBoostByCustomerID, DeactivateExpiredBoosts
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 9.3 Create database migrations for speed boost tables
  - Create migration for speed_boost_requests table
  - Create migration for speed_boost_history table
  - _Requirements: 8.1, 8.6_

- [ ] 9.4 Implement speed boost service
  - Create SpeedBoostService in internal/usecase/speed_boost_service.go
  - Implement request workflow: CreateRequest, ApproveRequest, RejectRequest
  - Implement boost activation and deactivation
  - Add price calculation logic
  - Add expiration checking
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 9.5 Integrate speed boost with Mikrotik
  - Add queue update logic when boost is activated
  - Add queue restoration when boost expires
  - _Requirements: 8.2, 8.4, 12.3_

- [ ] 9.6 Create speed boost handler and routes
  - Create SpeedBoostHandler in internal/delivery/http/handler/speed_boost_handler.go
  - Implement HTTP handlers for request management
  - Add speed boost routes to router
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ]* 9.7 Write property test for speed boost expiration
  - **Property 7: Speed boost expiration consistency**
  - **Validates: Requirements 8.4, 8.7**

- [ ]* 9.8 Write unit tests for speed boost service
  - Test request creation and approval workflow
  - Test price calculation
  - Test activation and expiration
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

## Phase 7: Service Plan Change Tracking

- [ ] 10. Implement service plan change tracking
- [ ] 10.1 Create service plan change entity and repository
  - Create ServicePlanChange entity in internal/domain/entity/
  - Add repository methods to ServicePlanRepository for change tracking
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 10.2 Create database migration for service_plan_changes table
  - Create migration with old_plan_id, new_plan_id, effective_date fields
  - _Requirements: 9.1, 9.4_

- [ ] 10.3 Implement service plan change logic in customer service
  - Add ChangeServicePlan method to CustomerService
  - Implement scheduled plan changes with effective dates
  - Record change history with reason and performer
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 10.4 Add service plan change endpoints
  - Add change plan endpoint to customer handler
  - Add get plan change history endpoint
  - _Requirements: 9.1, 9.2, 9.3, 9.7_

- [ ]* 10.5 Write property test for plan change history
  - **Property 8: Service plan change history completeness**
  - **Validates: Requirements 9.1, 9.2, 9.3**

- [ ]* 10.6 Write unit tests for service plan change tracking
  - Test plan change recording
  - Test scheduled changes
  - Test change history retrieval
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

## Phase 8: Audit Logging System

- [ ] 11. Implement audit logging
- [ ] 11.1 Create audit log repository interface and implementation
  - Create AuditLogRepository in internal/domain/repository/audit_log_repository.go
  - Implement PostgreSQL audit log repository in internal/repository/postgres/audit_log_repository.go
  - Include methods: Create, GetByID, List, GetByCustomerID
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 11.2 Create database migration for audit_logs table
  - Create migration with full-text search index on description
  - Add indexes for filtering by customer, action, category, date
  - _Requirements: 10.1, 10.7_

- [ ] 11.3 Implement audit logging service
  - Create AuditLogService in internal/usecase/audit_log_service.go
  - Implement LogAction method with old/new value tracking
  - Add sensitive data masking
  - Implement full-text search
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 11.4 Integrate audit logging across all services
  - Add audit logging to customer service operations
  - Add audit logging to payment operations
  - Add audit logging to service plan changes
  - Add audit logging to ticket operations
  - Add audit logging to device operations
  - _Requirements: 1.7, 3.7, 9.6, 10.1, 10.2, 10.3_

- [ ] 11.5 Create audit log handler and routes
  - Create AuditLogHandler in internal/delivery/http/handler/audit_log_handler.go
  - Implement HTTP handlers for querying audit logs
  - Add audit log routes to router
  - _Requirements: 10.4, 10.7_

- [ ]* 11.6 Write property test for audit log completeness
  - **Property 9: Audit log action recording**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ]* 11.7 Write unit tests for audit logging
  - Test audit log creation
  - Test sensitive data masking
  - Test full-text search
  - Test filtering and pagination
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

## Phase 9: Multi-Tenant Data Isolation & Security

- [ ] 12. Enhance multi-tenant security
- [ ] 12.1 Review and strengthen tenant middleware
  - Verify tenant_id extraction from JWT
  - Add tenant validation on all protected routes
  - _Requirements: 11.1, 11.2, 11.6_

- [ ] 12.2 Add tenant ownership validation to all repositories
  - Add tenant_id checks to all query methods
  - Prevent cross-tenant data access
  - _Requirements: 11.1, 11.3, 11.4, 11.5, 11.7_

- [ ] 12.3 Implement foreign key tenant validation
  - Add validation that related records belong to same tenant
  - Implement in all services before creating relationships
  - _Requirements: 11.5_

- [ ] 12.4 Add cross-tenant access logging
  - Log attempted cross-tenant access in audit logs
  - _Requirements: 11.3_

- [ ]* 12.5 Write property test for tenant data isolation
  - **Property 10: Tenant data isolation**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [ ]* 12.6 Write integration tests for multi-tenant scenarios
  - Test data isolation between tenants
  - Test cross-tenant access prevention
  - Test foreign key validation
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

## Phase 10: Reporting & Analytics

- [ ] 13. Implement reporting and analytics
- [ ] 13.1 Enhance dashboard service with analytics
  - Add revenue report by period
  - Add customer growth report
  - Add service plan distribution report
  - Add payment collection statistics
  - Add ticket statistics
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 13.2 Add analytics endpoints to dashboard handler
  - Add revenue report endpoint
  - Add customer growth endpoint
  - Add service plan distribution endpoint
  - Add payment statistics endpoint
  - Add ticket statistics endpoint
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 13.3 Implement report export functionality
  - Add CSV export for reports
  - Add PDF export for reports
  - _Requirements: 13.7_

- [ ]* 13.4 Write unit tests for reporting
  - Test revenue calculations
  - Test customer growth metrics
  - Test report generation
  - Test export functionality
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

## Phase 11: Data Validation & Business Rules

- [ ] 14. Enhance validation across all services
- [ ] 14.1 Implement comprehensive input validation
  - Add validation for customer data (email, phone, required fields)
  - Add validation for payment amounts and dates
  - Add validation for service plan bandwidth values
  - Add validation for date ranges and logical dates
  - _Requirements: 14.1, 14.2, 14.3, 14.6, 14.7_

- [ ] 14.2 Add business rule validation
  - Validate customer activation requirements
  - Validate outstanding balance calculations
  - Prevent service plan deletion if in use
  - _Requirements: 14.4, 14.5, 2.7_

- [ ] 14.3 Implement uniqueness constraint validation
  - Add duplicate checking for customer codes
  - Add duplicate checking for ticket numbers
  - Add duplicate checking for device serial numbers
  - _Requirements: 14.7_

- [ ]* 14.4 Write property tests for validation rules
  - **Property 11: Input validation consistency**
  - **Validates: Requirements 14.1, 14.2, 14.3, 14.6**

- [ ]* 14.5 Write unit tests for business rules
  - Test all validation rules
  - Test error messages
  - Test edge cases
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

## Phase 12: Search & Filtering Enhancement

- [ ] 15. Enhance search and filtering
- [ ] 15.1 Implement advanced customer search
  - Add full-text search on name, phone, email, customer code, NIK
  - Add filtering by status, service plan, date ranges
  - Implement case-insensitive partial matching
  - _Requirements: 15.1, 15.2, 15.6_

- [ ] 15.2 Implement payment search and filtering
  - Add search by customer, reference number, date range
  - Add filtering by status and payment method
  - _Requirements: 15.3_

- [ ] 15.3 Implement ticket search and filtering
  - Add search by ticket number, customer, description
  - Add filtering by status, priority, category
  - _Requirements: 15.4_

- [ ] 15.4 Implement device search and filtering
  - Add search by serial number, MAC address, customer
  - Add filtering by device type and status
  - _Requirements: 15.5_

- [ ] 15.5 Implement combined filter logic
  - Ensure multiple filters combine with AND logic
  - Add pagination to all search results
  - _Requirements: 15.7_

- [ ]* 15.6 Write property tests for search functionality
  - **Property 12: Search result consistency**
  - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6**

- [ ]* 15.7 Write unit tests for search and filtering
  - Test search across all entities
  - Test filter combinations
  - Test pagination with filters
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

## Phase 13: Property-Based Testing for Core Properties

- [ ]* 16. Implement property-based tests for customer management
- [ ]* 16.1 Write property test for customer code uniqueness
  - **Property 1: Customer code uniqueness**
  - **Validates: Requirements 1.1**

- [ ]* 16.2 Write property test for customer update timestamp consistency
  - **Property 2: Customer update timestamp consistency**
  - **Validates: Requirements 1.2**

- [ ]* 16.3 Write property test for customer pagination correctness
  - **Property 3: Customer pagination correctness**
  - **Validates: Requirements 1.3**

- [ ]* 16.4 Write property test for customer detail completeness
  - **Property 4: Customer detail completeness**
  - **Validates: Requirements 1.4**

- [ ]* 16.5 Write property test for customer deletion referential integrity
  - **Property 5: Customer deletion referential integrity**
  - **Validates: Requirements 1.5**

## Phase 14: Integration Testing & End-to-End Scenarios

- [ ]* 17. Write integration tests
- [ ]* 17.1 Write integration tests for customer lifecycle
  - Test complete customer journey: create, activate, update, suspend, terminate
  - Test customer with payments and tickets
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ]* 17.2 Write integration tests for service plan management
  - Test service plan creation with advanced settings
  - Test service plan changes and changelog
  - Test Mikrotik integration with service plans
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 12.2, 12.3_

- [ ]* 17.3 Write integration tests for payment workflows
  - Test payment recording and balance updates
  - Test payment history and reporting
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ]* 17.4 Write integration tests for ticket workflows
  - Test ticket creation, assignment, resolution, closure
  - Test ticket activity tracking
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 17.5 Write integration tests for monitoring and speed boost
  - Test monitoring data collection and retrieval
  - Test speed boost request and activation workflow
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

## Phase 15: Final Checkpoint & Documentation

- [ ] 18. Final checkpoint and documentation
- [ ] 18.1 Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Fix any failing tests

- [ ] 18.2 Update API documentation
  - Update OpenAPI/Swagger documentation for all new endpoints
  - Add request/response examples
  - Document error codes
  - _Requirements: All_

- [ ] 18.3 Create deployment documentation
  - Document environment variables
  - Document database migrations
  - Document Mikrotik integration setup
  - Create deployment checklist

- [ ] 18.4 Performance optimization review
  - Review database indexes
  - Optimize slow queries
  - Add caching where appropriate
  - Review API response times
