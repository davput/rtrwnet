package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Service type constants
const (
	ServiceTypeDHCP   = "dhcp"
	ServiceTypePPPoE  = "pppoe"
	ServiceTypeStatic = "static"
)

// Customer status constants
const (
	CustomerStatusPendingActivation = "pending_activation"
	CustomerStatusActive            = "active"
	CustomerStatusSuspended         = "suspended"
	CustomerStatusInactive          = "inactive"
	CustomerStatusTerminated        = "terminated"
)

type Customer struct {
	ID               string     `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID         string     `gorm:"type:uuid;not null;index" json:"tenant_id"`
	CustomerCode     string     `gorm:"uniqueIndex:idx_tenant_code;not null" json:"customer_code"`
	Name             string     `gorm:"not null" json:"name"`
	Email            string     `gorm:"index" json:"email"`
	Phone            string     `gorm:"not null" json:"phone"`
	Address          string     `json:"address"`
	Latitude         float64    `json:"latitude"`
	Longitude        float64    `json:"longitude"`
	ServicePlanID    string     `gorm:"type:uuid;not null" json:"service_plan_id"`
	ServiceType string `gorm:"column:service_type;not null;default:'dhcp'" json:"service_type"` // dhcp, pppoe, static

	// PPPoE settings
	PPPoEUsername string `gorm:"column:pppoe_username" json:"pppoe_username,omitempty"`
	PPPoEPassword string `gorm:"column:pppoe_password" json:"pppoe_password,omitempty"`

	// Static IP settings
	StaticIP      string `gorm:"column:static_ip" json:"static_ip,omitempty"`
	StaticGateway string `gorm:"column:static_gateway" json:"static_gateway,omitempty"`
	StaticDNS     string `gorm:"column:static_dns" json:"static_dns,omitempty"`

	// Connection status
	IsOnline  bool       `gorm:"column:is_online;default:false" json:"is_online"`
	IPAddress string     `gorm:"column:ip_address" json:"ip_address,omitempty"`
	LastSeen  *time.Time `gorm:"column:last_seen" json:"last_seen,omitempty"`
	
	Status           string     `gorm:"not null;default:'pending_activation'" json:"status"`
	InstallationDate time.Time  `json:"installation_date"`
	DueDate          int        `gorm:"not null;default:15" json:"due_date"` // day of month
	MonthlyFee       float64    `gorm:"not null" json:"monthly_fee"`
	Notes            string     `gorm:"type:text" json:"notes"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	DeletedAt        *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	Tenant           *Tenant    `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	ServicePlan      *ServicePlan `gorm:"foreignKey:ServicePlanID" json:"service_plan,omitempty"`
}

func (c *Customer) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	if c.ServiceType == "" {
		c.ServiceType = ServiceTypeDHCP
	}
	if c.Status == "" {
		c.Status = CustomerStatusPendingActivation
	}
	return nil
}
