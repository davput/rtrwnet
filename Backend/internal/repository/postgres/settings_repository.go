package postgres

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"gorm.io/gorm"
)

type settingsRepository struct {
	db *gorm.DB
}

func NewSettingsRepository(db *gorm.DB) repository.SettingsRepository {
	return &settingsRepository{db: db}
}

// ==================== USER SETTINGS ====================

func (r *settingsRepository) GetUserSettings(ctx context.Context, tenantID, userID string) (*entity.UserSettings, error) {
	var settings entity.UserSettings
	if err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND user_id = ?", tenantID, userID).
		First(&settings).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get user settings: %w", err)
	}
	return &settings, nil
}

func (r *settingsRepository) CreateUserSettings(ctx context.Context, settings *entity.UserSettings) error {
	if settings.ID == uuid.Nil {
		settings.ID = uuid.New()
	}
	if err := r.db.WithContext(ctx).Create(settings).Error; err != nil {
		return fmt.Errorf("failed to create user settings: %w", err)
	}
	return nil
}

func (r *settingsRepository) UpdateUserSettings(ctx context.Context, settings *entity.UserSettings) error {
	if err := r.db.WithContext(ctx).Save(settings).Error; err != nil {
		return fmt.Errorf("failed to update user settings: %w", err)
	}
	return nil
}

// ==================== TENANT SETTINGS ====================

func (r *settingsRepository) GetTenantSettings(ctx context.Context, tenantID string) (*entity.TenantSettings, error) {
	var settings entity.TenantSettings
	if err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		First(&settings).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get tenant settings: %w", err)
	}
	return &settings, nil
}

func (r *settingsRepository) CreateTenantSettings(ctx context.Context, settings *entity.TenantSettings) error {
	if settings.ID == uuid.Nil {
		settings.ID = uuid.New()
	}
	if err := r.db.WithContext(ctx).Create(settings).Error; err != nil {
		return fmt.Errorf("failed to create tenant settings: %w", err)
	}
	return nil
}

func (r *settingsRepository) UpdateTenantSettings(ctx context.Context, settings *entity.TenantSettings) error {
	if err := r.db.WithContext(ctx).Save(settings).Error; err != nil {
		return fmt.Errorf("failed to update tenant settings: %w", err)
	}
	return nil
}
