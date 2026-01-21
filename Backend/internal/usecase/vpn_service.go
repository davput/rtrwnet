package usecase

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math/big"
	"net"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"gorm.io/gorm"
)

type VPNService interface {
	// VPN Server Config
	GenerateServerConfig(ctx context.Context, tenantID string) (*VPNServerConfig, error)
	
	// Client (MikroTik) Config
	GenerateClientConfig(ctx context.Context, tenantID, nasID string) (*VPNClientConfig, error)
	GenerateMikroTikScript(ctx context.Context, tenantID, nasID string) (string, error)
	
	// Connection Management
	CreateVPNConnection(ctx context.Context, tenantID string, req *CreateVPNConnectionRequest) (*entity.VPNConnection, error)
	ListVPNConnections(ctx context.Context, tenantID string) ([]*entity.VPNConnection, error)
	GetVPNConnection(ctx context.Context, tenantID, connectionID string) (*entity.VPNConnection, error)
	DeleteVPNConnection(ctx context.Context, tenantID, connectionID string) error
}

type VPNServerConfig struct {
	ServerIP     string `json:"server_ip"`
	ServerPort   int    `json:"server_port"`
	Protocol     string `json:"protocol"`
	CACert       string `json:"ca_cert"`
	ServerCert   string `json:"server_cert"`
	ServerKey    string `json:"server_key"`
	DHParams     string `json:"dh_params"`
	TLSAuth      string `json:"tls_auth"`
	ConfigFile   string `json:"config_file"`
}

type VPNClientConfig struct {
	ClientName   string `json:"client_name"`
	ServerIP     string `json:"server_ip"`
	ServerPort   int    `json:"server_port"`
	Protocol     string `json:"protocol"`
	CACert       string `json:"ca_cert"`
	ClientCert   string `json:"client_cert"`
	ClientKey    string `json:"client_key"`
	TLSAuth      string `json:"tls_auth"`
	ConfigFile   string `json:"config_file"`
	ClientIP     string `json:"client_ip"`
}

type CreateVPNConnectionRequest struct {
	NASID       string `json:"nas_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type vpnService struct {
	db *gorm.DB
}

func NewVPNService(db *gorm.DB) VPNService {
	return &vpnService{db: db}
}

// GenerateServerConfig generates OpenVPN server configuration
func (s *vpnService) GenerateServerConfig(ctx context.Context, tenantID string) (*VPNServerConfig, error) {
	// Generate CA certificate
	caCert, caKey, err := generateCACertificate()
	if err != nil {
		return nil, fmt.Errorf("failed to generate CA certificate: %w", err)
	}

	// Generate server certificate
	serverCert, serverKey, err := generateServerCertificate(caCert, caKey)
	if err != nil {
		return nil, fmt.Errorf("failed to generate server certificate: %w", err)
	}

	// Generate DH params (simplified - in production use pre-generated)
	dhParams := generateDHParams()

	// Generate TLS auth key
	tlsAuth := generateTLSAuthKey()

	serverConfig := generateOpenVPNServerConfig()

	return &VPNServerConfig{
		ServerIP:   "0.0.0.0",
		ServerPort: 1194,
		Protocol:   "udp",
		CACert:     caCert,
		ServerCert: serverCert,
		ServerKey:  serverKey,
		DHParams:   dhParams,
		TLSAuth:    tlsAuth,
		ConfigFile: serverConfig,
	}, nil
}


// GenerateClientConfig generates OpenVPN client configuration for a NAS
func (s *vpnService) GenerateClientConfig(ctx context.Context, tenantID, nasID string) (*VPNClientConfig, error) {
	// Get NAS
	var nas entity.RadiusNAS
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", nasID, tenantID).First(&nas).Error; err != nil {
		return nil, errors.ErrNotFound
	}

	// Check if VPN connection exists
	var vpnConn entity.VPNConnection
	err := s.db.WithContext(ctx).Where("tenant_id = ? AND name = ?", tenantID, nas.ShortName).First(&vpnConn).Error
	
	if err == gorm.ErrRecordNotFound {
		// Create new VPN connection
		vpnConn = entity.VPNConnection{
			TenantID: tenantID,
			Name:     nas.ShortName,
			VPNType:  "openvpn",
			Status:   "pending",
			IsActive: true,
		}
		
		// Generate certificates
		caCert, caKey, _ := generateCACertificate()
		clientCert, clientKey, _ := generateClientCertificate(caCert, caKey, nas.ShortName)
		
		vpnConn.OVPNCACert = caCert
		vpnConn.OVPNClientCert = clientCert
		vpnConn.OVPNClientKeyEncrypted = clientKey
		
		if err := s.db.WithContext(ctx).Create(&vpnConn).Error; err != nil {
			return nil, fmt.Errorf("failed to create VPN connection: %w", err)
		}
	}

	// Generate client IP based on NAS ID (simple allocation)
	clientIP := allocateClientIP(nasID)

	// Get server IP from environment or config
	serverIP := getVPNServerIP()

	clientConfig := generateOpenVPNClientConfig(serverIP, 1194, vpnConn.OVPNCACert, vpnConn.OVPNClientCert, vpnConn.OVPNClientKeyEncrypted)

	return &VPNClientConfig{
		ClientName: nas.ShortName,
		ServerIP:   serverIP,
		ServerPort: 1194,
		Protocol:   "udp",
		CACert:     vpnConn.OVPNCACert,
		ClientCert: vpnConn.OVPNClientCert,
		ClientKey:  vpnConn.OVPNClientKeyEncrypted,
		ConfigFile: clientConfig,
		ClientIP:   clientIP,
	}, nil
}

// GenerateMikroTikScript generates a MikroTik RouterOS script for OpenVPN client setup
func (s *vpnService) GenerateMikroTikScript(ctx context.Context, tenantID, nasID string) (string, error) {
	// Get client config first
	clientConfig, err := s.GenerateClientConfig(ctx, tenantID, nasID)
	if err != nil {
		return "", err
	}

	// Get NAS for RADIUS config
	var nas entity.RadiusNAS
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", nasID, tenantID).First(&nas).Error; err != nil {
		return "", errors.ErrNotFound
	}

	// Get VPS/Server IP for RADIUS
	radiusServerIP := getRADIUSServerIP()
	
	// Generate VPN credentials
	vpnUser := fmt.Sprintf("rtrw%s", nasID[:8])
	vpnPassword := generateVPNPassword(12)

	script := generateMikroTikOpenVPNScript(MikroTikScriptParams{
		RouterName:     nas.ShortName,
		RouterIP:       nas.NASName,
		VPNServerIP:    clientConfig.ServerIP,
		VPNServerPort:  clientConfig.ServerPort,
		VPNClientIP:    clientConfig.ClientIP,
		VPNUser:        vpnUser,
		VPNPassword:    vpnPassword,
		VPNMode:        "OVPN",
		RADIUSServerIP: radiusServerIP,
		RADIUSSecret:   nas.Secret,
		RADIUSAuthPort: 1812,
		RADIUSAcctPort: 1813,
	})

	return script, nil
}

// CreateVPNConnection creates a new VPN connection record
func (s *vpnService) CreateVPNConnection(ctx context.Context, tenantID string, req *CreateVPNConnectionRequest) (*entity.VPNConnection, error) {
	// Generate certificates
	caCert, caKey, err := generateCACertificate()
	if err != nil {
		return nil, fmt.Errorf("failed to generate CA certificate: %w", err)
	}

	clientCert, clientKey, err := generateClientCertificate(caCert, caKey, req.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to generate client certificate: %w", err)
	}

	vpnConn := &entity.VPNConnection{
		TenantID:                tenantID,
		Name:                    req.Name,
		VPNType:                 "openvpn",
		OVPNCACert:              caCert,
		OVPNClientCert:          clientCert,
		OVPNClientKeyEncrypted:  clientKey,
		Status:                  "pending",
		IsActive:                true,
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

// ListVPNConnections lists all VPN connections for a tenant
func (s *vpnService) ListVPNConnections(ctx context.Context, tenantID string) ([]*entity.VPNConnection, error) {
	var connections []*entity.VPNConnection
	if err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Find(&connections).Error; err != nil {
		return nil, errors.ErrInternalServer
	}
	return connections, nil
}

// GetVPNConnection gets a VPN connection by ID
func (s *vpnService) GetVPNConnection(ctx context.Context, tenantID, connectionID string) (*entity.VPNConnection, error) {
	var conn entity.VPNConnection
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", connectionID, tenantID).First(&conn).Error; err != nil {
		return nil, errors.ErrNotFound
	}
	return &conn, nil
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


// Helper functions

func generateCACertificate() (string, *rsa.PrivateKey, error) {
	caKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return "", nil, err
	}

	caTemplate := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Organization: []string{"RT/RW Net SaaS"},
			CommonName:   "RT/RW Net CA",
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(10, 0, 0), // 10 years
		IsCA:                  true,
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageCRLSign,
		BasicConstraintsValid: true,
	}

	caCertDER, err := x509.CreateCertificate(rand.Reader, caTemplate, caTemplate, &caKey.PublicKey, caKey)
	if err != nil {
		return "", nil, err
	}

	caCertPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: caCertDER})
	return string(caCertPEM), caKey, nil
}

func generateServerCertificate(caCertPEM string, caKey *rsa.PrivateKey) (string, string, error) {
	serverKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return "", "", err
	}

	// Parse CA cert
	block, _ := pem.Decode([]byte(caCertPEM))
	caCert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "", "", err
	}

	serverTemplate := &x509.Certificate{
		SerialNumber: big.NewInt(2),
		Subject: pkix.Name{
			Organization: []string{"RT/RW Net SaaS"},
			CommonName:   "OpenVPN Server",
		},
		NotBefore:   time.Now(),
		NotAfter:    time.Now().AddDate(5, 0, 0), // 5 years
		KeyUsage:    x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		IPAddresses: []net.IP{net.ParseIP("0.0.0.0")},
	}

	serverCertDER, err := x509.CreateCertificate(rand.Reader, serverTemplate, caCert, &serverKey.PublicKey, caKey)
	if err != nil {
		return "", "", err
	}

	serverCertPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: serverCertDER})
	serverKeyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(serverKey)})

	return string(serverCertPEM), string(serverKeyPEM), nil
}

func generateClientCertificate(caCertPEM string, caKey *rsa.PrivateKey, clientName string) (string, string, error) {
	clientKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return "", "", err
	}

	// Parse CA cert
	block, _ := pem.Decode([]byte(caCertPEM))
	caCert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "", "", err
	}

	clientTemplate := &x509.Certificate{
		SerialNumber: big.NewInt(time.Now().UnixNano()),
		Subject: pkix.Name{
			Organization: []string{"RT/RW Net SaaS"},
			CommonName:   clientName,
		},
		NotBefore:   time.Now(),
		NotAfter:    time.Now().AddDate(2, 0, 0), // 2 years
		KeyUsage:    x509.KeyUsageDigitalSignature,
		ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	}

	clientCertDER, err := x509.CreateCertificate(rand.Reader, clientTemplate, caCert, &clientKey.PublicKey, caKey)
	if err != nil {
		return "", "", err
	}

	clientCertPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: clientCertDER})
	clientKeyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(clientKey)})

	return string(clientCertPEM), string(clientKeyPEM), nil
}

func generateDHParams() string {
	// Pre-generated DH params (2048-bit) - in production, generate fresh ones
	return `-----BEGIN DH PARAMETERS-----
MIIBCAKCAQEA///////////JD9qiIWjCNMTGYouA3BzRKQJOCIpnzHQCC76mOxOb
IlFKCHmONATd75UZs806QxswKwpt8l8UN0/hNW1tUcJF5IW1dmJefsb0TELppjft
awv/XLb0Brft7jhr+1qJn6WunyQRfEsf5kkoZlHs5Fs9wgB8uKFjvwWY2kg2HFXT
mmkWP6j9JM9fg2VdI9yjrZYcYvNWIIVSu57VKQdwlpZtZww1Tkq8mATxdGwIyhgh
fDKQXkYuNs474553LBgOhgObJ4Oi7Aeij7XFXfBvTFLJ3ivL9pVYFxg5lUl86pVq
5RXSJhiY+gUQFXKOWoqsqmj//////////wIBAg==
-----END DH PARAMETERS-----`
}

func generateTLSAuthKey() string {
	key := make([]byte, 256)
	rand.Read(key)
	return fmt.Sprintf(`-----BEGIN OpenVPN Static key V1-----
%x
-----END OpenVPN Static key V1-----`, key)
}

func generateOpenVPNServerConfig() string {
	return `# OpenVPN Server Configuration for RT/RW Net SaaS
port 1194
proto udp
dev tun

ca ca.crt
cert server.crt
key server.key
dh dh.pem
tls-auth ta.key 0

server 10.8.0.0 255.255.255.0
ifconfig-pool-persist ipp.txt

push "route 10.8.0.0 255.255.255.0"

keepalive 10 120
cipher AES-256-GCM
auth SHA256

user nobody
group nogroup

persist-key
persist-tun

status openvpn-status.log
log-append openvpn.log
verb 3

# Allow client-to-client communication
client-to-client

# Management interface
management localhost 7505
`
}

func generateOpenVPNClientConfig(serverIP string, serverPort int, caCert, clientCert, clientKey string) string {
	return fmt.Sprintf(`# OpenVPN Client Configuration
client
dev tun
proto udp
remote %s %d
resolv-retry infinite
nobind
persist-key
persist-tun
cipher AES-256-GCM
auth SHA256
verb 3

<ca>
%s</ca>

<cert>
%s</cert>

<key>
%s</key>
`, serverIP, serverPort, caCert, clientCert, clientKey)
}


type MikroTikScriptParams struct {
	// Router Info
	RouterName     string
	RouterIP       string
	
	// VPN Config
	VPNServerIP    string
	VPNServerPort  int
	VPNClientIP    string
	VPNUser        string
	VPNPassword    string
	VPNMode        string // OVPN, SSTP, L2TP
	
	// RADIUS Config
	RADIUSServerIP string
	RADIUSSecret   string
	RADIUSAuthPort int
	RADIUSAcctPort int
	
	// Pool Config
	PoolName       string
	PoolRange      string
	LocalAddress   string
	
	// Isolir Config
	IsolirNetwork  string
	IsolirRedirect string
}

func generateMikroTikOpenVPNScript(params MikroTikScriptParams) string {
	// Set defaults
	if params.VPNMode == "" {
		params.VPNMode = "OVPN"
	}
	if params.PoolName == "" {
		params.PoolName = "RTRWPOOL"
	}
	if params.PoolRange == "" {
		params.PoolRange = "10.200.192.100-10.200.207.254"
	}
	if params.LocalAddress == "" {
		params.LocalAddress = "10.200.192.1"
	}
	if params.IsolirNetwork == "" {
		params.IsolirNetwork = "172.30.0.0/16"
	}

	script := fmt.Sprintf(`########################################################################
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
rem [find name!=public]
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
/system scheduler
rem [find name~"rtrwnet"]
rem [find name~"RTRWNET"]
rem [find name="rtrwnetfailover"]

/interface sstp-client
rem [find name~"RTRW"]

/interface ovpn-client
rem [find name~"RTRW"]

/interface l2tp-client
rem [find name~"RTRW"]

/ppp profile
rem [find name=RTRWVPN]

# =========================================================
# RADIUS CONFIGURATION
# =========================================================
/radius
rem [find comment~"RTRWNET"]
add address=%s comment=RTRWNET authentication-port=%d accounting-port=%d secret="%s" service=ppp,dhcp,hotspot src-address=0.0.0.0 timeout=3s

/radius
set require-message-auth=no numbers=0

/radius incoming
set accept=yes port=3799

# =========================================================
# IP POOL FOR CUSTOMERS
# =========================================================
/ip pool
rem [find name=%s]
add comment="Network : 10.200.192.0/20" name=%s ranges=%s

# =========================================================
# PPP PROFILE FOR RADIUS
# =========================================================
/ppp profile
rem [find name=RTRWRADIUS]
add insert-queue-before=first local-address=%s name=RTRWRADIUS only-one=yes remote-address=%s

# =========================================================
# PPP AAA (RADIUS AUTHENTICATION)
# =========================================================
/ppp aaa
set use-radius=yes accounting=yes
set interim-update=0s

# =========================================================
# ISOLIR CONFIGURATION (BLOCK UNPAID CUSTOMERS)
# =========================================================
/ip firewall address-list
rem [find list=RTRWISOLIR]
add address=%s list=RTRWISOLIR

# NAT REDIRECT ISOLIR TO WEBPROXY
/ip firewall nat
rem [find comment="RTRWISOLIR"]
add action=redirect chain=dstnat comment="RTRWISOLIR" dst-address=!%s dst-port=80,443,8080 protocol=tcp src-address-list=RTRWISOLIR to-ports=3125

/ip firewall filter
rem [find comment="RTRWISOLIR"]
add action=reject chain=forward comment="RTRWISOLIR" dst-address=!%s protocol=tcp reject-with=icmp-network-unreachable src-address-list=RTRWISOLIR
add action=reject chain=forward comment="RTRWISOLIR" dst-address=!%s dst-port=!53,5353 protocol=udp reject-with=icmp-network-unreachable src-address-list=RTRWISOLIR

# =========================================================
# HOTSPOT PROFILE (IF USING HOTSPOT)
# =========================================================
/ip hotspot profile
set [find] use-radius=yes radius-accounting=yes
set [find] radius-interim-update=0s

/ip hotspot user profile
rem [find name=RTRWRADIUS]
add insert-queue-before=first keepalive-timeout=10m mac-cookie-timeout=1w name=RTRWRADIUS shared-users=unlimited transparent-proxy=yes open-status-page=always status-autorefresh=10m

# =========================================================
# WEB PROXY FOR ISOLIR PAGE
# =========================================================
/ip proxy
set cache-administrator=webmaster@rtrwnet.id enabled=yes max-cache-object-size=1KiB max-cache-size=none max-client-connections=50 max-fresh-time=5m max-server-connections=50 port=3125

/ip proxy access
rem [find comment~"RTRW"]
add action=deny redirect-to=isolir.rtrwnet.id src-address=%s comment="RTRWISOLIR"

# =========================================================
# VPN PROFILE
# =========================================================
/ppp profile
rem [find name=RTRWVPN]
add change-tcp-mss=yes comment="default by rtrwnet (jangan dirubah)" name=RTRWVPN only-one=yes use-encryption=yes

# =========================================================
# VPN CLIENT (SESUAI PILIHAN MODE)
# Interface Name: RTRWNET_VPN
# =========================================================
`, params.RouterName, params.RouterIP, params.VPNMode, params.RouterName,
		params.RADIUSServerIP, params.RADIUSAuthPort, params.RADIUSAcctPort, params.RADIUSSecret,
		params.PoolName, params.PoolName, params.PoolRange, params.LocalAddress, params.PoolName,
		params.IsolirNetwork, params.RADIUSServerIP, params.RADIUSServerIP, params.RADIUSServerIP,
		params.IsolirNetwork)

	// Add VPN client based on mode
	switch params.VPNMode {
	case "OVPN":
		script += fmt.Sprintf(`
/interface ovpn-client
rem [find name~"RTRWNET"]
add connect-to=%s port=%d name=RTRWNET_VPN profile=RTRWVPN user=%s password=%s cipher=aes256-cbc auth=sha256 disabled=no comment="VPN to RTRWNET SaaS"
`, params.VPNServerIP, params.VPNServerPort, params.VPNUser, params.VPNPassword)
	case "SSTP":
		script += fmt.Sprintf(`
/interface sstp-client
rem [find name~"RTRWNET"]
add connect-to=%s name=RTRWNET_VPN profile=RTRWVPN user=%s password=%s disabled=no comment="VPN to RTRWNET SaaS"
`, params.VPNServerIP, params.VPNUser, params.VPNPassword)
	case "L2TP":
		script += fmt.Sprintf(`
/interface l2tp-client
rem [find name~"RTRWNET"]
add connect-to=%s name=RTRWNET_VPN profile=RTRWVPN user=%s password=%s disabled=no comment="VPN to RTRWNET SaaS"
`, params.VPNServerIP, params.VPNUser, params.VPNPassword)
	}

	// Add routing and NAT
	script += fmt.Sprintf(`
# =========================================================
# ROUTING TO RADIUS SERVER VIA VPN
# =========================================================
/ip route
rem [find comment="RTRWROUTE"]
add dst-address=%s/32 gateway=RTRWNET_VPN distance=1 disabled=no comment="RTRWROUTE"

# =========================================================
# NAT MASQUERADE FOR VPN
# =========================================================
/ip firewall nat
rem [find comment="RTRWNAT"]
add chain=srcnat action=masquerade out-interface=RTRWNET_VPN comment="RTRWNAT"

# =========================================================
# FAILOVER SCHEDULER (AUTO RECONNECT)
# =========================================================
/system scheduler
rem [find name="rtrwnetfailover"]
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
# VERIFICATION COMMANDS
# =========================================================
:put "=========================================="
:put "RTRWNET SaaS Setup Complete!"
:put "=========================================="
:put ""
:put "Verifikasi koneksi dengan command berikut:"
:put "/interface ovpn-client print"
:put "/radius print"
:put "/ppp aaa print"
:put "/ping %s"
:put ""
:put "Jika VPN sudah connected (flag R),"
:put "MikroTik siap digunakan dengan RADIUS."
:put "=========================================="

# =========================================================
# END OF SCRIPT
# =========================================================
`, params.RADIUSServerIP, params.RADIUSServerIP, params.RADIUSServerIP)

	return script
}

func allocateClientIP(nasID string) string {
	// Simple IP allocation based on NAS ID hash
	// In production, use proper IP management
	hash := 0
	for _, c := range nasID {
		hash += int(c)
	}
	lastOctet := (hash % 250) + 2 // 10.8.0.2 - 10.8.0.251
	return fmt.Sprintf("10.8.0.%d", lastOctet)
}

func generateVPNPassword(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	rand.Read(b)
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return string(b)
}

func getVPNServerIP() string {
	// Get from environment variable
	if ip := os.Getenv("VPN_SERVER_IP"); ip != "" {
		return ip
	}
	// Fallback to default
	return "vpn.fureup.my.id"
}

func getRADIUSServerIP() string {
	// RADIUS server IP (same as VPN server in most cases)
	// This is the IP that MikroTik will see after VPN connection
	return "10.8.0.1" // VPN server's internal IP
}
