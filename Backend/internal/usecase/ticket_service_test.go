package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mock repositories
type MockTicketRepository struct {
	mock.Mock
}

func (m *MockTicketRepository) Create(ctx context.Context, ticket *entity.Ticket) error {
	args := m.Called(ctx, ticket)
	return args.Error(0)
}

func (m *MockTicketRepository) Update(ctx context.Context, ticket *entity.Ticket) error {
	args := m.Called(ctx, ticket)
	return args.Error(0)
}

func (m *MockTicketRepository) GetByID(ctx context.Context, id string) (*entity.Ticket, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Ticket), args.Error(1)
}

func (m *MockTicketRepository) GetByTicketNumber(ctx context.Context, tenantID, ticketNumber string) (*entity.Ticket, error) {
	args := m.Called(ctx, tenantID, ticketNumber)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Ticket), args.Error(1)
}

func (m *MockTicketRepository) List(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Ticket, int, error) {
	args := m.Called(ctx, tenantID, page, perPage, filters)
	return args.Get(0).([]*entity.Ticket), args.Int(1), args.Error(2)
}

func (m *MockTicketRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockTicketRepository) CreateActivity(ctx context.Context, activity *entity.TicketActivity) error {
	args := m.Called(ctx, activity)
	return args.Error(0)
}

func (m *MockTicketRepository) GetActivitiesByTicketID(ctx context.Context, ticketID string) ([]*entity.TicketActivity, error) {
	args := m.Called(ctx, ticketID)
	return args.Get(0).([]*entity.TicketActivity), args.Error(1)
}

func (m *MockTicketRepository) CountByStatus(ctx context.Context, tenantID, status string) (int, error) {
	args := m.Called(ctx, tenantID, status)
	return args.Int(0), args.Error(1)
}

func (m *MockTicketRepository) CountByPriority(ctx context.Context, tenantID, priority string) (int, error) {
	args := m.Called(ctx, tenantID, priority)
	return args.Int(0), args.Error(1)
}

type MockCustomerRepository struct {
	mock.Mock
}

func (m *MockCustomerRepository) FindByID(ctx context.Context, id string) (*entity.Customer, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Customer), args.Error(1)
}

func (m *MockCustomerRepository) Create(ctx context.Context, customer *entity.Customer) error {
	args := m.Called(ctx, customer)
	return args.Error(0)
}

func (m *MockCustomerRepository) Update(ctx context.Context, customer *entity.Customer) error {
	args := m.Called(ctx, customer)
	return args.Error(0)
}

func (m *MockCustomerRepository) FindByTenantID(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Customer, int, error) {
	args := m.Called(ctx, tenantID, page, perPage, filters)
	return args.Get(0).([]*entity.Customer), args.Int(1), args.Error(2)
}

func (m *MockCustomerRepository) FindByCustomerCode(ctx context.Context, tenantID, customerCode string) (*entity.Customer, error) {
	args := m.Called(ctx, tenantID, customerCode)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Customer), args.Error(1)
}

func (m *MockCustomerRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockCustomerRepository) CountByTenantID(ctx context.Context, tenantID string) (int, error) {
	args := m.Called(ctx, tenantID)
	return args.Int(0), args.Error(1)
}

func (m *MockCustomerRepository) CountByStatus(ctx context.Context, tenantID, status string) (int, error) {
	args := m.Called(ctx, tenantID, status)
	return args.Int(0), args.Error(1)
}

func (m *MockCustomerRepository) CountNewCustomersThisMonth(ctx context.Context, tenantID string) (int, error) {
	args := m.Called(ctx, tenantID)
	return args.Int(0), args.Error(1)
}

func (m *MockCustomerRepository) GenerateCustomerCode(ctx context.Context, tenantID string) (string, error) {
	args := m.Called(ctx, tenantID)
	return args.String(0), args.Error(1)
}

func TestTicketService_CreateTicket(t *testing.T) {
	mockTicketRepo := new(MockTicketRepository)
	mockCustomerRepo := new(MockCustomerRepository)
	service := NewTicketService(mockTicketRepo, mockCustomerRepo)

	ctx := context.Background()
	tenantID := "tenant-123"
	customerID := "customer-123"
	userID := "user-123"

	customer := &entity.Customer{
		ID:       customerID,
		TenantID: tenantID,
		Name:     "Test Customer",
	}

	req := &CreateTicketRequest{
		CustomerID:  customerID,
		Title:       "Test Ticket",
		Description: "Test Description",
		Priority:    "high",
	}

	t.Run("Success", func(t *testing.T) {
		mockCustomerRepo.On("FindByID", ctx, customerID).Return(customer, nil).Once()
		mockTicketRepo.On("List", ctx, tenantID, 1, 1000, mock.Anything).Return([]*entity.Ticket{}, 0, nil).Once()
		mockTicketRepo.On("Create", ctx, mock.AnythingOfType("*entity.Ticket")).Return(nil).Once()
		mockTicketRepo.On("CreateActivity", ctx, mock.AnythingOfType("*entity.TicketActivity")).Return(nil).Once()

		ticket, err := service.CreateTicket(ctx, tenantID, customerID, userID, req)

		assert.NoError(t, err)
		assert.NotNil(t, ticket)
		assert.Equal(t, tenantID, ticket.TenantID)
		assert.Equal(t, customerID, ticket.CustomerID)
		assert.Equal(t, req.Title, ticket.Title)
		assert.Equal(t, req.Priority, ticket.Priority)
		assert.Equal(t, entity.TicketStatusOpen, ticket.Status)
		mockCustomerRepo.AssertExpectations(t)
		mockTicketRepo.AssertExpectations(t)
	})

	t.Run("Customer Not Found", func(t *testing.T) {
		mockCustomerRepo.On("FindByID", ctx, customerID).Return(nil, assert.AnError).Once()

		ticket, err := service.CreateTicket(ctx, tenantID, customerID, userID, req)

		assert.Error(t, err)
		assert.Nil(t, ticket)
		mockCustomerRepo.AssertExpectations(t)
	})
}

func TestTicketService_AssignTicket(t *testing.T) {
	mockTicketRepo := new(MockTicketRepository)
	mockCustomerRepo := new(MockCustomerRepository)
	service := NewTicketService(mockTicketRepo, mockCustomerRepo)

	ctx := context.Background()
	tenantID := "tenant-123"
	ticketID := "ticket-123"
	assignedTo := "user-456"
	userID := "user-123"

	ticket := &entity.Ticket{
		ID:       ticketID,
		TenantID: tenantID,
		Status:   entity.TicketStatusOpen,
	}

	t.Run("Success", func(t *testing.T) {
		mockTicketRepo.On("GetByID", ctx, ticketID).Return(ticket, nil).Once()
		mockTicketRepo.On("Update", ctx, mock.AnythingOfType("*entity.Ticket")).Return(nil).Once()
		mockTicketRepo.On("CreateActivity", ctx, mock.AnythingOfType("*entity.TicketActivity")).Return(nil).Once()

		err := service.AssignTicket(ctx, tenantID, ticketID, assignedTo, userID)

		assert.NoError(t, err)
		assert.Equal(t, &assignedTo, ticket.AssignedTo)
		assert.Equal(t, entity.TicketStatusInProgress, ticket.Status)
		mockTicketRepo.AssertExpectations(t)
	})

	t.Run("Ticket Not Found", func(t *testing.T) {
		mockTicketRepo.On("GetByID", ctx, ticketID).Return(nil, assert.AnError).Once()

		err := service.AssignTicket(ctx, tenantID, ticketID, assignedTo, userID)

		assert.Error(t, err)
		mockTicketRepo.AssertExpectations(t)
	})
}

func TestTicketService_ResolveTicket(t *testing.T) {
	mockTicketRepo := new(MockTicketRepository)
	mockCustomerRepo := new(MockCustomerRepository)
	service := NewTicketService(mockTicketRepo, mockCustomerRepo)

	ctx := context.Background()
	tenantID := "tenant-123"
	ticketID := "ticket-123"
	userID := "user-123"
	resolutionNotes := "Issue resolved"

	ticket := &entity.Ticket{
		ID:       ticketID,
		TenantID: tenantID,
		Status:   entity.TicketStatusInProgress,
	}

	t.Run("Success", func(t *testing.T) {
		mockTicketRepo.On("GetByID", ctx, ticketID).Return(ticket, nil).Once()
		mockTicketRepo.On("Update", ctx, mock.AnythingOfType("*entity.Ticket")).Return(nil).Once()
		mockTicketRepo.On("CreateActivity", ctx, mock.AnythingOfType("*entity.TicketActivity")).Return(nil).Once()

		err := service.ResolveTicket(ctx, tenantID, ticketID, userID, resolutionNotes)

		assert.NoError(t, err)
		assert.Equal(t, entity.TicketStatusResolved, ticket.Status)
		assert.NotNil(t, ticket.ResolvedAt)
		mockTicketRepo.AssertExpectations(t)
	})
}

func TestTicketService_ListTickets(t *testing.T) {
	mockTicketRepo := new(MockTicketRepository)
	mockCustomerRepo := new(MockCustomerRepository)
	service := NewTicketService(mockTicketRepo, mockCustomerRepo)

	ctx := context.Background()
	tenantID := "tenant-123"
	page := 1
	perPage := 10
	filters := map[string]interface{}{
		"status": "open",
	}

	tickets := []*entity.Ticket{
		{
			ID:       "ticket-1",
			TenantID: tenantID,
			Title:    "Ticket 1",
			Status:   entity.TicketStatusOpen,
		},
		{
			ID:       "ticket-2",
			TenantID: tenantID,
			Title:    "Ticket 2",
			Status:   entity.TicketStatusOpen,
		},
	}

	t.Run("Success", func(t *testing.T) {
		mockTicketRepo.On("List", ctx, tenantID, page, perPage, filters).Return(tickets, 2, nil).Once()

		result, total, err := service.ListTickets(ctx, tenantID, page, perPage, filters)

		assert.NoError(t, err)
		assert.Equal(t, 2, total)
		assert.Len(t, result, 2)
		mockTicketRepo.AssertExpectations(t)
	})
}

func TestTicketService_GetTicketByID(t *testing.T) {
	mockTicketRepo := new(MockTicketRepository)
	mockCustomerRepo := new(MockCustomerRepository)
	service := NewTicketService(mockTicketRepo, mockCustomerRepo)

	ctx := context.Background()
	tenantID := "tenant-123"
	ticketID := "ticket-123"

	ticket := &entity.Ticket{
		ID:       ticketID,
		TenantID: tenantID,
		Title:    "Test Ticket",
	}

	activities := []*entity.TicketActivity{
		{
			ID:          "activity-1",
			TicketID:    ticketID,
			Description: "Ticket created",
			CreatedAt:   time.Now(),
		},
	}

	t.Run("Success", func(t *testing.T) {
		mockTicketRepo.On("GetByID", ctx, ticketID).Return(ticket, nil).Once()
		mockTicketRepo.On("GetActivitiesByTicketID", ctx, ticketID).Return(activities, nil).Once()

		result, err := service.GetTicketByID(ctx, tenantID, ticketID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, ticket, result.Ticket)
		assert.Len(t, result.Activities, 1)
		mockTicketRepo.AssertExpectations(t)
	})

	t.Run("Wrong Tenant", func(t *testing.T) {
		wrongTenantTicket := &entity.Ticket{
			ID:       ticketID,
			TenantID: "wrong-tenant",
			Title:    "Test Ticket",
		}
		mockTicketRepo.On("GetByID", ctx, ticketID).Return(wrongTenantTicket, nil).Once()

		result, err := service.GetTicketByID(ctx, tenantID, ticketID)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockTicketRepo.AssertExpectations(t)
	})
}
