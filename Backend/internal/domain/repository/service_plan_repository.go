package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type ServicePlanRepository interface {
	Create(ctx context.Context, plan *entity.ServicePlan) error
	FindByID(ctx context.Context, id string) (*entity.ServicePlan, error)
	FindByTenantID(ctx context.Context, tenantID string) ([]*entity.ServicePlan, error)
	Update(ctx context.Context, plan *entity.ServicePlan) error
	Delete(ctx context.Context, id string) error
	CountCustomersByPlanID(ctx context.Context, planID string) (int, error)
}
