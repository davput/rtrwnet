package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"gorm.io/gorm"
)

type tenantSubscriptionRepository struct {
	db *gorm.DB
}

func NewTenantSubscriptionRepository(db *gorm.DB) repository.TenantSubscriptionRepository {
	return &tenantSubscriptionRepository{db: db}
}

func (r *tenantSubscriptionRepository) Create(ctx context.Context, subscription *entity.TenantSubscription) error {
	if err := r.db.WithContext(ctx).Create(subscription).Error; err != nil {
		return fmt.Errorf("failed to create tenant subscription: %w", err)
	}
	return nil
}

func (r *tenantSubscriptionRepository) FindByID(ctx context.Context, id string) (*entity.TenantSubscription, error) {
	var subscription entity.TenantSubscription
	if err := r.db.WithContext(ctx).Preload("Plan").Where("id = ?", id).First(&subscription).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find tenant subscription: %w", err)
	}
	return &subscription, nil
}

func (r *tenantSubscriptionRepository) FindByTenantID(ctx context.Context, tenantID string) (*entity.TenantSubscription, error) {
	var subscription entity.TenantSubscription
	if err := r.db.WithContext(ctx).
		Preload("Plan").
		Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		First(&subscription).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find tenant subscription: %w", err)
	}
	return &subscription, nil
}

func (r *tenantSubscriptionRepository) FindExpiringIn(ctx context.Context, days int) ([]*entity.TenantSubscription, error) {
	var subscriptions []*entity.TenantSubscription
	targetDate := time.Now().AddDate(0, 0, days)
	
	if err := r.db.WithContext(ctx).
		Preload("Plan").
		Preload("Tenant").
		Where("status = ? AND next_billing_date <= ? AND auto_renew = ?", 
			entity.SubscriptionStatusActive, targetDate, true).
		Find(&subscriptions).Error; err != nil {
		return nil, fmt.Errorf("failed to find expiring subscriptions: %w", err)
	}
	return subscriptions, nil
}

func (r *tenantSubscriptionRepository) Update(ctx context.Context, subscription *entity.TenantSubscription) error {
	fmt.Printf("[DEBUG] Updating subscription: id=%s, plan_id=%s, status=%s\n", 
		subscription.ID, subscription.PlanID, subscription.Status)
	
	if err := r.db.WithContext(ctx).Save(subscription).Error; err != nil {
		return fmt.Errorf("failed to update tenant subscription: %w", err)
	}
	
	fmt.Printf("[DEBUG] Subscription updated successfully\n")
	return nil
}

func (r *tenantSubscriptionRepository) Delete(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Delete(&entity.TenantSubscription{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete tenant subscription: %w", err)
	}
	return nil
}

func (r *tenantSubscriptionRepository) FindActiveByTenantID(ctx context.Context, tenantID string) (*entity.TenantSubscription, error) {
	var subscription entity.TenantSubscription
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Where("status IN ?", []string{entity.SubscriptionStatusActive, entity.SubscriptionStatusTrial}).
		Preload("Plan").
		First(&subscription).Error
	if err != nil {
		// Check if there's an expired subscription
		var expiredSub entity.TenantSubscription
		expErr := r.db.WithContext(ctx).
			Where("tenant_id = ?", tenantID).
			Where("status = ?", entity.SubscriptionStatusExpired).
			First(&expiredSub).Error
		if expErr == nil {
			return nil, errors.ErrSubscriptionExpired
		}
		return nil, fmt.Errorf("failed to find active subscription: %w", err)
	}
	
	fmt.Printf("[DEBUG] FindActiveByTenantID: tenant=%s, subscription_id=%s, plan_id=%s, status=%s\n",
		tenantID, subscription.ID, subscription.PlanID, subscription.Status)
	
	// Check if trial/subscription has expired based on end_date
	if subscription.EndDate != nil && time.Now().After(*subscription.EndDate) {
		fmt.Printf("[DEBUG] Subscription expired: end_date=%s, now=%s\n", 
			subscription.EndDate.Format(time.RFC3339), time.Now().Format(time.RFC3339))
		
		// Update status to expired
		subscription.Status = entity.SubscriptionStatusExpired
		r.db.WithContext(ctx).Save(&subscription)
		
		if subscription.Status == entity.SubscriptionStatusTrial {
			return nil, errors.ErrTrialExpired
		}
		return nil, errors.ErrSubscriptionExpired
	}
	
	return &subscription, nil
}
