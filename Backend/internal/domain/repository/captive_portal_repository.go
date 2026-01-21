package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

// CaptivePortalRepository defines the interface for captive portal settings data operations
type CaptivePortalRepository interface {
	// GetSettings retrieves captive portal settings for a tenant
	GetSettings(ctx context.Context, tenantID string) (*entity.CaptivePortalSettings, error)

	// UpsertSettings creates or updates captive portal settings for a tenant
	UpsertSettings(ctx context.Context, settings *entity.CaptivePortalSettings) error
}
