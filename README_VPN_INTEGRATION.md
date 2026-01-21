# VPN + RADIUS Integration - Complete Guide

## 🎯 Tujuan

Memudahkan user menghubungkan MikroTik router ke RADIUS server melalui VPN dengan cara yang sangat mudah - **cukup input nama MikroTik, sistem generate script lengkap yang tinggal di-paste**.

## ✨ Fitur Utama

- 🔐 **Secure VPN Tunnel** - Semua traffic RADIUS terenkripsi
- 🚀 **Auto-Generate Script** - User hanya input nama, sistem generate script lengkap
- 📋 **Copy-Paste Ready** - Script tinggal paste ke MikroTik Terminal
- 🌍 **No Public IP Needed** - MikroTik bisa di mana saja
- 🎨 **Beautiful UI** - Modal dengan tabs (Instructions, Script, Info)
- 📦 **All-in-One** - VPN + RADIUS + PPPoE dalam satu script

## 🚀 Quick Start

### Pertama Kali (Setup OpenVPN Server)

**Windows:**
```powershell
cd scripts
.\setup-openvpn.ps1
```

**Linux/Mac:**
```bash
cd scripts
chmod +x setup-openvpn.sh
./setup-openvpn.sh
```

Input IP VPS → Buat password CA → Done! (2 menit)

### Update Environment

Edit `.env`:
```bash
VPN_SERVER_IP=YOUR_VPS_IP
```

### Restart Backend

```bash
docker-compose restart backend
```

### Mulai Gunakan

1. Login ke User Dashboard
2. RADIUS → NAS → Tambah MikroTik
3. Input nama (contoh: "MikroTik-Kantor")
4. Copy script yang muncul
5. Paste ke MikroTik Terminal
6. Done! MikroTik otomatis connect VPN + configure RADIUS

## 📁 File Structure

```
.
├── Backend/
│   ├── internal/
│   │   ├── usecase/
│   │   │   └── vpn_service.go          # VPN & certificate management
│   │   └── delivery/http/
│   │       └── handler/
│   │           └── vpn_handler.go      # API endpoints
│   └── freeradius/                     # FreeRADIUS config
│
├── Frontend/UserDashboard/src/
│   └── features/radius/components/
│       ├── MikroTikScriptModal.tsx     # Script display modal
│       └── NASTab.tsx                  # NAS management with VPN
│
├── scripts/
│   ├── setup-openvpn.sh               # Linux/Mac setup
│   └── setup-openvpn.ps1              # Windows setup
│
├── docs/
│   ├── QUICK_START_VPN.md             # Quick start guide
│   ├── OPENVPN_SETUP_GUIDE.md         # Detailed OpenVPN guide
│   ├── MIKROTIK_VPN_SETUP.md          # Complete MikroTik guide
│   └── FREERADIUS_MIGRATION.md        # FreeRADIUS migration
│
└── docker-compose.yml                  # Includes OpenVPN service
```

## 🔧 Technical Details

### Backend API Endpoints

```
GET  /api/v1/vpn/mikrotik-script/:id   # Generate MikroTik script
GET  /api/v1/vpn/client-config/:id     # Get OpenVPN config
GET  /api/v1/vpn/download-ovpn/:id     # Download .ovpn file
GET  /api/v1/vpn/connections           # List VPN connections
POST /api/v1/vpn/connections           # Create VPN connection
DEL  /api/v1/vpn/connections/:id       # Delete VPN connection
```

### Generated Script Includes

1. ✅ Certificate import (CA, client cert, client key)
2. ✅ OpenVPN client interface creation
3. ✅ VPN connection configuration
4. ✅ IP address assignment (10.8.0.x)
5. ✅ RADIUS server configuration
6. ✅ PPPoE server setup (optional)
7. ✅ Firewall rules
8. ✅ Verification commands

### Network Architecture

```
┌─────────────────────┐
│  MikroTik Router    │
│  (Anywhere)         │
└──────────┬──────────┘
           │ VPN Tunnel (Encrypted)
           │ UDP 1194
           ▼
┌─────────────────────┐
│  OpenVPN Server     │
│  10.8.0.1           │
│  (Docker)           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  FreeRADIUS Server  │
│  (Docker)           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PostgreSQL         │
│  (Docker)           │
└─────────────────────┘
```

## 🎨 Frontend Features

### MikroTikScriptModal Component

**3 Tabs:**
1. **Instructions** - Step-by-step guide dengan visual
2. **Script** - Copy-paste ready script dengan syntax highlighting
3. **Info** - Connection details & verification commands

**Features:**
- Copy to clipboard
- Download script (.rsc)
- Download OVPN config (.ovpn)
- Beautiful dark theme for script display
- Responsive design

### NASTab Component

**Simplified Form:**
- User hanya input nama MikroTik
- Secret auto-generated
- IP auto-detected via VPN

**Actions:**
- "Lihat Setup Script" untuk NAS existing
- Auto-open modal setelah create NAS
- Download options

## 🔒 Security Features

1. **Certificate-based Authentication** - No passwords for VPN
2. **Encrypted Tunnel** - All RADIUS traffic encrypted
3. **Unique Secrets** - Each NAS has unique RADIUS secret
4. **Auto-generated Keys** - Secure random generation
5. **Isolated Networks** - VPN network isolated from main network

## 📊 Monitoring

### Check OpenVPN Status

```bash
docker logs rtrwnet-openvpn
docker exec rtrwnet-openvpn cat /var/log/openvpn-status.log
```

### Check Connected Clients

```sql
SELECT 
    vc.name,
    vc.status,
    rn.nasname,
    rn.is_active
FROM vpn_connections vc
LEFT JOIN radius_nas rn ON vc.device_id = rn.id
WHERE vc.is_active = true;
```

### Check RADIUS Sessions

```sql
SELECT 
    username,
    nasipaddress,
    framedipaddress,
    acctstarttime
FROM radacct
WHERE acctstoptime IS NULL;
```

## 🐛 Troubleshooting

### OpenVPN tidak start

```bash
docker logs rtrwnet-openvpn
docker-compose restart openvpn
```

### MikroTik tidak connect

1. Cek firewall VPS (port 1194 UDP)
2. Cek certificate di MikroTik: `/certificate print`
3. Cek logs: `/log print where topics~"ovpn"`
4. Test ping: `/ping YOUR_VPS_IP`

### RADIUS authentication gagal

1. Cek VPN connected: `/interface ovpn-client print`
2. Test ping RADIUS: `/ping 10.8.0.1`
3. Cek RADIUS config: `/radius print`
4. Cek logs di server: `docker logs rtrwnet-freeradius`

## 📚 Documentation

- **QUICK_START_VPN.md** - Quick start guide (5 menit)
- **OPENVPN_SETUP_GUIDE.md** - Detailed OpenVPN setup
- **MIKROTIK_VPN_SETUP.md** - Complete MikroTik integration
- **FREERADIUS_MIGRATION.md** - FreeRADIUS migration guide
- **VPN_SETUP_SUMMARY.md** - Summary singkat

## 🎯 Use Cases

### Use Case 1: ISP dengan Multiple Lokasi

ISP punya 10 MikroTik di lokasi berbeda. Dengan VPN:
- Semua MikroTik connect ke 1 RADIUS server
- Tidak perlu IP public untuk setiap lokasi
- Centralized user management
- Secure connection

### Use Case 2: RT/RW Net Kecil

RT/RW Net dengan 1 MikroTik di rumah ketua RT:
- Setup mudah, tinggal paste script
- Tidak perlu konfigurasi kompleks
- Monitoring dari dashboard
- Aman dengan VPN

### Use Case 3: Testing & Development

Developer ingin test RADIUS:
- Setup lokal dengan Docker
- Generate script untuk test MikroTik
- Easy debugging
- No production impact

## 🚀 Future Enhancements

- [ ] Auto-detect VPN connection status
- [ ] Certificate auto-renewal
- [ ] WireGuard support (faster than OpenVPN)
- [ ] QR code untuk mobile config
- [ ] Multi-VPN server (load balancing)
- [ ] Bandwidth monitoring per VPN client
- [ ] Auto-backup MikroTik config

## 📝 Notes

- OpenVPN server menggunakan image `kylemanna/openvpn`
- VPN network: 10.8.0.0/24
- RADIUS server IP (internal): 10.8.0.1
- Certificates valid 2 tahun (client), 10 tahun (CA)
- Support multiple concurrent clients

## 🤝 Contributing

Jika ada bug atau feature request, silakan buat issue atau PR.

## 📄 License

Sesuai dengan license project utama.

---

**Made with ❤️ for RT/RW Net operators**
