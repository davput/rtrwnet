package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

type hotspotPackageRepository struct {
	db *gorm.DB
}

// NewHotspotPackageRepository creates a new instance of hotspot package repository
func NewHotspotPackageRepository(db *gorm.DB) repository.HotspotPackageRepository {
	return &hotspotPackageRepository{db: db}
}

func (r *hotspotPackageRepository) Create(ctx context.Context, pkg *entity.HotspotPackage) error {
	if pkg.ID == uuid.Nil {
		pkg.ID = uuid.New()
	}
	return r.db.WithContext(ctx).Create(pkg).Error
}

func (r *hotspotPackageRepository) FindByID(ctx context.Context, id string) (*entity.HotspotPackage, error) {
	var pkg entity.HotspotPackage
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&pkg).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &pkg, nil
}

func (r *hotspotPackageRepository) FindByTenantID(ctx context.Context, tenantID string) ([]*entity.HotspotPackage, error) {
	var packages []*entity.HotspotPackage
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Find(&packages).Error
	if err != nil {
		return nil, err
	}
	return packages, nil
}

func (r *hotspotPackageRepository) FindActiveByTenantID(ctx context.Context, tenantID string) ([]*entity.HotspotPackage, error) {
	var packages []*entity.HotspotPackage
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND is_active = ?", tenantID, true).
		Order("created_at DESC").
		Find(&packages).Error
	if err != nil {
		return nil, err
	}
	return packages, nil
}

func (r *hotspotPackageRepository) Update(ctx context.Context, pkg *entity.HotspotPackage) error {
	return r.db.WithContext(ctx).Save(pkg).Error
}

func (r *hotspotPackageRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.HotspotPackage{}, "id = ?", id).Error
}

func (r *hotspotPackageRepository) HasActiveVouchers(ctx context.Context, packageID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.HotspotVoucher{}).
		Where("package_id = ? AND status IN (?)", packageID, []string{
			entity.VoucherStatusActive,
			entity.VoucherStatusUnused,
		}).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
