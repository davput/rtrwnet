#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" 2>/dev/null; do
    echo "${DB_HOST:-postgres}:${DB_PORT:-5432} - no response"
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
done
echo "${DB_HOST:-postgres}:${DB_PORT:-5432} - accepting connections"
echo "PostgreSQL is ready!"

# Create radcheck view if not exists
echo "Creating radcheck view..."
PGPASSWORD="${DB_PASSWORD:-cvkcvk12}" psql -h "${DB_HOST:-postgres}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-rtrwnet_saas}" -c "
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
" 2>/dev/null || echo "Views may already exist"

# Update SQL config with environment variables - check both paths
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

# Fix site config for PAP/CHAP authentication - check both paths
for RADDB_PATH in /etc/raddb /opt/etc/raddb; do
    if [ -d "$RADDB_PATH/sites-enabled" ]; then
        cat > "$RADDB_PATH/sites-enabled/default" << 'SITEEOF'
server default {
    listen {
        type = auth
        ipaddr = *
        port = 1812
    }
    
    listen {
        type = acct
        ipaddr = *
        port = 1813
    }

    authorize {
        filter_username
        preprocess
        chap
        mschap
        sql
        pap
    }

    authenticate {
        Auth-Type PAP {
            pap
        }
        Auth-Type CHAP {
            chap
        }
        Auth-Type MS-CHAP {
            mschap
        }
    }

    preacct {
        preprocess
    }

    accounting {
        sql
    }

    post-auth {
        sql
    }
}
SITEEOF
        echo "Updated site config at $RADDB_PATH"
    fi
done

echo "Starting FreeRADIUS..."

# Find radiusd binary
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
