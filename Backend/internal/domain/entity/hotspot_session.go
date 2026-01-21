package entity

import (
	"fmt"
	"time"
)

// HotspotSession represents an active hotspot session (view from RadiusAccounting)
type HotspotSession struct {
	SessionID     string    `json:"session_id"`
	Username      string    `json:"username"`
	IPAddress     string    `json:"ip_address"`
	MACAddress    string    `json:"mac_address"`
	NASIPAddress  string    `json:"nas_ip_address"`
	StartTime     time.Time `json:"start_time"`
	Duration      int       `json:"duration"` // seconds
	UploadBytes   int64     `json:"upload_bytes"`
	DownloadBytes int64     `json:"download_bytes"`
	PackageName   string    `json:"package_name,omitempty"`
	Status        string    `json:"status"` // "active", "expired", "disconnected"
}

// SessionStatus constants
const (
	SessionStatusActive       = "active"
	SessionStatusExpired      = "expired"
	SessionStatusDisconnected = "disconnected"
)

// GetDurationFormatted returns duration in HH:MM:SS format
func (s *HotspotSession) GetDurationFormatted() string {
	hours := s.Duration / 3600
	minutes := (s.Duration % 3600) / 60
	seconds := s.Duration % 60
	return fmt.Sprintf("%02d:%02d:%02d", hours, minutes, seconds)
}

// GetTotalBytes returns total bytes transferred (upload + download)
func (s *HotspotSession) GetTotalBytes() int64 {
	return s.UploadBytes + s.DownloadBytes
}

// IsActive checks if the session is currently active
func (s *HotspotSession) IsActive() bool {
	return s.Status == SessionStatusActive
}
