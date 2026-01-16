package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

type customerRepository struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) repository.CustomerRepository {
	return &customerRepository{db: db}
}

func (r *customerRepository) Create(ctx context.Context, customer *entity.Customer) error {
	return r.db.WithContext(ctx).Create(customer).Error
}

func (r *customerRepository) FindByID(ctx context.Context, id string) (*entity.Customer, error) {
	var customer entity.Customer
	err := r.db.WithContext(ctx).
		Preload("ServicePlan").
		First(&customer, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepository) FindByTenantID(ctx context.Context, tenantID string, page, perPage int, filters map[string]interface{}) ([]*entity.Customer, int, error) {
	var customers []*entity.Customer
	var total int64

	query := r.db.WithContext(ctx).
		Preload("ServicePlan").
		Where("tenant_id = ?", tenantID)

	// Apply filters
	if search, ok := filters["search"].(string); ok && search != "" {
		query = query.Where("name ILIKE ? OR customer_code ILIKE ? OR phone ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}

	if serviceType, ok := filters["service_type"].(string); ok && serviceType != "" {
		query = query.Where("service_type = ?", serviceType)
	}

	if servicePlanID, ok := filters["service_plan_id"].(string); ok && servicePlanID != "" {
		query = query.Where("service_plan_id = ?", servicePlanID)
	}

	// Count total
	if err := query.Model(&entity.Customer{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting
	sortBy := "created_at"
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
	if err := query.Offset(offset).Limit(perPage).Find(&customers).Error; err != nil {
		return nil, 0, err
	}

	return customers, int(total), nil
}

func (r *customerRepository) FindByCustomerCode(ctx context.Context, tenantID, customerCode string) (*entity.Customer, error) {
	var customer entity.Customer
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND customer_code = ?", tenantID, customerCode).
		First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepository) Update(ctx context.Context, customer *entity.Customer) error {
	return r.db.WithContext(ctx).Save(customer).Error
}

func (r *customerRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.Customer{}, "id = ?", id).Error
}

func (r *customerRepository) CountByTenantID(ctx context.Context, tenantID string) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Customer{}).
		Where("tenant_id = ?", tenantID).
		Count(&count).Error
	return int(count), err
}

func (r *customerRepository) CountByStatus(ctx context.Context, tenantID, status string) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Customer{}).
		Where("tenant_id = ? AND status = ?", tenantID, status).
		Count(&count).Error
	return int(count), err
}

func (r *customerRepository) CountNewCustomersThisMonth(ctx context.Context, tenantID string) (int, error) {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Customer{}).
		Where("tenant_id = ? AND created_at >= ?", tenantID, startOfMonth).
		Count(&count).Error
	return int(count), err
}

func (r *customerRepository) GenerateCustomerCode(ctx context.Context, tenantID string) (string, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Customer{}).
		Where("tenant_id = ?", tenantID).
		Count(&count).Error
	if err != nil {
		return "", err
	}

	// Generate code: CUST001, CUST002, etc.
	code := fmt.Sprintf("CUST%03d", count+1)

	// Check if code already exists (in case of concurrent creation)
	var existing entity.Customer
	err = r.db.WithContext(ctx).
		Where("tenant_id = ? AND customer_code = ?", tenantID, code).
		First(&existing).Error

	if err == nil {
		// Code exists, try next number
		code = fmt.Sprintf("CUST%03d", count+2)
	}

	return code, nil
}
