package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type DeviceRepository interface {
	Create(ctx context.Context, device *entity.Device) error
	Update(ctx context.Context, device *entity.Device) error
	GetByID(ctx context.Context, id string) (*entity.Device, error)
	GetBySerialNumber(ctx context.Context, tenantID, serialNumber string) (*entity.Device, error)
	List(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Device, int, error)
	Delete(ctx context.Context, id string) error
	UpdateConnectionStatus(ctx context.Context, deviceID, status string) error
	GetMikrotikDevices(ctx context.Context, tenantID string) ([]*entity.Device, error)
	GetDefaultMikrotik(ctx context.Context, tenantID string) (*entity.Device, error)
	CountByTenantID(ctx context.Context, tenantID string) (int, error)
}
