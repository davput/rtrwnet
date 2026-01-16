package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Tenant struct {
	ID                   string    `gorm:"primaryKey;type:uuid" json:"id"`
	Name                 string    `gorm:"not null" json:"name"`
	Email                string    `gorm:"uniqueIndex;not null" json:"email"` // Unique email per tenant
	IsActive             bool      `gorm:"default:true" json:"is_active"`
	OnboardingCompleted  bool      `gorm:"default:false" json:"onboarding_completed"`
	OnboardingStep       int       `gorm:"default:0" json:"onboarding_step"` // Track current step
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

func (t *Tenant) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return nil
}
