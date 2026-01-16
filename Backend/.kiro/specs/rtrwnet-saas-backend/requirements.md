# Requirements Document

## Introduction

RT/RW Net SaaS Backend adalah sistem manajemen ISP (Internet Service Provider) berbasis SaaS yang memungkinkan operator RT/RW Net mengelola pelanggan, paket layanan, pembayaran, perangkat jaringan, dan monitoring secara terpusat. Sistem ini dirancang sebagai multi-tenant platform yang dapat melayani multiple ISP operators dengan data yang terisolasi.

## Glossary

- **System**: RT/RW Net SaaS Backend API
- **Tenant**: Organisasi ISP yang menggunakan platform (RT/RW Net operator)
- **Customer**: Pelanggan internet dari tenant
- **Service Plan**: Paket layanan internet dengan kecepatan dan harga tertentu
- **Payment**: Transaksi pembayaran dari customer
- **Device**: Perangkat jaringan (router, OLT, switch)
- **MikroTik Router**: Router MikroTik yang dikelola oleh sistem
- **Ticket**: Tiket support/keluhan dari customer
- **Speed Boost**: Fitur peningkatan kecepatan sementara
- **Audit Log**: Catatan aktivitas pengguna dalam sistem
- **JWT**: JSON Web Token untuk autentikasi
- **Multi-tenant**: Arsitektur yang memisahkan data antar tenant

## Requirements

### Requirement 1: Multi-Tenant Architecture

**User Story:** As a platform administrator, I want the system to support multiple ISP operators with isolated data, so that each tenant's data remains secure and separate.

#### Acceptance Criteria

1. WHEN a tenant registers THEN the System SHALL create an isolated database schema or partition for that tenant
2. WHEN a user authenticates THEN the System SHALL identify the tenant context and restrict data access to that tenant only
3. WHEN performing any database operation THEN the System SHALL automatically filter data by tenant_id
4. WHEN a tenant is deleted THEN the System SHALL remove all associated data without affecting other tenants
5. THE System SHALL prevent cross-tenant data access through API endpoints

### Requirement 2: Authentication and Authorization

**User Story:** As a system user, I want secure authentication with role-based access control, so that only authorized users can access specific features.

#### Acceptance Criteria

1. WHEN a user submits valid credentials THEN the System SHALL generate a JWT access token and refresh token
2. WHEN a user submits an expired access token THEN the System SHALL reject the request with 401 status
3. WHEN a user submits a valid refresh token THEN the System SHALL generate a new access token
4. WHEN a user logs out THEN the System SHALL invalidate the refresh token
5. WHEN a user attempts to access a protected endpoint THEN the System SHALL verify the JWT token and user permissions
6. THE System SHALL support role-based access control with roles: admin, operator, technician, viewer
7. WHEN a user attempts an unauthorized action THEN the System SHALL return 403 Forbidden status

### Requirement 3: Customer Management

**User Story:** As an ISP operator, I want to manage customer information and service subscriptions, so that I can track all customers and their service details.

#### Acceptance Criteria

1. WHEN creating a customer THEN the System SHALL generate a unique customer code automatically
2. WHEN creating a customer THEN the System SHALL validate required fields: name, phone, address, service_plan_id
3. WHEN retrieving customers THEN the System SHALL support pagination with configurable page size
4. WHEN searching customers THEN the System SHALL search by name, customer code, phone, or email
5. WHEN filtering customers THEN the System SHALL filter by status (active, suspended, terminated) and service plan
6. WHEN updating a customer THEN the System SHALL validate that the service_plan_id exists
7. WHEN deleting a customer THEN the System SHALL perform soft delete and retain historical data
8. WHEN retrieving customer statistics THEN the System SHALL calculate total, active, suspended, and terminated counts

### Requirement 4: Service Plan Management

**User Story:** As an ISP operator, I want to create and manage internet service plans with pricing and speed configurations, so that customers can subscribe to different packages.

#### Acceptance Criteria

1. WHEN creating a service plan THEN the System SHALL validate required fields: name, speed_download, speed_upload, price
2. WHEN creating a service plan THEN the System SHALL validate that speed values are positive numbers
3. WHEN creating a service plan THEN the System SHALL validate that price is a positive number
4. WHEN retrieving service plans THEN the System SHALL return only active plans by default
5. WHEN updating a service plan THEN the System SHALL preserve historical pricing for existing customers
6. WHEN deleting a service plan THEN the System SHALL prevent deletion if customers are using it
7. WHEN managing advanced settings THEN the System SHALL support burst configuration, priority, and queue settings

### Requirement 5: Payment Management

**User Story:** As an ISP operator, I want to track customer payments and payment status, so that I can manage billing and identify overdue accounts.

#### Acceptance Criteria

1. WHEN creating a payment THEN the System SHALL validate that the customer_id exists
2. WHEN creating a payment THEN the System SHALL validate that amount is a positive number
3. WHEN creating a payment THEN the System SHALL set status to "paid" if payment_date is provided
4. WHEN creating a payment THEN the System SHALL calculate due_date based on customer's billing cycle
5. WHEN retrieving payments THEN the System SHALL support filtering by customer, status, and date range
6. WHEN a payment is overdue THEN the System SHALL automatically update status to "overdue"
7. WHEN updating payment status to "paid" THEN the System SHALL record the payment_date

### Requirement 6: Device Management

**User Story:** As a network administrator, I want to manage network devices and monitor their status, so that I can maintain network infrastructure.

#### Acceptance Criteria

1. WHEN creating a device THEN the System SHALL validate required fields: name, type, ip_address
2. WHEN creating a device THEN the System SHALL validate that ip_address is in valid format
3. WHEN creating a device THEN the System SHALL encrypt sensitive credentials before storage
4. WHEN retrieving devices THEN the System SHALL not expose passwords in the response
5. WHEN checking device status THEN the System SHALL attempt to ping or connect to the device
6. WHEN a device is unreachable THEN the System SHALL update status to "offline" and record last_seen timestamp
7. WHEN deleting a device THEN the System SHALL check for dependencies before deletion

### Requirement 7: MikroTik Router Integration

**User Story:** As an ISP operator, I want to integrate with MikroTik routers for automated customer provisioning, so that service changes are applied automatically.

#### Acceptance Criteria

1. WHEN creating a router THEN the System SHALL validate connection credentials by testing the connection
2. WHEN a customer is activated THEN the System SHALL create PPPoE secret on the assigned MikroTik router
3. WHEN a customer's service plan changes THEN the System SHALL update the PPPoE profile on MikroTik
4. WHEN a customer is suspended THEN the System SHALL disable the PPPoE secret on MikroTik
5. WHEN a customer is terminated THEN the System SHALL remove the PPPoE secret from MikroTik
6. WHEN MikroTik connection fails THEN the System SHALL queue the operation for retry
7. THE System SHALL support multiple MikroTik routers per tenant

### Requirement 8: Ticketing System

**User Story:** As a customer support agent, I want to manage customer support tickets, so that I can track and resolve customer issues efficiently.

#### Acceptance Criteria

1. WHEN creating a ticket THEN the System SHALL validate required fields: customer_id, title, description
2. WHEN creating a ticket THEN the System SHALL set initial status to "open" and assign a unique ticket number
3. WHEN retrieving tickets THEN the System SHALL support filtering by customer, status, and priority
4. WHEN updating ticket status THEN the System SHALL validate status transitions (open → in_progress → resolved → closed)
5. WHEN assigning a ticket THEN the System SHALL validate that the assigned user exists
6. WHEN a ticket is resolved THEN the System SHALL record the resolution timestamp
7. THE System SHALL support ticket priority levels: low, medium, high, urgent

### Requirement 9: Speed Boost Management

**User Story:** As an ISP operator, I want to offer temporary speed boost packages to customers, so that customers can upgrade their speed for a limited time.

#### Acceptance Criteria

1. WHEN creating a speed boost request THEN the System SHALL validate that customer_id and boost_plan_id exist
2. WHEN creating a speed boost request THEN the System SHALL calculate price based on duration and plan difference
3. WHEN approving a speed boost THEN the System SHALL update the customer's service plan on MikroTik
4. WHEN approving a speed boost THEN the System SHALL set start_date to current date and calculate end_date
5. WHEN a speed boost expires THEN the System SHALL automatically revert to the original service plan
6. WHEN rejecting a speed boost THEN the System SHALL record the rejection reason
7. THE System SHALL support concurrent speed boost requests per customer

### Requirement 10: Monitoring and Analytics

**User Story:** As an ISP operator, I want to monitor customer bandwidth usage and network performance, so that I can ensure service quality and identify issues.

#### Acceptance Criteria

1. WHEN retrieving customer monitoring data THEN the System SHALL fetch real-time data from MikroTik
2. WHEN retrieving monitoring data THEN the System SHALL support time periods: 24h, 7d, 30d
3. WHEN calculating bandwidth usage THEN the System SHALL aggregate data from multiple time points
4. WHEN retrieving network overview THEN the System SHALL calculate total and used bandwidth across all customers
5. WHEN detecting high usage THEN the System SHALL generate alerts for bandwidth usage above threshold
6. WHEN a device goes offline THEN the System SHALL generate an alert
7. THE System SHALL store historical monitoring data for trend analysis

### Requirement 11: Dashboard and Statistics

**User Story:** As an ISP operator, I want to view dashboard statistics and KPIs, so that I can monitor business performance at a glance.

#### Acceptance Criteria

1. WHEN retrieving dashboard statistics THEN the System SHALL calculate customer counts by status
2. WHEN retrieving dashboard statistics THEN the System SHALL calculate revenue for current and previous month
3. WHEN retrieving dashboard statistics THEN the System SHALL calculate revenue growth percentage
4. WHEN retrieving dashboard statistics THEN the System SHALL count tickets by status
5. WHEN retrieving dashboard statistics THEN the System SHALL calculate network bandwidth usage percentage
6. THE System SHALL cache dashboard statistics for 5 minutes to improve performance
7. WHEN cache expires THEN the System SHALL recalculate statistics

### Requirement 12: Audit Logging

**User Story:** As a system administrator, I want to track all user actions in the system, so that I can audit changes and investigate issues.

#### Acceptance Criteria

1. WHEN a user performs a create operation THEN the System SHALL log the action with entity type, entity ID, and changes
2. WHEN a user performs an update operation THEN the System SHALL log the old and new values
3. WHEN a user performs a delete operation THEN the System SHALL log the deleted entity details
4. WHEN logging an action THEN the System SHALL record user_id, IP address, and timestamp
5. WHEN retrieving audit logs THEN the System SHALL support filtering by user, action, entity type, and date range
6. THE System SHALL retain audit logs for at least 1 year
7. THE System SHALL prevent modification or deletion of audit logs

### Requirement 13: Infrastructure Management

**User Story:** As a network administrator, I want to track network infrastructure inventory, so that I can manage equipment and supplies.

#### Acceptance Criteria

1. WHEN creating an infrastructure item THEN the System SHALL validate required fields: name, type, quantity
2. WHEN creating an infrastructure item THEN the System SHALL validate that quantity is a positive number
3. WHEN updating quantity THEN the System SHALL track quantity changes in audit log
4. WHEN retrieving infrastructure items THEN the System SHALL support filtering by type and location
5. WHEN quantity reaches minimum threshold THEN the System SHALL generate a low stock alert
6. THE System SHALL support item types: cable, router, switch, antenna, connector, tools
7. WHEN deleting an infrastructure item THEN the System SHALL perform soft delete

### Requirement 14: API Rate Limiting and Security

**User Story:** As a system administrator, I want to implement rate limiting and security measures, so that the API is protected from abuse and attacks.

#### Acceptance Criteria

1. WHEN a client exceeds rate limit THEN the System SHALL return 429 Too Many Requests status
2. THE System SHALL implement rate limiting of 100 requests per minute per user
3. WHEN detecting suspicious activity THEN the System SHALL temporarily block the IP address
4. THE System SHALL validate and sanitize all input data to prevent SQL injection
5. THE System SHALL validate and sanitize all input data to prevent XSS attacks
6. THE System SHALL use HTTPS for all API communications in production
7. THE System SHALL implement CORS with configurable allowed origins

### Requirement 15: Data Backup and Recovery

**User Story:** As a system administrator, I want automated database backups, so that data can be recovered in case of failure.

#### Acceptance Criteria

1. THE System SHALL perform automated daily database backups
2. WHEN performing backup THEN the System SHALL compress and encrypt the backup file
3. THE System SHALL retain backups for at least 30 days
4. WHEN backup fails THEN the System SHALL send notification to administrators
5. THE System SHALL support manual backup triggering via API
6. THE System SHALL support point-in-time recovery
7. WHEN restoring from backup THEN the System SHALL validate backup integrity before restoration

### Requirement 16: WebSocket Real-time Updates

**User Story:** As a system user, I want real-time updates for critical events, so that I can respond quickly to changes.

#### Acceptance Criteria

1. WHEN a customer is created THEN the System SHALL broadcast "customer:created" event via WebSocket
2. WHEN a payment is recorded THEN the System SHALL broadcast "payment:created" event via WebSocket
3. WHEN a ticket is created or updated THEN the System SHALL broadcast ticket events via WebSocket
4. WHEN a device status changes THEN the System SHALL broadcast "device:status" event via WebSocket
5. WHEN monitoring data updates THEN the System SHALL broadcast "monitoring:update" event via WebSocket
6. THE System SHALL support WebSocket authentication using JWT token
7. WHEN a WebSocket client disconnects THEN the System SHALL clean up resources

### Requirement 17: Email Notifications

**User Story:** As an ISP operator, I want automated email notifications for important events, so that I can stay informed without constantly checking the system.

#### Acceptance Criteria

1. WHEN a payment is overdue THEN the System SHALL send email notification to the customer
2. WHEN a ticket is created THEN the System SHALL send email notification to assigned technician
3. WHEN a speed boost is approved THEN the System SHALL send confirmation email to the customer
4. WHEN a device goes offline THEN the System SHALL send alert email to administrators
5. THE System SHALL use email templates with customizable content
6. THE System SHALL queue emails for asynchronous sending
7. WHEN email sending fails THEN the System SHALL retry up to 3 times

### Requirement 18: Data Export and Reporting

**User Story:** As an ISP operator, I want to export data and generate reports, so that I can analyze business performance and comply with regulations.

#### Acceptance Criteria

1. WHEN exporting customer data THEN the System SHALL support CSV and Excel formats
2. WHEN exporting payment data THEN the System SHALL include all relevant fields and calculations
3. WHEN generating reports THEN the System SHALL support date range filtering
4. THE System SHALL support report types: revenue report, customer growth report, payment report
5. WHEN generating large reports THEN the System SHALL process asynchronously and notify when complete
6. THE System SHALL support scheduled report generation
7. WHEN exporting data THEN the System SHALL respect user permissions and tenant isolation

### Requirement 19: Database Migration and Seeding

**User Story:** As a developer, I want database migration scripts and seed data, so that I can set up the system consistently across environments.

#### Acceptance Criteria

1. THE System SHALL provide migration scripts for all database tables
2. THE System SHALL provide seed data for initial setup (roles, default service plans)
3. WHEN running migrations THEN the System SHALL track migration version
4. WHEN rolling back migrations THEN the System SHALL revert database changes safely
5. THE System SHALL support migration for both PostgreSQL and MySQL
6. THE System SHALL provide migration for indexes and foreign keys
7. THE System SHALL provide migration for full-text search indexes

### Requirement 20: API Documentation

**User Story:** As a frontend developer, I want comprehensive API documentation, so that I can integrate with the backend efficiently.

#### Acceptance Criteria

1. THE System SHALL provide OpenAPI/Swagger documentation for all endpoints
2. THE System SHALL include request/response examples for all endpoints
3. THE System SHALL document all error codes and error responses
4. THE System SHALL provide authentication flow documentation
5. THE System SHALL include WebSocket event documentation
6. THE System SHALL provide interactive API testing interface
7. THE System SHALL keep documentation synchronized with code changes
