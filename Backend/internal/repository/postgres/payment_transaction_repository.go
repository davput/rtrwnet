package postgres

import (
	"context"
	"fmt"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"gorm.io/gorm"
)

type paymentTransactionRepository struct {
	db *gorm.DB
}

func NewPaymentTransactionRepository(db *gorm.DB) repository.PaymentTransactionRepository {
	return &paymentTransactionRepository{db: db}
}

func (r *paymentTransactionRepository) Create(ctx context.Context, transaction *entity.PaymentTransaction) error {
	// Debug: Log before create
	if transaction.PlanID != nil {
		fmt.Printf("[DEBUG] Create transaction: order=%s, plan_id=%s\n", transaction.OrderID, *transaction.PlanID)
	} else {
		fmt.Printf("[DEBUG] Create transaction: order=%s, plan_id=nil\n", transaction.OrderID)
	}
	
	if err := r.db.WithContext(ctx).Create(transaction).Error; err != nil {
		return fmt.Errorf("failed to create payment transaction: %w", err)
	}
	
	// Explicitly update plan_id if set (workaround for GORM not picking up new column)
	if transaction.PlanID != nil && *transaction.PlanID != "" {
		fmt.Printf("[DEBUG] Updating plan_id explicitly: id=%s, plan_id=%s\n", transaction.ID, *transaction.PlanID)
		if err := r.db.WithContext(ctx).
			Model(&entity.PaymentTransaction{}).
			Where("id = ?", transaction.ID).
			Update("plan_id", *transaction.PlanID).Error; err != nil {
			return fmt.Errorf("failed to update plan_id: %w", err)
		}
		fmt.Printf("[DEBUG] plan_id updated successfully\n")
	}
	
	return nil
}

func (r *paymentTransactionRepository) FindByID(ctx context.Context, id string) (*entity.PaymentTransaction, error) {
	var transaction entity.PaymentTransaction
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&transaction).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find payment transaction: %w", err)
	}
	return &transaction, nil
}

func (r *paymentTransactionRepository) FindByOrderID(ctx context.Context, orderID string) (*entity.PaymentTransaction, error) {
	var transaction entity.PaymentTransaction
	
	// Use GORM with explicit select to ensure all columns including plan_id are fetched
	if err := r.db.WithContext(ctx).
		Select("id, tenant_id, subscription_id, plan_id, order_id, amount, status, payment_method, payment_gateway, gateway_transaction_id, gateway_response, paid_at, expired_at, created_at, updated_at").
		Where("order_id = ?", orderID).
		First(&transaction).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find payment transaction: %w", err)
	}
	
	// Debug: Log the plan_id and subscription_id values
	fmt.Printf("[DEBUG] FindByOrderID: order=%s, id=%s\n", orderID, transaction.ID)
	if transaction.PlanID != nil {
		fmt.Printf("[DEBUG] FindByOrderID: plan_id=%s\n", *transaction.PlanID)
	} else {
		fmt.Printf("[DEBUG] FindByOrderID: plan_id=nil\n")
	}
	if transaction.SubscriptionID != nil {
		fmt.Printf("[DEBUG] FindByOrderID: subscription_id=%s\n", *transaction.SubscriptionID)
	} else {
		fmt.Printf("[DEBUG] FindByOrderID: subscription_id=nil\n")
	}
	
	return &transaction, nil
}

func (r *paymentTransactionRepository) FindByTenantID(ctx context.Context, tenantID string) ([]*entity.PaymentTransaction, error) {
	var transactions []*entity.PaymentTransaction
	if err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Find(&transactions).Error; err != nil {
		return nil, fmt.Errorf("failed to find payment transactions: %w", err)
	}
	return transactions, nil
}

func (r *paymentTransactionRepository) Update(ctx context.Context, transaction *entity.PaymentTransaction) error {
	if err := r.db.WithContext(ctx).Save(transaction).Error; err != nil {
		return fmt.Errorf("failed to update payment transaction: %w", err)
	}
	return nil
}

func (r *paymentTransactionRepository) FindAll(ctx context.Context, page, perPage int, status, tenantID, search string) ([]*entity.PaymentTransaction, int64, error) {
	var transactions []*entity.PaymentTransaction
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.PaymentTransaction{})

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}
	if search != "" {
		query = query.Where("order_id ILIKE ? OR gateway_transaction_id ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count payment transactions: %w", err)
	}

	// Get paginated results with tenant preload
	offset := (page - 1) * perPage
	if err := query.
		Preload("Tenant").
		Order("created_at DESC").
		Offset(offset).
		Limit(perPage).
		Find(&transactions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to find payment transactions: %w", err)
	}

	return transactions, total, nil
}

func (r *paymentTransactionRepository) GetStats(ctx context.Context) (*repository.PaymentStats, error) {
	stats := &repository.PaymentStats{}

	// Get total count
	if err := r.db.WithContext(ctx).Model(&entity.PaymentTransaction{}).Count(&stats.TotalTransactions).Error; err != nil {
		return nil, fmt.Errorf("failed to count total transactions: %w", err)
	}

	// Get total revenue (sum of paid transactions)
	var totalRevenue float64
	if err := r.db.WithContext(ctx).Model(&entity.PaymentTransaction{}).
		Where("status = ?", "paid").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalRevenue).Error; err != nil {
		return nil, fmt.Errorf("failed to sum revenue: %w", err)
	}
	stats.TotalRevenue = totalRevenue

	// Get counts by status
	type statusCount struct {
		Status string
		Count  int64
	}
	var statusCounts []statusCount
	if err := r.db.WithContext(ctx).Model(&entity.PaymentTransaction{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&statusCounts).Error; err != nil {
		return nil, fmt.Errorf("failed to count by status: %w", err)
	}

	for _, sc := range statusCounts {
		switch sc.Status {
		case "pending":
			stats.PendingCount = sc.Count
		case "paid":
			stats.PaidCount = sc.Count
		case "failed":
			stats.FailedCount = sc.Count
		case "expired":
			stats.ExpiredCount = sc.Count
		}
	}

	return stats, nil
}
