package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubscriptionPlan struct {
	ID           string    `gorm:"primaryKey;type:uuid" json:"id"`
	Name         string    `gorm:"not null" json:"name"`
	Slug         string    `gorm:"uniqueIndex;not null" json:"slug"`
	Description  string    `gorm:"type:text" json:"description"`
	Price        float64   `gorm:"not null" json:"price"`
	BillingCycle string    `gorm:"not null" json:"billing_cycle"` // monthly, yearly
	MaxCustomers int       `json:"max_customers"`                 // -1 = unlimited (legacy)
	MaxUsers     int       `json:"max_users"`                     // -1 = unlimited (legacy)
	Features     string    `gorm:"type:jsonb" json:"features"`    // JSON object (legacy)
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	IsPublic     bool      `gorm:"default:true" json:"is_public"` // visible in public pricing
	IsTrial      bool      `gorm:"default:false" json:"is_trial"` // trial plan
	SortOrder    int       `gorm:"default:0" json:"sort_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// New detailed limits and features (stored as JSONB)
	Limits       string `gorm:"type:jsonb" json:"limits"`        // PlanLimits as JSON
	PlanFeatures string `gorm:"type:jsonb" json:"plan_features"` // PlanFeatures as JSON
	TrialConfig  string `gorm:"type:jsonb" json:"trial_config"`  // TrialConfig as JSON
}

func (s *SubscriptionPlan) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

type TenantSubscription struct {
	ID              string            `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID        string            `gorm:"type:uuid;not null;index" json:"tenant_id"`
	PlanID          string            `gorm:"type:uuid;not null" json:"plan_id"`
	Status          string            `gorm:"not null;default:'pending'" json:"status"` // pending, active, suspended, cancelled, expired
	StartDate       *time.Time        `json:"start_date,omitempty"`
	EndDate         *time.Time        `json:"end_date,omitempty"`
	NextBillingDate *time.Time        `json:"next_billing_date,omitempty"`
	PaymentMethod   string            `json:"payment_method"`
	AutoRenew       bool              `gorm:"default:true" json:"auto_renew"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
	Tenant          *Tenant           `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Plan            *SubscriptionPlan `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
}

func (t *TenantSubscription) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return nil
}

const (
	SubscriptionStatusPending   = "pending"
	SubscriptionStatusActive    = "active"
	SubscriptionStatusTrial     = "trial"
	SubscriptionStatusSuspended = "suspended"
	SubscriptionStatusCancelled = "cancelled"
	SubscriptionStatusExpired   = "expired"
)

type PaymentTransaction struct {
	ID                   string              `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID             string              `gorm:"type:uuid;not null;index" json:"tenant_id"`
	SubscriptionID       *string             `gorm:"type:uuid" json:"subscription_id,omitempty"`
	PlanID               *string             `gorm:"type:uuid" json:"plan_id,omitempty"` // Plan to upgrade to after payment
	OrderID              string              `gorm:"uniqueIndex;not null" json:"order_id"`
	Amount               float64             `gorm:"not null" json:"amount"`
	Status               string              `gorm:"not null;default:'pending'" json:"status"` // pending, paid, failed, refunded, expired
	PaymentMethod        string              `json:"payment_method"`
	PaymentGateway       string              `json:"payment_gateway"` // midtrans, xendit, stripe, manual
	GatewayTransactionID string              `json:"gateway_transaction_id"`
	GatewayResponse      string              `gorm:"type:jsonb" json:"gateway_response"`
	PaidAt               *time.Time          `json:"paid_at,omitempty"`
	ExpiredAt            *time.Time          `json:"expired_at,omitempty"`
	CreatedAt            time.Time           `json:"created_at"`
	UpdatedAt            time.Time           `json:"updated_at"`
	Tenant               *Tenant             `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Subscription         *TenantSubscription `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
}

func (p *PaymentTransaction) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}

const (
	TransactionStatusPending   = "pending"
	TransactionStatusPaid      = "paid"
	TransactionStatusFailed    = "failed"
	TransactionStatusRefunded  = "refunded"
	TransactionStatusExpired   = "expired"
	TransactionStatusCancelled = "cancelled"
)
