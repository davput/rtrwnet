package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CaptivePortalSettings struct {
	ID              string    `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID        string    `gorm:"type:uuid;not null;uniqueIndex" json:"tenant_id"`
	LogoURL         string    `gorm:"type:text" json:"logo_url,omitempty"`
	PromotionalText string    `gorm:"type:text" json:"promotional_text,omitempty"`
	RedirectURL     string    `gorm:"type:text" json:"redirect_url,omitempty"`
	PrimaryColor    string    `gorm:"size:7;default:'#3B82F6'" json:"primary_color"`
	SecondaryColor  string    `gorm:"size:7;default:'#10B981'" json:"secondary_color"`
	UpdatedAt       time.Time `json:"updated_at"`
	
	// Relations
	Tenant *Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

func (c *CaptivePortalSettings) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	if c.PrimaryColor == "" {
		c.PrimaryColor = "#3B82F6"
	}
	if c.SecondaryColor == "" {
		c.SecondaryColor = "#10B981"
	}
	return nil
}

// TableName specifies the table name for GORM
func (CaptivePortalSettings) TableName() string {
	return "captive_portal_settings"
}
