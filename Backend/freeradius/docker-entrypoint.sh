#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" 2>/dev/null; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
done
echo "PostgreSQL is ready!"

# Create radcheck view if not exists
echo "Creating RADIUS views..."
PGPASSWORD="${DB_PASSWORD:-cvkcvk12}" psql -h "${DB_HOST:-postgres}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-rtrwnet_saas}" << 'SQLEOF'
-- radcheck view - returns Cleartext-Password for PAP auth
CREATE OR REPLACE VIEW radcheck AS
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

-- radreply view - returns reply attributes (like static IP)
CREATE OR REPLACE VIEW radreply AS
SELECT 
    ROW_NUMBER() OVER () AS id,
    pppoe_username AS username,
    'Framed-IP-Address'::text AS attribute,
    ':='::text AS op,
    static_ip AS value,
    true AS is_active
FROM customers
WHERE pppoe_username IS NOT NULL 
AND pppoe_username != ''
AND status = 'active'
AND static_ip IS NOT NULL 
AND static_ip != '';

-- Create empty group tables if not exist
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

-- Create accounting table if not exist
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

-- Create post-auth log table if not exist
CREATE TABLE IF NOT EXISTS radpostauth (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    pass VARCHAR(64),
    reply VARCHAR(32),
    authdate TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_radacct_username ON radacct(username);
CREATE INDEX IF NOT EXISTS idx_radacct_acctsessionid ON radacct(acctsessionid);
CREATE INDEX IF NOT EXISTS idx_radacct_nasipaddress ON radacct(nasipaddress);
CREATE INDEX IF NOT EXISTS idx_radpostauth_username ON radpostauth(username);
SQLEOF

echo "RADIUS views created successfully!"

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

echo "Starting FreeRADIUS in debug mode..."

# Find radiusd binary and run in foreground
if [ -x /opt/sbin/radiusd ]; then
    exec /opt/sbin/radiusd -f -l stdout
elif command -v radiusd >/dev/null 2>&1; then
    exec radiusd -f -l stdout
elif command -v freeradius >/dev/null 2>&1; then
    exec freeradius -f -l stdout
elif [ -x /usr/sbin/radiusd ]; then
    exec /usr/sbin/radiusd -f -l stdout
elif [ -x /usr/sbin/freeradius ]; then
    exec /usr/sbin/freeradius -f -l stdout
else
    echo "ERROR: radiusd/freeradius binary not found!"
    exit 1
fi
