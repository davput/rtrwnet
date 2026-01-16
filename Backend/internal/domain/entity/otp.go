package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EmailOTP struct {
	ID        string    `gorm:"primaryKey;type:uuid" json:"id"`
	Email     string    `gorm:"not null;index" json:"email"`
	OTP       string    `gorm:"not null" json:"-"`
	Purpose   string    `gorm:"not null" json:"purpose"` // registration, reset_password, etc.
	IsUsed    bool      `gorm:"default:false" json:"is_used"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

func (e *EmailOTP) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" {
		e.ID = uuid.New().String()
	}
	return nil
}

func (e *EmailOTP) IsExpired() bool {
	return time.Now().After(e.ExpiresAt)
}

const (
	OTPPurposeRegistration  = "registration"
	OTPPurposeResetPassword = "reset_password"
	OTPPurposeEmailChange   = "email_change"
)
