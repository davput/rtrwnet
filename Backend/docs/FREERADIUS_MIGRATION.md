# Migrasi dari layeh/radius ke FreeRADIUS

## Overview

Dokumen ini menjelaskan proses migrasi dari implementasi RADIUS custom menggunakan library `layeh.com/radius` ke FreeRADIUS server yang production-ready dengan PostgreSQL backend.

## Keuntungan Migrasi

1. **Production-Ready**: FreeRADIUS adalah standar industri yang telah teruji di jutaan deployment
2. **Better Performance**: FreeRADIUS dioptimasi untuk high-throughput RADIUS operations
3. **Rich Features**: Support untuk CoA (Change of Authorization), DM (Disconnect Messages), dan berbagai vendor-specific attributes
4. **Better Debugging**: FreeRADIUS memiliki logging dan debugging tools yang sangat lengkap
5. **Community Support**: Dokumentasi lengkap dan community yang besar
6. **Scalability**: Mudah di-scale horizontal dengan load balancing
7. **Separation of Concerns**: RADIUS server terpisah dari aplikasi backend

## Arsitektur Baru

```
┌─────────────────┐
│   MikroTik NAS  │
│   (PPPoE/Hotspot)│
└────────┬────────┘
         │ RADIUS Auth/Acct
         │ (UDP 1812/1813)
         ▼
┌─────────────────┐
│  FreeRADIUS     │◄──────┐
│  Server         │       │
└────────┬────────┘       │
         │                │
         │ SQL Queries    │ Sync Data
         ▼                │
┌─────────────────┐       │
│   PostgreSQL    │       │
│   Database      │       │
│   - radcheck    │       │
│   - radreply    │       │
│   - radacct     │       │
│   - radius_nas  │       │
└────────┬────────┘       │
         │                │
         │ App Queries    │
         ▼                │
┌─────────────────┐       │
│   Go Backend    │───────┘
│   API           │
└─────────────────┘
```

## Perubahan Database

### Tabel FreeRADIUS (sudah dibuat di migration 000026)

1. **radcheck** - User authentication credentials
   - username, attribute (Cleartext-Password), value (password)
   
2. **radreply** - User authorization attributes
   - username, attribute (Mikrotik-Rate-Limit, Framed-IP-Address, dll), value
   
3. **radacct** - Accounting records (session logs)
   - acctsessionid, username, nasipaddress, framedipaddress, acctinputoctets, acctoutputoctets, dll
   
4. **radpostauth** - Post-authentication logs
   
5. **radgroupcheck** & **radgroupreply** - Group-based attributes (optional)

6. **radusergroup** - User to group mapping (optional)

### Tabel Aplikasi (tetap ada)

- **radius_users** - User management di aplikasi
- **radius_nas** - NAS device management
- **hotspot_vouchers** - Voucher management
- **customers** - Customer dengan hotspot credentials

## Proses Migrasi

### 1. Backup Data

```bash
# Backup database
pg_dump -h localhost -U postgres -d rtrwnet_saas > backup_before_migration.sql

# Backup konfigurasi
cp Backend/.env Backend/.env.backup
```

### 2. Update Dependencies

```bash
cd Backend

# Remove layeh/radius dependency
go mod edit -droprequire layeh.com/radius

# Tidy dependencies
go mod tidy
```

### 3. Deploy FreeRADIUS Container

```bash
# Build dan start FreeRADIUS
docker-compose up -d freeradius

# Check logs
docker-compose logs -f freeradius

# Verify FreeRADIUS is running
docker exec -it rtrwnet-freeradius radiusd -X
```

### 4. Sync Data ke FreeRADIUS

Ada 2 cara untuk sync data:

#### A. Automatic Sync (Recommended)

Data akan otomatis di-sync ke FreeRADIUS setiap kali:
- RADIUS user dibuat/diupdate/dihapus
- Hotspot voucher dibuat/diupdate
- Customer hotspot dienable/disable

Ini sudah diimplementasi di:
- `radius_service.go` - untuk RADIUS users
- `hotspot_voucher_service.go` - untuk vouchers
- `customer_hotspot_handler.go` - untuk customer hotspot

#### B. Manual Bulk Sync

Untuk sync data existing:

```bash
# Via API endpoint (akan dibuat)
curl -X POST http://localhost:8089/api/v1/admin/radius/sync-all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Atau via database trigger (sudah ada di migration 000026)
# Trigger akan otomatis sync saat ada perubahan di radius_users
```

### 5. Update Environment Variables

```bash
# Backend/.env
ENABLE_RADIUS=false  # Disable built-in RADIUS server
FREERADIUS_HOST=freeradius
FREERADIUS_AUTH_PORT=1812
FREERADIUS_ACCT_PORT=1813
```

### 6. Restart Services

```bash
# Restart backend
docker-compose restart backend

# Verify
docker-compose ps
docker-compose logs backend | grep -i radius
```

### 7. Testing

#### Test Authentication

```bash
# Install radtest (FreeRADIUS client tools)
# Ubuntu/Debian: apt-get install freeradius-utils
# Windows: Download from FreeRADIUS website

# Test PPPoE user
radtest username password localhost:1812 0 testing123

# Expected output:
# Received Access-Accept Id 123 from 127.0.0.1:1812 to 0.0.0.0:0 length 20
```

#### Test via MikroTik

```
# MikroTik RouterOS
/radius add address=YOUR_FREERADIUS_IP secret=testing123 service=ppp,hotspot

# Test PPPoE
/ppp secret add name=testuser password=testpass service=pppoe

# Check RADIUS logs
/log print where topics~"radius"
```

### 8. Monitor

```bash
# FreeRADIUS logs
docker-compose logs -f freeradius

# Check accounting data
docker exec -it rtrwnet-postgres psql -U postgres -d rtrwnet_saas -c "SELECT * FROM radacct ORDER BY acctstarttime DESC LIMIT 10;"

# Check active sessions
docker exec -it rtrwnet-postgres psql -U postgres -d rtrwnet_saas -c "SELECT username, nasipaddress, framedipaddress, acctstarttime FROM radacct WHERE acctstoptime IS NULL;"
```

## Rollback Plan

Jika terjadi masalah:

```bash
# 1. Stop FreeRADIUS
docker-compose stop freeradius

# 2. Enable built-in RADIUS
# Edit Backend/.env
ENABLE_RADIUS=true

# 3. Restart backend
docker-compose restart backend

# 4. Restore database jika perlu
psql -h localhost -U postgres -d rtrwnet_saas < backup_before_migration.sql
```

## Konfigurasi MikroTik

### PPPoE Server

```
/ppp profile
add name=default-profile \
    local-address=10.10.10.1 \
    remote-address=pppoe-pool \
    use-compression=no \
    use-encryption=no \
    use-mpls=no \
    use-upnp=no

/ip pool
add name=pppoe-pool ranges=10.10.10.2-10.10.10.254

/interface pppoe-server server
add authentication=pap,chap,mschap1,mschap2 \
    default-profile=default-profile \
    interface=ether2 \
    service-name=ISP

/radius
add address=YOUR_FREERADIUS_IP \
    secret=testing123 \
    service=ppp \
    timeout=3s

/ppp aaa
set use-radius=yes \
    accounting=yes
```

### Hotspot

```
/ip hotspot profile
add name=default-hotspot \
    login-by=http-chap,http-pap \
    use-radius=yes

/radius
add address=YOUR_FREERADIUS_IP \
    secret=testing123 \
    service=hotspot \
    timeout=3s

/ip hotspot
add address-pool=hotspot-pool \
    interface=ether3 \
    name=hotspot1 \
    profile=default-hotspot
```

## Troubleshooting

### FreeRADIUS tidak start

```bash
# Check logs
docker-compose logs freeradius

# Run in debug mode
docker exec -it rtrwnet-freeradius radiusd -X

# Check config syntax
docker exec -it rtrwnet-freeradius radiusd -C
```

### Authentication gagal

```bash
# Check radcheck table
docker exec -it rtrwnet-postgres psql -U postgres -d rtrwnet_saas -c "SELECT * FROM radcheck WHERE username='testuser';"

# Check FreeRADIUS logs
docker-compose logs freeradius | grep -i "testuser"

# Test dari FreeRADIUS container
docker exec -it rtrwnet-freeradius radtest testuser testpass localhost 0 testing123
```

### Rate limit tidak apply

```bash
# Check radreply table
docker exec -it rtrwnet-postgres psql -U postgres -d rtrwnet_saas -c "SELECT * FROM radreply WHERE username='testuser';"

# Verify Mikrotik-Rate-Limit attribute format
# Should be: "upload/download" or "upload/download burst-upload/burst-download threshold-upload/threshold-download burst-time/burst-time"
```

### Accounting tidak masuk

```bash
# Check radacct table
docker exec -it rtrwnet-postgres psql -U postgres -d rtrwnet_saas -c "SELECT COUNT(*) FROM radacct;"

# Check NAS configuration
docker exec -it rtrwnet-postgres psql -U postgres -d rtrwnet_saas -c "SELECT * FROM radius_nas WHERE is_active=true;"

# Verify MikroTik RADIUS accounting is enabled
# /ppp aaa print
```

## Performance Tuning

### FreeRADIUS

Edit `Backend/freeradius/mods-available/sql`:

```
pool {
    start = 10      # Increase for high load
    min = 5
    max = 64        # Increase for high load
    spare = 5
    uses = 0
    retry_delay = 30
    lifetime = 0
    idle_timeout = 60
}
```

### PostgreSQL

```sql
-- Add indexes for better performance
CREATE INDEX idx_radcheck_username ON radcheck(username);
CREATE INDEX idx_radreply_username ON radreply(username);
CREATE INDEX idx_radacct_username ON radacct(username);
CREATE INDEX idx_radacct_session ON radacct(acctsessionid);
CREATE INDEX idx_radacct_start ON radacct(acctstarttime);
CREATE INDEX idx_radacct_stop ON radacct(acctstoptime);
```

## Monitoring & Alerting

### Prometheus Metrics

FreeRADIUS dapat di-monitor dengan:
- Total requests
- Authentication success/failure rate
- Response time
- Active sessions

### Grafana Dashboard

Import dashboard untuk FreeRADIUS monitoring (akan dibuat terpisah).

## Referensi

- [FreeRADIUS Documentation](https://freeradius.org/documentation/)
- [FreeRADIUS SQL Schema](https://github.com/FreeRADIUS/freeradius-server/tree/master/raddb/mods-config/sql/main)
- [MikroTik RADIUS](https://wiki.mikrotik.com/wiki/Manual:RADIUS_Client)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
