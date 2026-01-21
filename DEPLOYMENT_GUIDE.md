# Deployment Guide - Development & Production

## 🎯 Setup Overview

- **Laptop (Development)**: Manual install PostgreSQL + Redis
- **VPS (Production)**: Docker Compose (all services)

## 💻 Development Setup (Laptop - Windows)

### 1. Install Prerequisites

#### PostgreSQL
```powershell
# Via Chocolatey (recommended)
choco install postgresql

# Atau download installer dari:
# https://www.postgresql.org/download/windows/

# Verify installation
psql --version
```

#### Redis
```powershell
# Via Chocolatey
choco install redis-64

# Atau download dari:
# https://github.com/microsoftarchive/redis/releases

# Start Redis
redis-server

# Verify
redis-cli ping
# Should return: PONG
```

#### Go (jika belum ada)
```powershell
choco install golang
go version
```

#### Node.js (jika belum ada)
```powershell
choco install nodejs
node --version
npm --version
```

### 2. Setup Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE rtrwnet_saas;

# Exit
\q

# Run migrations
cd Backend
$env:PGPASSWORD="your_postgres_password"
Get-ChildItem migrations\*up.sql | Sort-Object Name | ForEach-Object { 
    Write-Host "Running: $($_.Name)"
    psql -h localhost -U postgres -d rtrwnet_saas -f $_.FullName 
}
```

### 3. Configure Backend

Edit `Backend/.env`:

```bash
# Server
SERVER_PORT=8089
SERVER_HOST=0.0.0.0
GIN_MODE=debug

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=rtrwnet_saas
DB_SSLMODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev-secret-key-change-in-production

# CORS (allow local frontend)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175

# VPN (will be configured in production)
VPN_SERVER_IP=
ENABLE_RADIUS=false

# Midtrans (optional for development)
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
```

### 4. Run Backend

```powershell
cd Backend
go run cmd/api/main.go
```

Backend akan jalan di: `http://localhost:8089`

Swagger docs: `http://localhost:8089/swagger/index.html`

### 5. Run Frontend

#### User Dashboard
```powershell
cd Frontend/UserDashboard

# Create .env
echo "VITE_API_BASE_URL=http://localhost:8089/api/v1" > .env

npm install
npm run dev
```
Jalan di: `http://localhost:5175`

#### Admin Dashboard
```powershell
cd Frontend/AdminDashboard

# Create .env
echo "VITE_API_URL=http://localhost:8089/api/v1" > .env

npm install
npm run dev
```
Jalan di: `http://localhost:5174`

#### Homepage
```powershell
cd Frontend/HomePage

# Create .env
echo "VITE_API_BASE_URL=http://localhost:8089/api/v1" > .env

npm install
npm run dev
```
Jalan di: `http://localhost:3000`

### 6. Test Development Setup

1. Open browser: `http://localhost:3000`
2. Register new account
3. Login to User Dashboard: `http://localhost:5175`
4. Test features

---

## 🚀 Production Setup (VPS - Docker)

### 1. Prerequisites di VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/your-repo/rtrwnet-saas.git
cd rtrwnet-saas
```

### 3. Configure Environment

Edit `.env` di root project:

```bash
# Database
DB_PASSWORD=strong_password_here

# JWT
JWT_SECRET=super-secret-jwt-key-production

# VPS IP (untuk VPN)
VPN_SERVER_IP=203.0.113.10  # Ganti dengan IP VPS Anda

# Midtrans (production)
MIDTRANS_SERVER_KEY=your_production_server_key
MIDTRANS_CLIENT_KEY=your_production_client_key
MIDTRANS_IS_PRODUCTION=true

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

### 4. Setup OpenVPN (Sekali Saja)

```bash
cd scripts
chmod +x setup-openvpn.sh
./setup-openvpn.sh
```

Input IP VPS Anda dan buat password untuk CA certificate.

### 5. Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow OpenVPN
sudo ufw allow 1194/udp

# Allow RADIUS (dari VPN network saja)
sudo ufw allow from 10.8.0.0/24 to any port 1812 proto udp
sudo ufw allow from 10.8.0.0/24 to any port 1813 proto udp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 6. Deploy Services

```bash
# Build dan start semua services
docker-compose up -d --build

# Check status
docker-compose ps

# Check logs
docker-compose logs -f
```

### 7. Setup Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/rtrwnet
```

Paste config ini:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8089;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# User Dashboard
server {
    listen 80;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:5175;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Dashboard
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Homepage
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable dan restart:

```bash
sudo ln -s /etc/nginx/sites-available/rtrwnet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d app.yourdomain.com
sudo certbot --nginx -d admin.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 9. Verify Production Deployment

```bash
# Check all containers running
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs freeradius
docker-compose logs openvpn

# Test API
curl https://api.yourdomain.com/health

# Test OpenVPN
docker logs rtrwnet-openvpn

# Test FreeRADIUS
docker exec rtrwnet-freeradius radiusd -X
```

---

## 🔄 Workflow: Development → Production

### 1. Develop di Laptop

```powershell
# Edit code
# Test locally
# Commit changes
git add .
git commit -m "Add new feature"
git push origin main
```

### 2. Deploy ke VPS

```bash
# SSH ke VPS
ssh user@your-vps-ip

# Pull latest code
cd /opt/rtrwnet-saas
git pull origin main

# Rebuild dan restart
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### 3. Run Migrations (jika ada)

```bash
# Copy migration file ke container
docker cp Backend/migrations/000xxx_new_migration.up.sql rtrwnet-postgres:/tmp/

# Execute migration
docker exec -it rtrwnet-postgres psql -U postgres -d rtrwnet_saas -f /tmp/000xxx_new_migration.up.sql
```

---

## 🛠️ Maintenance Commands

### Development (Laptop)

```powershell
# Restart PostgreSQL
net stop postgresql-x64-14
net start postgresql-x64-14

# Restart Redis
net stop Redis
net start Redis

# Clear Redis cache
redis-cli FLUSHALL

# Backup database
pg_dump -U postgres -d rtrwnet_saas > backup.sql

# Restore database
psql -U postgres -d rtrwnet_saas < backup.sql
```

### Production (VPS)

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# Backup database
docker exec rtrwnet-postgres pg_dump -U postgres rtrwnet_saas > backup.sql

# Restore database
docker exec -i rtrwnet-postgres psql -U postgres -d rtrwnet_saas < backup.sql

# Update images
docker-compose pull
docker-compose up -d

# Clean up
docker system prune -a
```

---

## 📊 Monitoring

### Check Service Status

```bash
# All containers
docker-compose ps

# Resource usage
docker stats

# Disk usage
df -h
docker system df
```

### Check Logs

```bash
# All services
docker-compose logs --tail=100

# Specific service
docker-compose logs -f backend
docker-compose logs -f freeradius
docker-compose logs -f openvpn
```

### Database Monitoring

```bash
# Connect to database
docker exec -it rtrwnet-postgres psql -U postgres -d rtrwnet_saas

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('rtrwnet_saas'));

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Development Issues

**Backend tidak start:**
```powershell
# Check PostgreSQL
psql -U postgres -c "SELECT version();"

# Check Redis
redis-cli ping

# Check port 8089
netstat -ano | findstr :8089
```

**Frontend tidak connect:**
```powershell
# Check .env file
cat Frontend/UserDashboard/.env

# Check CORS in backend
# Backend/.env should have:
# CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175
```

### Production Issues

**Container tidak start:**
```bash
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis
```

**OpenVPN tidak connect:**
```bash
# Check logs
docker logs rtrwnet-openvpn

# Check firewall
sudo ufw status

# Test port
nc -u -v your-vps-ip 1194
```

**FreeRADIUS tidak auth:**
```bash
# Check logs
docker logs rtrwnet-freeradius

# Test authentication
docker exec rtrwnet-freeradius radtest testuser testpass localhost 0 testing123

# Check database connection
docker exec rtrwnet-freeradius radiusd -X
```

---

## 🎯 Summary

**Development (Laptop):**
- ✅ PostgreSQL + Redis manual install
- ✅ Backend: `go run cmd/api/main.go`
- ✅ Frontend: `npm run dev`
- ✅ Fast development cycle
- ✅ Easy debugging

**Production (VPS):**
- ✅ Docker Compose (all services)
- ✅ OpenVPN + FreeRADIUS
- ✅ Nginx reverse proxy
- ✅ SSL certificates
- ✅ Auto-restart on failure
- ✅ Easy scaling

**Deployment Flow:**
1. Develop & test di laptop
2. Commit & push ke Git
3. Pull di VPS
4. `docker-compose up -d --build`
5. Done! 🚀
