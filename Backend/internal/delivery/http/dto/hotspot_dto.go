package dto

import "time"

// Hotspot Package DTOs

type CreatePackageRequest struct {
	Name          string `json:"name" validate:"required"`
	Description   string `json:"description"`
	DurationType  string `json:"duration_type" validate:"required,oneof=hours days"`
	Duration      int    `json:"duration" validate:"required,gt=0"`
	Price         int    `json:"price" validate:"gte=0"`
	SpeedUpload   int    `json:"speed_upload" validate:"required,gt=0"`
	SpeedDownload int    `json:"speed_download" validate:"required,gt=0"`
	DeviceLimit   int    `json:"device_limit" validate:"required,gte=1,lte=2"`
	MACBinding    bool   `json:"mac_binding"`
	SessionLimit  int    `json:"session_limit" validate:"required,gt=0"`
}

type UpdatePackageRequest struct {
	Name          string `json:"name"`
	Description   string `json:"description"`
	Price         int    `json:"price" validate:"gte=0"`
	SpeedUpload   int    `json:"speed_upload" validate:"gt=0"`
	SpeedDownload int    `json:"speed_download" validate:"gt=0"`
	DeviceLimit   int    `json:"device_limit" validate:"gte=1,lte=2"`
	MACBinding    bool   `json:"mac_binding"`
	SessionLimit  int    `json:"session_limit" validate:"gt=0"`
	IsActive      *bool  `json:"is_active"`
}

type PackageResponse struct {
	ID            string    `json:"id"`
	TenantID      string    `json:"tenant_id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	DurationType  string    `json:"duration_type"`
	Duration      int       `json:"duration"`
	Price         int       `json:"price"`
	SpeedUpload   int       `json:"speed_upload"`
	SpeedDownload int       `json:"speed_download"`
	DeviceLimit   int       `json:"device_limit"`
	MACBinding    bool      `json:"mac_binding"`
	SessionLimit  int       `json:"session_limit"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Hotspot Voucher DTOs

type GenerateVouchersRequest struct {
	PackageID string `json:"package_id" validate:"required"`
	Quantity  int    `json:"quantity" validate:"required,gt=0,lte=100"`
	Prefix    string `json:"prefix"`
}

type VoucherResponse struct {
	ID              string     `json:"id"`
	TenantID        string     `json:"tenant_id"`
	PackageID       string     `json:"package_id"`
	PackageName     string     `json:"package_name,omitempty"`
	VoucherCode     string     `json:"voucher_code"`
	VoucherPassword string     `json:"voucher_password,omitempty"` // Only shown on generation
	Status          string     `json:"status"`
	ActivatedAt     *time.Time `json:"activated_at,omitempty"`
	ExpiresAt       *time.Time `json:"expires_at,omitempty"`
	DeviceMAC       string     `json:"device_mac,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type VoucherListRequest struct {
	Status    string `json:"status" form:"status"`
	PackageID string `json:"package_id" form:"package_id"`
	StartDate string `json:"start_date" form:"start_date"`
	EndDate   string `json:"end_date" form:"end_date"`
	Page      int    `json:"page" form:"page"`
	PerPage   int    `json:"per_page" form:"per_page"`
}

type VoucherStatsResponse struct {
	TotalVouchers   int                    `json:"total_vouchers"`
	UnusedVouchers  int                    `json:"unused_vouchers"`
	ActiveVouchers  int                    `json:"active_vouchers"`
	ExpiredVouchers int                    `json:"expired_vouchers"`
	UsedVouchers    int                    `json:"used_vouchers"`
	PackageStats    []PackageVoucherStats  `json:"package_stats"`
	TotalRevenue    int                    `json:"total_revenue"`
}

type PackageVoucherStats struct {
	PackageID   string `json:"package_id"`
	PackageName string `json:"package_name"`
	Count       int    `json:"count"`
	Revenue     int    `json:"revenue"`
}

// Captive Portal DTOs

type UpdatePortalSettingsRequest struct {
	LogoURL         string `json:"logo_url"`
	PromotionalText string `json:"promotional_text"`
	RedirectURL     string `json:"redirect_url"`
	PrimaryColor    string `json:"primary_color" validate:"omitempty,len=7"`
	SecondaryColor  string `json:"secondary_color" validate:"omitempty,len=7"`
}

type PortalSettingsResponse struct {
	ID              string    `json:"id"`
	TenantID        string    `json:"tenant_id"`
	LogoURL         string    `json:"logo_url"`
	PromotionalText string    `json:"promotional_text"`
	RedirectURL     string    `json:"redirect_url"`
	PrimaryColor    string    `json:"primary_color"`
	SecondaryColor  string    `json:"secondary_color"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type AuthenticateRequest struct {
	Username   string `json:"username" validate:"required"`
	Password   string `json:"password" validate:"required"`
	MACAddress string `json:"mac_address"`
	NASIP      string `json:"nas_ip"`
}

type AuthResponse struct {
	Success     bool   `json:"success"`
	Message     string `json:"message"`
	RedirectURL string `json:"redirect_url,omitempty"`
	Username    string `json:"username,omitempty"`
}

// Session Monitoring DTOs

type SessionResponse struct {
	SessionID     string `json:"session_id"`
	Username      string `json:"username"`
	IPAddress     string `json:"ip_address"`
	MACAddress    string `json:"mac_address"`
	NASIPAddress  string `json:"nas_ip_address"`
	StartTime     string `json:"start_time"`
	Duration      string `json:"duration"` // formatted as HH:MM:SS
	UploadBytes   int64  `json:"upload_bytes"`
	DownloadBytes int64  `json:"download_bytes"`
	PackageName   string `json:"package_name"`
	Status        string `json:"status"`
}

type DisconnectRequest struct {
	SessionID string `json:"session_id" validate:"required"`
}
