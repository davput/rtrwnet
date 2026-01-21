package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/pkg/errors"
)

// HotspotVoucher represents a hotspot access voucher with time-limited credentials
type HotspotVoucher struct {
	ID              uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	TenantID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	PackageID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"package_id"`
	RadiusUserID    *uuid.UUID `gorm:"type:uuid;index" json:"radius_user_id,omitempty"`
	VoucherCode     string     `gorm:"type:varchar(50);not null" json:"voucher_code"`     // username untuk login
	VoucherPassword string     `gorm:"type:varchar(255);not null" json:"voucher_password"` // bcrypt hashed password
	Status          string     `gorm:"type:varchar(20);not null;default:'unused'" json:"status"` // "unused", "active", "expired", "used"
	ActivatedAt     *time.Time `gorm:"type:timestamp" json:"activated_at,omitempty"`
	ExpiresAt       *time.Time `gorm:"type:timestamp;index" json:"expires_at,omitempty"`
	DeviceMAC       string     `gorm:"type:varchar(17)" json:"device_mac,omitempty"`
	CreatedAt       time.Time  `gorm:"not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt       time.Time  `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Relations
	Tenant      *Tenant         `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Package     *HotspotPackage `gorm:"foreignKey:PackageID" json:"package,omitempty"`
	RadiusUser  *RadiusUser     `gorm:"foreignKey:RadiusUserID" json:"radius_user,omitempty"`
}

// TableName specifies the table name for HotspotVoucher
func (HotspotVoucher) TableName() string {
	return "hotspot_vouchers"
}

// VoucherStatus constants
const (
	VoucherStatusUnused  = "unused"
	VoucherStatusActive  = "active"
	VoucherStatusExpired = "expired"
	VoucherStatusUsed    = "used"
)

// IsExpired checks if the voucher has expired
func (v *HotspotVoucher) IsExpired() bool {
	if v.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*v.ExpiresAt)
}

// IsActive checks if the voucher is currently active and not expired
func (v *HotspotVoucher) IsActive() bool {
	return v.Status == VoucherStatusActive && !v.IsExpired()
}

// CanBeActivated checks if the voucher can be activated
func (v *HotspotVoucher) CanBeActivated() bool {
	return v.Status == VoucherStatusUnused
}

// Activate activates the voucher with the given duration
func (v *HotspotVoucher) Activate(duration int, durationType string) {
	now := time.Now()
	v.ActivatedAt = &now
	v.Status = VoucherStatusActive

	// Calculate expiration time
	var expiresAt time.Time
	if durationType == "hours" {
		expiresAt = now.Add(time.Duration(duration) * time.Hour)
	} else if durationType == "days" {
		expiresAt = now.Add(time.Duration(duration) * 24 * time.Hour)
	}
	v.ExpiresAt = &expiresAt
}

// MarkExpired marks the voucher as expired
func (v *HotspotVoucher) MarkExpired() {
	v.Status = VoucherStatusExpired
}

// Validate validates the voucher fields
func (v *HotspotVoucher) Validate() error {
	if v.VoucherCode == "" {
		return errors.NewValidationError("voucher_code is required")
	}
	if v.VoucherPassword == "" {
		return errors.NewValidationError("voucher_password is required")
	}
	if v.Status != VoucherStatusUnused && v.Status != VoucherStatusActive && 
	   v.Status != VoucherStatusExpired && v.Status != VoucherStatusUsed {
		return errors.NewValidationError("invalid voucher status")
	}
	return nil
}
