package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
)

// SupportTicketService defines the interface for user support ticket operations
type SupportTicketService interface {
	// User operations
	CreateTicket(ctx context.Context, tenantID, userID string, req *CreateSupportTicketRequest) (*entity.AdminSupportTicket, error)
	GetTicket(ctx context.Context, tenantID, ticketID string) (*entity.AdminSupportTicket, error)
	ListTickets(ctx context.Context, tenantID string, page, perPage int, status string) (*TicketListResponse, error)
	AddReply(ctx context.Context, tenantID, userID, ticketID string, message string) (*entity.SupportTicketReply, error)
	GetTicketStats(ctx context.Context, tenantID string) (*TicketStats, error)
}

// CreateSupportTicketRequest represents the request to create a support ticket
type CreateSupportTicketRequest struct {
	Subject     string `json:"subject" binding:"required"`
	Description string `json:"description" binding:"required"`
	Category    string `json:"category"`
	Priority    string `json:"priority"`
}

// TicketListResponse represents the response for listing tickets
type TicketListResponse struct {
	Tickets []*entity.AdminSupportTicket `json:"tickets"`
	Total   int64                        `json:"total"`
	Page    int                          `json:"page"`
	PerPage int                          `json:"per_page"`
}

// TicketStats represents ticket statistics for a tenant
type TicketStats struct {
	Total      int64 `json:"total"`
	Open       int64 `json:"open"`
	InProgress int64 `json:"in_progress"`
	Resolved   int64 `json:"resolved"`
	Closed     int64 `json:"closed"`
}

// supportTicketService implements SupportTicketService
type supportTicketService struct {
	ticketRepo          repository.SupportTicketRepository
	notificationService NotificationService
}

// NewSupportTicketService creates a new support ticket service
func NewSupportTicketService(ticketRepo repository.SupportTicketRepository) SupportTicketService {
	return &supportTicketService{
		ticketRepo: ticketRepo,
	}
}

// NewSupportTicketServiceWithNotification creates a new support ticket service with notification
func NewSupportTicketServiceWithNotification(ticketRepo repository.SupportTicketRepository, notificationService NotificationService) SupportTicketService {
	return &supportTicketService{
		ticketRepo:          ticketRepo,
		notificationService: notificationService,
	}
}

func (s *supportTicketService) CreateTicket(ctx context.Context, tenantID, userID string, req *CreateSupportTicketRequest) (*entity.AdminSupportTicket, error) {
	// Validate required fields
	if req.Subject == "" {
		return nil, errors.NewValidationError("Subject is required")
	}
	if req.Description == "" {
		return nil, errors.NewValidationError("Description is required")
	}

	// Set defaults
	category := req.Category
	if category == "" {
		category = "general"
	}

	priority := req.Priority
	if priority == "" {
		priority = entity.TicketPriorityMedium
	}

	// Validate priority
	validPriorities := map[string]bool{
		entity.TicketPriorityLow:    true,
		entity.TicketPriorityMedium: true,
		entity.TicketPriorityHigh:   true,
		entity.TicketPriorityUrgent: true,
	}
	if !validPriorities[priority] {
		priority = entity.TicketPriorityMedium
	}

	ticket := &entity.AdminSupportTicket{
		TenantID:    tenantID,
		UserID:      &userID,
		Subject:     req.Subject,
		Description: req.Description,
		Category:    category,
		Priority:    priority,
		Status:      entity.TicketStatusOpen,
	}

	if err := s.ticketRepo.Create(ctx, ticket); err != nil {
		return nil, errors.NewInternalError("Failed to create ticket")
	}

	// Create notification for user (ticket created confirmation)
	if s.notificationService != nil {
		data, _ := json.Marshal(map[string]interface{}{
			"ticket_id": ticket.ID,
			"subject":   ticket.Subject,
		})
		notification := &entity.Notification{
			TenantID: tenantID,
			UserID:   &userID,
			Type:     entity.NotificationTypeTicket,
			Title:    "Tiket Support Dibuat",
			Message:  "Tiket '" + ticket.Subject + "' berhasil dibuat. Tim support akan segera merespons.",
			Data:     string(data),
		}
		s.notificationService.CreateNotification(ctx, notification)

		// Create admin notification for new ticket
		adminNotification := &entity.AdminNotification{
			Type:    entity.NotificationTypeTicket,
			Title:   "Tiket Support Baru",
			Message: "Tiket baru: " + ticket.Subject + " (Prioritas: " + priority + ")",
			Data:    string(data),
		}
		s.notificationService.CreateAdminNotification(ctx, adminNotification)
	}

	return ticket, nil
}

func (s *supportTicketService) GetTicket(ctx context.Context, tenantID, ticketID string) (*entity.AdminSupportTicket, error) {
	ticket, err := s.ticketRepo.GetByIDAndTenantID(ctx, ticketID, tenantID)
	if err != nil {
		return nil, errors.NewNotFoundError("Ticket not found")
	}

	// Get replies
	replies, err := s.ticketRepo.GetRepliesByTicketID(ctx, ticketID)
	if err == nil {
		ticket.Replies = make([]entity.SupportTicketReply, len(replies))
		for i, r := range replies {
			ticket.Replies[i] = *r
		}
	}

	return ticket, nil
}

func (s *supportTicketService) ListTickets(ctx context.Context, tenantID string, page, perPage int, status string) (*TicketListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	tickets, total, err := s.ticketRepo.ListByTenantID(ctx, tenantID, page, perPage, status)
	if err != nil {
		return nil, errors.NewInternalError("Failed to list tickets")
	}

	return &TicketListResponse{
		Tickets: tickets,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	}, nil
}

func (s *supportTicketService) AddReply(ctx context.Context, tenantID, userID, ticketID string, message string) (*entity.SupportTicketReply, error) {
	// Verify ticket belongs to tenant
	ticket, err := s.ticketRepo.GetByIDAndTenantID(ctx, ticketID, tenantID)
	if err != nil {
		return nil, errors.NewNotFoundError("Ticket not found")
	}

	// Check if ticket is closed
	if ticket.Status == entity.TicketStatusClosed {
		return nil, errors.NewValidationError("Cannot reply to a closed ticket")
	}

	reply := &entity.SupportTicketReply{
		TicketID: ticketID,
		UserID:   &userID,
		Message:  message,
		IsAdmin:  false,
	}

	if err := s.ticketRepo.CreateReply(ctx, reply); err != nil {
		return nil, errors.NewInternalError("Failed to add reply")
	}

	// Update ticket status to open if it was resolved (user replied)
	if ticket.Status == entity.TicketStatusResolved {
		ticket.Status = entity.TicketStatusOpen
		ticket.ResolvedAt = nil
		s.ticketRepo.Update(ctx, ticket)
	}

	// Create admin notification for user reply
	if s.notificationService != nil {
		data, _ := json.Marshal(map[string]interface{}{
			"ticket_id": ticketID,
			"subject":   ticket.Subject,
		})
		adminNotification := &entity.AdminNotification{
			Type:    entity.NotificationTypeTicket,
			Title:   "Balasan Tiket Baru",
			Message: "User membalas tiket: " + ticket.Subject,
			Data:    string(data),
		}
		s.notificationService.CreateAdminNotification(ctx, adminNotification)
	}

	return reply, nil
}

func (s *supportTicketService) GetTicketStats(ctx context.Context, tenantID string) (*TicketStats, error) {
	counts, err := s.ticketRepo.CountByTenantID(ctx, tenantID)
	if err != nil {
		return nil, errors.NewInternalError("Failed to get ticket stats")
	}

	stats := &TicketStats{
		Open:       counts[entity.TicketStatusOpen],
		InProgress: counts[entity.TicketStatusInProgress],
		Resolved:   counts[entity.TicketStatusResolved],
		Closed:     counts[entity.TicketStatusClosed],
	}
	stats.Total = stats.Open + stats.InProgress + stats.Resolved + stats.Closed

	return stats, nil
}

// Admin operations - add reply from admin side
func AddAdminReply(ctx context.Context, ticketRepo repository.SupportTicketRepository, adminID, ticketID string, message string) (*entity.SupportTicketReply, error) {
	// Get ticket
	ticket, err := ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return nil, errors.NewNotFoundError("Ticket not found")
	}

	reply := &entity.SupportTicketReply{
		TicketID: ticketID,
		AdminID:  &adminID,
		Message:  message,
		IsAdmin:  true,
	}

	if err := ticketRepo.CreateReply(ctx, reply); err != nil {
		return nil, errors.NewInternalError("Failed to add reply")
	}

	// Update ticket status to in_progress if it was open
	if ticket.Status == entity.TicketStatusOpen {
		ticket.Status = entity.TicketStatusInProgress
		ticket.AssignedTo = &adminID
		ticketRepo.Update(ctx, ticket)
	}

	return reply, nil
}

// ResolveTicket marks a ticket as resolved
func ResolveTicket(ctx context.Context, ticketRepo repository.SupportTicketRepository, ticketID string) error {
	ticket, err := ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return errors.NewNotFoundError("Ticket not found")
	}

	now := time.Now()
	ticket.Status = entity.TicketStatusResolved
	ticket.ResolvedAt = &now

	return ticketRepo.Update(ctx, ticket)
}

// CloseTicket marks a ticket as closed
func CloseTicket(ctx context.Context, ticketRepo repository.SupportTicketRepository, ticketID string) error {
	ticket, err := ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return errors.NewNotFoundError("Ticket not found")
	}

	now := time.Now()
	ticket.Status = entity.TicketStatusClosed
	ticket.ClosedAt = &now

	return ticketRepo.Update(ctx, ticket)
}
