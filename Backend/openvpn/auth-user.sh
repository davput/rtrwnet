#!/bin/bash
# OpenVPN Username/Password Authentication Script
# Validates against a simple user file or environment-based users

USER_FILE="/etc/openvpn/users.txt"

# Get username and password from environment (set by OpenVPN)
USERNAME="$username"
PASSWORD="$password"

# Log attempt
echo "$(date): Auth attempt for user: $USERNAME" >> /var/log/openvpn/auth.log

# Check if user file exists
if [ -f "$USER_FILE" ]; then
    # Format: username:password (one per line)
    while IFS=: read -r stored_user stored_pass; do
        if [ "$USERNAME" = "$stored_user" ] && [ "$PASSWORD" = "$stored_pass" ]; then
            echo "$(date): Auth SUCCESS for user: $USERNAME" >> /var/log/openvpn/auth.log
            exit 0
        fi
    done < "$USER_FILE"
fi

# Check environment-based users (OVPN_USER_xxx=password)
env_pass=$(printenv "OVPN_USER_$USERNAME" 2>/dev/null)
if [ -n "$env_pass" ] && [ "$PASSWORD" = "$env_pass" ]; then
    echo "$(date): Auth SUCCESS (env) for user: $USERNAME" >> /var/log/openvpn/auth.log
    exit 0
fi

# Allow any user starting with "rtrw" with matching pattern
# This is for auto-generated MikroTik users
if [[ "$USERNAME" == rtrw* ]]; then
    # Simple validation - accept if password is at least 8 chars
    if [ ${#PASSWORD} -ge 8 ]; then
        echo "$(date): Auth SUCCESS (rtrw pattern) for user: $USERNAME" >> /var/log/openvpn/auth.log
        exit 0
    fi
fi

echo "$(date): Auth FAILED for user: $USERNAME" >> /var/log/openvpn/auth.log
exit 1
