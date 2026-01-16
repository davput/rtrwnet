package postgres

import (
	"context"
	"fmt"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"gorm.io/gorm"
)

type subscriptionPlanRepository struct {
	db *gorm.DB
}

func NewSubscriptionPlanRepository(db *gorm.DB) repository.SubscriptionPlanRepository {
	return &subscriptionPlanRepository{db: db}
}

func (r *subscriptionPlanRepository) Create(ctx context.Context, plan *entity.SubscriptionPlan) error {
	if err := r.db.WithContext(ctx).Create(plan).Error; err != nil {
		return fmt.Errorf("failed to create subscription plan: %w", err)
	}
	return nil
}

func (r *subscriptionPlanRepository) FindByID(ctx context.Context, id string) (*entity.SubscriptionPlan, error) {
	var plan entity.SubscriptionPlan
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find subscription plan: %w", err)
	}
	return &plan, nil
}

func (r *subscriptionPlanRepository) FindBySlug(ctx context.Context, slug string) (*entity.SubscriptionPlan, error) {
	var plan entity.SubscriptionPlan
	if err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find subscription plan: %w", err)
	}
	return &plan, nil
}

func (r *subscriptionPlanRepository) GetByID(ctx context.Context, id string) (*entity.SubscriptionPlan, error) {
	return r.FindByID(ctx, id)
}

func (r *subscriptionPlanRepository) GetAll(ctx context.Context) ([]*entity.SubscriptionPlan, error) {
	return r.FindAll(ctx, false)
}

func (r *subscriptionPlanRepository) FindAll(ctx context.Context, activeOnly bool) ([]*entity.SubscriptionPlan, error) {
	var plans []*entity.SubscriptionPlan
	query := r.db.WithContext(ctx)
	
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}
	
	if err := query.Order("sort_order ASC, price ASC").Find(&plans).Error; err != nil {
		return nil, fmt.Errorf("failed to find subscription plans: %w", err)
	}
	return plans, nil
}

func (r *subscriptionPlanRepository) FindPublicPlans(ctx context.Context) ([]*entity.SubscriptionPlan, error) {
	var plans []*entity.SubscriptionPlan
	if err := r.db.WithContext(ctx).
		Where("is_active = ? AND is_public = ?", true, true).
		Order("sort_order ASC, price ASC").
		Find(&plans).Error; err != nil {
		return nil, fmt.Errorf("failed to find public plans: %w", err)
	}
	return plans, nil
}

func (r *subscriptionPlanRepository) FindTrialPlan(ctx context.Context) (*entity.SubscriptionPlan, error) {
	var plan entity.SubscriptionPlan
	if err := r.db.WithContext(ctx).
		Where("is_active = ? AND is_trial = ?", true, true).
		First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find trial plan: %w", err)
	}
	return &plan, nil
}

func (r *subscriptionPlanRepository) Update(ctx context.Context, plan *entity.SubscriptionPlan) error {
	if err := r.db.WithContext(ctx).Save(plan).Error; err != nil {
		return fmt.Errorf("failed to update subscription plan: %w", err)
	}
	return nil
}

func (r *subscriptionPlanRepository) Delete(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Delete(&entity.SubscriptionPlan{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete subscription plan: %w", err)
	}
	return nil
}
