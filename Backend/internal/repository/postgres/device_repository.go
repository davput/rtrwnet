package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

type deviceRepository struct {
	db *gorm.DB
}

func NewDeviceRepository(db *gorm.DB) repository.DeviceRepository {
	return &deviceRepository{db: db}
}

func (r *deviceRepository) Create(ctx context.Context, device *entity.Device) error {
	return r.db.WithContext(ctx).Create(device).Error
}

func (r *deviceRepository) Update(ctx context.Context, device *entity.Device) error {
	return r.db.WithContext(ctx).Save(device).Error
}

func (r *deviceRepository) GetByID(ctx context.Context, id string) (*entity.Device, error) {
	var device entity.Device
	err := r.db.WithContext(ctx).
		Preload("Customer").
		Preload("ParentDevice").
		First(&device, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &device, nil
}

func (r *deviceRepository) GetBySerialNumber(ctx context.Context, tenantID, serialNumber string) (*entity.Device, error) {
	var device entity.Device
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND serial_number = ?", tenantID, serialNumber).
		First(&device).Error
	if err != nil {
		return nil, err
	}
	return &device, nil
}

func (r *deviceRepository) List(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Device, int, error) {
	var devices []*entity.Device
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Device{}).Where("tenant_id = ?", tenantID)

	// Apply filters
	if deviceType, ok := filters["device_type"].(string); ok && deviceType != "" {
		query = query.Where("device_type = ?", deviceType)
	}
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}
	if customerID, ok := filters["customer_id"].(string); ok && customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		searchPattern := fmt.Sprintf("%%%s%%", search)
		query = query.Where("device_name ILIKE ? OR serial_number ILIKE ? OR mac_address ILIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * perPage
	err := query.
		Preload("Customer").
		Preload("ParentDevice").
		Order("created_at DESC").
		Limit(perPage).
		Offset(offset).
		Find(&devices).Error

	if err != nil {
		return nil, 0, err
	}

	return devices, int(total), nil
}

func (r *deviceRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.Device{}, "id = ?", id).Error
}

func (r *deviceRepository) UpdateConnectionStatus(ctx context.Context, deviceID, status string) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.Device{}).
		Where("id = ?", deviceID).
		Updates(map[string]interface{}{
			"connection_status": status,
			"last_connected_at": now,
		}).Error
}

func (r *deviceRepository) GetMikrotikDevices(ctx context.Context, tenantID string) ([]*entity.Device, error) {
	var devices []*entity.Device
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND mikrotik_api_enabled = ?", tenantID, true).
		Order("device_name ASC").
		Find(&devices).Error
	if err != nil {
		return nil, err
	}
	return devices, nil
}

func (r *deviceRepository) GetDefaultMikrotik(ctx context.Context, tenantID string) (*entity.Device, error) {
	var device entity.Device
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND is_default_mikrotik = ? AND mikrotik_api_enabled = ?", tenantID, true, true).
		First(&device).Error
	if err != nil {
		return nil, err
	}
	return &device, nil
}

func (r *deviceRepository) CountByTenantID(ctx context.Context, tenantID string) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Device{}).
		Where("tenant_id = ?", tenantID).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return int(count), nil
}
