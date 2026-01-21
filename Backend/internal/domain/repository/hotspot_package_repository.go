package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

// HotspotPackageRepository defines the interface for hotspot package data operations
type HotspotPackageRepository interface {
	// Create creates a new hotspot package
	Create(ctx context.Context, pkg *entity.HotspotPackage) error

	// FindByID finds a hotspot package by ID
	FindByID(ctx context.Context, id string) (*entity.HotspotPackage, error)

	// FindByTenantID finds all hotspot packages for a tenant
	FindByTenantID(ctx context.Context, tenantID string) ([]*entity.HotspotPackage, error)

	// FindActiveByTenantID finds all active hotspot packages for a tenant
	FindActiveByTenantID(ctx context.Context, tenantID string) ([]*entity.HotspotPackage, error)

	// Update updates an existing hotspot package
	Update(ctx context.Context, pkg *entity.HotspotPackage) error

	// Delete deletes a hotspot package by ID
	Delete(ctx context.Context, id string) error

	// HasActiveVouchers checks if a package has any active vouchers
	HasActiveVouchers(ctx context.Context, packageID string) (bool, error)
}
