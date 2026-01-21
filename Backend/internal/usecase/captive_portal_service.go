package usecase

import (
	"context"
	"fmt"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"golang.org/x/crypto/bcrypt"
)

// CaptivePortalService defines the interface for captive portal business logic
type CaptivePortalService interface {
	GetPortalSettings(ctx context.Context, tenantID string) (*entity.CaptivePortalSettings, error)
	UpdatePortalSettings(ctx context.Context, tenantID string, req *UpdatePortalSettingsRequest) error
	AuthenticateUser(ctx context.Context, nasIP, username, password, macAddress string) (*HotspotAuthResponse, error)
}

type captivePortalService struct {
	portalRepo  repository.CaptivePortalRepository
	voucherRepo repository.HotspotVoucherRepository
	packageRepo repository.HotspotPackageRepository
}

// NewCaptivePortalService creates a new instance of captive portal service
func NewCaptivePortalService(
	portalRepo repository.CaptivePortalRepository,
	voucherRepo repository.HotspotVoucherRepository,
	packageRepo repository.HotspotPackageRepository,
) CaptivePortalService {
	return &captivePortalService{
		portalRepo:  portalRepo,
		voucherRepo: voucherRepo,
		packageRepo: packageRepo,
	}
}

// UpdatePortalSettingsRequest represents the request to update portal settings
type UpdatePortalSettingsRequest struct {
	LogoURL         string `json:"logo_url"`
	PromotionalText string `json:"promotional_text"`
	RedirectURL     string `json:"redirect_url"`
	PrimaryColor    string `json:"primary_color"`
	SecondaryColor  string `json:"secondary_color"`
}

// HotspotAuthResponse represents the authentication response
type HotspotAuthResponse struct {
	Success     bool   `json:"success"`
	Message     string `json:"message"`
	RedirectURL string `json:"redirect_url,omitempty"`
	Username    string `json:"username,omitempty"`
}

func (s *captivePortalService) GetPortalSettings(ctx context.Context, tenantID string) (*entity.CaptivePortalSettings, error) {
	settings, err := s.portalRepo.GetSettings(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get portal settings: %w", err)
	}
	return settings, nil
}

func (s *captivePortalService) UpdatePortalSettings(ctx context.Context, tenantID string, req *UpdatePortalSettingsRequest) error {
	settings := &entity.CaptivePortalSettings{
		TenantID:        tenantID,
		LogoURL:         req.LogoURL,
		PromotionalText: req.PromotionalText,
		RedirectURL:     req.RedirectURL,
		PrimaryColor:    req.PrimaryColor,
		SecondaryColor:  req.SecondaryColor,
	}

	if err := s.portalRepo.UpsertSettings(ctx, settings); err != nil {
		return fmt.Errorf("failed to update portal settings: %w", err)
	}

	return nil
}

func (s *captivePortalService) AuthenticateUser(ctx context.Context, nasIP, username, password, macAddress string) (*HotspotAuthResponse, error) {
	// TODO: Get tenant ID from NAS IP
	// For now, we'll search across all tenants
	voucher, err := s.voucherRepo.FindByCode(ctx, "", username)
	if err != nil {
		return &HotspotAuthResponse{
			Success: false,
			Message: "Invalid voucher code",
		}, nil
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(voucher.VoucherPassword), []byte(password)); err != nil {
		return &HotspotAuthResponse{
			Success: false,
			Message: "Invalid password",
		}, nil
	}

	// Check voucher status
	if voucher.Status == entity.VoucherStatusExpired {
		return &HotspotAuthResponse{
			Success: false,
			Message: "Voucher has expired",
		}, nil
	}

	if voucher.IsExpired() {
		return &HotspotAuthResponse{
			Success: false,
			Message: "Voucher time has expired",
		}, nil
	}

	// Load package
	pkg, err := s.packageRepo.FindByID(ctx, voucher.PackageID.String())
	if err != nil || pkg == nil {
		return &HotspotAuthResponse{
			Success: false,
			Message: "Package not found",
		}, nil
	}

	// Check MAC binding
	if pkg.MACBinding && voucher.DeviceMAC != "" && voucher.DeviceMAC != macAddress {
		return &HotspotAuthResponse{
			Success: false,
			Message: "Device not authorized (MAC binding)",
		}, nil
	}

	// Get portal settings for redirect URL
	settings, err := s.portalRepo.GetSettings(ctx, voucher.TenantID.String())
	if err != nil {
		settings = &entity.CaptivePortalSettings{
			TenantID:       voucher.TenantID.String(),
			PrimaryColor:   "#3B82F6",
			SecondaryColor: "#10B981",
		}
	}

	redirectURL := settings.RedirectURL
	if redirectURL == "" {
		redirectURL = "http://www.google.com"
	}

	return &HotspotAuthResponse{
		Success:     true,
		Message:     "Authentication successful",
		RedirectURL: redirectURL,
		Username:    username,
	}, nil
}
