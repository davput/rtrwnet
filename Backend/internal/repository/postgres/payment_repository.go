package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

type paymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) repository.PaymentRepository {
	return &paymentRepository{db: db}
}

func (r *paymentRepository) Create(ctx context.Context, payment *entity.Payment) error {
	return r.db.WithContext(ctx).Create(payment).Error
}

func (r *paymentRepository) FindByID(ctx context.Context, id string) (*entity.Payment, error) {
	var payment entity.Payment
	err := r.db.WithContext(ctx).
		Preload("Customer").
		First(&payment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &payment, nil
}

func (r *paymentRepository) FindByTenantID(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Payment, int, error) {
	var payments []*entity.Payment
	var total int64

	query := r.db.WithContext(ctx).
		Preload("Customer").
		Where("tenant_id = ?", tenantID)

	// Apply filters
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}

	if customerID, ok := filters["customer_id"].(string); ok && customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	if month, ok := filters["month"].(int); ok && month > 0 {
		year := time.Now().Year()
		if y, ok := filters["year"].(int); ok && y > 0 {
			year = y
		}
		startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
		endDate := startDate.AddDate(0, 1, 0)
		query = query.Where("due_date >= ? AND due_date < ?", startDate, endDate)
	}

	// Count total
	if err := query.Model(&entity.Payment{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting
	sortBy := "due_date"
	if sb, ok := filters["sort_by"].(string); ok && sb != "" {
		sortBy = sb
	}

	sortOrder := "desc"
	if so, ok := filters["sort_order"].(string); ok && so != "" {
		sortOrder = so
	}

	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

	// Apply pagination
	offset := (page - 1) * perPage
	if err := query.Offset(offset).Limit(perPage).Find(&payments).Error; err != nil {
		return nil, 0, err
	}

	return payments, int(total), nil
}

func (r *paymentRepository) FindByCustomerID(ctx context.Context, customerID string, limit int) ([]*entity.Payment, error) {
	var payments []*entity.Payment
	query := r.db.WithContext(ctx).
		Where("customer_id = ?", customerID).
		Order("due_date DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&payments).Error
	if err != nil {
		return nil, err
	}

	return payments, nil
}

func (r *paymentRepository) Update(ctx context.Context, payment *entity.Payment) error {
	return r.db.WithContext(ctx).Save(payment).Error
}

func (r *paymentRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.Payment{}, "id = ?", id).Error
}

func (r *paymentRepository) CountByStatus(ctx context.Context, tenantID, status string) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Payment{}).
		Where("tenant_id = ? AND status = ?", tenantID, status).
		Count(&count).Error
	return int(count), err
}

func (r *paymentRepository) SumByStatus(ctx context.Context, tenantID, status string) (float64, error) {
	var sum float64
	err := r.db.WithContext(ctx).
		Model(&entity.Payment{}).
		Where("tenant_id = ? AND status = ?", tenantID, status).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&sum).Error
	return sum, err
}

func (r *paymentRepository) SumByMonth(ctx context.Context, tenantID string, month, year int) (float64, error) {
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0)

	var sum float64
	err := r.db.WithContext(ctx).
		Model(&entity.Payment{}).
		Where("tenant_id = ? AND status = ? AND payment_date >= ? AND payment_date < ?",
			tenantID, entity.PaymentStatusPaid, startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&sum).Error
	return sum, err
}

func (r *paymentRepository) GetRecentPayments(ctx context.Context, tenantID string, limit int) ([]*entity.Payment, error) {
	var payments []*entity.Payment
	err := r.db.WithContext(ctx).
		Preload("Customer").
		Where("tenant_id = ? AND status = ?", tenantID, entity.PaymentStatusPaid).
		Order("payment_date DESC").
		Limit(limit).
		Find(&payments).Error
	if err != nil {
		return nil, err
	}
	return payments, nil
}

func (r *paymentRepository) GetMonthlyRevenue(ctx context.Context, tenantID string, months int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	now := time.Now()
	for i := months - 1; i >= 0; i-- {
		date := now.AddDate(0, -i, 0)
		month := int(date.Month())
		year := date.Year()

		sum, err := r.SumByMonth(ctx, tenantID, month, year)
		if err != nil {
			continue
		}

		results = append(results, map[string]interface{}{
			"month":   date.Format("Jan 2006"),
			"revenue": sum,
		})
	}

	return results, nil
}
