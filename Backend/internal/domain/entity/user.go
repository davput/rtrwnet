package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID        string    `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID  string    `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Email     string    `gorm:"uniqueIndex:idx_tenant_email;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	Name      string    `gorm:"not null" json:"name"`
	Role      string    `gorm:"not null" json:"role"` // admin, operator, technician, viewer
	AvatarURL *string   `gorm:"type:varchar(500)" json:"avatar_url,omitempty"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Tenant    *Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

const (
	RoleAdmin      = "admin"
	RoleOperator   = "operator"
	RoleTechnician = "technician"
	RoleViewer     = "viewer"
)
