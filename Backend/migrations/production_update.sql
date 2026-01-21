-- ============================================================
-- PRODUCTION DATABASE UPDATE SCRIPT
-- Generated: 2026-01-18
-- Contains migrations: 000010 - 000023 + update_existing_plans
-- ============================================================
-- IMPORTANT: Backup database before running this script!
-- Run with: psql -h <host> -U <user> -d <database> -f production_update.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 000010: Create Admin Tables
-- ============================================================

-- Admin Users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Audit Logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users(id),
    admin_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support Tickets table (from tenants to admin)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    assigned_to UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for admin tables
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- Insert default super admin (password: admin123)
INSERT INTO admin_users (id, name, email, password, role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Super Admin',
    'admin@rtwnet.com',
    '$2a$10$tKnV4p9F/v6WGhvzSzRpKOonBohVoVkFnJgUp6G7CKDGdR5PSEFgO',
    'super_admin',
    true
) ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- 000011: Add Tenant Onboarding
-- ============================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- ============================================================
-- 000012: Add Plan ID to Transactions
-- ============================================================

ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_plan_id ON payment_transactions(plan_id);

-- ============================================================
-- 000013: Create Email OTP Table
-- ============================================================

CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email_purpose ON email_otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);

COMMENT ON TABLE email_otps IS 'Stores OTP codes for email verification';

-- ============================================================
-- 000015: Add Plan Limits Features
-- ============================================================

ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS plan_features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trial_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_subscription_plans_public ON subscription_plans(is_public);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_trial ON subscription_plans(is_trial);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON subscription_plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- Update existing plans with default limits and features
UPDATE subscription_plans SET 
    limits = '{
        "max_customers": 50,
        "max_users": 2,
        "max_devices": 5,
        "max_bandwidth": 100,
        "max_storage": 10,
        "max_hotspots": 2,
        "max_vlans": 5,
        "max_firewall_rules": 20,
        "max_queue_rules": 10,
        "max_monitoring_days": 30,
        "max_reports": 5,
        "max_alerts": 10,
        "max_api_calls_per_hour": 100,
        "max_webhooks": 2
    }',
    plan_features = '{
        "customer_management": true,
        "billing_management": true,
        "device_management": true,
        "network_monitoring": true,
        "user_management": true,
        "mikrotik_integration": true,
        "hotspot_management": false,
        "vlan_management": false,
        "firewall_management": false,
        "queue_management": true,
        "speed_boost": false,
        "real_time_monitoring": false,
        "advanced_reports": false,
        "custom_dashboard": false,
        "data_export": false,
        "alert_system": true,
        "api_access": false,
        "webhook_support": false,
        "third_party_integration": false,
        "custom_branding": false,
        "white_label": false,
        "priority_support": false,
        "phone_support": false,
        "dedicated_manager": false,
        "custom_training": false
    }',
    trial_config = '{
        "trial_days": 14,
        "trial_enabled": true,
        "require_payment": false,
        "auto_convert": false
    }'
WHERE slug = 'starter' OR name ILIKE '%starter%' OR name ILIKE '%basic%';

UPDATE subscription_plans SET 
    limits = '{
        "max_customers": 200,
        "max_users": 5,
        "max_devices": 20,
        "max_bandwidth": 500,
        "max_storage": 50,
        "max_hotspots": 10,
        "max_vlans": 20,
        "max_firewall_rules": 100,
        "max_queue_rules": 50,
        "max_monitoring_days": 90,
        "max_reports": 20,
        "max_alerts": 50,
        "max_api_calls_per_hour": 1000,
        "max_webhooks": 10
    }',
    plan_features = '{
        "customer_management": true,
        "billing_management": true,
        "device_management": true,
        "network_monitoring": true,
        "user_management": true,
        "mikrotik_integration": true,
        "hotspot_management": true,
        "vlan_management": true,
        "firewall_management": true,
        "queue_management": true,
        "speed_boost": true,
        "real_time_monitoring": true,
        "advanced_reports": true,
        "custom_dashboard": true,
        "data_export": true,
        "alert_system": true,
        "api_access": true,
        "webhook_support": true,
        "third_party_integration": false,
        "custom_branding": true,
        "white_label": false,
        "priority_support": true,
        "phone_support": false,
        "dedicated_manager": false,
        "custom_training": false
    }',
    trial_config = '{
        "trial_days": 14,
        "trial_enabled": true,
        "require_payment": false,
        "auto_convert": false
    }'
WHERE slug = 'professional' OR name ILIKE '%professional%' OR name ILIKE '%pro%';

UPDATE subscription_plans SET 
    limits = '{
        "max_customers": -1,
        "max_users": -1,
        "max_devices": -1,
        "max_bandwidth": -1,
        "max_storage": -1,
        "max_hotspots": -1,
        "max_vlans": -1,
        "max_firewall_rules": -1,
        "max_queue_rules": -1,
        "max_monitoring_days": 365,
        "max_reports": -1,
        "max_alerts": -1,
        "max_api_calls_per_hour": -1,
        "max_webhooks": -1
    }',
    plan_features = '{
        "customer_management": true,
        "billing_management": true,
        "device_management": true,
        "network_monitoring": true,
        "user_management": true,
        "mikrotik_integration": true,
        "hotspot_management": true,
        "vlan_management": true,
        "firewall_management": true,
        "queue_management": true,
        "speed_boost": true,
        "real_time_monitoring": true,
        "advanced_reports": true,
        "custom_dashboard": true,
        "data_export": true,
        "alert_system": true,
        "api_access": true,
        "webhook_support": true,
        "third_party_integration": true,
        "custom_branding": true,
        "white_label": true,
        "priority_support": true,
        "phone_support": true,
        "dedicated_manager": true,
        "custom_training": true
    }',
    trial_config = '{
        "trial_days": 30,
        "trial_enabled": true,
        "require_payment": false,
        "auto_convert": false
    }'
WHERE slug = 'enterprise' OR name ILIKE '%enterprise%';

-- Insert Trial plan if not exists
INSERT INTO subscription_plans (id, name, slug, description, price, billing_cycle, max_customers, max_users, is_active, is_public, is_trial, sort_order, limits, plan_features, trial_config)
SELECT 
    gen_random_uuid(),
    'Trial',
    'trial',
    'Paket trial gratis selama 14 hari untuk mencoba semua fitur dasar',
    0,
    'monthly',
    25,
    1,
    true,
    true,
    true,
    0,
    '{"max_customers": 25, "max_users": 1, "max_devices": 3, "max_bandwidth": 50, "max_storage": 5, "max_hotspots": 1, "max_vlans": 2, "max_firewall_rules": 10, "max_queue_rules": 5, "max_monitoring_days": 14, "max_reports": 2, "max_alerts": 5, "max_api_calls_per_hour": 50, "max_webhooks": 1}',
    '{"customer_management": true, "billing_management": true, "device_management": true, "network_monitoring": true, "user_management": true, "mikrotik_integration": true, "hotspot_management": false, "vlan_management": false, "firewall_management": false, "queue_management": true, "speed_boost": false, "real_time_monitoring": false, "advanced_reports": false, "custom_dashboard": false, "data_export": false, "alert_system": true, "api_access": false, "webhook_support": false, "third_party_integration": false, "custom_branding": false, "white_label": false, "priority_support": false, "phone_support": false, "dedicated_manager": false, "custom_training": false}',
    '{"trial_days": 14, "trial_enabled": true, "require_payment": false, "auto_convert": false}'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE slug = 'trial');

COMMENT ON COLUMN subscription_plans.limits IS 'JSON object containing resource limits';
COMMENT ON COLUMN subscription_plans.plan_features IS 'JSON object containing feature flags';
COMMENT ON COLUMN subscription_plans.trial_config IS 'JSON object containing trial configuration';


-- ============================================================
-- 000016: Add Ticket Replies
-- ============================================================

CREATE TABLE IF NOT EXISTS support_ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    admin_id UUID REFERENCES admin_users(id),
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON support_ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_created_at ON support_ticket_replies(created_at);

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general';

-- ============================================================
-- 000017: Create Notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- ============================================================
-- 000018: Add Avatar URL
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

-- ============================================================
-- 000019: Create Chat Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    admin_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'waiting',
    subject VARCHAR(500),
    last_message TEXT,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_tenant_id ON chat_rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user_id ON chat_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_admin_id ON chat_rooms(admin_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================================
-- 000020: Add Customer Service Fields
-- ============================================================

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) DEFAULT 'dhcp',
ADD COLUMN IF NOT EXISTS pppoe_username VARCHAR(100),
ADD COLUMN IF NOT EXISTS pppoe_password VARCHAR(100),
ADD COLUMN IF NOT EXISTS static_ip VARCHAR(45),
ADD COLUMN IF NOT EXISTS static_gateway VARCHAR(45),
ADD COLUMN IF NOT EXISTS static_dns VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;

UPDATE customers SET service_type = 'dhcp' WHERE service_type IS NULL;

ALTER TABLE customers ALTER COLUMN address DROP NOT NULL;
ALTER TABLE customers ALTER COLUMN status SET DEFAULT 'pending_activation';

CREATE INDEX IF NOT EXISTS idx_customers_service_type ON customers(service_type);
CREATE INDEX IF NOT EXISTS idx_customers_is_online ON customers(is_online);


-- ============================================================
-- 000021: Add Customer Billing Settings
-- ============================================================

ALTER TABLE tenant_settings
ADD COLUMN IF NOT EXISTS billing_type VARCHAR(20) DEFAULT 'postpaid',
ADD COLUMN IF NOT EXISTS billing_date_type VARCHAR(20) DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS late_fee DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_fee_type VARCHAR(20) DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS invoice_due_days INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS generate_invoice_days_before INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS send_suspension_warning BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS warning_days_before_suspension INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS auto_reactivate_on_payment BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS send_payment_confirmation BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN tenant_settings.billing_type IS 'prepaid or postpaid';
COMMENT ON COLUMN tenant_settings.billing_date_type IS 'fixed (same date for all) or recycle (based on activation date)';
COMMENT ON COLUMN tenant_settings.billing_day IS 'Day of month for fixed billing (1-31)';
COMMENT ON COLUMN tenant_settings.late_fee IS 'Late fee amount or percentage';
COMMENT ON COLUMN tenant_settings.late_fee_type IS 'fixed (nominal) or percentage';
COMMENT ON COLUMN tenant_settings.invoice_due_days IS 'Days until invoice is due after creation';
COMMENT ON COLUMN tenant_settings.generate_invoice_days_before IS 'For prepaid: generate invoice X days before new period';

-- ============================================================
-- 000022: Create RADIUS Tables
-- ============================================================

-- Enable uuid-ossp extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- RADIUS NAS (Network Access Server) - MikroTik routers
CREATE TABLE IF NOT EXISTS radius_nas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nasname VARCHAR(128) NOT NULL,
    shortname VARCHAR(32) NOT NULL,
    type VARCHAR(30) DEFAULT 'other',
    ports INTEGER,
    secret VARCHAR(60) NOT NULL,
    server VARCHAR(64),
    community VARCHAR(50),
    description VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_radius_nas_tenant_id ON radius_nas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_radius_nas_nasname ON radius_nas(nasname);

-- RADIUS Users (for PPPoE/Hotspot authentication)
CREATE TABLE IF NOT EXISTS radius_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_plain VARCHAR(255),
    auth_type VARCHAR(20) DEFAULT 'pap',
    profile_name VARCHAR(64),
    ip_address VARCHAR(45),
    mac_address VARCHAR(17),
    is_active BOOLEAN DEFAULT TRUE,
    simultaneous_use INTEGER DEFAULT 1,
    expire_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, username)
);

CREATE INDEX IF NOT EXISTS idx_radius_users_tenant_id ON radius_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_radius_users_customer_id ON radius_users(customer_id);
CREATE INDEX IF NOT EXISTS idx_radius_users_username ON radius_users(username);

-- RADIUS User Attributes
CREATE TABLE IF NOT EXISTS radius_user_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    radius_user_id UUID NOT NULL REFERENCES radius_users(id) ON DELETE CASCADE,
    attribute VARCHAR(64) NOT NULL,
    op VARCHAR(2) DEFAULT ':=',
    value VARCHAR(253) NOT NULL,
    attr_type VARCHAR(10) DEFAULT 'reply',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_radius_user_attrs_user_id ON radius_user_attributes(radius_user_id);

-- RADIUS Profiles (bandwidth/rate limit profiles)
CREATE TABLE IF NOT EXISTS radius_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_plan_id UUID REFERENCES service_plans(id) ON DELETE SET NULL,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    rate_limit_rx INTEGER,
    rate_limit_tx INTEGER,
    burst_limit_rx INTEGER,
    burst_limit_tx INTEGER,
    burst_threshold_rx INTEGER,
    burst_threshold_tx INTEGER,
    burst_time INTEGER DEFAULT 10,
    session_timeout INTEGER,
    idle_timeout INTEGER DEFAULT 300,
    ip_pool VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_radius_profiles_tenant_id ON radius_profiles(tenant_id);

-- RADIUS Accounting (session logs)
CREATE TABLE IF NOT EXISTS radius_accounting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    radius_user_id UUID REFERENCES radius_users(id) ON DELETE SET NULL,
    acct_session_id VARCHAR(64) NOT NULL,
    acct_unique_id VARCHAR(32),
    username VARCHAR(64) NOT NULL,
    nas_ip_address VARCHAR(45),
    nas_port_id VARCHAR(50),
    nas_port_type VARCHAR(32),
    acct_start_time TIMESTAMP,
    acct_stop_time TIMESTAMP,
    acct_session_time INTEGER DEFAULT 0,
    acct_input_octets BIGINT DEFAULT 0,
    acct_output_octets BIGINT DEFAULT 0,
    acct_input_packets BIGINT DEFAULT 0,
    acct_output_packets BIGINT DEFAULT 0,
    acct_terminate_cause VARCHAR(32),
    framed_ip_address VARCHAR(45),
    framed_protocol VARCHAR(32),
    calling_station_id VARCHAR(50),
    called_station_id VARCHAR(50),
    service_type VARCHAR(32),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_radius_acct_tenant_id ON radius_accounting(tenant_id);
CREATE INDEX IF NOT EXISTS idx_radius_acct_user_id ON radius_accounting(radius_user_id);
CREATE INDEX IF NOT EXISTS idx_radius_acct_session_id ON radius_accounting(acct_session_id);
CREATE INDEX IF NOT EXISTS idx_radius_acct_username ON radius_accounting(username);
CREATE INDEX IF NOT EXISTS idx_radius_acct_start_time ON radius_accounting(acct_start_time);

-- VPN Connections
CREATE TABLE IF NOT EXISTS vpn_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    vpn_type VARCHAR(20) NOT NULL DEFAULT 'wireguard',
    wg_public_key VARCHAR(44),
    wg_private_key_encrypted TEXT,
    wg_endpoint VARCHAR(100),
    wg_allowed_ips VARCHAR(255),
    wg_persistent_keepalive INTEGER DEFAULT 25,
    ovpn_config_encrypted TEXT,
    ovpn_ca_cert TEXT,
    ovpn_client_cert TEXT,
    ovpn_client_key_encrypted TEXT,
    status VARCHAR(20) DEFAULT 'disconnected',
    last_connected_at TIMESTAMP,
    last_error TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vpn_connections_tenant_id ON vpn_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vpn_connections_device_id ON vpn_connections(device_id);

COMMENT ON TABLE radius_nas IS 'MikroTik routers registered as RADIUS NAS';
COMMENT ON TABLE radius_users IS 'PPPoE/Hotspot users for RADIUS authentication';
COMMENT ON TABLE radius_profiles IS 'Bandwidth profiles for RADIUS users';
COMMENT ON TABLE radius_accounting IS 'Session accounting data from RADIUS';
COMMENT ON TABLE vpn_connections IS 'VPN connections to customer MikroTik routers';


-- ============================================================
-- 000023: Create Service Plan Advanced Settings
-- ============================================================

CREATE TABLE IF NOT EXISTS service_plan_advanced_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_plan_id UUID NOT NULL UNIQUE REFERENCES service_plans(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_service_plan_advanced_settings_plan_id ON service_plan_advanced_settings(service_plan_id);

COMMENT ON TABLE service_plan_advanced_settings IS 'Advanced QoS settings for service plans';

-- ============================================================
-- Update Existing Plans (Standard & Premium)
-- ============================================================

UPDATE subscription_plans SET 
    limits = '{"max_customers": 100, "max_users": 3, "max_devices": 10, "max_bandwidth": 200, "max_storage": 20, "max_hotspots": 5, "max_vlans": 10, "max_firewall_rules": 50, "max_queue_rules": 25, "max_monitoring_days": 60, "max_reports": 10, "max_alerts": 25, "max_api_calls_per_hour": 500, "max_webhooks": 5}',
    plan_features = '{"customer_management": true, "billing_management": true, "device_management": true, "network_monitoring": true, "user_management": true, "mikrotik_integration": true, "hotspot_management": true, "vlan_management": false, "firewall_management": false, "queue_management": true, "speed_boost": false, "real_time_monitoring": true, "advanced_reports": false, "custom_dashboard": false, "data_export": true, "alert_system": true, "api_access": false, "webhook_support": false, "third_party_integration": false, "custom_branding": false, "white_label": false, "priority_support": false, "phone_support": false, "dedicated_manager": false, "custom_training": false}',
    trial_config = '{"trial_days": 14, "trial_enabled": true, "require_payment": false, "auto_convert": false}'
WHERE slug = 'standard';

UPDATE subscription_plans SET 
    limits = '{"max_customers": -1, "max_users": -1, "max_devices": -1, "max_bandwidth": -1, "max_storage": -1, "max_hotspots": -1, "max_vlans": -1, "max_firewall_rules": -1, "max_queue_rules": -1, "max_monitoring_days": 365, "max_reports": -1, "max_alerts": -1, "max_api_calls_per_hour": -1, "max_webhooks": -1}',
    plan_features = '{"customer_management": true, "billing_management": true, "device_management": true, "network_monitoring": true, "user_management": true, "mikrotik_integration": true, "hotspot_management": true, "vlan_management": true, "firewall_management": true, "queue_management": true, "speed_boost": true, "real_time_monitoring": true, "advanced_reports": true, "custom_dashboard": true, "data_export": true, "alert_system": true, "api_access": true, "webhook_support": true, "third_party_integration": true, "custom_branding": true, "white_label": true, "priority_support": true, "phone_support": true, "dedicated_manager": true, "custom_training": true}',
    trial_config = '{"trial_days": 30, "trial_enabled": true, "require_payment": false, "auto_convert": false}'
WHERE slug = 'premium';

-- Update any plans with empty limits
UPDATE subscription_plans SET 
    limits = '{"max_customers": 50, "max_users": 2, "max_devices": 5, "max_bandwidth": 100, "max_storage": 10, "max_hotspots": 2, "max_vlans": 5, "max_firewall_rules": 20, "max_queue_rules": 10, "max_monitoring_days": 30, "max_reports": 5, "max_alerts": 10, "max_api_calls_per_hour": 100, "max_webhooks": 2}'
WHERE limits IS NULL OR limits = '{}';

UPDATE subscription_plans SET 
    plan_features = '{"customer_management": true, "billing_management": true, "device_management": true, "network_monitoring": true, "user_management": true, "mikrotik_integration": true, "hotspot_management": false, "vlan_management": false, "firewall_management": false, "queue_management": true, "speed_boost": false, "real_time_monitoring": false, "advanced_reports": false, "custom_dashboard": false, "data_export": false, "alert_system": true, "api_access": false, "webhook_support": false, "third_party_integration": false, "custom_branding": false, "white_label": false, "priority_support": false, "phone_support": false, "dedicated_manager": false, "custom_training": false}'
WHERE plan_features IS NULL OR plan_features = '{}';

UPDATE subscription_plans SET 
    trial_config = '{"trial_days": 14, "trial_enabled": true, "require_payment": false, "auto_convert": false}'
WHERE trial_config IS NULL OR trial_config = '{}';

COMMIT;

-- ============================================================
-- END OF MIGRATION SCRIPT
-- ============================================================
