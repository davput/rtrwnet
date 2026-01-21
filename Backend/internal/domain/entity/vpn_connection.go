package entity

import (
	"time"

	"github.com/google/uuid"
)

// VPNConnection represents a VPN connection for a NAS device
type VPNConnection struct {
	ID                     uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID               string     `gorm:"type:varchar(36);not null;index" json:"tenant_id"`
	DeviceID               *uuid.UUID `gorm:"type:uuid;index" json:"device_id,omitempty"`
	Name                   string     `gorm:"type:varchar(100);not null" json:"name"`
	Description            string     `gorm:"type:text" json:"description,omitempty"`
	VPNType                string     `gorm:"type:varchar(20);default:'openvpn'" json:"vpn_type"`
	Status                 string     `gorm:"type:varchar(20);default:'pending'" json:"status"`
	IsActive               bool       `gorm:"default:true" json:"is_active"`
	
	// OpenVPN specific fields
	OVPNCACert             string     `gorm:"type:text" json:"-"`
	OVPNClientCert         string     `gorm:"type:text" json:"-"`
	OVPNClientKeyEncrypted string     `gorm:"type:text" json:"-"`
	OVPNTLSAuth            string     `gorm:"type:text" json:"-"`
	
	// Connection info
	AssignedIP             string     `gorm:"type:varchar(45)" json:"assigned_ip,omitempty"`
	LastConnectedAt        *time.Time `json:"last_connected_at,omitempty"`
	LastDisconnectedAt     *time.Time `json:"last_disconnected_at,omitempty"`
	
	// Timestamps
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
}

func (VPNConnection) TableName() string {
	return "vpn_connections"
}
