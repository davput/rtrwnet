# MikroTik VPN + RADIUS Auto-Setup

## Overview

Fitur ini memungkinkan user untuk menghubungkan MikroTik router ke RADIUS server melalui OpenVPN dengan cara yang sangat mudah - cukup input nama MikroTik, sistem akan generate script lengkap yang tinggal di-paste ke terminal MikroTik.

## Keuntungan Menggunakan VPN

1. **Keamanan**: Koneksi RADIUS terenkripsi melalui VPN tunnel
2. **Fleksibilitas**: MikroTik bisa berada di mana saja (tidak perlu IP public)
3. **Mudah**: Tidak perlu konfigurasi port forwarding atau firewall kompleks
4. **Centralized**: Semua MikroTik terhubung ke satu VPN server
5. **Monitoring**: Mudah monitor status koneksi VPN dari dashboard

## Alur Kerja

```
┌─────────────────────┐
│   User Dashboard    │
│  (Add MikroTik)     │
└──────────┬──────────┘
           │
           │ 1. Input nama MikroTik
           ▼
┌─────────────────────┐
│   Backend API       │
│  - Generate certs   │
│  - Create NAS       │
│  - Generate script  │
└──────────┬──────────┘
           │
           │ 2. Return script
           ▼
┌─────────────────────┐
│   User copies       │
│   script to         │
│   MikroTik Terminal │
└──────────┬──────────┘
           │
           │ 3. Script execution
           ▼
┌─────────────────────┐
│   MikroTik Router   │
│  - Import certs     │
│  - Create VPN       │
│  - Configure RADIUS │
│  - Setup PPPoE      │
└──────────┬──────────┘
           │
           │ 4. VPN connects
           ▼
┌─────────────────────┐
│   OpenVPN Server    │
│   (VPS)             │
└──────────┬──────────┘
           │
           │ 5. RADIUS auth
           ▼
┌─────────────────────┐
│   FreeRADIUS        │
│   Server            │
└─────────────────────┘
```

## Komponen yang Terlibat

### 1. Backend Services

#### VPNService (`vpn_service.go`)
- `GenerateClientConfig()` - Generate OpenVPN client config
- `GenerateMikroTikScript()` - Generate MikroTik RouterOS script
- Certificate generation (CA, client cert, client key)

#### VPNHandler (`vpn_handler.go`)
- `GET /vpn/mikrotik-script/:id` - Get MikroTik setup script
- `GET /vpn/client-config/:id` - Get OpenVPN config
- `GET /vpn/download-ovpn/:id` - Download .ovpn file

### 2. Frontend Components

#### MikroTikScriptModal
- Menampilkan script dalam modal
- Tab: Instructions, Script, Connection Info
- Copy to clipboard functionality
- Download script dan OVPN file

#### NASTab
- Form untuk add MikroTik (hanya input nama)
- Tombol "Lihat Setup Script" untuk NAS yang sudah ada
- Auto-open script modal setelah create NAS

### 3. OpenVPN Server

Container FreeRADIUS sudah include OpenVPN server (atau bisa deploy terpisah).

## Generated Script Content

Script yang di-generate mencakup:

1. **Certificate Import**
   - CA certificate
   - Client certificate
   - Client private key

2. **OpenVPN Client Interface**
   - Connection to VPN server
   - Authentication with certificates
   - Auto-reconnect configuration

3. **IP Address Configuration**
   - VPN tunnel IP (10.8.0.x)
   - Routes to RADIUS server

4. **RADIUS Configuration**
   - RADIUS server address (10.8.0.1 - VPN internal IP)
   - RADIUS secret
   - Authentication and accounting ports
   - Enable RADIUS for PPP/Hotspot

5. **PPPoE Server Setup** (optional)
   - IP pool for customers
   - PPP profile with RADIUS
   - PPPoE server interface

6. **Firewall Rules**
   - Allow OpenVPN traffic
   - Allow RADIUS traffic
   - NAT for VPN

## Cara Penggunaan

### Dari User Dashboard

1. **Tambah MikroTik Baru**
   ```
   Dashboard → RADIUS → NAS → Tambah MikroTik
   ```

2. **Input Nama**
   ```
   Nama: MikroTik-Kantor
   ```

3. **Generate Script**
   - Klik "Tambah & Generate Script"
   - Modal akan muncul dengan script lengkap

4. **Copy Script**
   - Klik tombol "Copy Script"
   - Atau select all dan copy manual

5. **Paste ke MikroTik**
   ```
   Winbox → New Terminal → Right Click → Paste
   ```

6. **Verifikasi**
   ```
   /interface ovpn-client print
   /radius print
   /ping 10.8.0.1
   ```

### Untuk NAS yang Sudah Ada

1. **Lihat Setup Script**
   ```
   Dashboard → RADIUS → NAS → Actions → Lihat Setup Script
   ```

2. **Download Files**
   - Download Script (.rsc)
   - Download OVPN Config (.ovpn)

## API Endpoints

### Generate MikroTik Script

```http
GET /api/v1/vpn/mikrotik-script/:nas_id
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "message": "MikroTik script generated successfully",
  "data": {
    "script": "# MikroTik script content...",
    "server_ip": "203.0.113.10",
    "server_port": 1194,
    "client_ip": "10.8.0.5",
    "client_name": "mikrotik-kantor",
    "instructions": [
      "1. Copy the entire script below",
      "2. Open MikroTik Terminal",
      "..."
    ]
  }
}
```

### Get OpenVPN Client Config

```http
GET /api/v1/vpn/client-config/:nas_id
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "client_name": "mikrotik-kantor",
    "server_ip": "203.0.113.10",
    "server_port": 1194,
    "protocol": "udp",
    "ca_cert": "-----BEGIN CERTIFICATE-----...",
    "client_cert": "-----BEGIN CERTIFICATE-----...",
    "client_key": "-----BEGIN RSA PRIVATE KEY-----...",
    "config_file": "# OpenVPN config...",
    "client_ip": "10.8.0.5"
  }
}
```

### Download OVPN File

```http
GET /api/v1/vpn/download-ovpn/:nas_id
Authorization: Bearer {token}
```

**Response:** File download (.ovpn)

## Database Schema

### vpn_connections Table

```sql
CREATE TABLE vpn_connections (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    device_id UUID,
    name VARCHAR(255) NOT NULL,
    vpn_type VARCHAR(50) DEFAULT 'openvpn',
    ovpn_ca_cert TEXT,
    ovpn_client_cert TEXT,
    ovpn_client_key_encrypted TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Troubleshooting

### VPN Tidak Connect

**Cek di MikroTik:**
```
/interface ovpn-client print
```

**Status harus "connected" (R flag)**

**Jika tidak connect:**
1. Cek log: `/log print where topics~"ovpn"`
2. Cek firewall: pastikan port 1194 UDP terbuka
3. Ping VPN server: `/ping YOUR_VPS_IP`
4. Cek certificate: `/certificate print`

### RADIUS Authentication Gagal

**Cek koneksi ke RADIUS:**
```
/ping 10.8.0.1
```

**Cek RADIUS config:**
```
/radius print
```

**Test RADIUS dari server:**
```bash
# Di VPS
docker exec -it rtrwnet-freeradius radtest username password localhost 0 testing123
```

### Certificate Error

**Re-import certificates:**
1. Download OVPN file dari dashboard
2. Extract certificates dari .ovpn file
3. Import via Winbox: System → Certificates → Import

## Security Best Practices

1. **Unique Secrets**: Setiap NAS punya RADIUS secret yang berbeda
2. **Certificate-based Auth**: VPN menggunakan certificate, bukan password
3. **Encrypted Tunnel**: Semua traffic RADIUS melalui encrypted VPN
4. **Firewall Rules**: Hanya allow traffic yang diperlukan
5. **Regular Rotation**: Rotate certificates setiap 1-2 tahun

## Monitoring

### Check VPN Status

```bash
# Di VPS
docker exec -it rtrwnet-openvpn cat /var/log/openvpn/status.log
```

### Check Active Connections

```sql
-- Di database
SELECT 
    vc.name,
    vc.status,
    vc.created_at,
    rn.nasname,
    rn.is_active
FROM vpn_connections vc
LEFT JOIN radius_nas rn ON vc.device_id = rn.id
WHERE vc.tenant_id = 'YOUR_TENANT_ID'
ORDER BY vc.created_at DESC;
```

### Check RADIUS Sessions

```sql
SELECT 
    username,
    nasipaddress,
    framedipaddress,
    acctstarttime,
    acctsessiontime
FROM radacct
WHERE acctstoptime IS NULL
ORDER BY acctstarttime DESC;
```

## Future Enhancements

1. **Auto-detect VPN Status**: Backend periodically check VPN connection status
2. **Certificate Renewal**: Auto-renew certificates before expiry
3. **Multi-VPN Server**: Support multiple VPN servers for load balancing
4. **WireGuard Support**: Alternative to OpenVPN (faster, modern)
5. **One-Click Setup**: QR code untuk import config ke MikroTik mobile app
6. **Backup Config**: Auto-backup MikroTik config sebelum apply script

## References

- [MikroTik OpenVPN Client](https://wiki.mikrotik.com/wiki/Manual:Interface/OVPN)
- [MikroTik RADIUS](https://wiki.mikrotik.com/wiki/Manual:RADIUS_Client)
- [OpenVPN Documentation](https://openvpn.net/community-resources/)
- [FreeRADIUS Documentation](https://freeradius.org/documentation/)
