-- ============================================
-- RT/RW Net SaaS - Docker Database Initialization
-- Auto-generated for Docker deployment
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TENANTS
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

-- ============================================
-- USERS
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

-- ============================================
-- SUBSCRIPTION PLANS (Platform Plans)
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(50) DEFAULT 'monthly',
    max_customers INTEGER DEFAULT 50,
    max_users INTEGER DEFAULT 3,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TENANT SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    trial_ends_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);

-- ============================================
-- SERVICE PLANS (ISP Plans for Customers)
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
-- SERVICE PLAN ADVANCED SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS service_plan_advanced_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_plan_id UUID NOT NULL REFERENCES service_plans(id) ON DELETE CASCADE,
    burst_enabled BOOLEAN DEFAULT FALSE,
    burst_limit INTEGER DEFAULT 0,
    burst_threshold INTEGER DEFAULT 0,
    burst_time INTEGER DEFAULT 10,
    priority INTEGER DEFAULT 8,
    address_list VARCHAR(255),
    parent_queue VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_plan_id)
);

-- ============================================
-- CUSTOMERS
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
    service_type VARCHAR(50) DEFAULT 'pppoe',
    pppoe_username VARCHAR(255),
    pppoe_password VARCHAR(255),
    static_ip VARCHAR(50),
    static_gateway VARCHAR(50),
    static_dns VARCHAR(255),
    is_online BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(50),
    last_seen TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
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

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT 'cash',
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

-- ============================================
-- PAYMENT TRANSACTIONS (Platform Payments)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    order_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_type VARCHAR(50),
    payment_method VARCHAR(100),
    va_number VARCHAR(100),
    bank VARCHAR(50),
    expiry_time TIMESTAMP,
    paid_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- ============================================
-- TICKETS
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- RADIUS NAS
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
-- RADIUS USERS
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
-- RADIUS PROFILES
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
-- RADIUS ACCOUNTING
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
-- VPN CONNECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS vpn_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id UUID,
    name VARCHAR(255) NOT NULL,
    vpn_type VARCHAR(50) DEFAULT 'openvpn',
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
-- ADMIN USERS (Platform Admins)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ADMIN AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- ============================================
-- SUPPORT TICKETS (User to Admin)
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    admin_id UUID REFERENCES admin_users(id),
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- ============================================
-- SUPPORT TICKET REPLIES
-- ============================================
CREATE TABLE IF NOT EXISTS support_ticket_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    admin_id UUID REFERENCES admin_users(id),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_ticket_id ON support_ticket_replies(ticket_id);

-- ============================================
-- CHAT ROOMS
-- ============================================
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    admin_id UUID REFERENCES admin_users(id),
    status VARCHAR(50) DEFAULT 'waiting',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_tenant_id ON chat_rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);

-- ============================================
-- EMAIL OTP
-- ============================================
CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'registration',
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Default Subscription Plans
INSERT INTO subscription_plans (id, name, description, price, billing_cycle, max_customers, max_users, features, is_active, is_popular, sort_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Starter', 'Untuk ISP pemula', 0, 'monthly', 50, 3, 
     '{"customer_management": true, "billing_management": true, "network_monitoring": false, "device_management": false, "mikrotik_integration": false}', 
     true, false, 1),
    ('22222222-2222-2222-2222-222222222222', 'Professional', 'Untuk ISP berkembang', 299000, 'monthly', 200, 10, 
     '{"customer_management": true, "billing_management": true, "network_monitoring": true, "device_management": true, "mikrotik_integration": false}', 
     true, true, 2),
    ('33333333-3333-3333-3333-333333333333', 'Enterprise', 'Untuk ISP besar', 599000, 'monthly', 1000, 50, 
     '{"customer_management": true, "billing_management": true, "network_monitoring": true, "device_management": true, "mikrotik_integration": true}', 
     true, false, 3)
ON CONFLICT DO NOTHING;

-- Default Admin User (password: admin123)
INSERT INTO admin_users (id, email, password, name, role, is_active)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'admin@rtrwnet.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlLBgXGlmPjPQQepLbXMCbJHPO2',
    'Super Admin',
    'super_admin',
    true
) ON CONFLICT DO NOTHING;

-- ============================================
-- DONE
-- ============================================
SELECT 'Database initialized successfully!' as status;
