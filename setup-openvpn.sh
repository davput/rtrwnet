#!/bin/bash
# ============================================
# OpenVPN Setup Script untuk RT/RW Net SaaS
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}OpenVPN Setup untuk RT/RW Net SaaS${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Load env
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

VPS_IP=${VPN_SERVER_IP:-202.10.48.155}

# Check if openvpn container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "rtrwnet-openvpn"; then
    echo -e "${YELLOW}[1/4] Creating OpenVPN container...${NC}"
    docker run -v openvpn_data:/etc/openvpn --rm kylemanna/openvpn ovpn_genconfig -u udp://${VPS_IP}
    
    echo -e "${YELLOW}[2/4] Generating PKI (tekan Enter untuk default)...${NC}"
    docker run -v openvpn_data:/etc/openvpn --rm -it kylemanna/openvpn ovpn_initpki nopass
fi

# Start OpenVPN
echo -e "${YELLOW}[3/4] Starting OpenVPN server...${NC}"
docker run -d \
    --name rtrwnet-openvpn \
    --restart unless-stopped \
    --cap-add=NET_ADMIN \
    -p 1194:1194/udp \
    -v openvpn_data:/etc/openvpn \
    kylemanna/openvpn 2>/dev/null || docker start rtrwnet-openvpn

# Configure for MikroTik (no client cert required)
echo -e "${YELLOW}[4/4] Configuring for MikroTik compatibility...${NC}"

# Create auth script
docker exec rtrwnet-openvpn sh -c 'cat > /etc/openvpn/auth.sh << "EOF"
#!/bin/sh
# Accept all - MikroTik auth
exit 0
EOF
chmod +x /etc/openvpn/auth.sh'

# Update server config for MikroTik
docker exec rtrwnet-openvpn sh -c 'cat >> /etc/openvpn/openvpn.conf << "EOF"

# MikroTik compatibility
verify-client-cert none
username-as-common-name
auth-user-pass-verify /etc/openvpn/auth.sh via-env
script-security 3
duplicate-cn
EOF' 2>/dev/null || true

# Restart to apply config
docker restart rtrwnet-openvpn

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}OpenVPN Server berhasil disetup!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Server IP  : ${VPS_IP}"
echo -e "Port       : 1194/UDP"
echo -e "VPN Network: 10.8.0.0/24"
echo ""
echo -e "${YELLOW}MikroTik sudah bisa connect tanpa certificate.${NC}"
echo -e "${YELLOW}Gunakan menu 'Tambah MikroTik' di dashboard untuk generate script.${NC}"
