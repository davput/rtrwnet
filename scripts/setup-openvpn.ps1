# PowerShell script untuk setup OpenVPN server di Windows
# Tidak perlu install manual, semua via Docker

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "OpenVPN Server Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get VPS IP
$VPS_IP = Read-Host "Masukkan IP VPS Anda (contoh: 203.0.113.10)"

if ([string]::IsNullOrWhiteSpace($VPS_IP)) {
    Write-Host "Error: IP VPS wajib diisi!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "IP VPS: $VPS_IP" -ForegroundColor Green
Write-Host ""

# Check if OpenVPN container exists
$containerExists = docker ps -a --format "{{.Names}}" | Select-String "rtrwnet-openvpn"
if ($containerExists) {
    Write-Host "OpenVPN container sudah ada. Menghapus container lama..." -ForegroundColor Yellow
    docker rm -f rtrwnet-openvpn 2>$null
}

# Remove old volume
Write-Host "Membersihkan volume lama..." -ForegroundColor Yellow
docker volume rm rtrwnet_openvpn_data 2>$null

Write-Host ""
Write-Host "Step 1: Membuat volume untuk OpenVPN..." -ForegroundColor Cyan
docker volume create --name rtrwnet_openvpn_data

Write-Host ""
Write-Host "Step 2: Generate konfigurasi OpenVPN..." -ForegroundColor Cyan
docker run -v rtrwnet_openvpn_data:/etc/openvpn --rm kylemanna/openvpn ovpn_genconfig -u "udp://$VPS_IP"

Write-Host ""
Write-Host "Step 3: Generate CA certificate..." -ForegroundColor Cyan
Write-Host "PENTING: Anda akan diminta membuat password untuk CA." -ForegroundColor Yellow
Write-Host "Simpan password ini dengan aman!" -ForegroundColor Yellow
Write-Host ""
docker run -v rtrwnet_openvpn_data:/etc/openvpn --rm -it kylemanna/openvpn ovpn_initpki

Write-Host ""
Write-Host "Step 4: Menyesuaikan konfigurasi..." -ForegroundColor Cyan
docker run -v rtrwnet_openvpn_data:/etc/openvpn --rm kylemanna/openvpn bash -c @"
    echo 'duplicate-cn' >> /etc/openvpn/openvpn.conf
    echo 'client-to-client' >> /etc/openvpn/openvpn.conf
    echo 'push \"route 10.8.0.0 255.255.255.0\"' >> /etc/openvpn/openvpn.conf
"@

Write-Host ""
Write-Host "Step 5: Start OpenVPN server..." -ForegroundColor Cyan
docker-compose up -d openvpn

Write-Host ""
Write-Host "Step 6: Tunggu OpenVPN server siap..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✓ OpenVPN Server berhasil di-setup!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Informasi:" -ForegroundColor Cyan
Write-Host "  - Server IP: $VPS_IP"
Write-Host "  - Port: 1194 UDP"
Write-Host "  - Network: 10.8.0.0/24"
Write-Host "  - Server VPN IP: 10.8.0.1"
Write-Host ""
Write-Host "Pastikan firewall mengizinkan port 1194 UDP" -ForegroundColor Yellow
Write-Host ""
Write-Host "Cek status OpenVPN:" -ForegroundColor Cyan
Write-Host "  docker logs rtrwnet-openvpn"
Write-Host ""
Write-Host "Update VPN_SERVER_IP di .env:" -ForegroundColor Cyan
Write-Host "  VPN_SERVER_IP=$VPS_IP"
Write-Host ""
