-- FreeRADIUS PostgreSQL Schema
-- Based on FreeRADIUS 3.x schema with multi-tenant support

-- radcheck: User authentication data
CREATE TABLE IF NOT EXISTS radcheck (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    username VARCHAR(64) NOT NULL DEFAULT '',
    attribute VARCHAR(64) NOT NULL DEFAULT '',
    op VARCHAR(2) NOT NULL DEFAULT '==',
    value VARCHAR(253) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_radcheck_username ON radcheck(username);
CREATE INDEX idx_radcheck_tenant ON radcheck(tenant_id);

-- radreply: User reply attributes (rate limit, etc)
CREATE TABLE IF NOT EXISTS radreply (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    username VARCHAR(64) NOT NULL DEFAULT '',
    attribute VARCHAR(64) NOT NULL DEFAULT '',
    op VARCHAR(2) NOT NULL DEFAULT '=',
    value VARCHAR(253) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_radreply_username ON radreply(username);
CREATE INDEX idx_radreply_tenant ON radreply(tenant_id);

-- radgroupcheck: Group check attributes
CREATE TABLE IF NOT EXISTS radgroupcheck (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    groupname VARCHAR(64) NOT NULL DEFAULT '',
    attribute VARCHAR(64) NOT NULL DEFAULT '',
    op VARCHAR(2) NOT NULL DEFAULT '==',
    value VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX idx_radgroupcheck_groupname ON radgroupcheck(groupname);

-- radgroupreply: Group reply attributes
CREATE TABLE IF NOT EXISTS radgroupreply (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    groupname VARCHAR(64) NOT NULL DEFAULT '',
    attribute VARCHAR(64) NOT NULL DEFAULT '',
    op VARCHAR(2) NOT NULL DEFAULT '=',
    value VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX idx_radgroupreply_groupname ON radgroupreply(groupname);

-- radusergroup: User to group mapping
CREATE TABLE IF NOT EXISTS radusergroup (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    username VARCHAR(64) NOT NULL DEFAULT '',
    groupname VARCHAR(64) NOT NULL DEFAULT '',
    priority INT NOT NULL DEFAULT 1
);
CREATE INDEX idx_radusergroup_username ON radusergroup(username);

-- radacct: Accounting data (sessions)
CREATE TABLE IF NOT EXISTS radacct (
    radacctid BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    acctsessionid VARCHAR(64) NOT NULL DEFAULT '',
    acctuniqueid VARCHAR(32) NOT NULL DEFAULT '',
    username VARCHAR(64) NOT NULL DEFAULT '',
    realm VARCHAR(64) DEFAULT '',
    nasipaddress INET NOT NULL,
    nasportid VARCHAR(32) DEFAULT NULL,
    nasporttype VARCHAR(32) DEFAULT NULL,
    acctstarttime TIMESTAMP NULL DEFAULT NULL,
    acctupdatetime TIMESTAMP NULL DEFAULT NULL,
    acctstoptime TIMESTAMP NULL DEFAULT NULL,
    acctinterval INT DEFAULT NULL,
    acctsessiontime INT DEFAULT NULL,
    acctauthentic VARCHAR(32) DEFAULT NULL,
    connectinfo_start VARCHAR(128) DEFAULT NULL,
    connectinfo_stop VARCHAR(128) DEFAULT NULL,
    acctinputoctets BIGINT DEFAULT NULL,
    acctoutputoctets BIGINT DEFAULT NULL,
    calledstationid VARCHAR(50) NOT NULL DEFAULT '',
    callingstationid VARCHAR(50) NOT NULL DEFAULT '',
    acctterminatecause VARCHAR(32) NOT NULL DEFAULT '',
    servicetype VARCHAR(32) DEFAULT NULL,
    framedprotocol VARCHAR(32) DEFAULT NULL,
    framedipaddress INET DEFAULT NULL,
    framedipv6address VARCHAR(45) DEFAULT NULL,
    framedipv6prefix VARCHAR(45) DEFAULT NULL,
    framedinterfaceid VARCHAR(44) DEFAULT NULL,
    delegatedipv6prefix VARCHAR(45) DEFAULT NULL
);

CREATE INDEX idx_radacct_username ON radacct(username);
CREATE INDEX idx_radacct_tenant ON radacct(tenant_id);
CREATE INDEX idx_radacct_session ON radacct(acctsessionid);
CREATE INDEX idx_radacct_unique ON radacct(acctuniqueid);
CREATE INDEX idx_radacct_start ON radacct(acctstarttime);
CREATE INDEX idx_radacct_stop ON radacct(acctstoptime);
CREATE INDEX idx_radacct_nas ON radacct(nasipaddress);
CREATE INDEX idx_radacct_active ON radacct(acctstoptime) WHERE acctstoptime IS NULL;

-- radpostauth: Post-authentication logging
CREATE TABLE IF NOT EXISTS radpostauth (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    username VARCHAR(64) NOT NULL DEFAULT '',
    pass VARCHAR(64) NOT NULL DEFAULT '',
    reply VARCHAR(32) NOT NULL DEFAULT '',
    authdate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_radpostauth_username ON radpostauth(username);
CREATE INDEX idx_radpostauth_tenant ON radpostauth(tenant_id);

-- nas: Network Access Servers (already exists, but ensure compatibility)
-- Using existing radius_nas table

-- Create view for active sessions
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    radacctid,
    tenant_id,
    acctsessionid,
    username,
    nasipaddress,
    framedipaddress,
    acctstarttime,
    acctinputoctets,
    acctoutputoctets,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - acctstarttime))::INT as session_time
FROM radacct
WHERE acctstoptime IS NULL;

-- Function to sync radius_users to radcheck
CREATE OR REPLACE FUNCTION sync_radius_user_to_radcheck()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Delete old entries
        DELETE FROM radcheck WHERE username = NEW.username AND tenant_id = NEW.tenant_id;
        
        -- Insert Cleartext-Password
        INSERT INTO radcheck (tenant_id, username, attribute, op, value)
        VALUES (NEW.tenant_id, NEW.username, 'Cleartext-Password', ':=', NEW.password_plain);
        
        -- Insert expiration if set
        IF NEW.expire_date IS NOT NULL THEN
            INSERT INTO radcheck (tenant_id, username, attribute, op, value)
            VALUES (NEW.tenant_id, NEW.username, 'Expiration', ':=', 
                    TO_CHAR(NEW.expire_date, 'Mon DD YYYY HH24:MI:SS'));
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM radcheck WHERE username = OLD.username AND tenant_id = OLD.tenant_id;
        DELETE FROM radreply WHERE username = OLD.username AND tenant_id = OLD.tenant_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-sync radius_users to radcheck
DROP TRIGGER IF EXISTS trigger_sync_radius_user ON radius_users;
CREATE TRIGGER trigger_sync_radius_user
    AFTER INSERT OR UPDATE OR DELETE ON radius_users
    FOR EACH ROW EXECUTE FUNCTION sync_radius_user_to_radcheck();

-- Function to sync hotspot_vouchers to radcheck
CREATE OR REPLACE FUNCTION sync_hotspot_voucher_to_radcheck()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Only sync active vouchers
        IF NEW.status = 'active' OR NEW.status = 'unused' THEN
            DELETE FROM radcheck WHERE username = NEW.voucher_code AND tenant_id = NEW.tenant_id;
            
            -- Insert Cleartext-Password (voucher_password is bcrypt, need plain text)
            -- For now, use voucher_code as password (will be updated by backend)
            INSERT INTO radcheck (tenant_id, username, attribute, op, value)
            VALUES (NEW.tenant_id, NEW.voucher_code, 'Cleartext-Password', ':=', NEW.voucher_code);
            
            -- Insert expiration if set
            IF NEW.expires_at IS NOT NULL THEN
                INSERT INTO radcheck (tenant_id, username, attribute, op, value)
                VALUES (NEW.tenant_id, NEW.voucher_code, 'Expiration', ':=', 
                        TO_CHAR(NEW.expires_at, 'Mon DD YYYY HH24:MI:SS'));
            END IF;
        ELSE
            -- Remove from radcheck if not active
            DELETE FROM radcheck WHERE username = NEW.voucher_code AND tenant_id = NEW.tenant_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM radcheck WHERE username = OLD.voucher_code AND tenant_id = OLD.tenant_id;
        DELETE FROM radreply WHERE username = OLD.voucher_code AND tenant_id = OLD.tenant_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-sync hotspot_vouchers to radcheck
DROP TRIGGER IF EXISTS trigger_sync_hotspot_voucher ON hotspot_vouchers;
CREATE TRIGGER trigger_sync_hotspot_voucher
    AFTER INSERT OR UPDATE OR DELETE ON hotspot_vouchers
    FOR EACH ROW EXECUTE FUNCTION sync_hotspot_voucher_to_radcheck();

-- Initial sync of existing data
INSERT INTO radcheck (tenant_id, username, attribute, op, value)
SELECT tenant_id, username, 'Cleartext-Password', ':=', password_plain
FROM radius_users
WHERE is_active = true
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE radcheck IS 'FreeRADIUS user authentication attributes';
COMMENT ON TABLE radreply IS 'FreeRADIUS user reply attributes (rate limits, etc)';
COMMENT ON TABLE radacct IS 'FreeRADIUS accounting sessions';
COMMENT ON TABLE radpostauth IS 'FreeRADIUS post-authentication log';
