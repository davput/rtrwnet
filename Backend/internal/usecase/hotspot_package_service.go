package usecase

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
)

// HotspotPackageService defines the interface for hotspot package business logic
type HotspotPackageService interface {
	CreatePackage(ctx context.Context, tenantID string, req *CreatePackageRequest) (*entity.HotspotPackage, error)
	ListPackages(ctx context.Context, tenantID string) ([]*entity.HotspotPackage, error)
	GetPackage(ctx context.Context, tenantID, packageID string) (*entity.HotspotPackage, error)
	UpdatePackage(ctx context.Context, tenantID, packageID string, req *UpdatePackageRequest) error
	DeletePackage(ctx context.Context, tenantID, packageID string) error
}

type hotspotPackageService struct {
	packageRepo repository.HotspotPackageRepository
}

// NewHotspotPackageService creates a new instance of hotspot package service
func NewHotspotPackageService(packageRepo repository.HotspotPackageRepository) HotspotPackageService {
	return &hotspotPackageService{
		packageRepo: packageRepo,
	}
}

// CreatePackageRequest represents the request to create a hotspot package
type CreatePackageRequest struct {
	Name           string `json:"name" validate:"required"`
	Description    string `json:"description"`
	DurationType   string `json:"duration_type" validate:"required,oneof=hours days"`
	Duration       int    `json:"duration" validate:"required,gt=0"`
	Price          int    `json:"price" validate:"gte=0"`
	SpeedUpload    int    `json:"speed_upload" validate:"required,gt=0"`
	SpeedDownload  int    `json:"speed_download" validate:"required,gt=0"`
	DeviceLimit    int    `json:"device_limit" validate:"required,gte=1,lte=2"`
	MACBinding     bool   `json:"mac_binding"`
	SessionLimit   int    `json:"session_limit" validate:"required,gt=0"`
}

// UpdatePackageRequest represents the request to update a hotspot package
type UpdatePackageRequest struct {
	Name           string `json:"name"`
	Description    string `json:"description"`
	Price          int    `json:"price" validate:"gte=0"`
	SpeedUpload    int    `json:"speed_upload" validate:"gt=0"`
	SpeedDownload  int    `json:"speed_download" validate:"gt=0"`
	DeviceLimit    int    `json:"device_limit" validate:"gte=1,lte=2"`
	MACBinding     bool   `json:"mac_binding"`
	SessionLimit   int    `json:"session_limit" validate:"gt=0"`
	IsActive       *bool  `json:"is_active"`
}

func (s *hotspotPackageService) CreatePackage(ctx context.Context, tenantID string, req *CreatePackageRequest) (*entity.HotspotPackage, error) {
	tenantUUID, err := uuid.Parse(tenantID)
	if err != nil {
		return nil, errors.NewValidationError("invalid tenant_id")
	}

	pkg := &entity.HotspotPackage{
		TenantID:      tenantUUID,
		Name:          req.Name,
		Description:   req.Description,
		DurationType:  req.DurationType,
		Duration:      req.Duration,
		Price:         req.Price,
		SpeedUpload:   req.SpeedUpload,
		SpeedDownload: req.SpeedDownload,
		DeviceLimit:   req.DeviceLimit,
		MACBinding:    req.MACBinding,
		SessionLimit:  req.SessionLimit,
		IsActive:      true,
	}

	if err := pkg.Validate(); err != nil {
		return nil, err
	}

	if err := s.packageRepo.Create(ctx, pkg); err != nil {
		return nil, fmt.Errorf("failed to create package: %w", err)
	}

	return pkg, nil
}

func (s *hotspotPackageService) ListPackages(ctx context.Context, tenantID string) ([]*entity.HotspotPackage, error) {
	packages, err := s.packageRepo.FindByTenantID(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list packages: %w", err)
	}
	return packages, nil
}

func (s *hotspotPackageService) GetPackage(ctx context.Context, tenantID, packageID string) (*entity.HotspotPackage, error) {
	pkg, err := s.packageRepo.FindByID(ctx, packageID)
	if err != nil {
		return nil, fmt.Errorf("failed to get package: %w", err)
	}
	if pkg == nil {
		return nil, errors.NewNotFoundError("package not found")
	}

	// Verify tenant ownership
	if pkg.TenantID.String() != tenantID {
		return nil, errors.NewForbiddenError("package does not belong to this tenant")
	}

	return pkg, nil
}

func (s *hotspotPackageService) UpdatePackage(ctx context.Context, tenantID, packageID string, req *UpdatePackageRequest) error {
	pkg, err := s.GetPackage(ctx, tenantID, packageID)
	if err != nil {
		return err
	}

	// Update fields
	if req.Name != "" {
		pkg.Name = req.Name
	}
	if req.Description != "" {
		pkg.Description = req.Description
	}
	if req.Price >= 0 {
		pkg.Price = req.Price
	}
	if req.SpeedUpload > 0 {
		pkg.SpeedUpload = req.SpeedUpload
	}
	if req.SpeedDownload > 0 {
		pkg.SpeedDownload = req.SpeedDownload
	}
	if req.DeviceLimit > 0 {
		pkg.DeviceLimit = req.DeviceLimit
	}
	pkg.MACBinding = req.MACBinding
	if req.SessionLimit > 0 {
		pkg.SessionLimit = req.SessionLimit
	}
	if req.IsActive != nil {
		pkg.IsActive = *req.IsActive
	}

	if err := pkg.Validate(); err != nil {
		return err
	}

	if err := s.packageRepo.Update(ctx, pkg); err != nil {
		return fmt.Errorf("failed to update package: %w", err)
	}

	return nil
}

func (s *hotspotPackageService) DeletePackage(ctx context.Context, tenantID, packageID string) error {
	pkg, err := s.GetPackage(ctx, tenantID, packageID)
	if err != nil {
		return err
	}

	// Check if package has active vouchers
	hasVouchers, err := s.packageRepo.HasActiveVouchers(ctx, packageID)
	if err != nil {
		return fmt.Errorf("failed to check active vouchers: %w", err)
	}
	if hasVouchers {
		return errors.NewConflictError("cannot delete package with active vouchers")
	}

	if err := s.packageRepo.Delete(ctx, pkg.ID.String()); err != nil {
		return fmt.Errorf("failed to delete package: %w", err)
	}

	return nil
}
