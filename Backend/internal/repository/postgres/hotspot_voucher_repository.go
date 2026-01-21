package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

type hotspotVoucherRepository struct {
	db *gorm.DB
}

// NewHotspotVoucherRepository creates a new instance of hotspot voucher repository
func NewHotspotVoucherRepository(db *gorm.DB) repository.HotspotVoucherRepository {
	return &hotspotVoucherRepository{db: db}
}

func (r *hotspotVoucherRepository) Create(ctx context.Context, voucher *entity.HotspotVoucher) error {
	if voucher.ID == uuid.Nil {
		voucher.ID = uuid.New()
	}
	return r.db.WithContext(ctx).Create(voucher).Error
}

func (r *hotspotVoucherRepository) CreateBatch(ctx context.Context, vouchers []*entity.HotspotVoucher) error {
	return r.db.WithContext(ctx).CreateInBatches(vouchers, 100).Error
}

func (r *hotspotVoucherRepository) FindByID(ctx context.Context, id string) (*entity.HotspotVoucher, error) {
	var voucher entity.HotspotVoucher
	err := r.db.WithContext(ctx).
		Preload("Package").
		Where("id = ?", id).
		First(&voucher).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &voucher, nil
}

func (r *hotspotVoucherRepository) FindByCode(ctx context.Context, tenantID, code string) (*entity.HotspotVoucher, error) {
	var voucher entity.HotspotVoucher
	err := r.db.WithContext(ctx).
		Preload("Package").
		Where("tenant_id = ? AND voucher_code = ?", tenantID, code).
		First(&voucher).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &voucher, nil
}

func (r *hotspotVoucherRepository) FindByTenantID(ctx context.Context, tenantID string, filters map[string]interface{}, page, perPage int) ([]*entity.HotspotVoucher, int, error) {
	var vouchers []*entity.HotspotVoucher
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.HotspotVoucher{}).Where("tenant_id = ?", tenantID)

	// Apply filters
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}
	if packageID, ok := filters["package_id"].(string); ok && packageID != "" {
		query = query.Where("package_id = ?", packageID)
	}
	if startDate, ok := filters["start_date"].(time.Time); ok {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate, ok := filters["end_date"].(time.Time); ok {
		query = query.Where("created_at <= ?", endDate)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * perPage
	err := query.
		Preload("Package").
		Order("created_at DESC").
		Limit(perPage).
		Offset(offset).
		Find(&vouchers).Error

	if err != nil {
		return nil, 0, err
	}

	return vouchers, int(total), nil
}

func (r *hotspotVoucherRepository) Update(ctx context.Context, voucher *entity.HotspotVoucher) error {
	return r.db.WithContext(ctx).Save(voucher).Error
}

func (r *hotspotVoucherRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.HotspotVoucher{}, "id = ?", id).Error
}

func (r *hotspotVoucherRepository) CountByStatus(ctx context.Context, tenantID, status string) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.HotspotVoucher{}).
		Where("tenant_id = ? AND status = ?", tenantID, status).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

func (r *hotspotVoucherRepository) CountByPackageAndDateRange(ctx context.Context, tenantID, packageID string, start, end time.Time) (int, error) {
	var count int64
	query := r.db.WithContext(ctx).
		Model(&entity.HotspotVoucher{}).
		Where("tenant_id = ?", tenantID)

	if packageID != "" {
		query = query.Where("package_id = ?", packageID)
	}
	if !start.IsZero() {
		query = query.Where("created_at >= ?", start)
	}
	if !end.IsZero() {
		query = query.Where("created_at <= ?", end)
	}

	err := query.Count(&count).Error
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

func (r *hotspotVoucherRepository) FindExpiredVouchers(ctx context.Context) ([]*entity.HotspotVoucher, error) {
	var vouchers []*entity.HotspotVoucher
	now := time.Now()
	err := r.db.WithContext(ctx).
		Where("status = ? AND expires_at IS NOT NULL AND expires_at < ?", entity.VoucherStatusActive, now).
		Find(&vouchers).Error
	if err != nil {
		return nil, err
	}
	return vouchers, nil
}

func (r *hotspotVoucherRepository) UpdateExpiredVouchers(ctx context.Context) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.HotspotVoucher{}).
		Where("status = ? AND expires_at IS NOT NULL AND expires_at < ?", entity.VoucherStatusActive, now).
		Update("status", entity.VoucherStatusExpired).Error
}
