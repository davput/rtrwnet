-- Hotspot Voucher System Tables

-- Table: hotspot_packages
CREATE TABLE IF NOT EXISTS hotspot_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_type VARCHAR(20) NOT NULL CHECK (duration_type IN ('hours', 'days')),
    duration INTEGER NOT NULL CHECK (duration > 0),
    price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
    speed_upload INTEGER NOT NULL CHECK (speed_upload > 0), -- kbps
    speed_download INTEGER NOT NULL CHECK (speed_download > 0), -- kbps
    device_limit INTEGER NOT NULL DEFAULT 1 CHECK (device_limit BETWEEN 1 AND 2),
    mac_binding BOOLEAN DEFAULT FALSE,
    session_limit INTEGER DEFAULT 1 CHECK (session_limit > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_hotspot_packages_tenant_id ON hotspot_packages(tenant_id);
CREATE INDEX idx_hotspot_packages_tenant_active ON hotspot_packages(tenant_id, is_active);

COMMENT ON TABLE hotspot_packages IS 'Hotspot service packages with duration and bandwidth limits';
COMMENT ON COLUMN hotspot_packages.duration_type IS 'Type of duration: hours or days';
COMMENT ON COLUMN hotspot_packages.duration IS 'Duration value in hours or days';
COMMENT ON COLUMN hotspot_packages.speed_upload IS 'Upload speed limit in kbps';
COMMENT ON COLUMN hotspot_packages.speed_download IS 'Download speed limit in kbps';
COMMENT ON COLUMN hotspot_packages.device_limit IS 'Maximum concurrent devices (1-2)';
COMMENT ON COLUMN hotspot_packages.mac_binding IS 'Enforce MAC address binding';
COMMENT ON COLUMN hotspot_packages.session_limit IS 'Maximum concurrent sessions';

-- Table: hotspot_vouchers
CREATE TABLE IF NOT EXISTS hotspot_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES hotspot_packages(id) ON DELETE RESTRICT,
    radius_user_id UUID REFERENCES radius_users(id) ON DELETE SET NULL,
    voucher_code VARCHAR(50) NOT NULL,
    voucher_password VARCHAR(255) NOT NULL, -- bcrypt hashed
    status VARCHAR(20) NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'active', 'expired', 'used')),
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,
    device_mac VARCHAR(17),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, voucher_code)
);

CREATE INDEX idx_hotspot_vouchers_tenant_id ON hotspot_vouchers(tenant_id);
CREATE INDEX idx_hotspot_vouchers_status ON hotspot_vouchers(tenant_id, status);
CREATE INDEX idx_hotspot_vouchers_package_id ON hotspot_vouchers(package_id);
CREATE INDEX idx_hotspot_vouchers_expires_at ON hotspot_vouchers(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_hotspot_vouchers_code ON hotspot_vouchers(voucher_code);
CREATE INDEX idx_hotspot_vouchers_radius_user ON hotspot_vouchers(radius_user_id) WHERE radius_user_id IS NOT NULL;

COMMENT ON TABLE hotspot_vouchers IS 'Hotspot access vouchers with time-limited credentials';
COMMENT ON COLUMN hotspot_vouchers.voucher_code IS 'Username for hotspot login';
COMMENT ON COLUMN hotspot_vouchers.voucher_password IS 'Bcrypt hashed password for hotspot login';
COMMENT ON COLUMN hotspot_vouchers.status IS 'Voucher status: unused, active, expired, used';
COMMENT ON COLUMN hotspot_vouchers.activated_at IS 'Timestamp of first login';
COMMENT ON COLUMN hotspot_vouchers.expires_at IS 'Calculated expiration: activated_at + duration';
COMMENT ON COLUMN hotspot_vouchers.device_mac IS 'MAC address bound to this voucher';

-- Table: captive_portal_settings
CREATE TABLE IF NOT EXISTS captive_portal_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    logo_url TEXT,
    promotional_text TEXT,
    redirect_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#10B981',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_captive_portal_settings_tenant_id ON captive_portal_settings(tenant_id);

COMMENT ON TABLE captive_portal_settings IS 'Captive portal branding and customization settings per tenant';
COMMENT ON COLUMN captive_portal_settings.logo_url IS 'URL to tenant logo image';
COMMENT ON COLUMN captive_portal_settings.promotional_text IS 'Promotional text displayed on login page';
COMMENT ON COLUMN captive_portal_settings.redirect_url IS 'URL to redirect after successful login';
COMMENT ON COLUMN captive_portal_settings.primary_color IS 'Primary brand color (hex)';
COMMENT ON COLUMN captive_portal_settings.secondary_color IS 'Secondary brand color (hex)';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hotspot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hotspot_packages_updated_at
    BEFORE UPDATE ON hotspot_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_hotspot_updated_at();

CREATE TRIGGER trigger_hotspot_vouchers_updated_at
    BEFORE UPDATE ON hotspot_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_hotspot_updated_at();

CREATE TRIGGER trigger_captive_portal_settings_updated_at
    BEFORE UPDATE ON captive_portal_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_hotspot_updated_at();
