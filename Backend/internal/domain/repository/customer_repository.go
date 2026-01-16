package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type CustomerRepository interface {
	Create(ctx context.Context, customer *entity.Customer) error
	FindByID(ctx context.Context, id string) (*entity.Customer, error)
	FindByTenantID(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Customer, int, error)
	FindByCustomerCode(ctx context.Context, tenantID, customerCode string) (*entity.Customer, error)
	Update(ctx context.Context, customer *entity.Customer) error
	Delete(ctx context.Context, id string) error
	CountByTenantID(ctx context.Context, tenantID string) (int, error)
	CountByStatus(ctx context.Context, tenantID, status string) (int, error)
	CountNewCustomersThisMonth(ctx context.Context, tenantID string) (int, error)
	GenerateCustomerCode(ctx context.Context, tenantID string) (string, error)
}
