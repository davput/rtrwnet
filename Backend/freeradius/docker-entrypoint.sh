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

# Update SQL config with environment variables
if [ -f /etc/raddb/mods-available/sql ]; then
    sed -i "s/server = .*/server = \"${DB_HOST:-postgres}\"/" /etc/raddb/mods-available/sql
    sed -i "s/port = .*/port = ${DB_PORT:-5432}/" /etc/raddb/mods-available/sql
    sed -i "s/login = .*/login = \"${DB_USER:-postgres}\"/" /etc/raddb/mods-available/sql
    sed -i "s/password = .*/password = \"${DB_PASSWORD:-cvkcvk12}\"/" /etc/raddb/mods-available/sql
    sed -i "s/radius_db = .*/radius_db = \"${DB_NAME:-rtrwnet_saas}\"/" /etc/raddb/mods-available/sql
fi

echo "Starting FreeRADIUS..."

# Find radiusd binary
if command -v radiusd >/dev/null 2>&1; then
    exec radiusd -f -l stdout
elif command -v freeradius >/dev/null 2>&1; then
    exec freeradius -f -l stdout
elif [ -x /usr/sbin/radiusd ]; then
    exec /usr/sbin/radiusd -f -l stdout
elif [ -x /usr/sbin/freeradius ]; then
    exec /usr/sbin/freeradius -f -l stdout
elif [ -x /opt/freeradius/sbin/radiusd ]; then
    exec /opt/freeradius/sbin/radiusd -f -l stdout
else
    echo "ERROR: radiusd/freeradius binary not found!"
    echo "Searching for radiusd..."
    find / -name "radiusd" -o -name "freeradius" 2>/dev/null || true
    exit 1
fi
