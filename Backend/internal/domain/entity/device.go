package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Device struct {
	ID                      string     `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID                string     `gorm:"type:uuid;not null;index" json:"tenant_id"`
	DeviceName              string     `gorm:"not null" json:"device_name"`
	DeviceType              string     `gorm:"not null" json:"device_type"` // router, onu, switch, access_point
	SerialNumber            string     `gorm:"uniqueIndex:idx_tenant_serial;not null" json:"serial_number"`
	MACAddress              string     `gorm:"index" json:"mac_address"`
	Brand                   string     `json:"brand"`
	Model                   string     `json:"model"`
	FirmwareVersion         string     `json:"firmware_version"`
	IPAddress               string     `json:"ip_address"`
	SubnetMask              string     `json:"subnet_mask"`
	Gateway                 string     `json:"gateway"`
	Location                string     `json:"location"`
	Latitude                float64    `json:"latitude"`
	Longitude               float64    `json:"longitude"`
	Status                  string     `gorm:"default:'offline'" json:"status"` // online, offline, maintenance
	LastSeen                *time.Time `json:"last_seen,omitempty"`
	CustomerID              *string    `gorm:"type:uuid;index" json:"customer_id,omitempty"`
	ParentDeviceID          *string    `gorm:"type:uuid" json:"parent_device_id,omitempty"`
	InstallationDate        *time.Time `json:"installation_date,omitempty"`
	WarrantyUntil           *time.Time `json:"warranty_until,omitempty"`
	PurchasePrice           float64    `json:"purchase_price"`
	Notes                   string     `gorm:"type:text" json:"notes"`
	MikrotikUsername        string     `json:"mikrotik_username"`
	MikrotikPasswordEncrypted string   `json:"-"` // encrypted
	MikrotikPort            string     `gorm:"default:'8728'" json:"mikrotik_port"`
	MikrotikAPIEnabled      bool       `gorm:"default:false" json:"mikrotik_api_enabled"`
	IsDefaultMikrotik       bool       `gorm:"default:false" json:"is_default_mikrotik"`
	ConnectionStatus        string     `gorm:"default:'disconnected'" json:"connection_status"` // connected, disconnected, error
	LastConnectedAt         *time.Time `json:"last_connected_at,omitempty"`
	CreatedAt               time.Time  `json:"created_at"`
	UpdatedAt               time.Time  `json:"updated_at"`
	Tenant                  *Tenant    `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Customer                *Customer  `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	ParentDevice            *Device    `gorm:"foreignKey:ParentDeviceID" json:"parent_device,omitempty"`
}

func (d *Device) BeforeCreate(tx *gorm.DB) error {
	if d.ID == "" {
		d.ID = uuid.New().String()
	}
	return nil
}

const (
	DeviceTypeRouter      = "router"
	DeviceTypeONU         = "onu"
	DeviceTypeSwitch      = "switch"
	DeviceTypeAccessPoint = "access_point"

	DeviceStatusOnline      = "online"
	DeviceStatusOffline     = "offline"
	DeviceStatusMaintenance = "maintenance"

	ConnectionStatusConnected    = "connected"
	ConnectionStatusDisconnected = "disconnected"
	ConnectionStatusError        = "error"
)

type MikroTikRouter struct {
	ID        string    `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID  string    `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Name      string    `gorm:"not null" json:"name"`
	Host      string    `gorm:"not null" json:"host"`
	Port      int       `gorm:"default:8728" json:"port"`
	Username  string    `gorm:"not null" json:"username"`
	Password  string    `gorm:"not null" json:"-"` // encrypted
	Location  string    `json:"location"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Tenant    *Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

func (m *MikroTikRouter) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	return nil
}
