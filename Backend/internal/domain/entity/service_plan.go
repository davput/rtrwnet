package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ServicePlan struct {
	ID            string    `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID      string    `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Name          string    `gorm:"not null" json:"name"`
	Description   string    `gorm:"type:text" json:"description"`
	SpeedDownload int       `gorm:"not null" json:"speed_download"` // in Mbps
	SpeedUpload   int       `gorm:"not null" json:"speed_upload"`   // in Mbps
	Price         float64   `gorm:"not null" json:"price"`
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	Features      string    `gorm:"type:jsonb" json:"features"` // JSON array
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	Tenant        *Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

func (s *ServicePlan) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	// Set default empty JSON object if features is empty
	if s.Features == "" {
		s.Features = "{}"
	}
	return nil
}

type ServicePlanAdvancedSettings struct {
	ID               string       `gorm:"primaryKey;type:uuid" json:"id"`
	ServicePlanID    string       `gorm:"type:uuid;uniqueIndex;not null" json:"service_plan_id"`
	BurstEnabled     bool         `gorm:"default:false" json:"burst_enabled"`
	BurstLimit       int          `json:"burst_limit"`       // in Mbps
	BurstThreshold   int          `json:"burst_threshold"`   // in Mbps
	BurstTime        int          `json:"burst_time"`        // in seconds
	Priority         int          `gorm:"default:8" json:"priority"`
	MaxConnections   int          `json:"max_connections"`
	AddressPool      string       `json:"address_pool"`
	DNSServers       string       `gorm:"type:jsonb" json:"dns_servers"` // JSON array
	TransparentProxy bool         `gorm:"default:false" json:"transparent_proxy"`
	QueueType        string       `gorm:"default:'pcq'" json:"queue_type"`
	ParentQueue      string       `json:"parent_queue"`
	ServicePlan      *ServicePlan `gorm:"foreignKey:ServicePlanID" json:"service_plan,omitempty"`
}

func (s *ServicePlanAdvancedSettings) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	// Set default empty JSON array if dns_servers is empty
	if s.DNSServers == "" {
		s.DNSServers = "[]"
	}
	return nil
}
