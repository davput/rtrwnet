# VPN Setup - Summary

## Jawaban: TIDAK Perlu Install Manual! ✅

Semua sudah disiapkan via Docker. Anda hanya perlu jalankan 1 script.

## 3 Langkah Setup (5 Menit)

### 1. Jalankan Script Setup

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

Input IP VPS Anda → Buat password CA → Selesai!

### 2. Update .env

```bash
VPN_SERVER_IP=YOUR_VPS_IP
```

### 3. Restart Backend

```bash
docker-compose restart backend
```

## Selesai! 🎉

Sekarang dari dashboard:
1. RADIUS → NAS → Tambah MikroTik
2. Input nama → Copy script
3. Paste ke MikroTik Terminal
4. Done!

## Yang Sudah Disiapkan

✅ OpenVPN server (Docker container)
✅ FreeRADIUS server (Docker container)
✅ Certificate generation otomatis
✅ MikroTik script generator
✅ Frontend modal untuk display script
✅ Complete documentation

## Files Created

**Backend:**
- `vpn_service.go` - VPN & certificate management
- `vpn_handler.go` - API endpoints
- Routes terintegrasi

**Frontend:**
- `MikroTikScriptModal.tsx` - Script display modal
- `NASTab.tsx` - Updated dengan VPN integration

**Scripts:**
- `setup-openvpn.sh` - Linux/Mac setup
- `setup-openvpn.ps1` - Windows setup

**Docs:**
- `QUICK_START_VPN.md` - Quick start guide
- `OPENVPN_SETUP_GUIDE.md` - Detailed guide
- `MIKROTIK_VPN_SETUP.md` - Complete documentation

## Firewall (Jangan Lupa!)

```bash
# Ubuntu/Debian
sudo ufw allow 1194/udp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=1194/udp
sudo firewall-cmd --reload
```

## Verification

```bash
# Cek OpenVPN running
docker ps | grep openvpn
docker logs rtrwnet-openvpn

# Dari MikroTik (setelah paste script)
/interface ovpn-client print
/ping 10.8.0.1
```

## Architecture

```
User Dashboard
    ↓ (Generate Script)
MikroTik Router
    ↓ (VPN Encrypted)
OpenVPN Server (Docker)
    ↓
FreeRADIUS (Docker)
    ↓
PostgreSQL
```

## Keuntungan

🔒 **Secure** - VPN encrypted tunnel
🚀 **Easy** - 1 script setup, paste ke MikroTik
🌍 **Flexible** - MikroTik bisa di mana saja
📦 **All-in-One** - VPN + RADIUS + Script generator

---

**Bottom Line:** Tidak perlu install apa-apa manual. Semua via Docker, tinggal jalankan script setup sekali, lalu dari dashboard tinggal generate script untuk setiap MikroTik baru.
