# OpenVPN Setup Guide

## Tidak Perlu Install Manual!

Semua sudah disiapkan via Docker. Anda hanya perlu menjalankan script setup.

## Quick Start

### Windows (PowerShell)

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

## Apa yang Dilakukan Script?

1. ✅ Membuat Docker volume untuk OpenVPN
2. ✅ Generate konfigurasi OpenVPN otomatis
3. ✅ Generate CA certificate dan keys
4. ✅ Setup multi-client support
5. ✅ Start OpenVPN server container
6. ✅ Configure network 10.8.0.0/24

## Setelah Setup

### 1. Update Environment Variable

Edit `.env` atau `Backend/.env`:

```bash
VPN_SERVER_IP=YOUR_VPS_IP_HERE
```

### 2. Restart Backend

```bash
docker-compose restart backend
```

### 3. Cek Status OpenVPN

```bash
# Lihat logs
docker logs rtrwnet-openvpn

# Cek container running
docker ps | grep openvpn

# Cek network
docker exec rtrwnet-openvpn ip addr show tun0
```

### 4. Test dari Dashboard

1. Login ke User Dashboard
2. RADIUS → NAS → Tambah MikroTik
3. Input nama: "Test-Router"
4. Copy script yang di-generate
5. Paste ke MikroTik Terminal

## Firewall Configuration

### Ubuntu/Debian

```bash
# Allow OpenVPN port
sudo ufw allow 1194/udp

# Enable IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# NAT for VPN clients
sudo iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
```

### CentOS/RHEL

```bash
# Allow OpenVPN port
sudo firewall-cmd --permanent --add-port=1194/udp
sudo firewall-cmd --reload

# Enable IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# NAT for VPN clients
sudo firewall-cmd --permanent --add-masquerade
sudo firewall-cmd --reload
```

### Cloud Provider (AWS, GCP, Azure, etc.)

Pastikan Security Group / Firewall Rules mengizinkan:
- **Inbound**: UDP port 1194 dari 0.0.0.0/0
- **Outbound**: All traffic

## Troubleshooting

### OpenVPN tidak start

```bash
# Cek logs
docker logs rtrwnet-openvpn

# Restart container
docker-compose restart openvpn

# Rebuild jika perlu
docker-compose up -d --force-recreate openvpn
```

### Port 1194 sudah digunakan

```bash
# Cek apa yang menggunakan port
sudo netstat -tulpn | grep 1194

# Atau
sudo lsof -i :1194

# Stop service yang conflict
sudo systemctl stop openvpn
```

### Client tidak bisa connect

1. **Cek firewall VPS**
   ```bash
   sudo ufw status
   sudo iptables -L -n
   ```

2. **Cek OpenVPN logs**
   ```bash
   docker logs rtrwnet-openvpn | tail -50
   ```

3. **Test dari client**
   ```bash
   # Ping VPS
   ping YOUR_VPS_IP
   
   # Test UDP port
   nc -u YOUR_VPS_IP 1194
   ```

4. **Cek certificate**
   ```bash
   docker exec rtrwnet-openvpn ls -la /etc/openvpn/pki
   ```

## Manual Setup (Jika Script Gagal)

### 1. Create Volume

```bash
docker volume create --name rtrwnet_openvpn_data
```

### 2. Generate Config

```bash
docker run -v rtrwnet_openvpn_data:/etc/openvpn --rm kylemanna/openvpn ovpn_genconfig -u udp://YOUR_VPS_IP
```

### 3. Generate PKI

```bash
docker run -v rtrwnet_openvpn_data:/etc/openvpn --rm -it kylemanna/openvpn ovpn_initpki
```

Anda akan diminta:
- Enter PEM pass phrase: (buat password baru)
- Common Name: (tekan Enter untuk default)

### 4. Start Server

```bash
docker-compose up -d openvpn
```

## Advanced Configuration

### Change VPN Network

Edit config di volume:

```bash
docker run -v rtrwnet_openvpn_data:/etc/openvpn --rm -it kylemanna/openvpn bash

# Edit /etc/openvpn/openvpn.conf
# Change: server 10.8.0.0 255.255.255.0
# To: server 10.9.0.0 255.255.255.0
```

### Add Static IP for Client

```bash
# Create client config directory
docker exec rtrwnet-openvpn mkdir -p /etc/openvpn/ccd

# Add static IP
docker exec rtrwnet-openvpn bash -c 'echo "ifconfig-push 10.8.0.10 255.255.255.0" > /etc/openvpn/ccd/client-name'

# Update main config
docker exec rtrwnet-openvpn bash -c 'echo "client-config-dir /etc/openvpn/ccd" >> /etc/openvpn/openvpn.conf'

# Restart
docker-compose restart openvpn
```

### Enable Logging

```bash
docker exec rtrwnet-openvpn bash -c 'echo "log /var/log/openvpn.log" >> /etc/openvpn/openvpn.conf'
docker exec rtrwnet-openvpn bash -c 'echo "status /var/log/openvpn-status.log" >> /etc/openvpn/openvpn.conf'
docker-compose restart openvpn
```

## Monitoring

### Check Connected Clients

```bash
docker exec rtrwnet-openvpn cat /var/log/openvpn-status.log
```

### Check Logs

```bash
# Real-time logs
docker logs -f rtrwnet-openvpn

# Last 100 lines
docker logs --tail 100 rtrwnet-openvpn
```

### Check Network

```bash
# VPN interface
docker exec rtrwnet-openvpn ip addr show tun0

# Routing table
docker exec rtrwnet-openvpn ip route
```

## Backup & Restore

### Backup

```bash
# Backup volume
docker run --rm -v rtrwnet_openvpn_data:/data -v $(pwd):/backup alpine tar czf /backup/openvpn-backup.tar.gz -C /data .

# Backup to remote
scp openvpn-backup.tar.gz user@backup-server:/backups/
```

### Restore

```bash
# Create volume
docker volume create --name rtrwnet_openvpn_data

# Restore data
docker run --rm -v rtrwnet_openvpn_data:/data -v $(pwd):/backup alpine tar xzf /backup/openvpn-backup.tar.gz -C /data

# Start server
docker-compose up -d openvpn
```

## Security Best Practices

1. ✅ **Use strong CA password** - Simpan dengan aman
2. ✅ **Rotate certificates** - Setiap 1-2 tahun
3. ✅ **Limit client access** - Gunakan firewall rules
4. ✅ **Monitor logs** - Setup alerting untuk suspicious activity
5. ✅ **Backup regularly** - Backup PKI dan config
6. ✅ **Use TLS auth** - Tambahan security layer (optional)

## References

- [kylemanna/openvpn Docker Image](https://github.com/kylemanna/docker-openvpn)
- [OpenVPN Documentation](https://openvpn.net/community-resources/)
- [Docker Volumes](https://docs.docker.com/storage/volumes/)
