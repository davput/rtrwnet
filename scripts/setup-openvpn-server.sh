#!/bin/bash
# ============================================
# OpenVPN Server Setup Script untuk RT/RW Net SaaS
# VPS IP: 202.10.48.155
# ============================================
# Jalankan dengan: sudo bash setup-openvpn-server.sh
# ============================================

set -e

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Konfigurasi
VPS_IP="202.10.48.155"
VPN_NETWORK="10.8.0.0"
VPN_NETMASK="255.255.255.0"
VPN_PORT="1194"
VPN_PROTO="udp"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}OpenVPN Server Setup untuk RT/RW Net SaaS${NC}"
echo -e "${GREEN}VPS IP: ${VPS_IP}${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Script harus dijalankan sebagai root (sudo)${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}Tidak dapat mendeteksi OS${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/8] Menginstall dependencies...${NC}"
if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
    apt update
    apt install -y openvpn easy-rsa iptables-persistent
elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
    yum install -y epel-release
    yum install -y openvpn easy-rsa iptables-services
else
    echo -e "${RED}OS tidak didukung: $OS${NC}"
    exit 1
fi

echo -e "${YELLOW}[2/8] Setup Easy-RSA dan generate certificates...${NC}"
# Setup Easy-RSA
EASYRSA_DIR="/etc/openvpn/easy-rsa"
mkdir -p $EASYRSA_DIR
cp -r /usr/share/easy-rsa/* $EASYRSA_DIR/ 2>/dev/null || cp -r /usr/share/easy-rsa/3/* $EASYRSA_DIR/ 2>/dev/null || true

cd $EASYRSA_DIR

# Init PKI
./easyrsa --batch init-pki

# Build CA
./easyrsa --batch build-ca nopass

# Generate server cert
./easyrsa --batch gen-req server nopass
./easyrsa --batch sign-req server server

# Generate DH params
./easyrsa --batch gen-dh

# Copy certificates
cp pki/ca.crt /etc/openvpn/
cp pki/issued/server.crt /etc/openvpn/
cp pki/private/server.key /etc/openvpn/
cp pki/dh.pem /etc/openvpn/

echo -e "${YELLOW}[3/8] Membuat konfigurasi OpenVPN server...${NC}"
cat > /etc/openvpn/server.conf << EOF
# ============================================
# OpenVPN Server Configuration
# RT/RW Net SaaS - Auto Generated
# ============================================

# Basic
port ${VPN_PORT}
proto ${VPN_PROTO}
dev tun

# Certificates
ca /etc/openvpn/ca.crt
cert /etc/openvpn/server.crt
key /etc/openvpn/server.key
dh /etc/openvpn/dh.pem

# Network
server ${VPN_NETWORK} ${VPN_NETMASK}
ifconfig-pool-persist /etc/openvpn/ipp.txt
topology subnet

# Push routes ke client
push "route ${VPN_NETWORK} ${VPN_NETMASK}"

# Keep alive
keepalive 10 120

# Security - Compatible dengan MikroTik
cipher AES-256-CBC
auth SHA256
tls-version-min 1.0

# Permissions
user nobody
group nogroup
persist-key
persist-tun

# Logging
status /var/log/openvpn-status.log
log-append /var/log/openvpn.log
verb 3

# Allow client-to-client communication
client-to-client

# MikroTik Compatibility
# Tidak memerlukan client certificate
# Auth via username saja
verify-client-cert none
username-as-common-name

# Auth script untuk validasi user
auth-user-pass-verify /etc/openvpn/auth.sh via-env
script-security 3

# Duplicate CN allowed (multiple MikroTik dengan nama sama)
duplicate-cn
EOF

echo -e "${YELLOW}[4/8] Membuat auth script...${NC}"
cat > /etc/openvpn/auth.sh << 'EOF'
#!/bin/bash
# ============================================
# OpenVPN Auth Script untuk RT/RW Net SaaS
# Accept semua username (validasi di level aplikasi)
# ============================================

# Log auth attempt
echo "$(date): Auth attempt - User: $username" >> /var/log/openvpn-auth.log

# Accept all - validasi dilakukan di aplikasi
exit 0
EOF
chmod +x /etc/openvpn/auth.sh

echo -e "${YELLOW}[5/8] Enable IP forwarding...${NC}"
# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/99-openvpn.conf
sysctl -p /etc/sysctl.d/99-openvpn.conf

echo -e "${YELLOW}[6/8] Setup firewall rules...${NC}"
# Detect main interface
MAIN_IF=$(ip route | grep default | awk '{print $5}' | head -1)
echo "Main interface: $MAIN_IF"

# Flush existing NAT rules untuk VPN
iptables -t nat -D POSTROUTING -s ${VPN_NETWORK}/24 -o $MAIN_IF -j MASQUERADE 2>/dev/null || true

# Add NAT rule
iptables -t nat -A POSTROUTING -s ${VPN_NETWORK}/24 -o $MAIN_IF -j MASQUERADE

# Allow OpenVPN port
iptables -I INPUT -p udp --dport ${VPN_PORT} -j ACCEPT

# Allow traffic from VPN network
iptables -I INPUT -s ${VPN_NETWORK}/24 -j ACCEPT
iptables -I FORWARD -s ${VPN_NETWORK}/24 -j ACCEPT
iptables -I FORWARD -d ${VPN_NETWORK}/24 -j ACCEPT

# Save iptables
if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
    netfilter-persistent save
elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
    service iptables save
fi

echo -e "${YELLOW}[7/8] Start OpenVPN service...${NC}"
# Enable dan start OpenVPN
systemctl enable openvpn@server
systemctl restart openvpn@server

# Wait for service to start
sleep 3

echo -e "${YELLOW}[8/8] Verifikasi...${NC}"
# Check status
if systemctl is-active --quiet openvpn@server; then
    echo -e "${GREEN}✓ OpenVPN server berjalan${NC}"
else
    echo -e "${RED}✗ OpenVPN server gagal start${NC}"
    systemctl status openvpn@server
    exit 1
fi

# Check tun interface
if ip addr show tun0 &>/dev/null; then
    TUN_IP=$(ip addr show tun0 | grep 'inet ' | awk '{print $2}')
    echo -e "${GREEN}✓ TUN interface aktif: ${TUN_IP}${NC}"
else
    echo -e "${RED}✗ TUN interface tidak ditemukan${NC}"
fi

# Check port
if netstat -ulnp | grep -q ":${VPN_PORT}"; then
    echo -e "${GREEN}✓ Port ${VPN_PORT}/UDP listening${NC}"
else
    echo -e "${RED}✗ Port ${VPN_PORT}/UDP tidak listening${NC}"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}OpenVPN Server berhasil disetup!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "VPS IP        : ${YELLOW}${VPS_IP}${NC}"
echo -e "VPN Port      : ${YELLOW}${VPN_PORT}/UDP${NC}"
echo -e "VPN Network   : ${YELLOW}${VPN_NETWORK}/24${NC}"
echo -e "Server VPN IP : ${YELLOW}10.8.0.1${NC}"
echo ""
echo -e "${GREEN}Langkah selanjutnya:${NC}"
echo -e "1. Buka dashboard RT/RW Net SaaS"
echo -e "2. Menu MikroTik → Tambah MikroTik"
echo -e "3. Masukkan IP VPS: ${VPS_IP}"
echo -e "4. Copy script dan paste ke Terminal MikroTik"
echo ""
echo -e "${GREEN}============================================${NC}"
