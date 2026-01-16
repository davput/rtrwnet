package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Payment struct {
	ID            string     `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID      string     `gorm:"type:uuid;not null;index" json:"tenant_id"`
	CustomerID    string     `gorm:"type:uuid;not null;index" json:"customer_id"`
	Amount        float64    `gorm:"not null" json:"amount"`
	PaymentDate   *time.Time `json:"payment_date,omitempty"`
	DueDate       time.Time  `gorm:"not null" json:"due_date"`
	Status        string     `gorm:"not null;default:'pending'" json:"status"` // pending, paid, overdue
	PaymentMethod string     `json:"payment_method"`                           // transfer, cash, e-wallet
	Notes         string     `gorm:"type:text" json:"notes"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	Tenant        *Tenant    `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Customer      *Customer  `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
}

func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}

const (
	PaymentStatusPending = "pending"
	PaymentStatusPaid    = "paid"
	PaymentStatusOverdue = "overdue"
)
