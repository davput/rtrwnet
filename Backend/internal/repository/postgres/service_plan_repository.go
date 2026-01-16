package postgres

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

type servicePlanRepository struct {
	db *gorm.DB
}

func NewServicePlanRepository(db *gorm.DB) repository.ServicePlanRepository {
	return &servicePlanRepository{db: db}
}

func (r *servicePlanRepository) Create(ctx context.Context, plan *entity.ServicePlan) error {
	return r.db.WithContext(ctx).Create(plan).Error
}

func (r *servicePlanRepository) FindByID(ctx context.Context, id string) (*entity.ServicePlan, error) {
	var plan entity.ServicePlan
	err := r.db.WithContext(ctx).First(&plan, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *servicePlanRepository) FindByTenantID(ctx context.Context, tenantID string) ([]*entity.ServicePlan, error) {
	var plans []*entity.ServicePlan
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Order("name ASC").
		Find(&plans).Error
	if err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *servicePlanRepository) Update(ctx context.Context, plan *entity.ServicePlan) error {
	return r.db.WithContext(ctx).Save(plan).Error
}

func (r *servicePlanRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.ServicePlan{}, "id = ?", id).Error
}

func (r *servicePlanRepository) CountCustomersByPlanID(ctx context.Context, planID string) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Customer{}).
		Where("service_plan_id = ?", planID).
		Count(&count).Error
	return int(count), err
}
