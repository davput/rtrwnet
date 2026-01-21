#!/bin/bash
set -e

PKI_DIR="/etc/openvpn/pki"
LOG_DIR="/var/log/openvpn"
CONFIG_FILE="/etc/openvpn/server.conf"
AUTH_SCRIPT="/etc/openvpn/auth-user.sh"

echo "============================================"
echo "OpenVPN Server - Username/Password Auth"
echo "============================================"

# Create log directory
mkdir -p $LOG_DIR

# Copy config files if not exist (PVC might be empty)
if [ ! -f "$CONFIG_FILE" ]; then
    echo ">>> Copying server.conf to PVC..."
    cat > $CONFIG_FILE << 'SERVERCONF'
# OpenVPN Server - Username/Password Auth (No Client Certificate)
port 1194
proto udp
dev tun

# Server network
server 10.8.0.0 255.255.255.0
topology subnet

# Certificates (server only - clients use username/password)
ca /etc/openvpn/pki/ca.crt
cert /etc/openvpn/pki/server.crt
key /etc/openvpn/pki/server.key
dh /etc/openvpn/pki/dh.pem

# Username/Password authentication
auth-user-pass-verify /etc/openvpn/auth-user.sh via-env
script-security 3
username-as-common-name

# NO client certificate required
verify-client-cert none

# Security
cipher AES-256-CBC
auth SHA256

# Performance
keepalive 10 120
persist-key
persist-tun

# Logging
status /var/log/openvpn/status.log 10
log-append /var/log/openvpn/openvpn.log
verb 3

# User/Group
user nobody
group nogroup

# Client settings
push "route 10.8.0.0 255.255.255.0"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"

# Allow multiple clients with same username
duplicate-cn

# Client-to-client
client-to-client

# Max clients
max-clients 100
SERVERCONF
fi

# Copy auth script if not exist
if [ ! -f "$AUTH_SCRIPT" ]; then
    echo ">>> Copying auth-user.sh to PVC..."
    cat > $AUTH_SCRIPT << 'AUTHSCRIPT'
#!/bin/bash
# OpenVPN Username/Password Authentication Script
USERNAME="$username"
PASSWORD="$password"

echo "$(date): Auth attempt for user: $USERNAME" >> /var/log/openvpn/auth.log

# Allow any user starting with "rtrw" with password >= 8 chars
if [[ "$USERNAME" == rtrw* ]] && [ ${#PASSWORD} -ge 8 ]; then
    echo "$(date): Auth SUCCESS for user: $USERNAME" >> /var/log/openvpn/auth.log
    exit 0
fi

# Check users file
if [ -f "/etc/openvpn/users.txt" ]; then
    while IFS=: read -r stored_user stored_pass; do
        if [ "$USERNAME" = "$stored_user" ] && [ "$PASSWORD" = "$stored_pass" ]; then
            echo "$(date): Auth SUCCESS for user: $USERNAME" >> /var/log/openvpn/auth.log
            exit 0
        fi
    done < "/etc/openvpn/users.txt"
fi

echo "$(date): Auth FAILED for user: $USERNAME" >> /var/log/openvpn/auth.log
exit 1
AUTHSCRIPT
    chmod +x $AUTH_SCRIPT
fi

# Check if PKI already exists
if [ ! -f "$PKI_DIR/ca.crt" ]; then
    echo ">>> Generating PKI (first time setup)..."
    
    mkdir -p $PKI_DIR
    cd /usr/share/easy-rsa
    
    # Initialize PKI
    ./easyrsa init-pki
    
    # Build CA (no password)
    echo ">>> Building CA..."
    ./easyrsa --batch build-ca nopass
    
    # Build server cert
    echo ">>> Building server certificate..."
    ./easyrsa --batch build-server-full server nopass
    
    # Generate DH
    echo ">>> Generating DH parameters..."
    ./easyrsa gen-dh
    
    # Copy to openvpn dir
    cp pki/ca.crt $PKI_DIR/
    cp pki/issued/server.crt $PKI_DIR/
    cp pki/private/server.key $PKI_DIR/
    cp pki/dh.pem $PKI_DIR/
    
    echo ">>> PKI generation complete!"
else
    echo ">>> PKI already exists, skipping generation"
fi

# Setup NAT
echo ">>> Setting up NAT..."
echo 1 > /proc/sys/net/ipv4/ip_forward

iptables -t nat -C POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE 2>/dev/null || \
iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE

iptables -C FORWARD -i tun0 -j ACCEPT 2>/dev/null || \
iptables -A FORWARD -i tun0 -j ACCEPT

iptables -C FORWARD -o tun0 -j ACCEPT 2>/dev/null || \
iptables -A FORWARD -o tun0 -j ACCEPT

# Create default users file if not exists
if [ ! -f "/etc/openvpn/users.txt" ]; then
    echo ">>> Creating default users file..."
    cat > /etc/openvpn/users.txt << 'EOF'
admin:admin123
test:test123
EOF
fi

echo ">>> Starting OpenVPN server..."
echo "============================================"

exec openvpn --config /etc/openvpn/server.conf
