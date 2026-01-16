package postgres

import (
	"context"
	"fmt"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

type ticketRepository struct {
	db *gorm.DB
}

func NewTicketRepository(db *gorm.DB) repository.TicketRepository {
	return &ticketRepository{db: db}
}

func (r *ticketRepository) Create(ctx context.Context, ticket *entity.Ticket) error {
	return r.db.WithContext(ctx).Create(ticket).Error
}

func (r *ticketRepository) Update(ctx context.Context, ticket *entity.Ticket) error {
	return r.db.WithContext(ctx).Save(ticket).Error
}

func (r *ticketRepository) GetByID(ctx context.Context, id string) (*entity.Ticket, error) {
	var ticket entity.Ticket
	err := r.db.WithContext(ctx).
		Preload("Customer").
		Preload("AssignedUser").
		First(&ticket, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

func (r *ticketRepository) GetByTicketNumber(ctx context.Context, tenantID, ticketNumber string) (*entity.Ticket, error) {
	var ticket entity.Ticket
	err := r.db.WithContext(ctx).
		Preload("Customer").
		Preload("AssignedUser").
		Where("tenant_id = ? AND ticket_number = ?", tenantID, ticketNumber).
		First(&ticket).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

func (r *ticketRepository) List(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Ticket, int, error) {
	var tickets []*entity.Ticket
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Ticket{}).Where("tenant_id = ?", tenantID)

	// Apply filters
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}
	if priority, ok := filters["priority"].(string); ok && priority != "" {
		query = query.Where("priority = ?", priority)
	}
	if customerID, ok := filters["customer_id"].(string); ok && customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if assignedTo, ok := filters["assigned_to"].(string); ok && assignedTo != "" {
		query = query.Where("assigned_to = ?", assignedTo)
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		searchPattern := fmt.Sprintf("%%%s%%", search)
		query = query.Where("ticket_number ILIKE ? OR title ILIKE ? OR description ILIKE ?", 
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
		Preload("AssignedUser").
		Order("created_at DESC").
		Limit(perPage).
		Offset(offset).
		Find(&tickets).Error

	if err != nil {
		return nil, 0, err
	}

	return tickets, int(total), nil
}

func (r *ticketRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.Ticket{}, "id = ?", id).Error
}

func (r *ticketRepository) CreateActivity(ctx context.Context, activity *entity.TicketActivity) error {
	return r.db.WithContext(ctx).Create(activity).Error
}

func (r *ticketRepository) GetActivitiesByTicketID(ctx context.Context, ticketID string) ([]*entity.TicketActivity, error) {
	var activities []*entity.TicketActivity
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("ticket_id = ?", ticketID).
		Order("created_at ASC").
		Find(&activities).Error
	if err != nil {
		return nil, err
	}
	return activities, nil
}

func (r *ticketRepository) CountByStatus(ctx context.Context, tenantID, status string) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Ticket{}).
		Where("tenant_id = ? AND status = ?", tenantID, status).
		Count(&count).Error
	return int(count), err
}

func (r *ticketRepository) CountByPriority(ctx context.Context, tenantID, priority string) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Ticket{}).
		Where("tenant_id = ? AND priority = ?", tenantID, priority).
		Count(&count).Error
	return int(count), err
}
