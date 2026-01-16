package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OLT - Optical Line Terminal
type OLT struct {
	ID             string    `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID       string    `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Name           string    `gorm:"not null" json:"name"`
	IPAddress      string    `gorm:"not null" json:"ip_address"`
	SNMPCommunity  string    `json:"snmp_community"`
	TelnetUsername string    `json:"telnet_username"`
	TelnetPassword string    `json:"-"` // encrypted
	Location       string    `json:"location"`
	Latitude       float64   `json:"latitude"`
	Longitude      float64   `json:"longitude"`
	Vendor         string    `json:"vendor"`
	Model          string    `json:"model"`
	IsActive       bool      `gorm:"default:true" json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	Tenant         *Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

func (o *OLT) BeforeCreate(tx *gorm.DB) error {
	if o.ID == "" {
		o.ID = uuid.New().String()
	}
	return nil
}

// ODC - Optical Distribution Cabinet
type ODC struct {
	ID        string    `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID  string    `gorm:"type:uuid;not null;index" json:"tenant_id"`
	OLTID     string    `gorm:"type:uuid;not null;index" json:"olt_id"`
	Name      string    `gorm:"not null" json:"name"`
	Location  string    `gorm:"not null" json:"location"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Capacity  int       `gorm:"default:0" json:"capacity"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Tenant    *Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	OLT       *OLT      `gorm:"foreignKey:OLTID" json:"olt,omitempty"`
}

func (o *ODC) BeforeCreate(tx *gorm.DB) error {
	if o.ID == "" {
		o.ID = uuid.New().String()
	}
	return nil
}

// ODP - Optical Distribution Point
type ODP struct {
	ID        string    `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID  string    `gorm:"type:uuid;not null;index" json:"tenant_id"`
	ODCID     string    `gorm:"type:uuid;not null;index" json:"odc_id"`
	Name      string    `gorm:"not null" json:"name"`
	Location  string    `gorm:"not null" json:"location"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Capacity  int       `gorm:"default:0" json:"capacity"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Tenant    *Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	ODC       *ODC      `gorm:"foreignKey:ODCID" json:"odc,omitempty"`
}

func (o *ODP) BeforeCreate(tx *gorm.DB) error {
	if o.ID == "" {
		o.ID = uuid.New().String()
	}
	return nil
}

// InfrastructureItem - Legacy infrastructure tracking
type InfrastructureItem struct {
	ID        string     `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID  string     `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Name      string     `gorm:"not null" json:"name"`
	Type      string     `gorm:"not null" json:"type"` // cable, router, switch, antenna, connector, tools
	Quantity  int        `gorm:"not null" json:"quantity"`
	Unit      string     `gorm:"not null" json:"unit"` // meter, piece, set
	Location  string     `json:"location"`
	Notes     string     `gorm:"type:text" json:"notes"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	Tenant    *Tenant    `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

func (i *InfrastructureItem) BeforeCreate(tx *gorm.DB) error {
	if i.ID == "" {
		i.ID = uuid.New().String()
	}
	return nil
}

const (
	InfrastructureTypeCable     = "cable"
	InfrastructureTypeRouter    = "router"
	InfrastructureTypeSwitch    = "switch"
	InfrastructureTypeAntenna   = "antenna"
	InfrastructureTypeConnector = "connector"
	InfrastructureTypeTools     = "tools"
)
