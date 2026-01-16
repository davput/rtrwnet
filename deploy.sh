#!/bin/bash
# ============================================
# RT/RW Net SaaS - One-Click Deploy Script
# ============================================
# Jalankan dengan: chmod +x deploy.sh && ./deploy.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}RT/RW Net SaaS - One-Click Deploy${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker tidak ditemukan! Install docker terlebih dahulu.${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose tidak ditemukan! Install docker-compose terlebih dahulu.${NC}"
    exit 1
fi

# Use docker compose or docker-compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Load environment variables
if [ -f .env.production ]; then
    echo -e "${YELLOW}[1/6] Loading environment variables...${NC}"
    export $(cat .env.production | grep -v '^#' | xargs)
    cp .env.production .env
else
    echo -e "${RED}.env.production tidak ditemukan!${NC}"
    exit 1
fi

# Stop existing containers
echo -e "${YELLOW}[2/6] Stopping existing containers...${NC}"
$DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true

# Build images
echo -e "${YELLOW}[3/6] Building Docker images...${NC}"
$DOCKER_COMPOSE build --no-cache

# Start services
echo -e "${YELLOW}[4/6] Starting services...${NC}"
$DOCKER_COMPOSE up -d

# Wait for services to be ready
echo -e "${YELLOW}[5/6] Waiting for services to be ready...${NC}"
sleep 10

# Check services
echo -e "${YELLOW}[6/6] Checking services...${NC}"
echo ""

# Check each service
services=("rtrwnet-postgres" "rtrwnet-redis" "rtrwnet-backend" "rtrwnet-user-dashboard" "rtrwnet-admin-dashboard" "rtrwnet-homepage")
all_running=true

for service in "${services[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
        echo -e "${GREEN}✓ ${service} is running${NC}"
    else
        echo -e "${RED}✗ ${service} is NOT running${NC}"
        all_running=false
    fi
done

echo ""

if [ "$all_running" = true ]; then
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}Deploy berhasil!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "Akses aplikasi:"
    echo -e "  Homepage       : ${BLUE}http://${VPN_SERVER_IP}:3000${NC}"
    echo -e "  User Dashboard : ${BLUE}http://${VPN_SERVER_IP}:5175${NC}"
    echo -e "  Admin Dashboard: ${BLUE}http://${VPN_SERVER_IP}:5174${NC}"
    echo -e "  Backend API    : ${BLUE}http://${VPN_SERVER_IP}:8089${NC}"
    echo ""
    echo -e "RADIUS Server:"
    echo -e "  Auth Port: ${BLUE}1812/UDP${NC}"
    echo -e "  Acct Port: ${BLUE}1813/UDP${NC}"
    echo ""
    echo -e "${YELLOW}Catatan:${NC}"
    echo -e "  - Pastikan firewall mengizinkan port: 3000, 5174, 5175, 8089, 1812/udp, 1813/udp"
    echo -e "  - Untuk setup OpenVPN, jalankan: ./setup-openvpn.sh"
    echo ""
else
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}Deploy gagal! Beberapa service tidak berjalan.${NC}"
    echo -e "${RED}============================================${NC}"
    echo ""
    echo -e "Cek logs dengan: docker-compose logs -f"
    exit 1
fi
