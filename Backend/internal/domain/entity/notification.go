package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Notification represents a notification for a user or tenant
type Notification struct {
	ID        string     `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID  string     `gorm:"type:uuid;index" json:"tenant_id"`
	UserID    *string    `gorm:"type:uuid;index" json:"user_id,omitempty"`
	Type      string     `gorm:"not null" json:"type"`
	Title     string     `gorm:"not null" json:"title"`
	Message   string     `gorm:"type:text;not null" json:"message"`
	Data      string     `gorm:"type:jsonb" json:"data,omitempty"`
	IsRead    bool       `gorm:"default:false" json:"is_read"`
	ReadAt    *time.Time `json:"read_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	return nil
}

// Notification types
const (
	NotificationTypeInfo       = "info"
	NotificationTypeSuccess    = "success"
	NotificationTypeWarning    = "warning"
	NotificationTypeError      = "error"
	NotificationTypePayment    = "payment"
	NotificationTypeTicket     = "ticket"
	NotificationTypeSystem     = "system"
	NotificationTypeSubscription = "subscription"
)

// AdminNotification represents a notification for admin users
type AdminNotification struct {
	ID        string     `gorm:"primaryKey;type:uuid" json:"id"`
	AdminID   *string    `gorm:"type:uuid;index" json:"admin_id,omitempty"`
	Type      string     `gorm:"not null" json:"type"`
	Title     string     `gorm:"not null" json:"title"`
	Message   string     `gorm:"type:text;not null" json:"message"`
	Data      string     `gorm:"type:jsonb" json:"data,omitempty"`
	IsRead    bool       `gorm:"default:false" json:"is_read"`
	ReadAt    *time.Time `json:"read_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

func (n *AdminNotification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	return nil
}
