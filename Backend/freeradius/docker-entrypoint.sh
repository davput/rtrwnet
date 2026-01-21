#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" 2>/dev/null; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
done
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
exec "$@"
