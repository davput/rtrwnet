package repository

import (
	"context"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

// HotspotVoucherRepository defines the interface for hotspot voucher data operations
type HotspotVoucherRepository interface {
	// Create creates a new hotspot voucher
	Create(ctx context.Context, voucher *entity.HotspotVoucher) error

	// CreateBatch creates multiple hotspot vouchers in a batch
	CreateBatch(ctx context.Context, vouchers []*entity.HotspotVoucher) error

	// FindByID finds a hotspot voucher by ID
	FindByID(ctx context.Context, id string) (*entity.HotspotVoucher, error)

	// FindByCode finds a hotspot voucher by code within a tenant
	FindByCode(ctx context.Context, tenantID, code string) (*entity.HotspotVoucher, error)

	// FindByTenantID finds hotspot vouchers for a tenant with filters and pagination
	FindByTenantID(ctx context.Context, tenantID string, filters map[string]interface{}, page, perPage int) ([]*entity.HotspotVoucher, int, error)

	// Update updates an existing hotspot voucher
	Update(ctx context.Context, voucher *entity.HotspotVoucher) error

	// Delete deletes a hotspot voucher by ID
	Delete(ctx context.Context, id string) error

	// CountByStatus counts vouchers by status for a tenant
	CountByStatus(ctx context.Context, tenantID, status string) (int, error)

	// CountByPackageAndDateRange counts vouchers by package and date range
	CountByPackageAndDateRange(ctx context.Context, tenantID, packageID string, start, end time.Time) (int, error)

	// FindExpiredVouchers finds all vouchers that have expired
	FindExpiredVouchers(ctx context.Context) ([]*entity.HotspotVoucher, error)

	// UpdateExpiredVouchers updates status of expired vouchers
	UpdateExpiredVouchers(ctx context.Context) error
}
