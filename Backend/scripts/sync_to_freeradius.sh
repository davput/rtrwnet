#!/bin/bash

# Script to sync existing data to FreeRADIUS tables
# This should be run once after migrating from layeh/radius to FreeRADIUS

set -e

echo "=========================================="
echo "FreeRADIUS Data Sync Script"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file with database configuration"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo ""

# Confirm before proceeding
read -p "This will sync all data to FreeRADIUS tables. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Starting sync..."
echo ""

# Run the Go script
go run scripts/sync_to_freeradius.go

echo ""
echo "=========================================="
echo "Sync completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify FreeRADIUS is running: docker-compose ps freeradius"
echo "2. Check FreeRADIUS logs: docker-compose logs -f freeradius"
echo "3. Test authentication: radtest username password localhost:1812 0 testing123"
echo "4. Update MikroTik RADIUS configuration to point to FreeRADIUS"
echo ""
