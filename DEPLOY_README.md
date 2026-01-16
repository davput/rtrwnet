# RT/RW Net SaaS - Deployment Guide

## Quick Start (One-Click Deploy)

### 1. Upload Project ke VPS

```bash
# Dari komputer lokal
scp -r . root@202.10.48.155:/root/rtrwnet-saas
```

Atau gunakan Git:
```bash
ssh root@202.10.48.155
git clone <your-repo-url> /root/rtrwnet-saas
cd /root/rtrwnet-saas
```

### 2. Deploy

```bash
cd /root/rtrwnet-saas

# Set permission
chmod +x deploy.sh manage.sh setup-openvpn.sh setup-firewall.sh

# Setup firewall
sudo ./setup-firewall.sh

# Deploy semua services
./deploy.sh
```

### 3. Setup OpenVPN (Opsional - untuk koneksi MikroTik)

```bash
./setup-openvpn.sh
```

## Akses Aplikasi

Setelah deploy berhasil:

| Service | URL |
|---------|-----|
| Homepage | http://202.10.48.155:3000 |
| User Dashboard | http://202.10.48.155:5175 |
| Admin Dashboard | http://202.10.48.155:5174 |
| Backend API | http://202.10.48.155:8089 |

## Management Commands

```bash
# Start semua services
./manage.sh start

# Stop semua services
./manage.sh stop

# Restart semua services
./manage.sh restart

# Lihat status
./manage.sh status

# Lihat logs
./manage.sh logs              # Semua logs
./manage.sh logs backend      # Logs backend saja

# Rebuild dan restart
./manage.sh rebuild

# Backup database
./manage.sh db-backup

# Restore database
./manage.sh db-restore backup_file.sql

# Shell ke backend
./manage.sh shell-backend

# Shell ke database
./manage.sh shell-db
```

## Konfigurasi

Edit file `.env.production` untuk mengubah konfigurasi:

```bash
nano .env.production
```

Setelah edit, rebuild:
```bash
./manage.sh rebuild
```

## Ports yang Digunakan

| Port | Protocol | Service |
|------|----------|---------|
| 3000 | TCP | Homepage |
| 5174 | TCP | Admin Dashboard |
| 5175 | TCP | User Dashboard |
| 8089 | TCP | Backend API |
| 5432 | TCP | PostgreSQL |
| 6379 | TCP | Redis |
| 1812 | UDP | RADIUS Auth |
| 1813 | UDP | RADIUS Accounting |
| 1194 | UDP | OpenVPN |

## Troubleshooting

### Service tidak berjalan
```bash
# Cek logs
./manage.sh logs

# Cek status container
docker ps -a
```

### Database error
```bash
# Restart database
docker restart rtrwnet-postgres

# Cek logs database
docker logs rtrwnet-postgres
```

### Frontend tidak bisa akses backend
1. Pastikan backend running: `docker ps | grep backend`
2. Cek CORS di backend logs
3. Pastikan firewall mengizinkan port 8089

### MikroTik tidak bisa connect RADIUS
1. Pastikan OpenVPN sudah setup: `./setup-openvpn.sh`
2. Cek VPN connection di MikroTik
3. Pastikan port 1812/1813 UDP terbuka
