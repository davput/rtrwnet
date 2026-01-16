package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SpeedBoost struct {
	ID              string       `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID        string       `gorm:"type:uuid;not null;index" json:"tenant_id"`
	CustomerID      string       `gorm:"type:uuid;not null;index" json:"customer_id"`
	CurrentPlanID   string       `gorm:"type:uuid;not null" json:"current_plan_id"`
	BoostPlanID     string       `gorm:"type:uuid;not null" json:"boost_plan_id"`
	DurationDays    int          `gorm:"not null" json:"duration_days"`
	Price           float64      `gorm:"not null" json:"price"`
	Status          string       `gorm:"not null;default:'pending'" json:"status"` // pending, approved, rejected, active, expired
	RequestDate     time.Time    `gorm:"not null" json:"request_date"`
	StartDate       *time.Time   `json:"start_date,omitempty"`
	EndDate         *time.Time   `json:"end_date,omitempty"`
	Notes           string       `gorm:"type:text" json:"notes"`
	RejectionReason string       `gorm:"type:text" json:"rejection_reason"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
	Tenant          *Tenant      `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Customer        *Customer    `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	CurrentPlan     *ServicePlan `gorm:"foreignKey:CurrentPlanID" json:"current_plan,omitempty"`
	BoostPlan       *ServicePlan `gorm:"foreignKey:BoostPlanID" json:"boost_plan,omitempty"`
}

func (s *SpeedBoost) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

const (
	SpeedBoostStatusPending  = "pending"
	SpeedBoostStatusApproved = "approved"
	SpeedBoostStatusRejected = "rejected"
	SpeedBoostStatusActive   = "active"
	SpeedBoostStatusExpired  = "expired"
)
