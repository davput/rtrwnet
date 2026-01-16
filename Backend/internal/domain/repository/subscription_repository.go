package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type SubscriptionPlanRepository interface {
	Create(ctx context.Context, plan *entity.SubscriptionPlan) error
	GetByID(ctx context.Context, id string) (*entity.SubscriptionPlan, error)
	FindByID(ctx context.Context, id string) (*entity.SubscriptionPlan, error)
	FindBySlug(ctx context.Context, slug string) (*entity.SubscriptionPlan, error)
	FindAll(ctx context.Context, activeOnly bool) ([]*entity.SubscriptionPlan, error)
	FindPublicPlans(ctx context.Context) ([]*entity.SubscriptionPlan, error)
	FindTrialPlan(ctx context.Context) (*entity.SubscriptionPlan, error)
	GetAll(ctx context.Context) ([]*entity.SubscriptionPlan, error)
	Update(ctx context.Context, plan *entity.SubscriptionPlan) error
	Delete(ctx context.Context, id string) error
}

type TenantSubscriptionRepository interface {
	Create(ctx context.Context, subscription *entity.TenantSubscription) error
	FindByID(ctx context.Context, id string) (*entity.TenantSubscription, error)
	FindByTenantID(ctx context.Context, tenantID string) (*entity.TenantSubscription, error)
	FindActiveByTenantID(ctx context.Context, tenantID string) (*entity.TenantSubscription, error)
	FindExpiringIn(ctx context.Context, days int) ([]*entity.TenantSubscription, error)
	Update(ctx context.Context, subscription *entity.TenantSubscription) error
	Delete(ctx context.Context, id string) error
}

type PaymentTransactionRepository interface {
	Create(ctx context.Context, transaction *entity.PaymentTransaction) error
	FindByID(ctx context.Context, id string) (*entity.PaymentTransaction, error)
	FindByOrderID(ctx context.Context, orderID string) (*entity.PaymentTransaction, error)
	FindByTenantID(ctx context.Context, tenantID string) ([]*entity.PaymentTransaction, error)
	Update(ctx context.Context, transaction *entity.PaymentTransaction) error
	// Admin methods
	FindAll(ctx context.Context, page, perPage int, status, tenantID, search string) ([]*entity.PaymentTransaction, int64, error)
	GetStats(ctx context.Context) (*PaymentStats, error)
}

// PaymentStats holds aggregated payment statistics
type PaymentStats struct {
	TotalTransactions int64   `json:"total_transactions"`
	TotalRevenue      float64 `json:"total_revenue"`
	PendingCount      int64   `json:"pending_count"`
	PaidCount         int64   `json:"paid_count"`
	FailedCount       int64   `json:"failed_count"`
	ExpiredCount      int64   `json:"expired_count"`
}
