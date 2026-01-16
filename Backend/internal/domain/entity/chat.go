package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ChatRoom represents a chat conversation between user and admin
type ChatRoom struct {
	ID          string     `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID    string     `gorm:"type:uuid;not null;index" json:"tenant_id"`
	UserID      string     `gorm:"type:uuid;not null" json:"user_id"`
	UserName    string     `gorm:"not null" json:"user_name"`
	UserEmail   string     `gorm:"not null" json:"user_email"`
	AdminID     *string    `gorm:"type:uuid" json:"admin_id,omitempty"`
	AdminName   *string    `json:"admin_name,omitempty"`
	Status      string     `gorm:"not null;default:'waiting'" json:"status"` // waiting, active, closed
	Subject     string     `json:"subject,omitempty"`
	LastMessage *string    `gorm:"column:last_message" json:"last_message,omitempty"`
	LastMsgAt   *time.Time `gorm:"column:last_message_at" json:"last_message_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	ClosedAt    *time.Time `json:"closed_at,omitempty"`
}

func (c *ChatRoom) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return nil
}

func (ChatRoom) TableName() string {
	return "chat_rooms"
}

// ChatMessage represents a single message in a chat room
type ChatMessage struct {
	ID         string    `gorm:"primaryKey;type:uuid" json:"id"`
	RoomID     string    `gorm:"type:uuid;not null;index" json:"room_id"`
	SenderID   string    `gorm:"type:uuid;not null" json:"sender_id"`
	SenderName string    `gorm:"not null" json:"sender_name"`
	SenderType string    `gorm:"not null" json:"sender_type"` // user, admin
	Message    string    `gorm:"type:text;not null" json:"message"`
	IsRead     bool      `gorm:"default:false" json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
}

func (m *ChatMessage) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	return nil
}

func (ChatMessage) TableName() string {
	return "chat_messages"
}

// Chat status constants
const (
	ChatStatusWaiting = "waiting"
	ChatStatusActive  = "active"
	ChatStatusClosed  = "closed"
)
