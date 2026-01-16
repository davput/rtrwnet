package postgres

import (
	"context"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

// AdminUserRepository implements repository.AdminUserRepository
type AdminUserRepository struct {
	db *gorm.DB
}

func NewAdminUserRepository(db *gorm.DB) repository.AdminUserRepository {
	return &AdminUserRepository{db: db}
}

func (r *AdminUserRepository) Create(ctx context.Context, admin *entity.AdminUser) error {
	return r.db.WithContext(ctx).Create(admin).Error
}

func (r *AdminUserRepository) GetByID(ctx context.Context, id string) (*entity.AdminUser, error) {
	var admin entity.AdminUser
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&admin).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}

func (r *AdminUserRepository) GetByEmail(ctx context.Context, email string) (*entity.AdminUser, error) {
	var admin entity.AdminUser
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&admin).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}

func (r *AdminUserRepository) Update(ctx context.Context, admin *entity.AdminUser) error {
	return r.db.WithContext(ctx).Save(admin).Error
}

func (r *AdminUserRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.AdminUser{}, "id = ?", id).Error
}

func (r *AdminUserRepository) List(ctx context.Context, page, perPage int) ([]*entity.AdminUser, int64, error) {
	var admins []*entity.AdminUser
	var total int64

	offset := (page - 1) * perPage

	if err := r.db.WithContext(ctx).Model(&entity.AdminUser{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.WithContext(ctx).
		Order("created_at DESC").
		Offset(offset).
		Limit(perPage).
		Find(&admins).Error; err != nil {
		return nil, 0, err
	}

	return admins, total, nil
}

func (r *AdminUserRepository) UpdateLastLogin(ctx context.Context, id string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&entity.AdminUser{}).Where("id = ?", id).Update("last_login", now).Error
}

// AdminAuditLogRepository implements repository.AdminAuditLogRepository
type AdminAuditLogRepository struct {
	db *gorm.DB
}

func NewAdminAuditLogRepository(db *gorm.DB) repository.AdminAuditLogRepository {
	return &AdminAuditLogRepository{db: db}
}

func (r *AdminAuditLogRepository) Create(ctx context.Context, log *entity.AdminAuditLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *AdminAuditLogRepository) List(ctx context.Context, page, perPage int, adminID string) ([]*entity.AdminAuditLog, int64, error) {
	var logs []*entity.AdminAuditLog
	var total int64

	offset := (page - 1) * perPage
	query := r.db.WithContext(ctx).Model(&entity.AdminAuditLog{})

	if adminID != "" {
		query = query.Where("admin_id = ?", adminID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.
		Order("created_at DESC").
		Offset(offset).
		Limit(perPage).
		Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

// SupportTicketRepository implements repository.SupportTicketRepository
type SupportTicketRepository struct {
	db *gorm.DB
}

func NewSupportTicketRepository(db *gorm.DB) repository.SupportTicketRepository {
	return &SupportTicketRepository{db: db}
}

func (r *SupportTicketRepository) Create(ctx context.Context, ticket *entity.AdminSupportTicket) error {
	return r.db.WithContext(ctx).Create(ticket).Error
}

func (r *SupportTicketRepository) GetByID(ctx context.Context, id string) (*entity.AdminSupportTicket, error) {
	var ticket entity.AdminSupportTicket
	if err := r.db.WithContext(ctx).
		Preload("Tenant").
		Preload("Assignee").
		Where("id = ?", id).
		First(&ticket).Error; err != nil {
		return nil, err
	}
	return &ticket, nil
}

func (r *SupportTicketRepository) Update(ctx context.Context, ticket *entity.AdminSupportTicket) error {
	return r.db.WithContext(ctx).Save(ticket).Error
}

func (r *SupportTicketRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.AdminSupportTicket{}, "id = ?", id).Error
}

func (r *SupportTicketRepository) List(ctx context.Context, page, perPage int, status string) ([]*entity.AdminSupportTicket, int64, error) {
	var tickets []*entity.AdminSupportTicket
	var total int64

	offset := (page - 1) * perPage
	query := r.db.WithContext(ctx).Model(&entity.AdminSupportTicket{})

	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	baseQuery := r.db.WithContext(ctx).Preload("Tenant")
	if status != "" && status != "all" {
		baseQuery = baseQuery.Where("status = ?", status)
	}

	if err := baseQuery.
		Order("CASE WHEN priority = 'urgent' THEN 1 WHEN priority = 'high' THEN 2 WHEN priority = 'medium' THEN 3 ELSE 4 END, created_at DESC").
		Offset(offset).
		Limit(perPage).
		Find(&tickets).Error; err != nil {
		return nil, 0, err
	}

	// Set tenant name
	for _, t := range tickets {
		if t.Tenant != nil {
			t.TenantName = t.Tenant.Name
		}
	}

	return tickets, total, nil
}

func (r *SupportTicketRepository) CountByStatus(ctx context.Context) (map[string]int64, error) {
	result := make(map[string]int64)
	
	var counts []struct {
		Status string
		Count  int64
	}

	if err := r.db.WithContext(ctx).
		Model(&entity.AdminSupportTicket{}).
		Select("status, count(*) as count").
		Group("status").
		Scan(&counts).Error; err != nil {
		return nil, err
	}

	for _, c := range counts {
		result[c.Status] = c.Count
	}

	return result, nil
}

func (r *SupportTicketRepository) ListByTenantID(ctx context.Context, tenantID string, page, perPage int, status string) ([]*entity.AdminSupportTicket, int64, error) {
	var tickets []*entity.AdminSupportTicket
	var total int64

	offset := (page - 1) * perPage
	query := r.db.WithContext(ctx).Model(&entity.AdminSupportTicket{}).Where("tenant_id = ?", tenantID)

	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	baseQuery := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)
	if status != "" && status != "all" {
		baseQuery = baseQuery.Where("status = ?", status)
	}

	if err := baseQuery.
		Order("created_at DESC").
		Offset(offset).
		Limit(perPage).
		Find(&tickets).Error; err != nil {
		return nil, 0, err
	}

	return tickets, total, nil
}

func (r *SupportTicketRepository) CountByTenantID(ctx context.Context, tenantID string) (map[string]int64, error) {
	result := make(map[string]int64)
	
	var counts []struct {
		Status string
		Count  int64
	}

	if err := r.db.WithContext(ctx).
		Model(&entity.AdminSupportTicket{}).
		Where("tenant_id = ?", tenantID).
		Select("status, count(*) as count").
		Group("status").
		Scan(&counts).Error; err != nil {
		return nil, err
	}

	for _, c := range counts {
		result[c.Status] = c.Count
	}

	return result, nil
}

func (r *SupportTicketRepository) GetByIDAndTenantID(ctx context.Context, id, tenantID string) (*entity.AdminSupportTicket, error) {
	var ticket entity.AdminSupportTicket
	if err := r.db.WithContext(ctx).
		Preload("Replies", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		Where("id = ? AND tenant_id = ?", id, tenantID).
		First(&ticket).Error; err != nil {
		return nil, err
	}
	return &ticket, nil
}

func (r *SupportTicketRepository) CreateReply(ctx context.Context, reply *entity.SupportTicketReply) error {
	return r.db.WithContext(ctx).Create(reply).Error
}

func (r *SupportTicketRepository) GetRepliesByTicketID(ctx context.Context, ticketID string) ([]*entity.SupportTicketReply, error) {
	var replies []*entity.SupportTicketReply
	if err := r.db.WithContext(ctx).
		Where("ticket_id = ?", ticketID).
		Order("created_at ASC").
		Find(&replies).Error; err != nil {
		return nil, err
	}
	return replies, nil
}

// AdminTenantRepository implements repository.AdminTenantRepository
type AdminTenantRepository struct {
	db *gorm.DB
}

func NewAdminTenantRepository(db *gorm.DB) repository.AdminTenantRepository {
	return &AdminTenantRepository{db: db}
}

func (r *AdminTenantRepository) GetAllTenants(ctx context.Context, page, perPage int, search, status, planID string) ([]*entity.TenantDetail, int64, error) {
	var tenants []*entity.Tenant
	var total int64

	offset := (page - 1) * perPage
	query := r.db.WithContext(ctx).Model(&entity.Tenant{})

	if search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.
		Order("created_at DESC").
		Offset(offset).
		Limit(perPage).
		Find(&tenants).Error; err != nil {
		return nil, 0, err
	}

	// Convert to TenantDetail with additional info
	var details []*entity.TenantDetail
	for _, t := range tenants {
		detail := &entity.TenantDetail{
			Tenant: *t,
			Status: "active",
		}

		// Get subscription info
		var sub entity.TenantSubscription
		if err := r.db.WithContext(ctx).
			Preload("Plan").
			Where("tenant_id = ?", t.ID).
			Order("created_at DESC").
			First(&sub).Error; err == nil {
			detail.Status = sub.Status
			detail.PlanID = sub.PlanID
			if sub.Plan != nil {
				detail.PlanName = sub.Plan.Name
			}
			detail.ExpiresAt = sub.EndDate
		}

		// Get customer count
		var customerCount int64
		r.db.WithContext(ctx).Model(&entity.Customer{}).Where("tenant_id = ?", t.ID).Count(&customerCount)
		detail.CustomerCount = int(customerCount)

		// Get monthly revenue (sum of customer monthly fees)
		var revenue float64
		r.db.WithContext(ctx).Model(&entity.Customer{}).
			Where("tenant_id = ? AND status = 'active'", t.ID).
			Select("COALESCE(SUM(monthly_fee), 0)").
			Scan(&revenue)
		detail.MonthlyRevenue = revenue

		// Filter by status if specified
		if status != "" && status != "all" && detail.Status != status {
			continue
		}

		// Filter by plan if specified
		if planID != "" && detail.PlanID != planID {
			continue
		}

		details = append(details, detail)
	}

	return details, total, nil
}

func (r *AdminTenantRepository) GetTenantDetail(ctx context.Context, id string) (*entity.TenantDetail, error) {
	var tenant entity.Tenant
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&tenant).Error; err != nil {
		return nil, err
	}

	detail := &entity.TenantDetail{
		Tenant: tenant,
		Status: "active",
	}

	// Get subscription info
	var sub entity.TenantSubscription
	if err := r.db.WithContext(ctx).
		Preload("Plan").
		Where("tenant_id = ?", id).
		Order("created_at DESC").
		First(&sub).Error; err == nil {
		detail.Status = sub.Status
		detail.PlanID = sub.PlanID
		if sub.Plan != nil {
			detail.PlanName = sub.Plan.Name
		}
		detail.ExpiresAt = sub.EndDate
	}

	// Get customer count
	var customerCount int64
	r.db.WithContext(ctx).Model(&entity.Customer{}).Where("tenant_id = ?", id).Count(&customerCount)
	detail.CustomerCount = int(customerCount)

	// Get monthly revenue
	var revenue float64
	r.db.WithContext(ctx).Model(&entity.Customer{}).
		Where("tenant_id = ? AND status = 'active'", id).
		Select("COALESCE(SUM(monthly_fee), 0)").
		Scan(&revenue)
	detail.MonthlyRevenue = revenue

	return detail, nil
}

func (r *AdminTenantRepository) SuspendTenant(ctx context.Context, id string, reason string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update tenant
		if err := tx.Model(&entity.Tenant{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
			return err
		}

		// Update subscription status
		if err := tx.Model(&entity.TenantSubscription{}).
			Where("tenant_id = ? AND status = ?", id, entity.SubscriptionStatusActive).
			Update("status", entity.SubscriptionStatusSuspended).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *AdminTenantRepository) ActivateTenant(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update tenant
		if err := tx.Model(&entity.Tenant{}).Where("id = ?", id).Update("is_active", true).Error; err != nil {
			return err
		}

		// Update subscription status
		if err := tx.Model(&entity.TenantSubscription{}).
			Where("tenant_id = ? AND status = ?", id, entity.SubscriptionStatusSuspended).
			Update("status", entity.SubscriptionStatusActive).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *AdminTenantRepository) GetDashboardStats(ctx context.Context) (*repository.AdminDashboardStats, error) {
	stats := &repository.AdminDashboardStats{}

	// Total tenants
	r.db.WithContext(ctx).Model(&entity.Tenant{}).Count(&stats.TotalTenants)

	// Active tenants
	r.db.WithContext(ctx).Model(&entity.Tenant{}).Where("is_active = ?", true).Count(&stats.ActiveTenants)

	// Trial tenants
	r.db.WithContext(ctx).Model(&entity.TenantSubscription{}).
		Where("status = ?", entity.SubscriptionStatusTrial).
		Distinct("tenant_id").
		Count(&stats.TrialTenants)

	// Total customers across all tenants
	r.db.WithContext(ctx).Model(&entity.Customer{}).Count(&stats.TotalCustomers)

	// Monthly revenue from subscription payments
	var revenue float64
	r.db.WithContext(ctx).Model(&entity.PaymentTransaction{}).
		Where("status = 'paid' AND created_at >= ?", time.Now().AddDate(0, -1, 0)).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&revenue)
	stats.MonthlyRevenue = revenue

	// New tenants this month
	r.db.WithContext(ctx).Model(&entity.Tenant{}).
		Where("created_at >= ?", time.Now().AddDate(0, 0, -30)).
		Count(&stats.NewTenantsThisMonth)

	// Calculate growth rate (simplified)
	var lastMonthTenants int64
	r.db.WithContext(ctx).Model(&entity.Tenant{}).
		Where("created_at < ?", time.Now().AddDate(0, -1, 0)).
		Count(&lastMonthTenants)
	
	if lastMonthTenants > 0 {
		stats.GrowthRate = float64(stats.NewTenantsThisMonth) / float64(lastMonthTenants) * 100
	}

	// Churn rate (simplified - tenants that became inactive this month)
	var churnedTenants int64
	r.db.WithContext(ctx).Model(&entity.TenantSubscription{}).
		Where("status IN (?, ?) AND updated_at >= ?", 
			entity.SubscriptionStatusCancelled, 
			entity.SubscriptionStatusExpired,
			time.Now().AddDate(0, -1, 0)).
		Distinct("tenant_id").
		Count(&churnedTenants)
	
	if stats.ActiveTenants > 0 {
		stats.ChurnRate = float64(churnedTenants) / float64(stats.ActiveTenants) * 100
	}

	return stats, nil
}

func (r *AdminTenantRepository) GetRevenueData(ctx context.Context, months int) ([]*repository.RevenueData, error) {
	var data []*repository.RevenueData

	for i := months - 1; i >= 0; i-- {
		startDate := time.Now().AddDate(0, -i, 0)
		endDate := time.Now().AddDate(0, -i+1, 0)
		
		monthName := startDate.Format("Jan")

		var revenue float64
		r.db.WithContext(ctx).Model(&entity.PaymentTransaction{}).
			Where("status = 'paid' AND created_at >= ? AND created_at < ?", startDate, endDate).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&revenue)

		var tenants int64
		r.db.WithContext(ctx).Model(&entity.Tenant{}).
			Where("created_at < ?", endDate).
			Count(&tenants)

		data = append(data, &repository.RevenueData{
			Month:   monthName,
			Revenue: revenue,
			Tenants: tenants,
		})
	}

	return data, nil
}

func (r *AdminTenantRepository) GetTenantGrowthData(ctx context.Context, months int) ([]*repository.TenantGrowthData, error) {
	var data []*repository.TenantGrowthData

	for i := months - 1; i >= 0; i-- {
		startDate := time.Now().AddDate(0, -i, 0)
		endDate := time.Now().AddDate(0, -i+1, 0)
		
		monthName := startDate.Format("Jan")

		var newTenants int64
		r.db.WithContext(ctx).Model(&entity.Tenant{}).
			Where("created_at >= ? AND created_at < ?", startDate, endDate).
			Count(&newTenants)

		var churnedTenants int64
		r.db.WithContext(ctx).Model(&entity.TenantSubscription{}).
			Where("status IN (?, ?) AND updated_at >= ? AND updated_at < ?",
				entity.SubscriptionStatusCancelled,
				entity.SubscriptionStatusExpired,
				startDate, endDate).
			Distinct("tenant_id").
			Count(&churnedTenants)

		var totalTenants int64
		r.db.WithContext(ctx).Model(&entity.Tenant{}).
			Where("created_at < ?", endDate).
			Count(&totalTenants)

		data = append(data, &repository.TenantGrowthData{
			Month:          monthName,
			NewTenants:     newTenants,
			ChurnedTenants: churnedTenants,
			TotalTenants:   totalTenants,
		})
	}

	return data, nil
}
