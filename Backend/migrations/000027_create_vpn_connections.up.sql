-- VPN Connections table for storing VPN client configurations
CREATE TABLE IF NOT EXISTS vpn_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(36) NOT NULL,
    device_id UUID REFERENCES radius_nas(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    vpn_type VARCHAR(20) DEFAULT 'openvpn',
    status VARCHAR(20) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    
    -- OpenVPN certificates (stored encrypted in production)
    ovpn_ca_cert TEXT,
    ovpn_client_cert TEXT,
    ovpn_client_key_encrypted TEXT,
    ovpn_tls_auth TEXT,
    
    -- Connection info
    assigned_ip VARCHAR(45),
    last_connected_at TIMESTAMP,
    last_disconnected_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vpn_connections_tenant ON vpn_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vpn_connections_device ON vpn_connections(device_id);
CREATE INDEX IF NOT EXISTS idx_vpn_connections_status ON vpn_connections(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_vpn_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vpn_connections_updated_at ON vpn_connections;
CREATE TRIGGER trigger_vpn_connections_updated_at
    BEFORE UPDATE ON vpn_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_vpn_connections_updated_at();
