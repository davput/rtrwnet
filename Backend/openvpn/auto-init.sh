#!/bin/bash
set -e

OVPN_DATA="/etc/openvpn"
OVPN_SERVER_URL="${OVPN_SERVER_URL:-udp://vpn.example.com}"
OVPN_NETWORK="${OVPN_NETWORK:-10.8.0.0}"
OVPN_NETMASK="${OVPN_NETMASK:-255.255.255.0}"
OVPN_DNS1="${OVPN_DNS1:-8.8.8.8}"
OVPN_DNS2="${OVPN_DNS2:-8.8.4.4}"

echo "============================================"
echo "   OpenVPN Auto-Init (Fully Automated)"
echo "============================================"
echo "Server URL: $OVPN_SERVER_URL"
echo "Network: $OVPN_NETWORK/$OVPN_NETMASK"
echo "DNS: $OVPN_DNS1, $OVPN_DNS2"
echo "============================================"

# Check if already initialized
if [ -f "$OVPN_DATA/openvpn.conf" ] && [ -f "$OVPN_DATA/pki/ca.crt" ]; then
    echo ">>> OpenVPN already initialized, starting server..."
else
    echo ">>> First time initialization..."
    
    # Use kylemanna/openvpn built-in tools
    echo ">>> Generating server config..."
    ovpn_genconfig -u "$OVPN_SERVER_URL" \
        -s "$OVPN_NETWORK/24" \
        -n "$OVPN_DNS1" \
        -n "$OVPN_DNS2" \
        -N \
        -d \
        -C AES-256-GCM \
        -a SHA256
    
    # Initialize PKI non-interactively
    echo ">>> Initializing PKI (this may take a while)..."
    
    # Set vars for non-interactive mode
    export EASYRSA_BATCH=1
    export EASYRSA_REQ_CN="RTRWNet-VPN-CA"
    
    # Use built-in ovpn_initpki with nopass
    echo -e "\n\n" | ovpn_initpki nopass
    
    echo ">>> PKI initialization complete!"
    
    # Add extra config for MikroTik compatibility
    cat >> $OVPN_DATA/openvpn.conf << 'EXTRACONF'

# MikroTik compatibility
duplicate-cn
client-to-client
max-clients 100
EXTRACONF

    echo "============================================"
    echo "   OpenVPN Initialization Complete!"
    echo "============================================"
fi

# Setup NAT (if not already)
echo ">>> Setting up NAT..."
iptables -t nat -C POSTROUTING -s ${OVPN_NETWORK}/24 -o eth0 -j MASQUERADE 2>/dev/null || \
iptables -t nat -A POSTROUTING -s ${OVPN_NETWORK}/24 -o eth0 -j MASQUERADE || true

# Start OpenVPN using built-in script
echo ">>> Starting OpenVPN server..."
exec ovpn_run
