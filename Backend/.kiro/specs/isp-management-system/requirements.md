# Requirements Document - ISP Management System

## Introduction

This document outlines the requirements for a comprehensive ISP (Internet Service Provider) Management System. The system manages customers, service plans, payments, network infrastructure (OLT/ODC/ODP), devices (including Mikrotik routers), monitoring data, support tickets, speed boost requests, and audit logging. The system is designed for multi-tenant SaaS architecture where each ISP tenant can manage their own operations independently.

## Glossary

- **System**: The ISP Management System
- **Tenant**: An ISP company using the system
- **Customer**: An end-user subscriber of internet services
- **Service Plan**: A predefined internet package with bandwidth and pricing
- **OLT**: Optical Line Terminal - main network equipment
- **ODC**: Optical Distribution Cabinet - distribution point from OLT
- **ODP**: Optical Distribution Point - final distribution point to customers
- **PPPoE**: Point-to-Point Protocol over Ethernet for authentication
- **Speed Boost**: Temporary bandwidth increase feature
- **Ticket**: Customer support request or issue
- **Audit Log**: Record of system activities and changes
- **Mikrotik**: Router brand with API integration capabilities
- **FUP**: Fair Usage Policy - bandwidth throttling after quota limit

## Requirements

### Requirement 1: Customer Management

**User Story:** As an ISP administrator, I want to manage customer information and service subscriptions, so that I can track all customer data and their service status.

#### Acceptance Criteria

1. WHEN an administrator creates a new customer THEN the System SHALL generate a unique customer code and store all customer information including personal data, address, and network configuration
2. WHEN an administrator updates customer information THEN the System SHALL validate the data and update the customer record with timestamp
3. WHEN an administrator views customer list THEN the System SHALL display paginated customers with filtering by status, service plan, and search by name/phone/email/customer code
4. WHEN an administrator views customer detail THEN the System SHALL display complete customer information including service plan, payment history, tickets, and network configuration
5. WHEN an administrator deletes a customer THEN the System SHALL soft-delete or archive the customer record while maintaining referential integrity
6. WHEN a customer is assigned a service plan THEN the System SHALL calculate monthly fee and due date based on activation date
7. WHEN customer status changes THEN the System SHALL record the change in audit logs with timestamp and user information

### Requirement 2: Service Plan Management

**User Story:** As an ISP administrator, I want to create and manage service plans with advanced configurations, so that I can offer different internet packages to customers.

#### Acceptance Criteria

1. WHEN an administrator creates a service plan THEN the System SHALL store basic information including name, bandwidth (download/upload), and monthly price
2. WHEN an administrator creates advanced service plan configuration THEN the System SHALL store burst settings, quota limits, FUP settings, billing cycle, and QoS parameters
3. WHEN an administrator updates a service plan THEN the System SHALL record the change in changelog with old and new values
4. WHEN an administrator views service plans THEN the System SHALL display all plans with filtering by active status and search by name
5. WHEN an administrator toggles service plan status THEN the System SHALL activate or deactivate the plan
6. WHEN a service plan has Mikrotik queue configuration THEN the System SHALL store the queue template for automatic application
7. WHEN an administrator deletes a service plan THEN the System SHALL prevent deletion if customers are using the plan

### Requirement 3: Payment Management

**User Story:** As an ISP administrator, I want to record and track customer payments, so that I can manage billing and outstanding balances.

#### Acceptance Criteria

1. WHEN an administrator records a payment THEN the System SHALL store payment details including amount, method, payment date, and period (month/year)
2. WHEN a payment is recorded THEN the System SHALL update customer's outstanding balance and last payment date
3. WHEN an administrator views payment list THEN the System SHALL display paginated payments with filtering by customer, status, date range, and payment method
4. WHEN an administrator views payment detail THEN the System SHALL display complete payment information including customer details and receipt
5. WHEN an administrator generates payment receipt THEN the System SHALL create a receipt with unique reference number
6. WHEN payment is for monthly subscription THEN the System SHALL associate payment with specific period (month and year)
7. WHEN an administrator deletes a payment THEN the System SHALL reverse the balance update and record the deletion in audit logs

### Requirement 4: Ticket Management

**User Story:** As an ISP administrator, I want to manage customer support tickets, so that I can track and resolve customer issues efficiently.

#### Acceptance Criteria

1. WHEN a ticket is created THEN the System SHALL generate a unique ticket number and store ticket information including title, description, category, and priority
2. WHEN an administrator updates ticket status THEN the System SHALL record the status change in ticket activities
3. WHEN an administrator assigns a ticket THEN the System SHALL update the assigned_to field and record the activity
4. WHEN an administrator resolves a ticket THEN the System SHALL set resolved_at timestamp and store resolution notes
5. WHEN an administrator views ticket list THEN the System SHALL display paginated tickets with filtering by status, priority, category, and customer
6. WHEN an administrator views ticket detail THEN the System SHALL display complete ticket information including all activities timeline
7. WHEN any ticket action occurs THEN the System SHALL create a ticket activity record with description and performer

### Requirement 5: Network Infrastructure Management

**User Story:** As an ISP network administrator, I want to manage network infrastructure (OLT, ODC, ODP), so that I can organize and track network topology.

#### Acceptance Criteria

1. WHEN an administrator creates an OLT THEN the System SHALL store OLT information including name, IP address, SNMP community, and credentials
2. WHEN an administrator creates an ODC THEN the System SHALL associate it with an OLT and store location and capacity information
3. WHEN an administrator creates an ODP THEN the System SHALL associate it with an ODC and store location and capacity information
4. WHEN an administrator views infrastructure list THEN the System SHALL display hierarchical view of OLT > ODC > ODP with active status
5. WHEN a customer is assigned to network infrastructure THEN the System SHALL link customer to ODP, ODC, and OLT with port information
6. WHEN an administrator updates infrastructure status THEN the System SHALL toggle is_active flag
7. WHEN infrastructure has location coordinates THEN the System SHALL store latitude and longitude for mapping

### Requirement 6: Device Management

**User Story:** As an ISP administrator, I want to manage customer devices and network equipment, so that I can track hardware inventory and Mikrotik router configurations.

#### Acceptance Criteria

1. WHEN an administrator registers a device THEN the System SHALL store device information including type, serial number, MAC address, brand, and model
2. WHEN a device is a Mikrotik router THEN the System SHALL store encrypted credentials, API port, and connection settings
3. WHEN an administrator assigns a device to a customer THEN the System SHALL link the device to customer record
4. WHEN a device has parent device THEN the System SHALL create hierarchical relationship for network topology
5. WHEN an administrator views device list THEN the System SHALL display paginated devices with filtering by type, status, and customer
6. WHEN device status changes THEN the System SHALL update status and last_seen timestamp
7. WHEN a Mikrotik device connects THEN the System SHALL update connection_status and last_connected_at timestamp

### Requirement 7: Monitoring Data Collection

**User Story:** As an ISP administrator, I want to collect and view customer monitoring data, so that I can track network usage and performance.

#### Acceptance Criteria

1. WHEN monitoring data is collected THEN the System SHALL store bandwidth speeds, data usage, ONU status, signal strength, and uptime
2. WHEN a customer's connection status changes THEN the System SHALL update is_online flag and last_seen timestamp
3. WHEN an administrator views monitoring data THEN the System SHALL display time-series data with filtering by customer and date range
4. WHEN monitoring data exceeds threshold THEN the System SHALL flag the data for alerting
5. WHEN an administrator views customer monitoring THEN the System SHALL display current status and historical trends
6. WHEN monitoring data is stored THEN the System SHALL include timestamp for time-series analysis
7. WHEN data usage is recorded THEN the System SHALL store both download and upload bytes

### Requirement 8: Speed Boost Management

**User Story:** As an ISP administrator, I want to manage customer speed boost requests, so that customers can temporarily increase their bandwidth.

#### Acceptance Criteria

1. WHEN a customer requests speed boost THEN the System SHALL create a request with desired speeds, duration, and calculated price
2. WHEN an administrator approves speed boost THEN the System SHALL activate the boost and create history record with expiration time
3. WHEN an administrator rejects speed boost THEN the System SHALL update status and store rejection reason
4. WHEN speed boost expires THEN the System SHALL deactivate the boost and update history record
5. WHEN an administrator views speed boost requests THEN the System SHALL display paginated requests with filtering by status and customer
6. WHEN speed boost is active THEN the System SHALL track original speeds and boosted speeds in history
7. WHEN speed boost ends THEN the System SHALL set ended_at timestamp and is_active to false

### Requirement 9: Service Plan Change Tracking

**User Story:** As an ISP administrator, I want to track customer service plan changes, so that I can maintain history of plan upgrades and downgrades.

#### Acceptance Criteria

1. WHEN a customer's service plan changes THEN the System SHALL record old plan, new plan, change date, and effective date
2. WHEN plan change is recorded THEN the System SHALL store the reason and performer information
3. WHEN an administrator views plan change history THEN the System SHALL display chronological list of changes for a customer
4. WHEN plan change has future effective date THEN the System SHALL schedule the change for that date
5. WHEN effective date arrives THEN the System SHALL apply the new plan to customer
6. WHEN plan change is recorded THEN the System SHALL create audit log entry
7. WHEN an administrator views customer detail THEN the System SHALL display plan change history

### Requirement 10: Audit Logging

**User Story:** As an ISP administrator, I want to track all system activities, so that I can maintain security and compliance audit trails.

#### Acceptance Criteria

1. WHEN any significant action occurs THEN the System SHALL create an audit log with action, category, description, and timestamp
2. WHEN data is modified THEN the System SHALL store old value and new value in audit log
3. WHEN an action is performed THEN the System SHALL record performer identity and IP address
4. WHEN an administrator views audit logs THEN the System SHALL display paginated logs with filtering by customer, action, category, and date range
5. WHEN audit log is created THEN the System SHALL include customer_id if action relates to a customer
6. WHEN sensitive data is logged THEN the System SHALL mask or encrypt sensitive information
7. WHEN audit logs are queried THEN the System SHALL support full-text search on description

### Requirement 11: Multi-Tenant Data Isolation

**User Story:** As a system architect, I want to ensure data isolation between tenants, so that each ISP can only access their own data.

#### Acceptance Criteria

1. WHEN any data query is executed THEN the System SHALL filter by authenticated tenant ID
2. WHEN data is created THEN the System SHALL automatically associate it with the authenticated tenant
3. WHEN cross-tenant access is attempted THEN the System SHALL deny access and log the attempt
4. WHEN an administrator views any list THEN the System SHALL only display data belonging to their tenant
5. WHEN foreign key relationships exist THEN the System SHALL validate that related records belong to the same tenant
6. WHEN tenant context is missing THEN the System SHALL reject the request with authentication error
7. WHEN data is deleted THEN the System SHALL verify tenant ownership before deletion

### Requirement 12: API Integration and Automation

**User Story:** As an ISP administrator, I want to integrate with Mikrotik routers and automate configurations, so that I can manage customer bandwidth remotely.

#### Acceptance Criteria

1. WHEN Mikrotik integration is enabled THEN the System SHALL connect to Mikrotik API using stored credentials
2. WHEN service plan has auto-apply configuration THEN the System SHALL automatically create queue rules on Mikrotik
3. WHEN customer bandwidth changes THEN the System SHALL update Mikrotik queue configuration via API
4. WHEN Mikrotik connection fails THEN the System SHALL log the error and retry with exponential backoff
5. WHEN queue configuration is applied THEN the System SHALL use queue name template from service plan
6. WHEN an administrator tests Mikrotik connection THEN the System SHALL verify connectivity and return status
7. WHEN Mikrotik credentials are stored THEN the System SHALL encrypt passwords before storage

### Requirement 13: Reporting and Analytics

**User Story:** As an ISP administrator, I want to view reports and analytics, so that I can make informed business decisions.

#### Acceptance Criteria

1. WHEN an administrator requests dashboard overview THEN the System SHALL display total customers, active customers, revenue, and pending payments
2. WHEN an administrator views revenue report THEN the System SHALL calculate total revenue by period with filtering by date range
3. WHEN an administrator views customer growth report THEN the System SHALL display new customers by period
4. WHEN an administrator views service plan distribution THEN the System SHALL display customer count per service plan
5. WHEN an administrator views payment collection report THEN the System SHALL display payment statistics by method and period
6. WHEN an administrator views ticket statistics THEN the System SHALL display ticket count by status, category, and priority
7. WHEN an administrator exports report THEN the System SHALL generate downloadable file in CSV or PDF format

### Requirement 14: Data Validation and Business Rules

**User Story:** As a system architect, I want to enforce data validation and business rules, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN customer data is submitted THEN the System SHALL validate required fields, format, and uniqueness constraints
2. WHEN payment amount is recorded THEN the System SHALL validate that amount is positive and not exceeding reasonable limits
3. WHEN service plan is created THEN the System SHALL validate that bandwidth values are positive integers
4. WHEN customer is activated THEN the System SHALL validate that service plan is assigned and active
5. WHEN outstanding balance is calculated THEN the System SHALL ensure accuracy based on payments and fees
6. WHEN date fields are submitted THEN the System SHALL validate date format and logical date ranges
7. WHEN unique fields are submitted THEN the System SHALL check for duplicates and return appropriate error

### Requirement 15: Search and Filtering

**User Story:** As an ISP administrator, I want to search and filter data efficiently, so that I can quickly find specific records.

#### Acceptance Criteria

1. WHEN an administrator searches customers THEN the System SHALL search by name, phone, email, customer code, and NIK
2. WHEN an administrator filters customers THEN the System SHALL filter by status, service plan, and date ranges
3. WHEN an administrator searches payments THEN the System SHALL search by customer, reference number, and date range
4. WHEN an administrator searches tickets THEN the System SHALL search by ticket number, customer, and description
5. WHEN an administrator searches devices THEN the System SHALL search by serial number, MAC address, and customer
6. WHEN search query is provided THEN the System SHALL perform case-insensitive partial matching
7. WHEN multiple filters are applied THEN the System SHALL combine filters with AND logic
