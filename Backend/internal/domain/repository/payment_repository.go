package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type PaymentRepository interface {
	Create(ctx context.Context, payment *entity.Payment) error
	FindByID(ctx context.Context, id string) (*entity.Payment, error)
	FindByTenantID(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Payment, int, error)
	FindByCustomerID(ctx context.Context, customerID string, limit int) ([]*entity.Payment, error)
	Update(ctx context.Context, payment *entity.Payment) error
	Delete(ctx context.Context, id string) error
	CountByStatus(ctx context.Context, tenantID, status string) (int, error)
	SumByStatus(ctx context.Context, tenantID, status string) (float64, error)
	SumByMonth(ctx context.Context, tenantID string, month, year int) (float64, error)
	GetRecentPayments(ctx context.Context, tenantID string, limit int) ([]*entity.Payment, error)
	GetMonthlyRevenue(ctx context.Context, tenantID string, months int) ([]map[string]interface{}, error)
}
