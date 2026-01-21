package usecase

import (
	"bytes"
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
	"text/template"
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

	script := generateMikroTikOpenVPNScript(MikroTikScriptParams{
		VPNServerIP:    clientConfig.ServerIP,
		VPNServerPort:  clientConfig.ServerPort,
		VPNClientIP:    clientConfig.ClientIP,
		CACert:         clientConfig.CACert,
		ClientCert:     clientConfig.ClientCert,
		ClientKey:      clientConfig.ClientKey,
		ClientName:     clientConfig.ClientName,
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
	VPNServerIP    string
	VPNServerPort  int
	VPNClientIP    string
	CACert         string
	ClientCert     string
	ClientKey      string
	ClientName     string
	RADIUSServerIP string
	RADIUSSecret   string
	RADIUSAuthPort int
	RADIUSAcctPort int
}

func generateMikroTikOpenVPNScript(params MikroTikScriptParams) string {
	scriptTemplate := `# ============================================
# MikroTik OpenVPN Client + RADIUS Configuration
# Generated by RT/RW Net SaaS
# Client: {{.ClientName}}
# ============================================

# Step 1: Import Certificates
# Copy and paste each certificate section separately

# --- CA Certificate ---
/certificate
add name=ca-rtrwnet common-name="RT/RW Net CA"
:put "Paste CA certificate content in Winbox: System > Certificates > ca-rtrwnet > Edit > Paste"

# --- Client Certificate ---
/certificate
add name=client-{{.ClientName}} common-name="{{.ClientName}}"
:put "Paste Client certificate content in Winbox: System > Certificates > client-{{.ClientName}} > Edit > Paste"

# --- Client Key ---
:put "Import client key via Winbox: System > Certificates > Import"

# ============================================
# Step 2: Create OpenVPN Client Interface
# ============================================

/interface ovpn-client
add name=ovpn-to-vps \
    connect-to={{.VPNServerIP}} \
    port={{.VPNServerPort}} \
    mode=ip \
    protocol=udp \
    user={{.ClientName}} \
    password="" \
    certificate=client-{{.ClientName}} \
    cipher=aes256-cbc \
    auth=sha256 \
    add-default-route=no \
    disabled=no \
    comment="VPN to RT/RW Net SaaS Server"

# ============================================
# Step 3: Configure IP Address for VPN
# ============================================

/ip address
add address={{.VPNClientIP}}/24 interface=ovpn-to-vps comment="VPN Client IP"

# ============================================
# Step 4: Configure RADIUS
# ============================================

# Remove existing RADIUS config (optional)
# /radius remove [find]

/radius
add address={{.RADIUSServerIP}} \
    secret="{{.RADIUSSecret}}" \
    service=ppp,login,hotspot \
    authentication-port={{.RADIUSAuthPort}} \
    accounting-port={{.RADIUSAcctPort}} \
    timeout=3s \
    comment="RT/RW Net SaaS RADIUS"

# Enable RADIUS for PPP
/ppp aaa
set use-radius=yes accounting=yes interim-update=1m

# ============================================
# Step 5: Configure PPP Profile for RADIUS
# ============================================

/ppp profile
add name=profile-radius \
    local-address=10.50.50.1 \
    remote-address=pool-pelanggan \
    dns-server=8.8.8.8,8.8.4.4 \
    change-tcp-mss=yes \
    comment="Profile for RADIUS users"

# ============================================
# Step 6: Configure PPPoE Server (if needed)
# ============================================

# Create IP Pool for customers
/ip pool
add name=pool-pelanggan ranges=10.50.50.2-10.50.50.254

# PPPoE Server (adjust interface as needed)
# /interface pppoe-server server
# add service-name=pppoe-service interface=ether2 default-profile=profile-radius disabled=no

# ============================================
# Step 7: Firewall Rules for VPN Traffic
# ============================================

/ip firewall filter
add chain=input action=accept protocol=udp dst-port=1194 comment="Allow OpenVPN"
add chain=input action=accept src-address={{.RADIUSServerIP}} comment="Allow RADIUS Server"

/ip firewall nat
add chain=srcnat out-interface=ovpn-to-vps action=masquerade comment="NAT for VPN"

# ============================================
# Step 8: Routes (if needed)
# ============================================

# Route to VPN server network
/ip route
add dst-address=10.8.0.0/24 gateway=ovpn-to-vps comment="Route to VPN network"

# ============================================
# Verification Commands
# ============================================

:put "=== Verification Commands ==="
:put "/interface ovpn-client print"
:put "/radius print"
:put "/ppp aaa print"
:put "/ping {{.RADIUSServerIP}}"

# ============================================
# Certificate Content (Import via Winbox)
# ============================================

:put "=== CA Certificate ==="
:put "{{.CACertOneLine}}"

:put "=== Client Certificate ==="
:put "{{.ClientCertOneLine}}"

:put "=== Client Key ==="
:put "{{.ClientKeyOneLine}}"

# ============================================
# END OF SCRIPT
# ============================================
`

	// Process certificates for display (remove newlines for easier copy)
	params.CACert = "See below"
	params.ClientCert = "See below"
	params.ClientKey = "See below"

	tmpl, err := template.New("mikrotik").Parse(scriptTemplate)
	if err != nil {
		return fmt.Sprintf("Error generating script: %v", err)
	}

	// Add one-line versions for display
	data := struct {
		MikroTikScriptParams
		CACertOneLine     string
		ClientCertOneLine string
		ClientKeyOneLine  string
	}{
		MikroTikScriptParams: params,
		CACertOneLine:        "[Import via Winbox - System > Certificates > Import]",
		ClientCertOneLine:    "[Import via Winbox - System > Certificates > Import]",
		ClientKeyOneLine:     "[Import via Winbox - System > Certificates > Import]",
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return fmt.Sprintf("Error generating script: %v", err)
	}

	return buf.String()
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
