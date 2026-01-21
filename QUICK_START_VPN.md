# Quick Start - VPN + RADIUS Setup

## Tidak Perlu Install Manual! 🎉

Semua sudah disiapkan via Docker. Ikuti 3 langkah mudah ini:

## Step 1: Setup OpenVPN Server (Sekali Saja)

### Windows
```powershell
cd scripts
.\setup-openvpn.ps1
```

### Linux/Mac
```bash
cd scripts
chmod +x setup-openvpn.sh
./setup-openvpn.sh
```

**Yang dilakukan script:**
- ✅ Buat Docker volume
- ✅ Generate certificates otomatis
- ✅ Setup OpenVPN server
- ✅ Configure network 10.8.0.0/24

**Anda hanya perlu:**
1. Input IP VPS Anda
2. Buat password untuk CA (simpan baik-baik!)
3. Tunggu selesai (~2 menit)

## Step 2: Update Environment Variable

Edit file `.env` di root project:

```bash
VPN_SERVER_IP=YOUR_VPS_IP_HERE
```

Contoh:
```bash
VPN_SERVER_IP=203.0.113.10
```

## Step 3: Restart Services

```bash
docker-compose restart backend
```

## Selesai! 🎊

Sekarang Anda bisa:

1. **Login ke User Dashboard**
2. **RADIUS → NAS → Tambah MikroTik**
3. **Input nama MikroTik** (contoh: "MikroTik-Kantor")
4. **Copy script** yang di-generate
5. **Paste ke MikroTik Terminal**

MikroTik akan otomatis:
- Connect ke VPN server
- Configure RADIUS
- Setup PPPoE server
- Siap digunakan!

## Verifikasi

### Cek OpenVPN Running

```bash
docker ps | grep openvpn
docker logs rtrwnet-openvpn
```

### Cek dari MikroTik (setelah paste script)

```
/interface ovpn-client print
/radius print
/ping 10.8.0.1
```

## Troubleshooting

### OpenVPN tidak start?

```bash
# Cek logs
docker logs rtrwnet-openvpn

# Restart
docker-compose restart openvpn
```

### Port 1194 blocked?

```bash
# Ubuntu/Debian
sudo ufw allow 1194/udp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=1194/udp
sudo firewall-cmd --reload
```

### MikroTik tidak connect?

1. Cek firewall VPS (port 1194 UDP harus open)
2. Cek IP VPS di environment variable
3. Cek certificate di MikroTik: `/certificate print`
4. Cek logs di MikroTik: `/log print where topics~"ovpn"`

## Architecture

```
MikroTik Router
    ↓ (VPN Tunnel - Encrypted)
OpenVPN Server (10.8.0.1)
    ↓
FreeRADIUS Server
    ↓
PostgreSQL Database
```

## Keuntungan

✅ **Aman** - Semua traffic RADIUS terenkripsi via VPN
✅ **Mudah** - Tidak perlu IP public untuk MikroTik
✅ **Otomatis** - Script lengkap tinggal paste
✅ **Fleksibel** - MikroTik bisa di mana saja
✅ **Centralized** - Semua MikroTik terhubung ke satu server

## Need Help?

Baca dokumentasi lengkap:
- `OPENVPN_SETUP_GUIDE.md` - Setup detail
- `MIKROTIK_VPN_SETUP.md` - MikroTik integration
- `FREERADIUS_MIGRATION.md` - RADIUS setup

## Summary

**Anda TIDAK perlu:**
- ❌ Install OpenVPN manual
- ❌ Generate certificate manual
- ❌ Configure firewall kompleks
- ❌ Setup RADIUS manual

**Anda HANYA perlu:**
- ✅ Jalankan 1 script setup
- ✅ Update 1 environment variable
- ✅ Restart backend
- ✅ Paste script ke MikroTik

**That's it!** 🚀
