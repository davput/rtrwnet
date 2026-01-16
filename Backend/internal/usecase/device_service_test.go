package usecase

import (
	"context"
	"testing"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockDeviceRepository struct {
	mock.Mock
}

func (m *MockDeviceRepository) Create(ctx context.Context, device *entity.Device) error {
	args := m.Called(ctx, device)
	return args.Error(0)
}

func (m *MockDeviceRepository) Update(ctx context.Context, device *entity.Device) error {
	args := m.Called(ctx, device)
	return args.Error(0)
}

func (m *MockDeviceRepository) GetByID(ctx context.Context, id string) (*entity.Device, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Device), args.Error(1)
}

func (m *MockDeviceRepository) GetBySerialNumber(ctx context.Context, tenantID, serialNumber string) (*entity.Device, error) {
	args := m.Called(ctx, tenantID, serialNumber)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Device), args.Error(1)
}

func (m *MockDeviceRepository) List(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Device, int, error) {
	args := m.Called(ctx, tenantID, page, perPage, filters)
	return args.Get(0).([]*entity.Device), args.Int(1), args.Error(2)
}

func (m *MockDeviceRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockDeviceRepository) UpdateConnectionStatus(ctx context.Context, deviceID, status string) error {
	args := m.Called(ctx, deviceID, status)
	return args.Error(0)
}

func (m *MockDeviceRepository) GetMikrotikDevices(ctx context.Context, tenantID string) ([]*entity.Device, error) {
	args := m.Called(ctx, tenantID)
	return args.Get(0).([]*entity.Device), args.Error(1)
}

func (m *MockDeviceRepository) GetDefaultMikrotik(ctx context.Context, tenantID string) (*entity.Device, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Device), args.Error(1)
}

type MockMikrotikService struct {
	mock.Mock
}

func (m *MockMikrotikService) Connect(ctx context.Context, host, port, username, password string) error {
	args := m.Called(ctx, host, port, username, password)
	return args.Error(0)
}

func (m *MockMikrotikService) Disconnect() error {
	args := m.Called()
	return args.Error(0)
}

func (m *MockMikrotikService) CreateQueue(ctx context.Context, queueName, targetIP string, maxUpload, maxDownload int) error {
	args := m.Called(ctx, queueName, targetIP, maxUpload, maxDownload)
	return args.Error(0)
}

func (m *MockMikrotikService) UpdateQueue(ctx context.Context, queueName string, maxUpload, maxDownload int) error {
	args := m.Called(ctx, queueName, maxUpload, maxDownload)
	return args.Error(0)
}

func (m *MockMikrotikService) DeleteQueue(ctx context.Context, queueName string) error {
	args := m.Called(ctx, queueName)
	return args.Error(0)
}

func (m *MockMikrotikService) GetQueueList(ctx context.Context) ([]MikrotikQueue, error) {
	args := m.Called(ctx)
	return args.Get(0).([]MikrotikQueue), args.Error(1)
}

func (m *MockMikrotikService) TestConnection(ctx context.Context, host, port, username, password string) (bool, error) {
	args := m.Called(ctx, host, port, username, password)
	return args.Bool(0), args.Error(1)
}

func TestDeviceService_CreateDevice(t *testing.T) {
	mockDeviceRepo := new(MockDeviceRepository)
	mockMikrotikSvc := new(MockMikrotikService)
	service := NewDeviceService(mockDeviceRepo, mockMikrotikSvc)

	ctx := context.Background()
	tenantID := "tenant-123"

	req := &CreateDeviceRequest{
		DeviceName:         "Router-001",
		DeviceType:         "router",
		SerialNumber:       "SN123456",
		Brand:              "Mikrotik",
		Model:              "RB750",
		IPAddress:          "192.168.1.1",
		MikrotikAPIEnabled: true,
		IsDefaultMikrotik:  false,
	}

	t.Run("Success", func(t *testing.T) {
		mockDeviceRepo.On("GetBySerialNumber", ctx, tenantID, req.SerialNumber).Return(nil, assert.AnError).Once()
		mockDeviceRepo.On("Create", ctx, mock.AnythingOfType("*entity.Device")).Return(nil).Once()

		device, err := service.CreateDevice(ctx, tenantID, req)

		assert.NoError(t, err)
		assert.NotNil(t, device)
		assert.Equal(t, tenantID, device.TenantID)
		assert.Equal(t, req.DeviceName, device.DeviceName)
		assert.Equal(t, req.SerialNumber, device.SerialNumber)
		assert.Equal(t, entity.DeviceStatusOffline, device.Status)
		mockDeviceRepo.AssertExpectations(t)
	})

	t.Run("Duplicate Serial Number", func(t *testing.T) {
		existingDevice := &entity.Device{
			ID:           "device-123",
			TenantID:     tenantID,
			SerialNumber: req.SerialNumber,
		}
		mockDeviceRepo.On("GetBySerialNumber", ctx, tenantID, req.SerialNumber).Return(existingDevice, nil).Once()

		device, err := service.CreateDevice(ctx, tenantID, req)

		assert.Error(t, err)
		assert.Nil(t, device)
		assert.Contains(t, err.Error(), "already exists")
		mockDeviceRepo.AssertExpectations(t)
	})

	t.Run("Set As Default Mikrotik", func(t *testing.T) {
		reqWithDefault := &CreateDeviceRequest{
			DeviceName:         "Router-002",
			DeviceType:         "router",
			SerialNumber:       "SN789012",
			MikrotikAPIEnabled: true,
			IsDefaultMikrotik:  true,
		}

		existingDefault := &entity.Device{
			ID:                "device-old",
			TenantID:          tenantID,
			IsDefaultMikrotik: true,
		}

		mockDeviceRepo.On("GetBySerialNumber", ctx, tenantID, reqWithDefault.SerialNumber).Return(nil, assert.AnError).Once()
		mockDeviceRepo.On("GetDefaultMikrotik", ctx, tenantID).Return(existingDefault, nil).Once()
		mockDeviceRepo.On("Update", ctx, existingDefault).Return(nil).Once()
		mockDeviceRepo.On("Create", ctx, mock.AnythingOfType("*entity.Device")).Return(nil).Once()

		device, err := service.CreateDevice(ctx, tenantID, reqWithDefault)

		assert.NoError(t, err)
		assert.NotNil(t, device)
		assert.True(t, device.IsDefaultMikrotik)
		assert.False(t, existingDefault.IsDefaultMikrotik)
		mockDeviceRepo.AssertExpectations(t)
	})
}

func TestDeviceService_UpdateDevice(t *testing.T) {
	mockDeviceRepo := new(MockDeviceRepository)
	mockMikrotikSvc := new(MockMikrotikService)
	service := NewDeviceService(mockDeviceRepo, mockMikrotikSvc)

	ctx := context.Background()
	tenantID := "tenant-123"
	deviceID := "device-123"

	device := &entity.Device{
		ID:         deviceID,
		TenantID:   tenantID,
		DeviceName: "Router-001",
		Status:     entity.DeviceStatusOffline,
	}

	req := &UpdateDeviceRequest{
		DeviceName: "Router-001-Updated",
		Status:     entity.DeviceStatusOnline,
	}

	t.Run("Success", func(t *testing.T) {
		mockDeviceRepo.On("GetByID", ctx, deviceID).Return(device, nil).Once()
		mockDeviceRepo.On("Update", ctx, mock.AnythingOfType("*entity.Device")).Return(nil).Once()

		result, err := service.UpdateDevice(ctx, tenantID, deviceID, req)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, req.DeviceName, result.DeviceName)
		assert.Equal(t, req.Status, result.Status)
		mockDeviceRepo.AssertExpectations(t)
	})

	t.Run("Device Not Found", func(t *testing.T) {
		mockDeviceRepo.On("GetByID", ctx, deviceID).Return(nil, assert.AnError).Once()

		result, err := service.UpdateDevice(ctx, tenantID, deviceID, req)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockDeviceRepo.AssertExpectations(t)
	})

	t.Run("Wrong Tenant", func(t *testing.T) {
		wrongTenantDevice := &entity.Device{
			ID:       deviceID,
			TenantID: "wrong-tenant",
		}
		mockDeviceRepo.On("GetByID", ctx, deviceID).Return(wrongTenantDevice, nil).Once()

		result, err := service.UpdateDevice(ctx, tenantID, deviceID, req)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockDeviceRepo.AssertExpectations(t)
	})
}

func TestDeviceService_TestMikrotikConnection(t *testing.T) {
	mockDeviceRepo := new(MockDeviceRepository)
	mockMikrotikSvc := new(MockMikrotikService)
	service := NewDeviceService(mockDeviceRepo, mockMikrotikSvc)

	ctx := context.Background()
	tenantID := "tenant-123"
	deviceID := "device-123"

	device := &entity.Device{
		ID:                        deviceID,
		TenantID:                  tenantID,
		IPAddress:                 "192.168.1.1",
		MikrotikPort:              "8728",
		MikrotikUsername:          "admin",
		MikrotikPasswordEncrypted: "password",
		MikrotikAPIEnabled:        true,
	}

	t.Run("Success", func(t *testing.T) {
		mockDeviceRepo.On("GetByID", ctx, deviceID).Return(device, nil).Once()
		mockMikrotikSvc.On("TestConnection", ctx, device.IPAddress, device.MikrotikPort, 
			device.MikrotikUsername, device.MikrotikPasswordEncrypted).Return(true, nil).Once()
		mockDeviceRepo.On("UpdateConnectionStatus", ctx, deviceID, entity.ConnectionStatusConnected).Return(nil).Once()

		success, err := service.TestMikrotikConnection(ctx, tenantID, deviceID)

		assert.NoError(t, err)
		assert.True(t, success)
		mockDeviceRepo.AssertExpectations(t)
		mockMikrotikSvc.AssertExpectations(t)
	})

	t.Run("API Not Enabled", func(t *testing.T) {
		deviceNoAPI := &entity.Device{
			ID:                 deviceID,
			TenantID:           tenantID,
			MikrotikAPIEnabled: false,
		}
		mockDeviceRepo.On("GetByID", ctx, deviceID).Return(deviceNoAPI, nil).Once()

		success, err := service.TestMikrotikConnection(ctx, tenantID, deviceID)

		assert.Error(t, err)
		assert.False(t, success)
		assert.Contains(t, err.Error(), "not enabled")
		mockDeviceRepo.AssertExpectations(t)
	})

	t.Run("Connection Failed", func(t *testing.T) {
		mockDeviceRepo.On("GetByID", ctx, deviceID).Return(device, nil).Once()
		mockMikrotikSvc.On("TestConnection", ctx, device.IPAddress, device.MikrotikPort,
			device.MikrotikUsername, device.MikrotikPasswordEncrypted).Return(false, assert.AnError).Once()
		mockDeviceRepo.On("UpdateConnectionStatus", ctx, deviceID, entity.ConnectionStatusError).Return(nil).Once()

		success, err := service.TestMikrotikConnection(ctx, tenantID, deviceID)

		assert.Error(t, err)
		assert.False(t, success)
		mockDeviceRepo.AssertExpectations(t)
		mockMikrotikSvc.AssertExpectations(t)
	})
}

func TestDeviceService_ListDevices(t *testing.T) {
	mockDeviceRepo := new(MockDeviceRepository)
	mockMikrotikSvc := new(MockMikrotikService)
	service := NewDeviceService(mockDeviceRepo, mockMikrotikSvc)

	ctx := context.Background()
	tenantID := "tenant-123"
	page := 1
	perPage := 10
	filters := map[string]interface{}{
		"device_type": "router",
	}

	devices := []*entity.Device{
		{
			ID:         "device-1",
			TenantID:   tenantID,
			DeviceName: "Router-001",
			DeviceType: "router",
		},
		{
			ID:         "device-2",
			TenantID:   tenantID,
			DeviceName: "Router-002",
			DeviceType: "router",
		},
	}

	t.Run("Success", func(t *testing.T) {
		mockDeviceRepo.On("List", ctx, tenantID, page, perPage, filters).Return(devices, 2, nil).Once()

		result, total, err := service.ListDevices(ctx, tenantID, page, perPage, filters)

		assert.NoError(t, err)
		assert.Equal(t, 2, total)
		assert.Len(t, result, 2)
		mockDeviceRepo.AssertExpectations(t)
	})
}

func TestDeviceService_DeleteDevice(t *testing.T) {
	mockDeviceRepo := new(MockDeviceRepository)
	mockMikrotikSvc := new(MockMikrotikService)
	service := NewDeviceService(mockDeviceRepo, mockMikrotikSvc)

	ctx := context.Background()
	tenantID := "tenant-123"
	deviceID := "device-123"

	device := &entity.Device{
		ID:       deviceID,
		TenantID: tenantID,
	}

	t.Run("Success", func(t *testing.T) {
		mockDeviceRepo.On("GetByID", ctx, deviceID).Return(device, nil).Once()
		mockDeviceRepo.On("Delete", ctx, deviceID).Return(nil).Once()

		err := service.DeleteDevice(ctx, tenantID, deviceID)

		assert.NoError(t, err)
		mockDeviceRepo.AssertExpectations(t)
	})

	t.Run("Wrong Tenant", func(t *testing.T) {
		wrongTenantDevice := &entity.Device{
			ID:       deviceID,
			TenantID: "wrong-tenant",
		}
		mockDeviceRepo.On("GetByID", ctx, deviceID).Return(wrongTenantDevice, nil).Once()

		err := service.DeleteDevice(ctx, tenantID, deviceID)

		assert.Error(t, err)
		mockDeviceRepo.AssertExpectations(t)
	})
}
