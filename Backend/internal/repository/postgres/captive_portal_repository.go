package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

type captivePortalRepository struct {
	db *gorm.DB
}

// NewCaptivePortalRepository creates a new instance of captive portal repository
func NewCaptivePortalRepository(db *gorm.DB) repository.CaptivePortalRepository {
	return &captivePortalRepository{db: db}
}

func (r *captivePortalRepository) GetSettings(ctx context.Context, tenantID string) (*entity.CaptivePortalSettings, error) {
	var settings entity.CaptivePortalSettings
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).First(&settings).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Return default settings if not found
			return &entity.CaptivePortalSettings{
				TenantID:       tenantID,
				PrimaryColor:   "#3B82F6",
				SecondaryColor: "#10B981",
			}, nil
		}
		return nil, err
	}
	return &settings, nil
}

func (r *captivePortalRepository) UpsertSettings(ctx context.Context, settings *entity.CaptivePortalSettings) error {
	// Check if settings exist
	var existing entity.CaptivePortalSettings
	err := r.db.WithContext(ctx).Where("tenant_id = ?", settings.TenantID).First(&existing).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new settings
			if settings.ID == "" {
				settings.ID = uuid.New().String()
			}
			return r.db.WithContext(ctx).Create(settings).Error
		}
		return err
	}

	// Update existing settings
	settings.ID = existing.ID
	return r.db.WithContext(ctx).Save(settings).Error
}
