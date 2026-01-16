package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
)

type TicketService interface {
	CreateTicket(ctx context.Context, tenantID, customerID, userID string, req *CreateTicketRequest) (*entity.Ticket, error)
	UpdateTicket(ctx context.Context, tenantID, ticketID, userID string, req *UpdateTicketRequest) (*entity.Ticket, error)
	GetTicketByID(ctx context.Context, tenantID, ticketID string) (*TicketDetail, error)
	ListTickets(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Ticket, int, error)
	AssignTicket(ctx context.Context, tenantID, ticketID, assignedTo, userID string) error
	ResolveTicket(ctx context.Context, tenantID, ticketID, userID, resolutionNotes string) error
	CloseTicket(ctx context.Context, tenantID, ticketID, userID string) error
	GetTicketActivities(ctx context.Context, ticketID string) ([]*entity.TicketActivity, error)
}

type ticketService struct {
	ticketRepo   repository.TicketRepository
	customerRepo repository.CustomerRepository
}

func NewTicketService(ticketRepo repository.TicketRepository, customerRepo repository.CustomerRepository) TicketService {
	return &ticketService{
		ticketRepo:   ticketRepo,
		customerRepo: customerRepo,
	}
}

type CreateTicketRequest struct {
	CustomerID  string `json:"customer_id" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
	Priority    string `json:"priority" binding:"required,oneof=low medium high urgent"`
}

type UpdateTicketRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority" binding:"omitempty,oneof=low medium high urgent"`
	Status      string `json:"status" binding:"omitempty,oneof=open in_progress resolved closed"`
}

type TicketDetail struct {
	Ticket     *entity.Ticket           `json:"ticket"`
	Activities []*entity.TicketActivity `json:"activities"`
}

func (s *ticketService) CreateTicket(ctx context.Context, tenantID, customerID, userID string, req *CreateTicketRequest) (*entity.Ticket, error) {
	// Verify customer exists and belongs to tenant
	customer, err := s.customerRepo.FindByID(ctx, req.CustomerID)
	if err != nil {
		return nil, errors.NewNotFoundError("customer not found")
	}
	if customer.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("customer does not belong to this tenant")
	}

	// Generate ticket number
	ticketNumber, err := s.generateTicketNumber(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	ticket := &entity.Ticket{
		TenantID:     tenantID,
		CustomerID:   req.CustomerID,
		TicketNumber: ticketNumber,
		Title:        req.Title,
		Description:  req.Description,
		Priority:     req.Priority,
		Status:       entity.TicketStatusOpen,
	}

	if err := s.ticketRepo.Create(ctx, ticket); err != nil {
		return nil, err
	}

	// Create activity log
	activity := &entity.TicketActivity{
		TicketID:     ticket.ID,
		ActivityType: entity.TicketActivityCreated,
		Description:  fmt.Sprintf("Ticket created with priority: %s", req.Priority),
		PerformedBy:  userID,
	}
	_ = s.ticketRepo.CreateActivity(ctx, activity)

	return ticket, nil
}

func (s *ticketService) UpdateTicket(ctx context.Context, tenantID, ticketID, userID string, req *UpdateTicketRequest) (*entity.Ticket, error) {
	ticket, err := s.ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return nil, errors.NewNotFoundError("ticket not found")
	}
	if ticket.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("ticket does not belong to this tenant")
	}

	oldStatus := ticket.Status
	oldPriority := ticket.Priority

	if req.Title != "" {
		ticket.Title = req.Title
	}
	if req.Description != "" {
		ticket.Description = req.Description
	}
	if req.Priority != "" && req.Priority != oldPriority {
		ticket.Priority = req.Priority
		activity := &entity.TicketActivity{
			TicketID:     ticket.ID,
			ActivityType: entity.TicketActivityStatusChanged,
			Description:  fmt.Sprintf("Priority changed from %s to %s", oldPriority, req.Priority),
			PerformedBy:  userID,
		}
		_ = s.ticketRepo.CreateActivity(ctx, activity)
	}
	if req.Status != "" && req.Status != oldStatus {
		ticket.Status = req.Status
		activity := &entity.TicketActivity{
			TicketID:     ticket.ID,
			ActivityType: entity.TicketActivityStatusChanged,
			Description:  fmt.Sprintf("Status changed from %s to %s", oldStatus, req.Status),
			PerformedBy:  userID,
		}
		_ = s.ticketRepo.CreateActivity(ctx, activity)
	}

	if err := s.ticketRepo.Update(ctx, ticket); err != nil {
		return nil, err
	}

	return ticket, nil
}

func (s *ticketService) GetTicketByID(ctx context.Context, tenantID, ticketID string) (*TicketDetail, error) {
	ticket, err := s.ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return nil, errors.NewNotFoundError("ticket not found")
	}
	if ticket.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("ticket does not belong to this tenant")
	}

	activities, err := s.ticketRepo.GetActivitiesByTicketID(ctx, ticketID)
	if err != nil {
		return nil, err
	}

	return &TicketDetail{
		Ticket:     ticket,
		Activities: activities,
	}, nil
}

func (s *ticketService) ListTickets(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Ticket, int, error) {
	return s.ticketRepo.List(ctx, tenantID, page, perPage, filters)
}

func (s *ticketService) AssignTicket(ctx context.Context, tenantID, ticketID, assignedTo, userID string) error {
	ticket, err := s.ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return errors.NewNotFoundError("ticket not found")
	}
	if ticket.TenantID != tenantID {
		return errors.NewUnauthorizedError("ticket does not belong to this tenant")
	}

	ticket.AssignedTo = &assignedTo
	if ticket.Status == entity.TicketStatusOpen {
		ticket.Status = entity.TicketStatusInProgress
	}

	if err := s.ticketRepo.Update(ctx, ticket); err != nil {
		return err
	}

	// Create activity log
	activity := &entity.TicketActivity{
		TicketID:     ticket.ID,
		ActivityType: entity.TicketActivityAssigned,
		Description:  fmt.Sprintf("Ticket assigned to user %s", assignedTo),
		PerformedBy:  userID,
	}
	_ = s.ticketRepo.CreateActivity(ctx, activity)

	return nil
}

func (s *ticketService) ResolveTicket(ctx context.Context, tenantID, ticketID, userID, resolutionNotes string) error {
	ticket, err := s.ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return errors.NewNotFoundError("ticket not found")
	}
	if ticket.TenantID != tenantID {
		return errors.NewUnauthorizedError("ticket does not belong to this tenant")
	}

	now := time.Now()
	ticket.Status = entity.TicketStatusResolved
	ticket.ResolvedAt = &now

	if err := s.ticketRepo.Update(ctx, ticket); err != nil {
		return err
	}

	// Create activity log
	activity := &entity.TicketActivity{
		TicketID:     ticket.ID,
		ActivityType: entity.TicketActivityResolved,
		Description:  fmt.Sprintf("Ticket resolved. Notes: %s", resolutionNotes),
		PerformedBy:  userID,
	}
	_ = s.ticketRepo.CreateActivity(ctx, activity)

	return nil
}

func (s *ticketService) CloseTicket(ctx context.Context, tenantID, ticketID, userID string) error {
	ticket, err := s.ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return errors.NewNotFoundError("ticket not found")
	}
	if ticket.TenantID != tenantID {
		return errors.NewUnauthorizedError("ticket does not belong to this tenant")
	}

	ticket.Status = entity.TicketStatusClosed

	if err := s.ticketRepo.Update(ctx, ticket); err != nil {
		return err
	}

	// Create activity log
	activity := &entity.TicketActivity{
		TicketID:     ticket.ID,
		ActivityType: entity.TicketActivityStatusChanged,
		Description:  "Ticket closed",
		PerformedBy:  userID,
	}
	_ = s.ticketRepo.CreateActivity(ctx, activity)

	return nil
}

func (s *ticketService) GetTicketActivities(ctx context.Context, ticketID string) ([]*entity.TicketActivity, error) {
	return s.ticketRepo.GetActivitiesByTicketID(ctx, ticketID)
}

func (s *ticketService) generateTicketNumber(ctx context.Context, tenantID string) (string, error) {
	// Generate ticket number format: TKT-YYYYMMDD-XXXX
	now := time.Now()
	dateStr := now.Format("20060102")
	
	// Count tickets created today for this tenant
	filters := map[string]interface{}{
		"search": fmt.Sprintf("TKT-%s", dateStr),
	}
	tickets, _, err := s.ticketRepo.List(ctx, tenantID, 1, 1000, filters)
	if err != nil {
		return "", err
	}
	
	sequence := len(tickets) + 1
	return fmt.Sprintf("TKT-%s-%04d", dateStr, sequence), nil
}
