package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Ticket struct {
	ID           string     `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID     string     `gorm:"type:uuid;not null;index" json:"tenant_id"`
	CustomerID   string     `gorm:"type:uuid;not null;index" json:"customer_id"`
	TicketNumber string     `gorm:"uniqueIndex:idx_tenant_ticket;not null" json:"ticket_number"`
	Title        string     `gorm:"not null" json:"title"`
	Description  string     `gorm:"type:text;not null" json:"description"`
	Status       string     `gorm:"not null;default:'open'" json:"status"`       // open, in_progress, resolved, closed
	Priority     string     `gorm:"not null;default:'medium'" json:"priority"`   // low, medium, high, urgent
	AssignedTo   *string    `gorm:"type:uuid" json:"assigned_to,omitempty"`
	ResolvedAt   *time.Time `json:"resolved_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	Tenant       *Tenant    `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Customer     *Customer  `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	AssignedUser *User      `gorm:"foreignKey:AssignedTo" json:"assigned_user,omitempty"`
}

func (t *Ticket) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return nil
}

const (
	TicketStatusOpen       = "open"
	TicketStatusInProgress = "in_progress"
	TicketStatusResolved   = "resolved"
	TicketStatusClosed     = "closed"

	TicketPriorityLow    = "low"
	TicketPriorityMedium = "medium"
	TicketPriorityHigh   = "high"
	TicketPriorityUrgent = "urgent"
)

type TicketActivity struct {
	ID           string    `gorm:"primaryKey;type:uuid" json:"id"`
	TicketID     string    `gorm:"type:uuid;not null;index" json:"ticket_id"`
	ActivityType string    `gorm:"not null" json:"activity_type"` // created, assigned, status_changed, commented, resolved
	Description  string    `gorm:"type:text;not null" json:"description"`
	PerformedBy  string    `gorm:"type:uuid;not null" json:"performed_by"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
	Ticket       *Ticket   `gorm:"foreignKey:TicketID" json:"ticket,omitempty"`
	User         *User     `gorm:"foreignKey:PerformedBy" json:"user,omitempty"`
}

func (t *TicketActivity) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	if t.CreatedAt.IsZero() {
		t.CreatedAt = time.Now()
	}
	return nil
}

const (
	TicketActivityCreated       = "created"
	TicketActivityAssigned      = "assigned"
	TicketActivityStatusChanged = "status_changed"
	TicketActivityCommented     = "commented"
	TicketActivityResolved      = "resolved"
)
