#!/bin/sh
set -e

echo "=== FreeRADIUS Entrypoint ==="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
max_attempts=30
attempt=0
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "ERROR: PostgreSQL not ready after $max_attempts attempts"
        exit 1
    fi
    echo "PostgreSQL is unavailable - sleeping (attempt $attempt/$max_attempts)"
    sleep 2
done
echo "PostgreSQL is ready!"

# Create RADIUS views and tables
echo "Creating RADIUS views..."
export PGPASSWORD="${DB_PASSWORD:-cvkcvk12}"

# Drop and recreate views to ensure correct structure
psql -h "${DB_HOST:-postgres}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-rtrwnet_saas}" -c "
DROP VIEW IF EXISTS radcheck CASCADE;
CREATE VIEW radcheck AS
SELECT 
    ROW_NUMBER() OVER () AS id,
    pppoe_username AS username,
    'Cleartext-Password'::text AS attribute,
    ':='::text AS op,
    pppoe_password AS value,
    true AS is_active
FROM customers
WHERE pppoe_username IS NOT NULL 
AND pppoe_username != ''
AND status = 'active';
" || echo "Warning: Could not create radcheck view"

psql -h "${DB_HOST:-postgres}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-rtrwnet_saas}" -c "
DROP VIEW IF EXISTS radreply CASCADE;
CREATE VIEW radreply AS
-- Static IP assignment
SELECT 
    ROW_NUMBER() OVER () AS id,
    c.pppoe_username AS username,
    'Framed-IP-Address'::text AS attribute,
    ':='::text AS op,
    c.static_ip AS value,
    true AS is_active
FROM customers c
WHERE c.pppoe_username IS NOT NULL 
AND c.pppoe_username != ''
AND c.status = 'active'
AND c.static_ip IS NOT NULL 
AND c.static_ip != ''

UNION ALL

-- MikroTik Rate Limit (format: rx/tx for download/upload in kbps)
SELECT 
    ROW_NUMBER() OVER () + 10000 AS id,
    c.pppoe_username AS username,
    'Mikrotik-Rate-Limit'::text AS attribute,
    ':='::text AS op,
    (sp.speed_download * 1000)::text || 'k/' || (sp.speed_upload * 1000)::text || 'k' AS value,
    true AS is_active
FROM customers c
JOIN service_plans sp ON c.service_plan_id = sp.id::text
WHERE c.pppoe_username IS NOT NULL 
AND c.pppoe_username != ''
AND c.status = 'active'
AND sp.speed_download > 0;
" || echo "Warning: Could not create radreply view"

psql -h "${DB_HOST:-postgres}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-rtrwnet_saas}" -c "
CREATE TABLE IF NOT EXISTS radgroupcheck (
    id SERIAL PRIMARY KEY,
    groupname VARCHAR(64) NOT NULL,
    attribute VARCHAR(64) NOT NULL,
    op VARCHAR(2) DEFAULT ':=',
    value VARCHAR(253) NOT NULL
);
CREATE TABLE IF NOT EXISTS radgroupreply (
    id SERIAL PRIMARY KEY,
    groupname VARCHAR(64) NOT NULL,
    attribute VARCHAR(64) NOT NULL,
    op VARCHAR(2) DEFAULT ':=',
    value VARCHAR(253) NOT NULL
);
CREATE TABLE IF NOT EXISTS radusergroup (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    groupname VARCHAR(64) NOT NULL,
    priority INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS radacct (
    radacctid BIGSERIAL PRIMARY KEY,
    acctsessionid VARCHAR(64) NOT NULL,
    acctuniqueid VARCHAR(32) NOT NULL UNIQUE,
    username VARCHAR(64) NOT NULL,
    realm VARCHAR(64),
    nasipaddress VARCHAR(15) NOT NULL,
    nasportid VARCHAR(32),
    nasporttype VARCHAR(32),
    acctstarttime TIMESTAMP WITH TIME ZONE,
    acctupdatetime TIMESTAMP WITH TIME ZONE,
    acctstoptime TIMESTAMP WITH TIME ZONE,
    acctsessiontime INTEGER,
    acctauthentic VARCHAR(32),
    connectinfo_start VARCHAR(128),
    connectinfo_stop VARCHAR(128),
    acctinputoctets BIGINT,
    acctoutputoctets BIGINT,
    calledstationid VARCHAR(50),
    callingstationid VARCHAR(50),
    acctterminatecause VARCHAR(32),
    servicetype VARCHAR(32),
    framedprotocol VARCHAR(32),
    framedipaddress VARCHAR(15)
);
CREATE TABLE IF NOT EXISTS radpostauth (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    pass VARCHAR(64),
    reply VARCHAR(32),
    authdate TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
" || echo "Warning: Could not create RADIUS tables"

echo "RADIUS setup complete!"

# Update SQL config with environment variables
for RADDB_PATH in /etc/raddb /opt/etc/raddb; do
    if [ -f "$RADDB_PATH/mods-available/sql" ]; then
        sed -i "s/server = .*/server = \"${DB_HOST:-postgres}\"/" "$RADDB_PATH/mods-available/sql"
        sed -i "s/port = .*/port = ${DB_PORT:-5432}/" "$RADDB_PATH/mods-available/sql"
        sed -i "s/login = .*/login = \"${DB_USER:-postgres}\"/" "$RADDB_PATH/mods-available/sql"
        sed -i "s/password = .*/password = \"${DB_PASSWORD:-cvkcvk12}\"/" "$RADDB_PATH/mods-available/sql"
        sed -i "s/radius_db = .*/radius_db = \"${DB_NAME:-rtrwnet_saas}\"/" "$RADDB_PATH/mods-available/sql"
        echo "Updated SQL config at $RADDB_PATH"
    fi
done

# Remove inner-tunnel to avoid conflicts
rm -f /etc/raddb/sites-enabled/inner-tunnel 2>/dev/null || true
rm -f /opt/etc/raddb/sites-enabled/inner-tunnel 2>/dev/null || true

# Disable EAP module (not needed for PPPoE/PAP auth)
rm -f /etc/raddb/mods-enabled/eap 2>/dev/null || true
rm -f /opt/etc/raddb/mods-enabled/eap 2>/dev/null || true

echo "Starting FreeRADIUS in DEBUG mode..."

# Find and run radiusd with debug flag (-X)
if [ -x /opt/sbin/radiusd ]; then
    exec /opt/sbin/radiusd -X
elif [ -x /usr/sbin/radiusd ]; then
    exec /usr/sbin/radiusd -X
elif [ -x /usr/sbin/freeradius ]; then
    exec /usr/sbin/freeradius -X
else
    echo "ERROR: radiusd binary not found!"
    exit 1
fi
