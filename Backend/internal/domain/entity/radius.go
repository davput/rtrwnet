package entity

import (
	"time"

	"github.com/google/uuid"
)

// RadiusNAS represents a MikroTik router as RADIUS NAS
type RadiusNAS struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID    string    `json:"tenant_id" gorm:"type:uuid;not null;index"`
	NASName     string    `json:"nasname" gorm:"column:nasname;not null"` // IP or hostname
	ShortName   string    `json:"shortname" gorm:"column:shortname;not null"`
	Type        string    `json:"type" gorm:"default:'other'"`
	Ports       int       `json:"ports"`
	Secret      string    `json:"secret" gorm:"not null"`
	Server      string    `json:"server"`
	Community   string    `json:"community"`
	Description string    `json:"description"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (RadiusNAS) TableName() string {
	return "radius_nas"
}

// RadiusUser represents a PPPoE/Hotspot user
type RadiusUser struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID        string     `json:"tenant_id" gorm:"type:uuid;not null;index"`
	CustomerID      *string    `json:"customer_id" gorm:"type:uuid;index"`
	Username        string     `json:"username" gorm:"not null;uniqueIndex:idx_tenant_username"`
	PasswordHash    string     `json:"-" gorm:"not null"`
	PasswordPlain   string     `json:"-"` // Encrypted, for CHAP/MS-CHAP
	AuthType        string     `json:"auth_type" gorm:"default:'pap'"`
	ProfileName     string     `json:"profile_name"`
	IPAddress       string     `json:"ip_address"`
	MACAddress      string     `json:"mac_address"`
	IsActive        bool       `json:"is_active" gorm:"default:true"`
	SimultaneousUse int        `json:"simultaneous_use" gorm:"default:1"`
	ExpireDate      *time.Time `json:"expire_date"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	// Relations
	Customer   *Customer              `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	Attributes []RadiusUserAttribute  `json:"attributes,omitempty" gorm:"foreignKey:RadiusUserID"`
}

func (RadiusUser) TableName() string {
	return "radius_users"
}

// RadiusUserAttribute represents check/reply attributes
type RadiusUserAttribute struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	RadiusUserID uuid.UUID `json:"radius_user_id" gorm:"type:uuid;not null;index"`
	Attribute    string    `json:"attribute" gorm:"not null"`
	Op           string    `json:"op" gorm:"default:':='"`
	Value        string    `json:"value" gorm:"not null"`
	AttrType     string    `json:"attr_type" gorm:"default:'reply'"` // check or reply
	CreatedAt    time.Time `json:"created_at"`
}

func (RadiusUserAttribute) TableName() string {
	return "radius_user_attributes"
}

// RadiusProfile represents bandwidth/rate limit profile
type RadiusProfile struct {
	ID               uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID         string    `json:"tenant_id" gorm:"type:uuid;not null;index"`
	ServicePlanID    *string   `json:"service_plan_id" gorm:"type:uuid"`
	Name             string    `json:"name" gorm:"not null;uniqueIndex:idx_tenant_profile_name"`
	Description      string    `json:"description"`
	RateLimitRx      int       `json:"rate_limit_rx"`      // Download kbps
	RateLimitTx      int       `json:"rate_limit_tx"`      // Upload kbps
	BurstLimitRx     int       `json:"burst_limit_rx"`
	BurstLimitTx     int       `json:"burst_limit_tx"`
	BurstThresholdRx int       `json:"burst_threshold_rx"`
	BurstThresholdTx int       `json:"burst_threshold_tx"`
	BurstTime        int       `json:"burst_time" gorm:"default:10"`
	SessionTimeout   int       `json:"session_timeout"`
	IdleTimeout      int       `json:"idle_timeout" gorm:"default:300"`
	IPPool           string    `json:"ip_pool"`
	IsActive         bool      `json:"is_active" gorm:"default:true"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Relations
	ServicePlan *ServicePlan `json:"service_plan,omitempty" gorm:"foreignKey:ServicePlanID"`
}

func (RadiusProfile) TableName() string {
	return "radius_profiles"
}

// RadiusAccounting represents session accounting
type RadiusAccounting struct {
	ID                uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID          string     `json:"tenant_id" gorm:"type:uuid;not null;index"`
	RadiusUserID      *uuid.UUID `json:"radius_user_id" gorm:"type:uuid;index"`
	AcctSessionID     string     `json:"acct_session_id" gorm:"not null;index"`
	AcctUniqueID      string     `json:"acct_unique_id"`
	Username          string     `json:"username" gorm:"not null;index"`
	NASIPAddress      string     `json:"nas_ip_address"`
	NASPortID         string     `json:"nas_port_id"`
	NASPortType       string     `json:"nas_port_type"`
	AcctStartTime     *time.Time `json:"acct_start_time" gorm:"index"`
	AcctStopTime      *time.Time `json:"acct_stop_time"`
	AcctSessionTime   int        `json:"acct_session_time" gorm:"default:0"`
	AcctInputOctets   int64      `json:"acct_input_octets" gorm:"default:0"`
	AcctOutputOctets  int64      `json:"acct_output_octets" gorm:"default:0"`
	AcctInputPackets  int64      `json:"acct_input_packets" gorm:"default:0"`
	AcctOutputPackets int64      `json:"acct_output_packets" gorm:"default:0"`
	AcctTerminateCause string    `json:"acct_terminate_cause"`
	FramedIPAddress   string     `json:"framed_ip_address"`
	FramedProtocol    string     `json:"framed_protocol"`
	CallingStationID  string     `json:"calling_station_id"` // MAC
	CalledStationID   string     `json:"called_station_id"`
	ServiceType       string     `json:"service_type"`
	CreatedAt         time.Time  `json:"created_at"`

	// Relations
	RadiusUser *RadiusUser `json:"radius_user,omitempty" gorm:"foreignKey:RadiusUserID"`
}

func (RadiusAccounting) TableName() string {
	return "radius_accounting"
}

// VPNConnection represents VPN connection to customer MikroTik
type VPNConnection struct {
	ID                     uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID               string     `json:"tenant_id" gorm:"column:tenant_id;type:uuid;not null;index"`
	DeviceID               *uuid.UUID `json:"device_id" gorm:"column:device_id;type:uuid;index"`
	Name                   string     `json:"name" gorm:"column:name;not null"`
	VPNType                string     `json:"vpn_type" gorm:"column:vpn_type;default:'openvpn'"` // wireguard, openvpn
	// WireGuard
	WGPublicKey            string     `json:"wg_public_key" gorm:"column:wg_public_key"`
	WGPrivateKeyEncrypted  string     `json:"-" gorm:"column:wg_private_key_encrypted"`
	WGEndpoint             string     `json:"wg_endpoint" gorm:"column:wg_endpoint"`
	WGAllowedIPs           string     `json:"wg_allowed_ips" gorm:"column:wg_allowed_ips"`
	WGPersistentKeepalive  int        `json:"wg_persistent_keepalive" gorm:"column:wg_persistent_keepalive;default:25"`
	// OpenVPN
	OVPNConfigEncrypted    string     `json:"-" gorm:"column:ovpn_config_encrypted"`
	OVPNCACert             string     `json:"-" gorm:"column:ovpn_ca_cert"`
	OVPNClientCert         string     `json:"-" gorm:"column:ovpn_client_cert"`
	OVPNClientKeyEncrypted string     `json:"-" gorm:"column:ovpn_client_key_encrypted"`
	// Status
	Status                 string     `json:"status" gorm:"column:status;default:'disconnected'"`
	LastConnectedAt        *time.Time `json:"last_connected_at" gorm:"column:last_connected_at"`
	LastError              string     `json:"last_error" gorm:"column:last_error"`
	IsActive               bool       `json:"is_active" gorm:"column:is_active;default:true"`
	CreatedAt              time.Time  `json:"created_at" gorm:"column:created_at"`
	UpdatedAt              time.Time  `json:"updated_at" gorm:"column:updated_at"`

	// Relations
	Device *Device `json:"device,omitempty" gorm:"foreignKey:DeviceID"`
}

func (VPNConnection) TableName() string {
	return "vpn_connections"
}

// Constants
const (
	AuthTypePAP      = "pap"
	AuthTypeCHAP     = "chap"
	AuthTypeMSCHAP   = "mschap"
	AuthTypeMSCHAPv2 = "mschapv2"

	VPNTypeWireGuard = "wireguard"
	VPNTypeOpenVPN   = "openvpn"
	VPNTypeL2TP      = "l2tp"
	VPNTypePPTP      = "pptp"

	VPNStatusConnected    = "connected"
	VPNStatusDisconnected = "disconnected"
	VPNStatusConnecting   = "connecting"
	VPNStatusError        = "error"
)
