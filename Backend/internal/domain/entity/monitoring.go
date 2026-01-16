package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MonitoringData struct {
	ID            string    `gorm:"primaryKey;type:uuid" json:"id"`
	TenantID      string    `gorm:"type:uuid;not null;index" json:"tenant_id"`
	CustomerID    string    `gorm:"type:uuid;not null;index" json:"customer_id"`
	DownloadSpeed float64   `json:"download_speed"` // in Mbps
	UploadSpeed   float64   `json:"upload_speed"`   // in Mbps
	Latency       int       `json:"latency"`        // in ms
	PacketLoss    float64   `json:"packet_loss"`    // percentage
	DataUsage     int64     `json:"data_usage"`     // in bytes
	Timestamp     time.Time `gorm:"not null;index" json:"timestamp"`
	Tenant        *Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Customer      *Customer `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
}

func (m *MonitoringData) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	if m.Timestamp.IsZero() {
		m.Timestamp = time.Now()
	}
	return nil
}
