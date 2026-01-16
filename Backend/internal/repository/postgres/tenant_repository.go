package postgres

import (
	"context"
	"fmt"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"gorm.io/gorm"
)

type tenantRepository struct {
	db *gorm.DB
}

func NewTenantRepository(db *gorm.DB) repository.TenantRepository {
	return &tenantRepository{db: db}
}

func (r *tenantRepository) Create(ctx context.Context, tenant *entity.Tenant) error {
	if err := r.db.WithContext(ctx).Create(tenant).Error; err != nil {
		return fmt.Errorf("failed to create tenant: %w", err)
	}
	return nil
}

func (r *tenantRepository) FindByID(ctx context.Context, id string) (*entity.Tenant, error) {
	var tenant entity.Tenant
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&tenant).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find tenant: %w", err)
	}
	return &tenant, nil
}

func (r *tenantRepository) FindByEmail(ctx context.Context, email string) (*entity.Tenant, error) {
	var tenant entity.Tenant
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&tenant).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find tenant by email: %w", err)
	}
	return &tenant, nil
}

func (r *tenantRepository) FindAll(ctx context.Context) ([]*entity.Tenant, error) {
	var tenants []*entity.Tenant
	if err := r.db.WithContext(ctx).Find(&tenants).Error; err != nil {
		return nil, fmt.Errorf("failed to find tenants: %w", err)
	}
	return tenants, nil
}

func (r *tenantRepository) List(ctx context.Context) ([]*entity.Tenant, error) {
	return r.FindAll(ctx)
}

func (r *tenantRepository) Update(ctx context.Context, tenant *entity.Tenant) error {
	if err := r.db.WithContext(ctx).Save(tenant).Error; err != nil {
		return fmt.Errorf("failed to update tenant: %w", err)
	}
	return nil
}

func (r *tenantRepository) Delete(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Delete(&entity.Tenant{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete tenant: %w", err)
	}
	return nil
}
