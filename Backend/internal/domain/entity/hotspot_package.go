package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/pkg/errors"
)

// HotspotPackage represents a hotspot service package with duration and bandwidth limits
type HotspotPackage struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	TenantID       uuid.UUID `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Name           string    `gorm:"type:varchar(100);not null" json:"name"`
	Description    string    `gorm:"type:text" json:"description"`
	DurationType   string    `gorm:"type:varchar(20);not null" json:"duration_type"` // "hours" or "days"
	Duration       int       `gorm:"not null" json:"duration"`                       // jumlah jam/hari
	Price          int       `gorm:"not null;default:0" json:"price"`                // harga dalam rupiah
	SpeedUpload    int       `gorm:"not null" json:"speed_upload"`                   // kbps
	SpeedDownload  int       `gorm:"not null" json:"speed_download"`                 // kbps
	DeviceLimit    int       `gorm:"not null;default:1" json:"device_limit"`         // 1-2 devices
	MACBinding     bool      `gorm:"default:false" json:"mac_binding"`               // enforce MAC address binding
	SessionLimit   int       `gorm:"default:1" json:"session_limit"`                 // concurrent sessions
	IsActive       bool      `gorm:"default:true" json:"is_active"`
	CreatedAt      time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt      time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Relations
	Tenant   *Tenant           `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Vouchers []HotspotVoucher  `gorm:"foreignKey:PackageID" json:"vouchers,omitempty"`
}

// TableName specifies the table name for HotspotPackage
func (HotspotPackage) TableName() string {
	return "hotspot_packages"
}

// Validate validates the hotspot package fields
func (p *HotspotPackage) Validate() error {
	if p.Name == "" {
		return errors.NewValidationError("name is required")
	}
	if p.DurationType != "hours" && p.DurationType != "days" {
		return errors.NewValidationError("duration_type must be 'hours' or 'days'")
	}
	if p.Duration <= 0 {
		return errors.NewValidationError("duration must be greater than 0")
	}
	if p.Price < 0 {
		return errors.NewValidationError("price cannot be negative")
	}
	if p.SpeedUpload <= 0 {
		return errors.NewValidationError("speed_upload must be greater than 0")
	}
	if p.SpeedDownload <= 0 {
		return errors.NewValidationError("speed_download must be greater than 0")
	}
	if p.DeviceLimit < 1 || p.DeviceLimit > 2 {
		return errors.NewValidationError("device_limit must be between 1 and 2")
	}
	if p.SessionLimit <= 0 {
		return errors.NewValidationError("session_limit must be greater than 0")
	}
	return nil
}
