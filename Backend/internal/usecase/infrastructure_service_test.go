package usecase

import (
	"context"
	"testing"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockInfrastructureRepository struct {
	mock.Mock
}

// OLT methods
func (m *MockInfrastructureRepository) CreateOLT(ctx context.Context, olt *entity.OLT) error {
	args := m.Called(ctx, olt)
	return args.Error(0)
}

func (m *MockInfrastructureRepository) UpdateOLT(ctx context.Context, olt *entity.OLT) error {
	args := m.Called(ctx, olt)
	return args.Error(0)
}

func (m *MockInfrastructureRepository) GetOLTByID(ctx context.Context, id string) (*entity.OLT, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.OLT), args.Error(1)
}

func (m *MockInfrastructureRepository) ListOLTs(ctx context.Context, tenantID string, isActive *bool) ([]*entity.OLT, error) {
	args := m.Called(ctx, tenantID, isActive)
	return args.Get(0).([]*entity.OLT), args.Error(1)
}

func (m *MockInfrastructureRepository) DeleteOLT(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// ODC methods
func (m *MockInfrastructureRepository) CreateODC(ctx context.Context, odc *entity.ODC) error {
	args := m.Called(ctx, odc)
	return args.Error(0)
}

func (m *MockInfrastructureRepository) UpdateODC(ctx context.Context, odc *entity.ODC) error {
	args := m.Called(ctx, odc)
	return args.Error(0)
}

func (m *MockInfrastructureRepository) GetODCByID(ctx context.Context, id string) (*entity.ODC, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.ODC), args.Error(1)
}

func (m *MockInfrastructureRepository) ListODCs(ctx context.Context, tenantID string, oltID string, isActive *bool) ([]*entity.ODC, error) {
	args := m.Called(ctx, tenantID, oltID, isActive)
	return args.Get(0).([]*entity.ODC), args.Error(1)
}

func (m *MockInfrastructureRepository) DeleteODC(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// ODP methods
func (m *MockInfrastructureRepository) CreateODP(ctx context.Context, odp *entity.ODP) error {
	args := m.Called(ctx, odp)
	return args.Error(0)
}

func (m *MockInfrastructureRepository) UpdateODP(ctx context.Context, odp *entity.ODP) error {
	args := m.Called(ctx, odp)
	return args.Error(0)
}

func (m *MockInfrastructureRepository) GetODPByID(ctx context.Context, id string) (*entity.ODP, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.ODP), args.Error(1)
}

func (m *MockInfrastructureRepository) ListODPs(ctx context.Context, tenantID string, odcID string, isActive *bool) ([]*entity.ODP, error) {
	args := m.Called(ctx, tenantID, odcID, isActive)
	return args.Get(0).([]*entity.ODP), args.Error(1)
}

func (m *MockInfrastructureRepository) DeleteODP(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestInfrastructureService_CreateOLT(t *testing.T) {
	mockRepo := new(MockInfrastructureRepository)
	service := NewInfrastructureService(mockRepo)

	ctx := context.Background()
	tenantID := "tenant-123"

	req := &CreateOLTRequest{
		Name:      "OLT-001",
		IPAddress: "192.168.1.1",
		Location:  "Jakarta",
		Vendor:    "Huawei",
	}

	t.Run("Success", func(t *testing.T) {
		mockRepo.On("CreateOLT", ctx, mock.AnythingOfType("*entity.OLT")).Return(nil).Once()

		olt, err := service.CreateOLT(ctx, tenantID, req)

		assert.NoError(t, err)
		assert.NotNil(t, olt)
		assert.Equal(t, tenantID, olt.TenantID)
		assert.Equal(t, req.Name, olt.Name)
		assert.Equal(t, req.IPAddress, olt.IPAddress)
		assert.True(t, olt.IsActive)
		mockRepo.AssertExpectations(t)
	})
}

func TestInfrastructureService_CreateODC(t *testing.T) {
	mockRepo := new(MockInfrastructureRepository)
	service := NewInfrastructureService(mockRepo)

	ctx := context.Background()
	tenantID := "tenant-123"
	oltID := "olt-123"

	olt := &entity.OLT{
		ID:       oltID,
		TenantID: tenantID,
		Name:     "OLT-001",
	}

	req := &CreateODCRequest{
		OLTID:    oltID,
		Name:     "ODC-001",
		Location: "Jakarta Selatan",
		Capacity: 48,
	}

	t.Run("Success", func(t *testing.T) {
		mockRepo.On("GetOLTByID", ctx, oltID).Return(olt, nil).Once()
		mockRepo.On("CreateODC", ctx, mock.AnythingOfType("*entity.ODC")).Return(nil).Once()

		odc, err := service.CreateODC(ctx, tenantID, req)

		assert.NoError(t, err)
		assert.NotNil(t, odc)
		assert.Equal(t, tenantID, odc.TenantID)
		assert.Equal(t, oltID, odc.OLTID)
		assert.Equal(t, req.Name, odc.Name)
		assert.Equal(t, req.Capacity, odc.Capacity)
		assert.True(t, odc.IsActive)
		mockRepo.AssertExpectations(t)
	})

	t.Run("OLT Not Found", func(t *testing.T) {
		mockRepo.On("GetOLTByID", ctx, oltID).Return(nil, assert.AnError).Once()

		odc, err := service.CreateODC(ctx, tenantID, req)

		assert.Error(t, err)
		assert.Nil(t, odc)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Wrong Tenant", func(t *testing.T) {
		wrongTenantOLT := &entity.OLT{
			ID:       oltID,
			TenantID: "wrong-tenant",
			Name:     "OLT-001",
		}
		mockRepo.On("GetOLTByID", ctx, oltID).Return(wrongTenantOLT, nil).Once()

		odc, err := service.CreateODC(ctx, tenantID, req)

		assert.Error(t, err)
		assert.Nil(t, odc)
		mockRepo.AssertExpectations(t)
	})
}

func TestInfrastructureService_CreateODP(t *testing.T) {
	mockRepo := new(MockInfrastructureRepository)
	service := NewInfrastructureService(mockRepo)

	ctx := context.Background()
	tenantID := "tenant-123"
	odcID := "odc-123"

	odc := &entity.ODC{
		ID:       odcID,
		TenantID: tenantID,
		Name:     "ODC-001",
	}

	req := &CreateODPRequest{
		ODCID:    odcID,
		Name:     "ODP-001",
		Location: "Jl. Sudirman No. 1",
		Capacity: 8,
	}

	t.Run("Success", func(t *testing.T) {
		mockRepo.On("GetODCByID", ctx, odcID).Return(odc, nil).Once()
		mockRepo.On("CreateODP", ctx, mock.AnythingOfType("*entity.ODP")).Return(nil).Once()

		odp, err := service.CreateODP(ctx, tenantID, req)

		assert.NoError(t, err)
		assert.NotNil(t, odp)
		assert.Equal(t, tenantID, odp.TenantID)
		assert.Equal(t, odcID, odp.ODCID)
		assert.Equal(t, req.Name, odp.Name)
		assert.Equal(t, req.Capacity, odp.Capacity)
		assert.True(t, odp.IsActive)
		mockRepo.AssertExpectations(t)
	})
}

func TestInfrastructureService_DeleteOLT(t *testing.T) {
	mockRepo := new(MockInfrastructureRepository)
	service := NewInfrastructureService(mockRepo)

	ctx := context.Background()
	tenantID := "tenant-123"
	oltID := "olt-123"

	olt := &entity.OLT{
		ID:       oltID,
		TenantID: tenantID,
		Name:     "OLT-001",
	}

	t.Run("Success - No ODCs", func(t *testing.T) {
		mockRepo.On("GetOLTByID", ctx, oltID).Return(olt, nil).Once()
		mockRepo.On("ListODCs", ctx, tenantID, oltID, (*bool)(nil)).Return([]*entity.ODC{}, nil).Once()
		mockRepo.On("DeleteOLT", ctx, oltID).Return(nil).Once()

		err := service.DeleteOLT(ctx, tenantID, oltID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Fail - Has ODCs", func(t *testing.T) {
		odcs := []*entity.ODC{
			{ID: "odc-1", OLTID: oltID},
		}
		mockRepo.On("GetOLTByID", ctx, oltID).Return(olt, nil).Once()
		mockRepo.On("ListODCs", ctx, tenantID, oltID, (*bool)(nil)).Return(odcs, nil).Once()

		err := service.DeleteOLT(ctx, tenantID, oltID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "Cannot delete OLT with existing ODCs")
		mockRepo.AssertExpectations(t)
	})
}

func TestInfrastructureService_DeleteODC(t *testing.T) {
	mockRepo := new(MockInfrastructureRepository)
	service := NewInfrastructureService(mockRepo)

	ctx := context.Background()
	tenantID := "tenant-123"
	odcID := "odc-123"

	odc := &entity.ODC{
		ID:       odcID,
		TenantID: tenantID,
		Name:     "ODC-001",
	}

	t.Run("Success - No ODPs", func(t *testing.T) {
		mockRepo.On("GetODCByID", ctx, odcID).Return(odc, nil).Once()
		mockRepo.On("ListODPs", ctx, tenantID, odcID, (*bool)(nil)).Return([]*entity.ODP{}, nil).Once()
		mockRepo.On("DeleteODC", ctx, odcID).Return(nil).Once()

		err := service.DeleteODC(ctx, tenantID, odcID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Fail - Has ODPs", func(t *testing.T) {
		odps := []*entity.ODP{
			{ID: "odp-1", ODCID: odcID},
		}
		mockRepo.On("GetODCByID", ctx, odcID).Return(odc, nil).Once()
		mockRepo.On("ListODPs", ctx, tenantID, odcID, (*bool)(nil)).Return(odps, nil).Once()

		err := service.DeleteODC(ctx, tenantID, odcID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "Cannot delete ODC with existing ODPs")
		mockRepo.AssertExpectations(t)
	})
}

func TestInfrastructureService_ListOLTs(t *testing.T) {
	mockRepo := new(MockInfrastructureRepository)
	service := NewInfrastructureService(mockRepo)

	ctx := context.Background()
	tenantID := "tenant-123"

	olts := []*entity.OLT{
		{ID: "olt-1", TenantID: tenantID, Name: "OLT-001", IsActive: true},
		{ID: "olt-2", TenantID: tenantID, Name: "OLT-002", IsActive: true},
	}

	t.Run("Success - All OLTs", func(t *testing.T) {
		mockRepo.On("ListOLTs", ctx, tenantID, (*bool)(nil)).Return(olts, nil).Once()

		result, err := service.ListOLTs(ctx, tenantID, nil)

		assert.NoError(t, err)
		assert.Len(t, result, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Success - Active Only", func(t *testing.T) {
		isActive := true
		mockRepo.On("ListOLTs", ctx, tenantID, &isActive).Return(olts, nil).Once()

		result, err := service.ListOLTs(ctx, tenantID, &isActive)

		assert.NoError(t, err)
		assert.Len(t, result, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestInfrastructureService_UpdateOLT(t *testing.T) {
	mockRepo := new(MockInfrastructureRepository)
	service := NewInfrastructureService(mockRepo)

	ctx := context.Background()
	tenantID := "tenant-123"
	oltID := "olt-123"

	olt := &entity.OLT{
		ID:        oltID,
		TenantID:  tenantID,
		Name:      "OLT-001",
		IPAddress: "192.168.1.1",
		IsActive:  true,
	}

	req := &UpdateOLTRequest{
		Name:      "OLT-001-Updated",
		IPAddress: "192.168.1.2",
	}

	t.Run("Success", func(t *testing.T) {
		mockRepo.On("GetOLTByID", ctx, oltID).Return(olt, nil).Once()
		mockRepo.On("UpdateOLT", ctx, mock.AnythingOfType("*entity.OLT")).Return(nil).Once()

		result, err := service.UpdateOLT(ctx, tenantID, oltID, req)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, req.Name, result.Name)
		assert.Equal(t, req.IPAddress, result.IPAddress)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Wrong Tenant", func(t *testing.T) {
		wrongTenantOLT := &entity.OLT{
			ID:       oltID,
			TenantID: "wrong-tenant",
			Name:     "OLT-001",
		}
		mockRepo.On("GetOLTByID", ctx, oltID).Return(wrongTenantOLT, nil).Once()

		result, err := service.UpdateOLT(ctx, tenantID, oltID, req)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}
