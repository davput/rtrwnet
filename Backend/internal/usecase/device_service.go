package usecase

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
)

type DeviceService interface {
	CreateDevice(ctx context.Context, tenantID string, req *CreateDeviceRequest) (*entity.Device, error)
	UpdateDevice(ctx context.Context, tenantID, deviceID string, req *UpdateDeviceRequest) (*entity.Device, error)
	GetDeviceByID(ctx context.Context, tenantID, deviceID string) (*entity.Device, error)
	ListDevices(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Device, int, error)
	DeleteDevice(ctx context.Context, tenantID, deviceID string) error
	TestMikrotikConnection(ctx context.Context, tenantID, deviceID string) (bool, error)
	SyncMikrotikQueues(ctx context.Context, tenantID, deviceID string) error
}

type deviceService struct {
	deviceRepo     repository.DeviceRepository
	mikrotikSvc    MikrotikService
}

func NewDeviceService(deviceRepo repository.DeviceRepository, mikrotikSvc MikrotikService) DeviceService {
	return &deviceService{
		deviceRepo:  deviceRepo,
		mikrotikSvc: mikrotikSvc,
	}
}

type CreateDeviceRequest struct {
	DeviceName         string   `json:"device_name" binding:"required"`
	DeviceType         string   `json:"device_type" binding:"required,oneof=router onu switch access_point"`
	SerialNumber       string   `json:"serial_number" binding:"required"`
	MACAddress         string   `json:"mac_address"`
	Brand              string   `json:"brand"`
	Model              string   `json:"model"`
	FirmwareVersion    string   `json:"firmware_version"`
	IPAddress          string   `json:"ip_address"`
	SubnetMask         string   `json:"subnet_mask"`
	Gateway            string   `json:"gateway"`
	Location           string   `json:"location"`
	Latitude           float64  `json:"latitude"`
	Longitude          float64  `json:"longitude"`
	CustomerID         *string  `json:"customer_id"`
	ParentDeviceID     *string  `json:"parent_device_id"`
	PurchasePrice      float64  `json:"purchase_price"`
	Notes              string   `json:"notes"`
	MikrotikUsername   string   `json:"mikrotik_username"`
	MikrotikPassword   string   `json:"mikrotik_password"`
	MikrotikPort       string   `json:"mikrotik_port"`
	MikrotikAPIEnabled bool     `json:"mikrotik_api_enabled"`
	IsDefaultMikrotik  bool     `json:"is_default_mikrotik"`
}

type UpdateDeviceRequest struct {
	DeviceName         string   `json:"device_name"`
	DeviceType         string   `json:"device_type" binding:"omitempty,oneof=router onu switch access_point"`
	MACAddress         string   `json:"mac_address"`
	Brand              string   `json:"brand"`
	Model              string   `json:"model"`
	FirmwareVersion    string   `json:"firmware_version"`
	IPAddress          string   `json:"ip_address"`
	SubnetMask         string   `json:"subnet_mask"`
	Gateway            string   `json:"gateway"`
	Location           string   `json:"location"`
	Latitude           float64  `json:"latitude"`
	Longitude          float64  `json:"longitude"`
	Status             string   `json:"status" binding:"omitempty,oneof=online offline maintenance"`
	CustomerID         *string  `json:"customer_id"`
	ParentDeviceID     *string  `json:"parent_device_id"`
	PurchasePrice      float64  `json:"purchase_price"`
	Notes              string   `json:"notes"`
	MikrotikUsername   string   `json:"mikrotik_username"`
	MikrotikPassword   string   `json:"mikrotik_password"`
	MikrotikPort       string   `json:"mikrotik_port"`
	MikrotikAPIEnabled *bool    `json:"mikrotik_api_enabled"`
	IsDefaultMikrotik  *bool    `json:"is_default_mikrotik"`
}

func (s *deviceService) CreateDevice(ctx context.Context, tenantID string, req *CreateDeviceRequest) (*entity.Device, error) {
	// Check if serial number already exists
	existing, _ := s.deviceRepo.GetBySerialNumber(ctx, tenantID, req.SerialNumber)
	if existing != nil {
		return nil, errors.NewValidationError("device with this serial number already exists")
	}

	// If this is set as default Mikrotik, unset any existing default
	if req.IsDefaultMikrotik {
		defaultDevice, _ := s.deviceRepo.GetDefaultMikrotik(ctx, tenantID)
		if defaultDevice != nil {
			defaultDevice.IsDefaultMikrotik = false
			_ = s.deviceRepo.Update(ctx, defaultDevice)
		}
	}

	device := &entity.Device{
		TenantID:                  tenantID,
		DeviceName:                req.DeviceName,
		DeviceType:                req.DeviceType,
		SerialNumber:              req.SerialNumber,
		MACAddress:                req.MACAddress,
		Brand:                     req.Brand,
		Model:                     req.Model,
		FirmwareVersion:           req.FirmwareVersion,
		IPAddress:                 req.IPAddress,
		SubnetMask:                req.SubnetMask,
		Gateway:                   req.Gateway,
		Location:                  req.Location,
		Latitude:                  req.Latitude,
		Longitude:                 req.Longitude,
		Status:                    entity.DeviceStatusOffline,
		CustomerID:                req.CustomerID,
		ParentDeviceID:            req.ParentDeviceID,
		PurchasePrice:             req.PurchasePrice,
		Notes:                     req.Notes,
		MikrotikUsername:          req.MikrotikUsername,
		MikrotikPasswordEncrypted: req.MikrotikPassword, // TODO: Encrypt password
		MikrotikPort:              req.MikrotikPort,
		MikrotikAPIEnabled:        req.MikrotikAPIEnabled,
		IsDefaultMikrotik:         req.IsDefaultMikrotik,
		ConnectionStatus:          entity.ConnectionStatusDisconnected,
	}

	if device.MikrotikPort == "" {
		device.MikrotikPort = "8728"
	}

	if err := s.deviceRepo.Create(ctx, device); err != nil {
		return nil, err
	}

	return device, nil
}

func (s *deviceService) UpdateDevice(ctx context.Context, tenantID, deviceID string, req *UpdateDeviceRequest) (*entity.Device, error) {
	device, err := s.deviceRepo.GetByID(ctx, deviceID)
	if err != nil {
		return nil, errors.NewNotFoundError("device not found")
	}
	if device.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("device does not belong to this tenant")
	}

	// If this is set as default Mikrotik, unset any existing default
	if req.IsDefaultMikrotik != nil && *req.IsDefaultMikrotik {
		defaultDevice, _ := s.deviceRepo.GetDefaultMikrotik(ctx, tenantID)
		if defaultDevice != nil && defaultDevice.ID != deviceID {
			defaultDevice.IsDefaultMikrotik = false
			_ = s.deviceRepo.Update(ctx, defaultDevice)
		}
	}

	if req.DeviceName != "" {
		device.DeviceName = req.DeviceName
	}
	if req.DeviceType != "" {
		device.DeviceType = req.DeviceType
	}
	if req.MACAddress != "" {
		device.MACAddress = req.MACAddress
	}
	if req.Brand != "" {
		device.Brand = req.Brand
	}
	if req.Model != "" {
		device.Model = req.Model
	}
	if req.FirmwareVersion != "" {
		device.FirmwareVersion = req.FirmwareVersion
	}
	if req.IPAddress != "" {
		device.IPAddress = req.IPAddress
	}
	if req.SubnetMask != "" {
		device.SubnetMask = req.SubnetMask
	}
	if req.Gateway != "" {
		device.Gateway = req.Gateway
	}
	if req.Location != "" {
		device.Location = req.Location
	}
	if req.Latitude != 0 {
		device.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		device.Longitude = req.Longitude
	}
	if req.Status != "" {
		device.Status = req.Status
	}
	if req.CustomerID != nil {
		device.CustomerID = req.CustomerID
	}
	if req.ParentDeviceID != nil {
		device.ParentDeviceID = req.ParentDeviceID
	}
	if req.PurchasePrice > 0 {
		device.PurchasePrice = req.PurchasePrice
	}
	if req.Notes != "" {
		device.Notes = req.Notes
	}
	if req.MikrotikUsername != "" {
		device.MikrotikUsername = req.MikrotikUsername
	}
	if req.MikrotikPassword != "" {
		device.MikrotikPasswordEncrypted = req.MikrotikPassword // TODO: Encrypt password
	}
	if req.MikrotikPort != "" {
		device.MikrotikPort = req.MikrotikPort
	}
	if req.MikrotikAPIEnabled != nil {
		device.MikrotikAPIEnabled = *req.MikrotikAPIEnabled
	}
	if req.IsDefaultMikrotik != nil {
		device.IsDefaultMikrotik = *req.IsDefaultMikrotik
	}

	if err := s.deviceRepo.Update(ctx, device); err != nil {
		return nil, err
	}

	return device, nil
}

func (s *deviceService) GetDeviceByID(ctx context.Context, tenantID, deviceID string) (*entity.Device, error) {
	device, err := s.deviceRepo.GetByID(ctx, deviceID)
	if err != nil {
		return nil, errors.NewNotFoundError("device not found")
	}
	if device.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("device does not belong to this tenant")
	}
	return device, nil
}

func (s *deviceService) ListDevices(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Device, int, error) {
	return s.deviceRepo.List(ctx, tenantID, page, perPage, filters)
}

func (s *deviceService) DeleteDevice(ctx context.Context, tenantID, deviceID string) error {
	device, err := s.deviceRepo.GetByID(ctx, deviceID)
	if err != nil {
		return errors.NewNotFoundError("device not found")
	}
	if device.TenantID != tenantID {
		return errors.NewUnauthorizedError("device does not belong to this tenant")
	}

	return s.deviceRepo.Delete(ctx, deviceID)
}

func (s *deviceService) TestMikrotikConnection(ctx context.Context, tenantID, deviceID string) (bool, error) {
	device, err := s.deviceRepo.GetByID(ctx, deviceID)
	if err != nil {
		return false, errors.NewNotFoundError("device not found")
	}
	if device.TenantID != tenantID {
		return false, errors.NewUnauthorizedError("device does not belong to this tenant")
	}

	if !device.MikrotikAPIEnabled {
		return false, errors.NewValidationError("Mikrotik API is not enabled for this device")
	}

	// Test connection
	success, err := s.mikrotikSvc.TestConnection(ctx, device.IPAddress, device.MikrotikPort, 
		device.MikrotikUsername, device.MikrotikPasswordEncrypted)
	
	if err != nil {
		_ = s.deviceRepo.UpdateConnectionStatus(ctx, deviceID, entity.ConnectionStatusError)
		return false, err
	}

	if success {
		_ = s.deviceRepo.UpdateConnectionStatus(ctx, deviceID, entity.ConnectionStatusConnected)
	} else {
		_ = s.deviceRepo.UpdateConnectionStatus(ctx, deviceID, entity.ConnectionStatusDisconnected)
	}

	return success, nil
}

func (s *deviceService) SyncMikrotikQueues(ctx context.Context, tenantID, deviceID string) error {
	device, err := s.deviceRepo.GetByID(ctx, deviceID)
	if err != nil {
		return errors.NewNotFoundError("device not found")
	}
	if device.TenantID != tenantID {
		return errors.NewUnauthorizedError("device does not belong to this tenant")
	}

	if !device.MikrotikAPIEnabled {
		return errors.NewValidationError("Mikrotik API is not enabled for this device")
	}

	// Connect to Mikrotik
	if err := s.mikrotikSvc.Connect(ctx, device.IPAddress, device.MikrotikPort,
		device.MikrotikUsername, device.MikrotikPasswordEncrypted); err != nil {
		return err
	}
	defer s.mikrotikSvc.Disconnect()

	// Get queue list
	queues, err := s.mikrotikSvc.GetQueueList(ctx)
	if err != nil {
		return err
	}

	// TODO: Sync queues with customer service plans
	_ = queues

	return nil
}
