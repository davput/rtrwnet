package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type SettingsRepository interface {
	// User Settings
	GetUserSettings(ctx context.Context, tenantID, userID string) (*entity.UserSettings, error)
	CreateUserSettings(ctx context.Context, settings *entity.UserSettings) error
	UpdateUserSettings(ctx context.Context, settings *entity.UserSettings) error

	// Tenant Settings
	GetTenantSettings(ctx context.Context, tenantID string) (*entity.TenantSettings, error)
	CreateTenantSettings(ctx context.Context, settings *entity.TenantSettings) error
	UpdateTenantSettings(ctx context.Context, settings *entity.TenantSettings) error
}
