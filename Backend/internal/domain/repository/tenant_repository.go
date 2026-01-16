package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type TenantRepository interface {
	Create(ctx context.Context, tenant *entity.Tenant) error
	FindByID(ctx context.Context, id string) (*entity.Tenant, error)
	FindByEmail(ctx context.Context, email string) (*entity.Tenant, error)
	FindAll(ctx context.Context) ([]*entity.Tenant, error)
	Update(ctx context.Context, tenant *entity.Tenant) error
	Delete(ctx context.Context, id string) error
}
