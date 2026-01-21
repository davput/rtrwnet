-- ============================================
-- RT/RW Net SaaS - Complete Database Schema
-- Auto-generated for Docker/K8s deployment
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. TENANTS
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_email_unique ON tenants(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

-- ============================================
-- 2. USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 3. SUBSCRIPTION PLANS (SaaS Plans)
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
    max_customers INTEGER DEFAULT 50,
    max_users INTEGER DEFAULT 3,
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    plan_features JSONB DEFAULT '{}',
    trial_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    is_trial BOOLEAN DEFAULT FALSE,
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_public ON subscription_plans(is_public);

-- ============================================
-- 4. TENANT SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    next_billing_date TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT '',
    auto_renew BOOLEAN DEFAULT TRUE,
    trial_ends_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);

-- ============================================
-- 5. PAYMENT TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES tenant_subscriptions(id),
    plan_id UUID REFERENCES subscription_plans(id),
    order_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(100),
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB DEFAULT '{}',
    paid_at TIMESTAMP,
    expired_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- ============================================
-- 6. SERVICE PLANS (ISP Plans)
-- ============================================
CREATE TABLE IF NOT EXISTS service_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    speed_download INTEGER NOT NULL DEFAULT 10,
    speed_upload INTEGER NOT NULL DEFAULT 10,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_service_plans_tenant_id ON service_plans(tenant_id);

-- ============================================
-- 7. SERVICE PLAN ADVANCED SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS service_plan_advanced_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_plan_id UUID NOT NULL REFERENCES service_plans(id) ON DELETE CASCADE UNIQUE,
    burst_enabled BOOLEAN DEFAULT FALSE,
    burst_limit INTEGER DEFAULT 0,
    burst_threshold INTEGER DEFAULT 0,
    burst_time INTEGER DEFAULT 10,
    priority INTEGER DEFAULT 8,
    max_connections INTEGER DEFAULT 0,
    address_pool VARCHAR(64),
    dns_servers JSONB DEFAULT '[]',
    transparent_proxy BOOLEAN DEFAULT FALSE,
    queue_type VARCHAR(32) DEFAULT 'pcq',
    parent_queue VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_service_plan_advanced_plan_id ON service_plan_advanced_settings(service_plan_id);

-- ============================================
-- 8. CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    service_plan_id UUID REFERENCES service_plans(id),
    service_type VARCHAR(50) DEFAULT 'dhcp',
    pppoe_username VARCHAR(255),
    pppoe_password VARCHAR(255),
    static_ip VARCHAR(50),
    static_gateway VARCHAR(50),
    static_dns VARCHAR(255),
    is_online BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(50),
    last_seen TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_activation',
    installation_date TIMESTAMP,
    due_date INTEGER DEFAULT 15,
    monthly_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, customer_code)
);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_service_type ON customers(service_type);
CREATE INDEX IF NOT EXISTS idx_customers_is_online ON customers(is_online);

-- ============================================
-- 9. PAYMENTS (Customer Payments)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

-- ============================================
-- 10. TICKETS
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, ticket_number)
);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);

-- ============================================
-- 11. TICKET ACTIVITIES
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ticket_activities_ticket_id ON ticket_activities(ticket_id);

-- ============================================
-- 12. NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- 13. ADMIN USERS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 14. ADMIN AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id),
    admin_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- ============================================
-- 15. ADMIN NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);

-- ============================================
-- 16. SUPPORT TICKETS
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    assigned_to UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- ============================================
-- 17. SUPPORT TICKET REPLIES
-- ============================================
CREATE TABLE IF NOT EXISTS support_ticket_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    admin_id UUID REFERENCES admin_users(id),
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_ticket_id ON support_ticket_replies(ticket_id);

-- ============================================
-- 18. CHAT ROOMS
-- ============================================
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    admin_id UUID REFERENCES admin_users(id),
    admin_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'waiting',
    subject VARCHAR(255),
    last_message TEXT,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_tenant_id ON chat_rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);

-- ============================================
-- 19. CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);

-- ============================================
-- 20. EMAIL OTP
-- ============================================
CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'registration',
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);

-- ============================================
-- 21. INFRASTRUCTURE - OLTs
-- ============================================
CREATE TABLE IF NOT EXISTS olts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    snmp_community VARCHAR(255),
    telnet_username VARCHAR(255),
    telnet_password TEXT,
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    vendor VARCHAR(100),
    model VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_olts_tenant_id ON olts(tenant_id);

-- ============================================
-- 22. INFRASTRUCTURE - ODCs
-- ============================================
CREATE TABLE IF NOT EXISTS odcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    olt_id UUID NOT NULL REFERENCES olts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_odcs_tenant_id ON odcs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_odcs_olt_id ON odcs(olt_id);

-- ============================================
-- 23. INFRASTRUCTURE - ODPs
-- ============================================
CREATE TABLE IF NOT EXISTS odps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    odc_id UUID NOT NULL REFERENCES odcs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_odps_tenant_id ON odps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_odps_odc_id ON odps(odc_id);

-- ============================================
-- 24. DEVICES
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'mikrotik',
    ip_address VARCHAR(50),
    mac_address VARCHAR(50),
    api_port INTEGER DEFAULT 8728,
    api_username VARCHAR(255),
    api_password_encrypted TEXT,
    status VARCHAR(50) DEFAULT 'offline',
    last_seen TIMESTAMP,
    system_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_devices_tenant_id ON devices(tenant_id);

-- ============================================
-- 25. RADIUS NAS
-- ============================================
CREATE TABLE IF NOT EXISTS radius_nas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nasname VARCHAR(255) NOT NULL,
    shortname VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'other',
    ports INTEGER DEFAULT 0,
    secret VARCHAR(255) NOT NULL,
    server VARCHAR(255),
    community VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_radius_nas_tenant_id ON radius_nas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_radius_nas_nasname ON radius_nas(nasname);

-- ============================================
-- 26. RADIUS USERS
-- ============================================
CREATE TABLE IF NOT EXISTS radius_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_plain VARCHAR(255),
    auth_type VARCHAR(50) DEFAULT 'pap',
    profile_name VARCHAR(255),
    ip_address VARCHAR(50),
    mac_address VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    simultaneous_use INTEGER DEFAULT 1,
    expire_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, username)
);
CREATE INDEX IF NOT EXISTS idx_radius_users_tenant_id ON radius_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_radius_users_username ON radius_users(username);
CREATE INDEX IF NOT EXISTS idx_radius_users_customer_id ON radius_users(customer_id);

-- ============================================
-- 27. RADIUS USER ATTRIBUTES
-- ============================================
CREATE TABLE IF NOT EXISTS radius_user_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    radius_user_id UUID NOT NULL REFERENCES radius_users(id) ON DELETE CASCADE,
    attribute VARCHAR(255) NOT NULL,
    op VARCHAR(10) DEFAULT ':=',
    value VARCHAR(255) NOT NULL,
    attr_type VARCHAR(50) DEFAULT 'reply',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_radius_user_attributes_user_id ON radius_user_attributes(radius_user_id);

-- ============================================
-- 28. RADIUS PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS radius_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_plan_id UUID REFERENCES service_plans(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rate_limit_rx INTEGER DEFAULT 0,
    rate_limit_tx INTEGER DEFAULT 0,
    burst_limit_rx INTEGER DEFAULT 0,
    burst_limit_tx INTEGER DEFAULT 0,
    burst_threshold_rx INTEGER DEFAULT 0,
    burst_threshold_tx INTEGER DEFAULT 0,
    burst_time INTEGER DEFAULT 10,
    session_timeout INTEGER DEFAULT 0,
    idle_timeout INTEGER DEFAULT 300,
    ip_pool VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);
CREATE INDEX IF NOT EXISTS idx_radius_profiles_tenant_id ON radius_profiles(tenant_id);

-- ============================================
-- 29. RADIUS ACCOUNTING
-- ============================================
CREATE TABLE IF NOT EXISTS radius_accounting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    radius_user_id UUID REFERENCES radius_users(id),
    acct_session_id VARCHAR(255) NOT NULL,
    acct_unique_id VARCHAR(255),
    username VARCHAR(255) NOT NULL,
    nas_ip_address VARCHAR(50),
    nas_port_id VARCHAR(50),
    nas_port_type VARCHAR(50),
    acct_start_time TIMESTAMP,
    acct_stop_time TIMESTAMP,
    acct_session_time INTEGER DEFAULT 0,
    acct_input_octets BIGINT DEFAULT 0,
    acct_output_octets BIGINT DEFAULT 0,
    acct_input_packets BIGINT DEFAULT 0,
    acct_output_packets BIGINT DEFAULT 0,
    acct_terminate_cause VARCHAR(50),
    framed_ip_address VARCHAR(50),
    framed_protocol VARCHAR(50),
    calling_station_id VARCHAR(50),
    called_station_id VARCHAR(50),
    service_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_radius_accounting_tenant_id ON radius_accounting(tenant_id);
CREATE INDEX IF NOT EXISTS idx_radius_accounting_username ON radius_accounting(username);
CREATE INDEX IF NOT EXISTS idx_radius_accounting_session_id ON radius_accounting(acct_session_id);
CREATE INDEX IF NOT EXISTS idx_radius_accounting_start_time ON radius_accounting(acct_start_time);

-- ============================================
-- 30. VPN CONNECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS vpn_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id UUID,
    name VARCHAR(255) NOT NULL,
    vpn_type VARCHAR(50) DEFAULT 'wireguard',
    wg_public_key TEXT,
    wg_private_key_encrypted TEXT,
    wg_endpoint VARCHAR(255),
    wg_allowed_ips TEXT,
    wg_persistent_keepalive INTEGER DEFAULT 25,
    ovpn_config_encrypted TEXT,
    ovpn_ca_cert TEXT,
    ovpn_client_cert TEXT,
    ovpn_client_key_encrypted TEXT,
    status VARCHAR(50) DEFAULT 'disconnected',
    last_connected_at TIMESTAMP,
    last_error TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vpn_connections_tenant_id ON vpn_connections(tenant_id);

-- ============================================
-- 31. USER SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    payment_notifications BOOLEAN DEFAULT TRUE,
    system_notifications BOOLEAN DEFAULT TRUE,
    marketing_notifications BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'id',
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_tenant_id ON user_settings(tenant_id);

-- ============================================
-- 32. TENANT SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(255),
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    company_logo VARCHAR(500),
    default_due_date INTEGER DEFAULT 10,
    grace_period_days INTEGER DEFAULT 7,
    auto_suspend_enabled BOOLEAN DEFAULT TRUE,
    auto_suspend_days INTEGER DEFAULT 14,
    invoice_prefix VARCHAR(20) DEFAULT 'INV',
    invoice_footer TEXT,
    tax_enabled BOOLEAN DEFAULT FALSE,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    send_payment_reminder BOOLEAN DEFAULT TRUE,
    reminder_days_before INTEGER DEFAULT 3,
    send_overdue_notice BOOLEAN DEFAULT TRUE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_api_key TEXT,
    telegram_enabled BOOLEAN DEFAULT FALSE,
    telegram_bot_token TEXT,
    billing_type VARCHAR(20) DEFAULT 'postpaid',
    billing_date_type VARCHAR(20) DEFAULT 'fixed',
    billing_day INTEGER DEFAULT 1,
    late_fee DECIMAL(15,2) DEFAULT 0,
    late_fee_type VARCHAR(20) DEFAULT 'fixed',
    invoice_due_days INTEGER DEFAULT 14,
    generate_invoice_days_before INTEGER DEFAULT 7,
    send_suspension_warning BOOLEAN DEFAULT TRUE,
    warning_days_before_suspension INTEGER DEFAULT 3,
    auto_reactivate_on_payment BOOLEAN DEFAULT TRUE,
    send_payment_confirmation BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);

-- ============================================
-- DEFAULT DATA - SUBSCRIPTION PLANS
-- ============================================
INSERT INTO subscription_plans (id, name, slug, description, price, billing_cycle, max_customers, max_users, features, is_active, is_public, is_popular, sort_order, limits, plan_features, trial_config)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Starter', 'starter', 'Untuk ISP pemula dengan maksimal 50 pelanggan', 0, 'monthly', 50, 3, 
     '{"customer_management": true, "billing_management": true, "network_monitoring": false, "device_management": false, "mikrotik_integration": false}', 
     true, true, false, 1,
     '{"max_customers": 50, "max_users": 3, "max_devices": 5}',
     '{"customer_management": true, "billing_management": true, "network_monitoring": false, "device_management": false, "mikrotik_integration": false}',
     '{"trial_days": 14, "trial_enabled": true}'),
    ('22222222-2222-2222-2222-222222222222', 'Professional', 'professional', 'Untuk ISP berkembang dengan maksimal 200 pelanggan', 299000, 'monthly', 200, 10, 
     '{"customer_management": true, "billing_management": true, "network_monitoring": true, "device_management": true, "mikrotik_integration": false}', 
     true, true, true, 2,
     '{"max_customers": 200, "max_users": 10, "max_devices": 20}',
     '{"customer_management": true, "billing_management": true, "network_monitoring": true, "device_management": true, "mikrotik_integration": false}',
     '{"trial_days": 14, "trial_enabled": true}'),
    ('33333333-3333-3333-3333-333333333333', 'Enterprise', 'enterprise', 'Untuk ISP besar tanpa batasan', 599000, 'monthly', -1, -1, 
     '{"customer_management": true, "billing_management": true, "network_monitoring": true, "device_management": true, "mikrotik_integration": true}', 
     true, true, false, 3,
     '{"max_customers": -1, "max_users": -1, "max_devices": -1}',
     '{"customer_management": true, "billing_management": true, "network_monitoring": true, "device_management": true, "mikrotik_integration": true}',
     '{"trial_days": 30, "trial_enabled": true}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DEFAULT DATA - ADMIN USER
-- Password: admin123
-- ============================================
INSERT INTO admin_users (id, email, password, name, role, is_active)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'admin@rtrwnet.com',
    '$2a$10$OAssK8D/8RqbsX8MKccQtuhlMgxNhxmV0cd0fyh9/fSFj7v4REA0W',
    'Super Admin',
    'super_admin',
    true
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DONE
-- ============================================
SELECT 'Database initialized successfully!' as status;


-- ============================================
-- VPN CONNECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS vpn_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(36) NOT NULL,
    device_id UUID,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    vpn_type VARCHAR(20) DEFAULT 'openvpn',
    status VARCHAR(20) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    ovpn_ca_cert TEXT,
    ovpn_client_cert TEXT,
    ovpn_client_key_encrypted TEXT,
    ovpn_tls_auth TEXT,
    assigned_ip VARCHAR(45),
    last_connected_at TIMESTAMP,
    last_disconnected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vpn_connections_tenant ON vpn_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vpn_connections_device ON vpn_connections(device_id);
