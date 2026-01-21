#!/bin/bash
set -e

PKI_DIR="/etc/openvpn/pki"
LOG_DIR="/var/log/openvpn"

echo "============================================"
echo "OpenVPN Server - Username/Password Auth"
echo "============================================"

# Create log directory
mkdir -p $LOG_DIR

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
# Format: username:password
# Add your VPN users here
admin:admin123
test:test123
EOF
fi

echo ">>> Starting OpenVPN server..."
echo "============================================"

exec openvpn --config /etc/openvpn/server.conf
