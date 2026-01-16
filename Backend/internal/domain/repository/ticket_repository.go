package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type TicketRepository interface {
	Create(ctx context.Context, ticket *entity.Ticket) error
	Update(ctx context.Context, ticket *entity.Ticket) error
	GetByID(ctx context.Context, id string) (*entity.Ticket, error)
	GetByTicketNumber(ctx context.Context, tenantID, ticketNumber string) (*entity.Ticket, error)
	List(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Ticket, int, error)
	Delete(ctx context.Context, id string) error
	CreateActivity(ctx context.Context, activity *entity.TicketActivity) error
	GetActivitiesByTicketID(ctx context.Context, ticketID string) ([]*entity.TicketActivity, error)
	CountByStatus(ctx context.Context, tenantID, status string) (int, error)
	CountByPriority(ctx context.Context, tenantID, priority string) (int, error)
}
