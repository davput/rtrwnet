#!/bin/bash

# Script untuk setup OpenVPN server otomatis
# Tidak perlu install manual, semua via Docker

set -e

echo "=========================================="
echo "OpenVPN Server Setup"
echo "=========================================="
echo ""

# Get VPS IP
read -p "Masukkan IP VPS Anda (contoh: 203.0.113.10): " VPS_IP

if [ -z "$VPS_IP" ]; then
    echo "Error: IP VPS wajib diisi!"
    exit 1
fi

echo ""
echo "IP VPS: $VPS_IP"
echo ""

# Check if OpenVPN container exists
if docker ps -a | grep -q rtrwnet-openvpn; then
    echo "OpenVPN container sudah ada. Menghapus container lama..."
    docker rm -f rtrwnet-openvpn 2>/dev/null || true
fi

# Remove old volume
echo "Membersihkan volume lama..."
docker volume rm rtrwnet_openvpn_data 2>/dev/null || true

echo ""
echo "Step 1: Membuat volume untuk OpenVPN..."
docker volume create --name rtrwnet_openvpn_data

echo ""
echo "Step 2: Generate konfigurasi OpenVPN..."
docker run -v rtrwnet_openvpn_data:/etc/openvpn --rm kylemanna/openvpn ovpn_genconfig -u udp://$VPS_IP

echo ""
echo "Step 3: Generate CA certificate..."
echo "PENTING: Anda akan diminta membuat password untuk CA."
echo "Simpan password ini dengan aman!"
echo ""
docker run -v rtrwnet_openvpn_data:/etc/openvpn --rm -it kylemanna/openvpn ovpn_initpki

echo ""
echo "Step 4: Menyesuaikan konfigurasi..."
# Update config untuk multi-client
docker run -v rtrwnet_openvpn_data:/etc/openvpn --rm kylemanna/openvpn bash -c "
    echo 'duplicate-cn' >> /etc/openvpn/openvpn.conf
    echo 'client-to-client' >> /etc/openvpn/openvpn.conf
    echo 'push \"route 10.8.0.0 255.255.255.0\"' >> /etc/openvpn/openvpn.conf
"

echo ""
echo "Step 5: Start OpenVPN server..."
docker-compose up -d openvpn

echo ""
echo "Step 6: Tunggu OpenVPN server siap..."
sleep 5

echo ""
echo "=========================================="
echo "✓ OpenVPN Server berhasil di-setup!"
echo "=========================================="
echo ""
echo "Informasi:"
echo "  - Server IP: $VPS_IP"
echo "  - Port: 1194 UDP"
echo "  - Network: 10.8.0.0/24"
echo "  - Server VPN IP: 10.8.0.1"
echo ""
echo "Pastikan firewall mengizinkan port 1194 UDP:"
echo "  sudo ufw allow 1194/udp"
echo ""
echo "Cek status OpenVPN:"
echo "  docker logs rtrwnet-openvpn"
echo ""
echo "Update VPN_SERVER_IP di .env:"
echo "  VPN_SERVER_IP=$VPS_IP"
echo ""
