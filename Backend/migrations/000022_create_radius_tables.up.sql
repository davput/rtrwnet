-- FreeRADIUS integration tables

-- RADIUS NAS (Network Access Server) - MikroTik routers
CREATE TABLE IF NOT EXISTS radius_nas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nasname VARCHAR(128) NOT NULL, -- IP or hostname
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

CREATE INDEX idx_radius_nas_tenant_id ON radius_nas(tenant_id);
CREATE INDEX idx_radius_nas_nasname ON radius_nas(nasname);

-- RADIUS Users (for PPPoE/Hotspot authentication)
CREATE TABLE IF NOT EXISTS radius_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_plain VARCHAR(255), -- For CHAP/MS-CHAP (encrypted)
    auth_type VARCHAR(20) DEFAULT 'pap', -- pap, chap, mschap, mschapv2
    profile_name VARCHAR(64), -- Rate limit profile
    ip_address VARCHAR(45), -- Static IP if assigned
    mac_address VARCHAR(17),
    is_active BOOLEAN DEFAULT TRUE,
    simultaneous_use INTEGER DEFAULT 1,
    expire_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, username)
);

CREATE INDEX idx_radius_users_tenant_id ON radius_users(tenant_id);
CREATE INDEX idx_radius_users_customer_id ON radius_users(customer_id);
CREATE INDEX idx_radius_users_username ON radius_users(username);

-- RADIUS User Attributes (check/reply attributes)
CREATE TABLE IF NOT EXISTS radius_user_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    radius_user_id UUID NOT NULL REFERENCES radius_users(id) ON DELETE CASCADE,
    attribute VARCHAR(64) NOT NULL,
    op VARCHAR(2) DEFAULT ':=', -- :=, ==, +=, etc
    value VARCHAR(253) NOT NULL,
    attr_type VARCHAR(10) DEFAULT 'reply', -- check or reply
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_radius_user_attrs_user_id ON radius_user_attributes(radius_user_id);

-- RADIUS Profiles (bandwidth/rate limit profiles)
CREATE TABLE IF NOT EXISTS radius_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_plan_id UUID REFERENCES service_plans(id) ON DELETE SET NULL,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    -- Rate limits (in kbps)
    rate_limit_rx INTEGER, -- Download
    rate_limit_tx INTEGER, -- Upload
    burst_limit_rx INTEGER,
    burst_limit_tx INTEGER,
    burst_threshold_rx INTEGER,
    burst_threshold_tx INTEGER,
    burst_time INTEGER DEFAULT 10, -- seconds
    -- Session limits
    session_timeout INTEGER, -- seconds, 0 = unlimited
    idle_timeout INTEGER DEFAULT 300, -- seconds
    -- IP Pool
    ip_pool VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_radius_profiles_tenant_id ON radius_profiles(tenant_id);

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
    acct_session_time INTEGER DEFAULT 0, -- seconds
    acct_input_octets BIGINT DEFAULT 0,
    acct_output_octets BIGINT DEFAULT 0,
    acct_input_packets BIGINT DEFAULT 0,
    acct_output_packets BIGINT DEFAULT 0,
    acct_terminate_cause VARCHAR(32),
    framed_ip_address VARCHAR(45),
    framed_protocol VARCHAR(32),
    calling_station_id VARCHAR(50), -- MAC address
    called_station_id VARCHAR(50),
    service_type VARCHAR(32),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_radius_acct_tenant_id ON radius_accounting(tenant_id);
CREATE INDEX idx_radius_acct_user_id ON radius_accounting(radius_user_id);
CREATE INDEX idx_radius_acct_session_id ON radius_accounting(acct_session_id);
CREATE INDEX idx_radius_acct_username ON radius_accounting(username);
CREATE INDEX idx_radius_acct_start_time ON radius_accounting(acct_start_time);

-- VPN Connections (for connecting to customer MikroTik)
CREATE TABLE IF NOT EXISTS vpn_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    vpn_type VARCHAR(20) NOT NULL DEFAULT 'wireguard', -- wireguard, openvpn, l2tp, pptp
    -- WireGuard specific
    wg_public_key VARCHAR(44),
    wg_private_key_encrypted TEXT,
    wg_endpoint VARCHAR(100), -- IP:Port
    wg_allowed_ips VARCHAR(255),
    wg_persistent_keepalive INTEGER DEFAULT 25,
    -- OpenVPN specific
    ovpn_config_encrypted TEXT,
    ovpn_ca_cert TEXT,
    ovpn_client_cert TEXT,
    ovpn_client_key_encrypted TEXT,
    -- Connection status
    status VARCHAR(20) DEFAULT 'disconnected', -- connected, disconnected, connecting, error
    last_connected_at TIMESTAMP,
    last_error TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vpn_connections_tenant_id ON vpn_connections(tenant_id);
CREATE INDEX idx_vpn_connections_device_id ON vpn_connections(device_id);

-- Comments
COMMENT ON TABLE radius_nas IS 'MikroTik routers registered as RADIUS NAS';
COMMENT ON TABLE radius_users IS 'PPPoE/Hotspot users for RADIUS authentication';
COMMENT ON TABLE radius_profiles IS 'Bandwidth profiles for RADIUS users';
COMMENT ON TABLE radius_accounting IS 'Session accounting data from RADIUS';
COMMENT ON TABLE vpn_connections IS 'VPN connections to customer MikroTik routers';
