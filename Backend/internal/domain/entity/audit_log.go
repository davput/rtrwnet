package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditLog struct {
	ID         string    `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID   string    `gorm:"type:uuid;not null;index" json:"tenant_id"`
	UserID     string    `gorm:"type:uuid;not null;index" json:"user_id"`
	Action     string    `gorm:"not null" json:"action"` // create, update, delete
	EntityType string    `gorm:"not null;index" json:"entity_type"` // customer, payment, device, etc
	EntityID   string    `gorm:"not null" json:"entity_id"`
	Changes    string    `gorm:"type:jsonb" json:"changes"` // JSON object
	IPAddress  string    `json:"ip_address"`
	Timestamp  time.Time `gorm:"not null;index" json:"timestamp"`
	Tenant     *Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	User       *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	if a.Timestamp.IsZero() {
		a.Timestamp = time.Now()
	}
	return nil
}

const (
	AuditActionCreate = "create"
	AuditActionUpdate = "update"
	AuditActionDelete = "delete"
)
