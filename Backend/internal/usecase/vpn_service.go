package usecase

import (
	"context"
	"fmt"
	"os"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"gorm.io/gorm"
)

type VPNService interface {
	GenerateMikroTikScript(ctx context.Context, tenantID, nasID string) (string, error)
	GenerateClientConfig(ctx context.Context, tenantID, nasID string) (*VPNClientConfig, error)
	GetVPNCredentials(ctx context.Context, tenantID, nasID string) (*VPNCredentials, error)
	CreateVPNConnection(ctx context.Context, tenantID string, req *CreateVPNConnectionRequest) (*entity.VPNConnection, error)
	ListVPNConnections(ctx context.Context, tenantID string) ([]*entity.VPNConnection, error)
	DeleteVPNConnection(ctx context.Context, tenantID, connectionID string) error
}

type VPNCredentials struct {
	Username   string `json:"username"`
	Password   string `json:"password"`
	ServerIP   string `json:"server_ip"`
	ServerPort int    `json:"server_port"`
	Protocol   string `json:"protocol"`
	ClientIP   string `json:"client_ip"`
}

type vpnService struct {
	db *gorm.DB
}

func NewVPNService(db *gorm.DB) VPNService {
	return &vpnService{db: db}
}

// GetVPNCredentials returns VPN credentials for a NAS
func (s *vpnService) GetVPNCredentials(ctx context.Context, tenantID, nasID string) (*VPNCredentials, error) {
	// Get NAS
	var nas entity.RadiusNAS
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", nasID, tenantID).First(&nas).Error; err != nil {
		return nil, errors.ErrNotFound
	}

	// Generate deterministic credentials based on NAS ID
	username := fmt.Sprintf("rtrw%s", nasID[:8])
	password := generateDeterministicPassword(nasID)
	clientIP := allocateClientIP(nasID)
	serverIP := getVPNServerIP()

	return &VPNCredentials{
		Username:   username,
		Password:   password,
		ServerIP:   serverIP,
		ServerPort: 1194,
		Protocol:   "tcp", // TCP for MikroTik compatibility
		ClientIP:   clientIP,
	}, nil
}

// GenerateMikroTikScript generates a complete MikroTik RouterOS script
func (s *vpnService) GenerateMikroTikScript(ctx context.Context, tenantID, nasID string) (string, error) {
	// Get NAS
	var nas entity.RadiusNAS
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", nasID, tenantID).First(&nas).Error; err != nil {
		return "", errors.ErrNotFound
	}

	// Get VPN credentials
	creds, err := s.GetVPNCredentials(ctx, tenantID, nasID)
	if err != nil {
		return "", err
	}

	// Get RADIUS server IP (internal VPN IP)
	radiusServerIP := getRADIUSServerIP()

	script := generateMikroTikScript(MikroTikScriptParams{
		RouterName:     nas.ShortName,
		RouterIP:       nas.NASName,
		VPNServerIP:    creds.ServerIP,
		VPNServerPort:  creds.ServerPort,
		VPNClientIP:    creds.ClientIP,
		VPNUser:        creds.Username,
		VPNPassword:    creds.Password,
		VPNMode:        "OVPN",
		RADIUSServerIP: radiusServerIP,
		RADIUSSecret:   nas.Secret,
		RADIUSAuthPort: 1812,
		RADIUSAcctPort: 1813,
	})

	return script, nil
}

// ListVPNConnections lists all VPN connections for a tenant
func (s *vpnService) ListVPNConnections(ctx context.Context, tenantID string) ([]*entity.VPNConnection, error) {
	var connections []*entity.VPNConnection
	if err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Find(&connections).Error; err != nil {
		return nil, errors.ErrInternalServer
	}
	return connections, nil
}

// DeleteVPNConnection deletes a VPN connection
func (s *vpnService) DeleteVPNConnection(ctx context.Context, tenantID, connectionID string) error {
	result := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", connectionID, tenantID).Delete(&entity.VPNConnection{})
	if result.Error != nil {
		return errors.ErrInternalServer
	}
	if result.RowsAffected == 0 {
		return errors.ErrNotFound
	}
	return nil
}

// ============================================
// Helper Functions
// ============================================

type MikroTikScriptParams struct {
	RouterName     string
	RouterIP       string
	VPNServerIP    string
	VPNServerPort  int
	VPNClientIP    string
	VPNUser        string
	VPNPassword    string
	VPNMode        string
	RADIUSServerIP string
	RADIUSSecret   string
	RADIUSAuthPort int
	RADIUSAcctPort int
}

func generateMikroTikScript(p MikroTikScriptParams) string {
	// Set defaults
	if p.VPNMode == "" {
		p.VPNMode = "OVPN"
	}

	return fmt.Sprintf(`########################################################################
# RTRWNET SAAS - MIKROTIK VPN SCRIPT (RouterOS v6/v7)
#
# Nama Router   : %s
# IP Router     : %s
# Jenis         : VPN RADIUS
# Versi Script  : RTRWNET SaaS v1.0
# VPN Mode      : %s
########################################################################

# =========================================================
# SNMP CONFIGURATION
# =========================================================
/snmp community
set [ find default=yes ] disabled=yes write-access=no
:do { rem [find name!=public] } on-error={}
add name=RTRWNET write-access=yes

/snmp
set enabled=yes trap-community=RTRWNET trap-version=2

# =========================================================
# SYSTEM CONFIGURATION
# =========================================================
/system identity
set name="%s"

/system clock
set time-zone-autodetect=no time-zone-name=Asia/Jakarta

/ip dns
set allow-remote-requests=yes

/system ntp client
set enabled=yes primary-ntp=162.159.200.1 secondary-ntp=162.159.200.123

# =========================================================
# CLEANUP OLD CONFIG
# =========================================================
:do { /system scheduler rem [find name~"rtrwnet"] } on-error={}
:do { /system scheduler rem [find name~"RTRWNET"] } on-error={}
:do { /interface ovpn-client rem [find name~"RTRW"] } on-error={}
:do { /interface sstp-client rem [find name~"RTRW"] } on-error={}
:do { /interface l2tp-client rem [find name~"RTRW"] } on-error={}
:do { /ppp profile rem [find name=RTRWVPN] } on-error={}

# =========================================================
# RADIUS CONFIGURATION
# =========================================================
:do { /radius rem [find comment~"RTRWNET"] } on-error={}
/radius
add address=%s comment=RTRWNET authentication-port=%d accounting-port=%d secret="%s" service=ppp,dhcp,hotspot src-address=0.0.0.0 timeout=3s

/radius incoming
set accept=yes port=3799

# =========================================================
# IP POOL FOR CUSTOMERS
# =========================================================
:do { /ip pool rem [find name=RTRWPOOL] } on-error={}
/ip pool
add comment="Network : 10.200.192.0/20" name=RTRWPOOL ranges=10.200.192.100-10.200.207.254

# =========================================================
# PPP PROFILE FOR RADIUS
# =========================================================
:do { /ppp profile rem [find name=RTRWRADIUS] } on-error={}
/ppp profile
add insert-queue-before=first local-address=10.200.192.1 name=RTRWRADIUS only-one=yes remote-address=RTRWPOOL

# =========================================================
# PPP AAA (RADIUS AUTHENTICATION)
# =========================================================
/ppp aaa
set use-radius=yes accounting=yes interim-update=0s

# =========================================================
# ISOLIR CONFIGURATION (BLOCK UNPAID CUSTOMERS)
# =========================================================
:do { /ip firewall address-list rem [find list=RTRWISOLIR] } on-error={}
/ip firewall address-list
add address=172.30.0.0/16 list=RTRWISOLIR

# NAT REDIRECT ISOLIR
:do { /ip firewall nat rem [find comment="RTRWISOLIR"] } on-error={}
/ip firewall nat
add action=redirect chain=dstnat comment="RTRWISOLIR" dst-address=!%s dst-port=80,443,8080 protocol=tcp src-address-list=RTRWISOLIR to-ports=3125

:do { /ip firewall filter rem [find comment="RTRWISOLIR"] } on-error={}
/ip firewall filter
add action=reject chain=forward comment="RTRWISOLIR" dst-address=!%s protocol=tcp reject-with=icmp-network-unreachable src-address-list=RTRWISOLIR
add action=reject chain=forward comment="RTRWISOLIR" dst-address=!%s dst-port=!53,5353 protocol=udp reject-with=icmp-network-unreachable src-address-list=RTRWISOLIR

# =========================================================
# HOTSPOT PROFILE (IF USING HOTSPOT)
# =========================================================
/ip hotspot profile
set [find] use-radius=yes radius-accounting=yes radius-interim-update=0s

:do { /ip hotspot user profile rem [find name=RTRWRADIUS] } on-error={}
/ip hotspot user profile
add insert-queue-before=first keepalive-timeout=10m mac-cookie-timeout=1w name=RTRWRADIUS shared-users=unlimited transparent-proxy=yes open-status-page=always status-autorefresh=10m

# =========================================================
# WEB PROXY FOR ISOLIR PAGE
# =========================================================
/ip proxy
set cache-administrator=webmaster@rtrwnet.id enabled=yes max-cache-object-size=1KiB max-cache-size=none max-client-connections=50 max-fresh-time=5m max-server-connections=50 port=3125

:do { /ip proxy access rem [find comment~"RTRW"] } on-error={}
/ip proxy access
add action=deny redirect-to=isolir.rtrwnet.id src-address=172.30.0.0/16 comment="RTRWISOLIR"

# =========================================================
# VPN PROFILE
# =========================================================
:do { /ppp profile rem [find name=RTRWVPN] } on-error={}
/ppp profile
add change-tcp-mss=yes comment="default by rtrwnet (jangan dirubah)" name=RTRWVPN only-one=yes use-encryption=yes

# =========================================================
# VPN CLIENT - USERNAME/PASSWORD AUTH (NO CERTIFICATE)
# Interface Name: RTRWNET_VPN
# =========================================================
:do { /interface ovpn-client rem [find name=RTRWNET_VPN] } on-error={}
/interface ovpn-client
add connect-to=%s port=%d name=RTRWNET_VPN profile=RTRWVPN user=%s password=%s cipher=aes256-cbc auth=sha256 disabled=no comment="VPN to RTRWNET SaaS"

# =========================================================
# ROUTING TO RADIUS SERVER VIA VPN
# =========================================================
:do { /ip route rem [find comment="RTRWROUTE"] } on-error={}
/ip route
add dst-address=%s/32 gateway=RTRWNET_VPN distance=1 disabled=no comment="RTRWROUTE"

# =========================================================
# NAT MASQUERADE FOR VPN
# =========================================================
:do { /ip firewall nat rem [find comment="RTRWNAT"] } on-error={}
/ip firewall nat
add chain=srcnat action=masquerade out-interface=RTRWNET_VPN comment="RTRWNAT"

# =========================================================
# FAILOVER SCHEDULER (AUTO RECONNECT)
# =========================================================
:do { /system scheduler rem [find name="rtrwnetfailover"] } on-error={}
/system scheduler
add disabled=no interval=30s name=rtrwnetfailover on-event="{
:local intname \"RTRWNET_VPN\";
:local pingresult ([/ping %s interface=\$intname count=3]);
:if (\$pingresult = 0) do={
  /interface set \$intname disabled=yes;
  :delay 5s;
  /interface set \$intname disabled=no;
  :log warning \"RTRWNET VPN reconnecting...\";
}
}"

# =========================================================
# VERIFICATION
# =========================================================
:put "=========================================="
:put "RTRWNET SaaS Setup Complete!"
:put "=========================================="
:put ""
:put "VPN Credentials:"
:put "  Server  : %s:%d"
:put "  Username: %s"
:put "  Password: %s"
:put ""
:put "Verifikasi koneksi:"
:put "  /interface ovpn-client print"
:put "  /radius print"
:put "  /ping %s"
:put ""
:put "Jika VPN sudah connected (flag R),"
:put "MikroTik siap digunakan dengan RADIUS."
:put "=========================================="
`,
		p.RouterName, p.RouterIP, p.VPNMode, p.RouterName,
		p.RADIUSServerIP, p.RADIUSAuthPort, p.RADIUSAcctPort, p.RADIUSSecret,
		p.RADIUSServerIP, p.RADIUSServerIP, p.RADIUSServerIP,
		p.VPNServerIP, p.VPNServerPort, p.VPNUser, p.VPNPassword,
		p.RADIUSServerIP,
		p.RADIUSServerIP,
		p.VPNServerIP, p.VPNServerPort, p.VPNUser, p.VPNPassword,
		p.RADIUSServerIP)
}

func allocateClientIP(nasID string) string {
	hash := 0
	for _, c := range nasID {
		hash += int(c)
	}
	lastOctet := (hash % 250) + 2
	return fmt.Sprintf("10.8.0.%d", lastOctet)
}

func generateDeterministicPassword(nasID string) string {
	// Generate deterministic password based on NAS ID
	// This ensures same NAS always gets same password
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, 12)
	
	// Use NAS ID as seed
	seed := []byte(nasID)
	for i := 0; i < 12; i++ {
		idx := int(seed[i%len(seed)]) % len(charset)
		result[i] = charset[idx]
	}
	return string(result)
}

func getVPNServerIP() string {
	if ip := os.Getenv("VPN_SERVER_IP"); ip != "" {
		return ip
	}
	return "vpn.fureup.my.id"
}

func getRADIUSServerIP() string {
	// Internal VPN IP of RADIUS server
	return "10.8.0.1"
}

// Unused but kept for interface compatibility
type VPNClientConfig struct {
	ClientName string `json:"client_name"`
	ServerIP   string `json:"server_ip"`
	ServerPort int    `json:"server_port"`
	Protocol   string `json:"protocol"`
	ClientIP   string `json:"client_ip"`
	ConfigFile string `json:"config_file"`
}

func (s *vpnService) GenerateClientConfig(ctx context.Context, tenantID, nasID string) (*VPNClientConfig, error) {
	creds, err := s.GetVPNCredentials(ctx, tenantID, nasID)
	if err != nil {
		return nil, err
	}
	
	var nas entity.RadiusNAS
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", nasID, tenantID).First(&nas).Error; err != nil {
		return nil, errors.ErrNotFound
	}

	return &VPNClientConfig{
		ClientName: nas.ShortName,
		ServerIP:   creds.ServerIP,
		ServerPort: creds.ServerPort,
		Protocol:   creds.Protocol,
		ClientIP:   creds.ClientIP,
	}, nil
}

func (s *vpnService) CreateVPNConnection(ctx context.Context, tenantID string, req *CreateVPNConnectionRequest) (*entity.VPNConnection, error) {
	vpnConn := &entity.VPNConnection{
		TenantID: tenantID,
		Name:     req.Name,
		VPNType:  "openvpn",
		Status:   "pending",
		IsActive: true,
	}

	if req.NASID != "" {
		nasUUID, _ := uuid.Parse(req.NASID)
		vpnConn.DeviceID = &nasUUID
	}

	if err := s.db.WithContext(ctx).Create(vpnConn).Error; err != nil {
		return nil, fmt.Errorf("failed to create VPN connection: %w", err)
	}

	return vpnConn, nil
}

type CreateVPNConnectionRequest struct {
	NASID       string `json:"nas_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}
