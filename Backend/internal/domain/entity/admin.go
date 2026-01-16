package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AdminUser represents a super admin user for the SaaS platform
type AdminUser struct {
	ID        string     `gorm:"primaryKey;type:uuid" json:"id"`
	Name      string     `gorm:"not null" json:"name"`
	Email     string     `gorm:"uniqueIndex;not null" json:"email"`
	Password  string     `gorm:"not null" json:"-"`
	Role      string     `gorm:"not null;default:'admin'" json:"role"` // super_admin, admin, support
	AvatarURL *string    `gorm:"type:varchar(500)" json:"avatar_url,omitempty"`
	IsActive  bool       `gorm:"default:true" json:"is_active"`
	LastLogin *time.Time `json:"last_login,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (a *AdminUser) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}

const (
	AdminRoleSuperAdmin = "super_admin"
	AdminRoleAdmin      = "admin"
	AdminRoleSupport    = "support"
)

// AdminAuditLog represents audit log for admin actions
type TenantDetail struct {
	Tenant
	Slug           string  `json:"slug"`
	Phone          string  `json:"phone"`
	Address        string  `json:"address"`
	LogoURL        string  `json:"logo_url,omitempty"`
	Status         string  `json:"status"` // active, suspended, trial, expired
	PlanID         string  `json:"plan_id"`
	PlanName       string  `json:"plan_name"`
	CustomerCount  int     `json:"customer_count"`
	MonthlyRevenue float64 `json:"monthly_revenue"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`
}

// AdminAuditLog represents audit log for admin actions
type AdminAuditLog struct {
	ID           string    `gorm:"primaryKey;type:uuid" json:"id"`
	AdminID      string    `gorm:"type:uuid;not null;index" json:"admin_id"`
	AdminName    string    `gorm:"not null" json:"admin_name"`
	Action       string    `gorm:"not null" json:"action"` // CREATE, UPDATE, DELETE, SUSPEND, ACTIVATE
	ResourceType string    `gorm:"not null" json:"resource_type"`
	ResourceID   string    `gorm:"not null" json:"resource_id"`
	Details      string    `gorm:"type:text" json:"details"`
	IPAddress    string    `json:"ip_address"`
	CreatedAt    time.Time `json:"created_at"`
}

func (a *AdminAuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}

// AdminSupportTicket represents a support ticket from tenant to admin
type AdminSupportTicket struct {
	ID          string                `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID    string                `gorm:"type:uuid;not null;index" json:"tenant_id"`
	TenantName  string                `gorm:"-" json:"tenant_name,omitempty"`
	UserID      *string               `gorm:"type:uuid" json:"user_id,omitempty"`
	Subject     string                `gorm:"not null" json:"subject"`
	Description string                `gorm:"type:text;not null" json:"description"`
	Category    string                `gorm:"default:'general'" json:"category"`
	Status      string                `gorm:"not null;default:'open'" json:"status"`
	Priority    string                `gorm:"not null;default:'medium'" json:"priority"`
	AssignedTo  *string               `gorm:"type:uuid" json:"assigned_to,omitempty"`
	ResolvedAt  *time.Time            `json:"resolved_at,omitempty"`
	ClosedAt    *time.Time            `json:"closed_at,omitempty"`
	CreatedAt   time.Time             `json:"created_at"`
	UpdatedAt   time.Time             `json:"updated_at"`
	Tenant      *Tenant               `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	User        *User                 `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Assignee    *AdminUser            `gorm:"foreignKey:AssignedTo" json:"assignee,omitempty"`
	Replies     []SupportTicketReply  `gorm:"foreignKey:TicketID" json:"replies,omitempty"`
	ReplyCount  int64                 `gorm:"-" json:"reply_count"`
}

func (s *AdminSupportTicket) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

// TableName specifies the table name for AdminSupportTicket
func (AdminSupportTicket) TableName() string {
	return "support_tickets"
}

// SupportTicketReply represents a reply to a support ticket
type SupportTicketReply struct {
	ID        string    `gorm:"primaryKey;type:uuid" json:"id"`
	TicketID  string    `gorm:"type:uuid;not null;index" json:"ticket_id"`
	UserID    *string   `gorm:"type:uuid" json:"user_id,omitempty"`
	AdminID   *string   `gorm:"type:uuid" json:"admin_id,omitempty"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	IsAdmin   bool      `gorm:"default:false" json:"is_admin"`
	CreatedAt time.Time `json:"created_at"`
}

func (r *SupportTicketReply) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return nil
}

// TableName specifies the table name for SupportTicketReply
func (SupportTicketReply) TableName() string {
	return "support_ticket_replies"
}
