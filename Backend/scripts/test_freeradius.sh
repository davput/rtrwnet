#!/bin/bash

# Script to test FreeRADIUS authentication
# Requires radtest (freeradius-utils package)

set -e

echo "=========================================="
echo "FreeRADIUS Authentication Test"
echo "=========================================="
echo ""

# Check if radtest is installed
if ! command -v radtest &> /dev/null; then
    echo "Error: radtest not found!"
    echo ""
    echo "Please install freeradius-utils:"
    echo "  Ubuntu/Debian: sudo apt-get install freeradius-utils"
    echo "  CentOS/RHEL: sudo yum install freeradius-utils"
    echo "  macOS: brew install freeradius-server"
    exit 1
fi

# Default values
RADIUS_HOST=${RADIUS_HOST:-localhost}
RADIUS_PORT=${RADIUS_PORT:-1812}
RADIUS_SECRET=${RADIUS_SECRET:-testing123}

echo "RADIUS Server: $RADIUS_HOST:$RADIUS_PORT"
echo "Secret: $RADIUS_SECRET"
echo ""

# Test with sample user
echo "Enter username to test (or press Enter to skip):"
read USERNAME

if [ -z "$USERNAME" ]; then
    echo "No username provided. Exiting."
    exit 0
fi

echo "Enter password:"
read -s PASSWORD
echo ""

echo "Testing authentication..."
echo ""

# Run radtest
radtest "$USERNAME" "$PASSWORD" "$RADIUS_HOST:$RADIUS_PORT" 0 "$RADIUS_SECRET"

echo ""
echo "=========================================="
echo "Test completed!"
echo "=========================================="
echo ""
echo "If you see 'Access-Accept', authentication was successful!"
echo "If you see 'Access-Reject', check:"
echo "  1. Username and password are correct"
echo "  2. User exists in radcheck table"
echo "  3. FreeRADIUS logs: docker-compose logs freeradius"
echo ""
