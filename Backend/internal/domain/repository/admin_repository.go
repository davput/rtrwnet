package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

// AdminUserRepository defines the interface for admin user operations
type AdminUserRepository interface {
	Create(ctx context.Context, admin *entity.AdminUser) error
	GetByID(ctx context.Context, id string) (*entity.AdminUser, error)
	GetByEmail(ctx context.Context, email string) (*entity.AdminUser, error)
	Update(ctx context.Context, admin *entity.AdminUser) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, page, perPage int) ([]*entity.AdminUser, int64, error)
	UpdateLastLogin(ctx context.Context, id string) error
}

// AdminAuditLogRepository defines the interface for audit log operations
type AdminAuditLogRepository interface {
	Create(ctx context.Context, log *entity.AdminAuditLog) error
	List(ctx context.Context, page, perPage int, adminID string) ([]*entity.AdminAuditLog, int64, error)
}

// SupportTicketRepository defines the interface for support ticket operations
type SupportTicketRepository interface {
	Create(ctx context.Context, ticket *entity.AdminSupportTicket) error
	GetByID(ctx context.Context, id string) (*entity.AdminSupportTicket, error)
	GetByIDAndTenantID(ctx context.Context, id, tenantID string) (*entity.AdminSupportTicket, error)
	Update(ctx context.Context, ticket *entity.AdminSupportTicket) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, page, perPage int, status string) ([]*entity.AdminSupportTicket, int64, error)
	ListByTenantID(ctx context.Context, tenantID string, page, perPage int, status string) ([]*entity.AdminSupportTicket, int64, error)
	CountByStatus(ctx context.Context) (map[string]int64, error)
	CountByTenantID(ctx context.Context, tenantID string) (map[string]int64, error)
	// Reply methods
	CreateReply(ctx context.Context, reply *entity.SupportTicketReply) error
	GetRepliesByTicketID(ctx context.Context, ticketID string) ([]*entity.SupportTicketReply, error)
}

// AdminTenantRepository extends tenant operations for admin
type AdminTenantRepository interface {
	GetAllTenants(ctx context.Context, page, perPage int, search, status, planID string) ([]*entity.TenantDetail, int64, error)
	GetTenantDetail(ctx context.Context, id string) (*entity.TenantDetail, error)
	SuspendTenant(ctx context.Context, id string, reason string) error
	ActivateTenant(ctx context.Context, id string) error
	GetDashboardStats(ctx context.Context) (*AdminDashboardStats, error)
	GetRevenueData(ctx context.Context, months int) ([]*RevenueData, error)
	GetTenantGrowthData(ctx context.Context, months int) ([]*TenantGrowthData, error)
}

// AdminDashboardStats represents admin dashboard statistics
type AdminDashboardStats struct {
	TotalTenants        int64   `json:"total_tenants"`
	ActiveTenants       int64   `json:"active_tenants"`
	TrialTenants        int64   `json:"trial_tenants"`
	TotalCustomers      int64   `json:"total_customers"`
	MonthlyRevenue      float64 `json:"monthly_revenue"`
	GrowthRate          float64 `json:"growth_rate"`
	NewTenantsThisMonth int64   `json:"new_tenants_this_month"`
	ChurnRate           float64 `json:"churn_rate"`
}

// RevenueData represents monthly revenue data
type RevenueData struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
	Tenants int64   `json:"tenants"`
}

// TenantGrowthData represents tenant growth data
type TenantGrowthData struct {
	Month         string `json:"month"`
	NewTenants    int64  `json:"new_tenants"`
	ChurnedTenants int64 `json:"churned_tenants"`
	TotalTenants  int64  `json:"total_tenants"`
}
