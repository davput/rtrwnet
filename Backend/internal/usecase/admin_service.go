package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/payment"
	"golang.org/x/crypto/bcrypt"
)

// AdminService defines the interface for admin operations
type AdminService interface {
	// Auth
	Login(ctx context.Context, email, password string) (*AdminAuthResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*AdminTokenResponse, error)
	GetProfile(ctx context.Context, adminID string) (*entity.AdminUser, error)

	// Dashboard
	GetDashboardStats(ctx context.Context) (*repository.AdminDashboardStats, error)
	GetRevenueData(ctx context.Context, months int) ([]*repository.RevenueData, error)
	GetTenantGrowthData(ctx context.Context, months int) ([]*repository.TenantGrowthData, error)

	// Tenants
	ListTenants(ctx context.Context, page, perPage int, search, status, planID string) (*TenantListResponse, error)
	GetTenant(ctx context.Context, id string) (*entity.TenantDetail, error)
	CreateTenant(ctx context.Context, req *CreateTenantRequest) (*entity.TenantDetail, error)
	UpdateTenant(ctx context.Context, id string, req *UpdateTenantRequest) (*entity.TenantDetail, error)
	DeleteTenant(ctx context.Context, id string) error
	SuspendTenant(ctx context.Context, id string, reason string, adminID string) error
	ActivateTenant(ctx context.Context, id string, adminID string) error

	// Subscription Plans
	ListPlans(ctx context.Context) ([]*entity.SubscriptionPlan, error)
	CreatePlan(ctx context.Context, req *CreatePlanRequest) (*entity.SubscriptionPlan, error)
	UpdatePlan(ctx context.Context, id string, req *UpdatePlanRequest) (*entity.SubscriptionPlan, error)
	DeletePlan(ctx context.Context, id string) error

	// Admin Users
	ListAdmins(ctx context.Context, page, perPage int) (*AdminListResponse, error)
	CreateAdmin(ctx context.Context, req *CreateAdminRequest) (*entity.AdminUser, error)
	UpdateAdmin(ctx context.Context, id string, req *UpdateAdminRequest) (*entity.AdminUser, error)
	DeleteAdmin(ctx context.Context, id string) error

	// Audit Logs
	ListAuditLogs(ctx context.Context, page, perPage int, adminID string) (*AuditLogListResponse, error)
	CreateAuditLog(ctx context.Context, adminID, adminName, action, resourceType, resourceID, details, ipAddress string) error

	// Support Tickets
	ListSupportTickets(ctx context.Context, page, perPage int, status string) (*SupportTicketListResponse, error)
	GetSupportTicket(ctx context.Context, id string) (*entity.AdminSupportTicket, error)
	UpdateTicketStatus(ctx context.Context, id, status string, assignedTo *string) (*entity.AdminSupportTicket, error)
	AddTicketReply(ctx context.Context, adminID, ticketID, message string) (*entity.SupportTicketReply, error)
	ResolveTicket(ctx context.Context, ticketID string) error
	CloseTicket(ctx context.Context, ticketID string) error

	// Payment Transactions
	ListPaymentTransactions(ctx context.Context, page, perPage int, status, tenantID, search string) (*PaymentTransactionListResponse, error)
	GetPaymentTransaction(ctx context.Context, id string) (*entity.PaymentTransaction, error)
	GetPaymentStats(ctx context.Context) (*repository.PaymentStats, error)
	ReconcilePayment(ctx context.Context, orderID string) (*PaymentReconcileResponse, error)
}

// Response types
type AdminAuthResponse struct {
	Token        string            `json:"token"`
	RefreshToken string            `json:"refresh_token"`
	ExpiresIn    int64             `json:"expires_in"`
	User         *entity.AdminUser `json:"user"`
}

type AdminTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"`
}

type TenantListResponse struct {
	Tenants []*entity.TenantDetail `json:"tenants"`
	Total   int64                  `json:"total"`
	Page    int                    `json:"page"`
	PerPage int                    `json:"per_page"`
}

type AdminListResponse struct {
	Admins  []*entity.AdminUser `json:"admins"`
	Total   int64               `json:"total"`
	Page    int                 `json:"page"`
	PerPage int                 `json:"per_page"`
}

type AuditLogListResponse struct {
	Logs    []*entity.AdminAuditLog `json:"logs"`
	Total   int64                   `json:"total"`
	Page    int                     `json:"page"`
	PerPage int                     `json:"per_page"`
}

type SupportTicketListResponse struct {
	Tickets []*entity.AdminSupportTicket `json:"tickets"`
	Total   int64                        `json:"total"`
	Page    int                          `json:"page"`
	PerPage int                          `json:"per_page"`
}

type PaymentTransactionListResponse struct {
	Transactions []*PaymentTransactionDetail `json:"transactions"`
	Total        int64                       `json:"total"`
	Page         int                         `json:"page"`
	PerPage      int                         `json:"per_page"`
}

type PaymentTransactionDetail struct {
	ID                   string     `json:"id"`
	TenantID             string     `json:"tenant_id"`
	TenantName           string     `json:"tenant_name"`
	SubscriptionID       *string    `json:"subscription_id,omitempty"`
	PlanID               *string    `json:"plan_id,omitempty"`
	OrderID              string     `json:"order_id"`
	Amount               float64    `json:"amount"`
	Status               string     `json:"status"`
	PaymentMethod        string     `json:"payment_method"`
	PaymentGateway       string     `json:"payment_gateway"`
	GatewayTransactionID string     `json:"gateway_transaction_id"`
	PaidAt               *time.Time `json:"paid_at,omitempty"`
	ExpiredAt            *time.Time `json:"expired_at,omitempty"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

type PaymentReconcileResponse struct {
	OrderID        string `json:"order_id"`
	LocalStatus    string `json:"local_status"`
	GatewayStatus  string `json:"gateway_status"`
	IsMatched      bool   `json:"is_matched"`
	Message        string `json:"message"`
	UpdatedStatus  string `json:"updated_status,omitempty"`
}

// Request types
type CreateTenantRequest struct {
	Name          string `json:"name" binding:"required"`
	Slug          string `json:"slug" binding:"required"`
	Email         string `json:"email" binding:"required,email"`
	Phone         string `json:"phone"`
	Address       string `json:"address"`
	PlanID        string `json:"plan_id" binding:"required"`
	AdminName     string `json:"admin_name" binding:"required"`
	AdminEmail    string `json:"admin_email" binding:"required,email"`
	AdminPassword string `json:"admin_password" binding:"required,min=6"`
}

type UpdateTenantRequest struct {
	Name    *string `json:"name"`
	Email   *string `json:"email"`
	Phone   *string `json:"phone"`
	Address *string `json:"address"`
	Status  *string `json:"status"`
	PlanID  *string `json:"plan_id"`
}

type CreatePlanRequest struct {
	Name         string                  `json:"name" binding:"required"`
	Slug         string                  `json:"slug" binding:"required"`
	Description  string                  `json:"description"`
	Price        float64                 `json:"price"`
	BillingCycle string                  `json:"billing_cycle" binding:"required"`
	MaxCustomers int                     `json:"max_customers"`
	MaxUsers     int                     `json:"max_users"`
	Features     []string                `json:"features"`
	IsPublic     *bool                   `json:"is_public"`
	IsTrial      *bool                   `json:"is_trial"`
	SortOrder    *int                    `json:"sort_order"`
	Limits       *entity.PlanLimits      `json:"limits"`
	PlanFeatures *entity.PlanFeatures    `json:"plan_features"`
	TrialConfig  *entity.TrialConfig     `json:"trial_config"`
}

type UpdatePlanRequest struct {
	Name         *string                 `json:"name"`
	Slug         *string                 `json:"slug"`
	Description  *string                 `json:"description"`
	Price        *float64                `json:"price"`
	BillingCycle *string                 `json:"billing_cycle"`
	MaxCustomers *int                    `json:"max_customers"`
	MaxUsers     *int                    `json:"max_users"`
	Features     *[]string               `json:"features"`
	IsActive     *bool                   `json:"is_active"`
	IsPublic     *bool                   `json:"is_public"`
	IsTrial      *bool                   `json:"is_trial"`
	SortOrder    *int                    `json:"sort_order"`
	Limits       *entity.PlanLimits      `json:"limits"`
	PlanFeatures *entity.PlanFeatures    `json:"plan_features"`
	TrialConfig  *entity.TrialConfig     `json:"trial_config"`
}

type CreateAdminRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required"`
	IsActive bool   `json:"is_active"`
}

type UpdateAdminRequest struct {
	Name     *string `json:"name"`
	Email    *string `json:"email"`
	Password *string `json:"password"`
	Role     *string `json:"role"`
	IsActive *bool   `json:"is_active"`
}

// AdminServiceImpl implements AdminService
type AdminServiceImpl struct {
	adminUserRepo          repository.AdminUserRepository
	auditLogRepo           repository.AdminAuditLogRepository
	supportTicketRepo      repository.SupportTicketRepository
	adminTenantRepo        repository.AdminTenantRepository
	planRepo               repository.SubscriptionPlanRepository
	tenantRepo             repository.TenantRepository
	userRepo               repository.UserRepository
	paymentTransactionRepo repository.PaymentTransactionRepository
	midtransClient         *payment.MidtransClient
	jwtSecret              string
	notificationService    NotificationService
}

func NewAdminService(
	adminUserRepo repository.AdminUserRepository,
	auditLogRepo repository.AdminAuditLogRepository,
	supportTicketRepo repository.SupportTicketRepository,
	adminTenantRepo repository.AdminTenantRepository,
	planRepo repository.SubscriptionPlanRepository,
	tenantRepo repository.TenantRepository,
	userRepo repository.UserRepository,
	paymentTransactionRepo repository.PaymentTransactionRepository,
	midtransClient *payment.MidtransClient,
	jwtSecret string,
) AdminService {
	return &AdminServiceImpl{
		adminUserRepo:          adminUserRepo,
		auditLogRepo:           auditLogRepo,
		supportTicketRepo:      supportTicketRepo,
		adminTenantRepo:        adminTenantRepo,
		planRepo:               planRepo,
		tenantRepo:             tenantRepo,
		userRepo:               userRepo,
		paymentTransactionRepo: paymentTransactionRepo,
		midtransClient:         midtransClient,
		jwtSecret:              jwtSecret,
	}
}

// NewAdminServiceWithNotification creates admin service with notification support
func NewAdminServiceWithNotification(
	adminUserRepo repository.AdminUserRepository,
	auditLogRepo repository.AdminAuditLogRepository,
	supportTicketRepo repository.SupportTicketRepository,
	adminTenantRepo repository.AdminTenantRepository,
	planRepo repository.SubscriptionPlanRepository,
	tenantRepo repository.TenantRepository,
	userRepo repository.UserRepository,
	paymentTransactionRepo repository.PaymentTransactionRepository,
	midtransClient *payment.MidtransClient,
	jwtSecret string,
	notificationService NotificationService,
) AdminService {
	return &AdminServiceImpl{
		adminUserRepo:          adminUserRepo,
		auditLogRepo:           auditLogRepo,
		supportTicketRepo:      supportTicketRepo,
		adminTenantRepo:        adminTenantRepo,
		planRepo:               planRepo,
		tenantRepo:             tenantRepo,
		userRepo:               userRepo,
		paymentTransactionRepo: paymentTransactionRepo,
		midtransClient:         midtransClient,
		jwtSecret:              jwtSecret,
		notificationService:    notificationService,
	}
}

func (s *AdminServiceImpl) Login(ctx context.Context, email, password string) (*AdminAuthResponse, error) {
	admin, err := s.adminUserRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, errors.NewUnauthorizedError("Invalid credentials")
	}

	if !admin.IsActive {
		return nil, errors.ErrForbidden
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(password)); err != nil {
		return nil, errors.NewUnauthorizedError("Invalid credentials")
	}

	// Update last login
	s.adminUserRepo.UpdateLastLogin(ctx, admin.ID)

	// Generate JWT access token
	accessToken := generateAdminToken(admin.ID, admin.Email, admin.Role, s.jwtSecret)
	
	// Generate refresh token
	refreshToken := generateAdminRefreshToken(admin.ID, s.jwtSecret)

	return &AdminAuthResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    3600, // 1 hour
		User:         admin,
	}, nil
}

func (s *AdminServiceImpl) RefreshToken(ctx context.Context, refreshToken string) (*AdminTokenResponse, error) {
	// Validate refresh token
	adminID, err := validateAdminRefreshToken(refreshToken, s.jwtSecret)
	if err != nil {
		return nil, errors.NewUnauthorizedError("Invalid or expired refresh token")
	}

	// Get admin to verify still active
	admin, err := s.adminUserRepo.GetByID(ctx, adminID)
	if err != nil {
		return nil, errors.NewUnauthorizedError("Admin not found")
	}

	if !admin.IsActive {
		return nil, errors.NewForbiddenError("Admin account is inactive")
	}

	// Generate new access token
	accessToken := generateAdminToken(admin.ID, admin.Email, admin.Role, s.jwtSecret)

	return &AdminTokenResponse{
		AccessToken: accessToken,
		ExpiresIn:   3600, // 1 hour
	}, nil
}

func (s *AdminServiceImpl) GetProfile(ctx context.Context, adminID string) (*entity.AdminUser, error) {
	return s.adminUserRepo.GetByID(ctx, adminID)
}

func (s *AdminServiceImpl) GetDashboardStats(ctx context.Context) (*repository.AdminDashboardStats, error) {
	return s.adminTenantRepo.GetDashboardStats(ctx)
}

func (s *AdminServiceImpl) GetRevenueData(ctx context.Context, months int) ([]*repository.RevenueData, error) {
	return s.adminTenantRepo.GetRevenueData(ctx, months)
}

func (s *AdminServiceImpl) GetTenantGrowthData(ctx context.Context, months int) ([]*repository.TenantGrowthData, error) {
	return s.adminTenantRepo.GetTenantGrowthData(ctx, months)
}

func (s *AdminServiceImpl) ListTenants(ctx context.Context, page, perPage int, search, status, planID string) (*TenantListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	tenants, total, err := s.adminTenantRepo.GetAllTenants(ctx, page, perPage, search, status, planID)
	if err != nil {
		return nil, err
	}

	return &TenantListResponse{
		Tenants: tenants,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	}, nil
}

func (s *AdminServiceImpl) GetTenant(ctx context.Context, id string) (*entity.TenantDetail, error) {
	return s.adminTenantRepo.GetTenantDetail(ctx, id)
}

func (s *AdminServiceImpl) CreateTenant(ctx context.Context, req *CreateTenantRequest) (*entity.TenantDetail, error) {
	// Create tenant
	tenant := &entity.Tenant{
		Name:     req.Name,
		Email:    req.Email,
		IsActive: true,
	}

	if err := s.tenantRepo.Create(ctx, tenant); err != nil {
		return nil, errors.NewInternalError("Failed to create tenant")
	}

	// Create admin user for tenant
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.AdminPassword), bcrypt.DefaultCost)
	user := &entity.User{
		TenantID: tenant.ID,
		Email:    req.AdminEmail,
		Password: string(hashedPassword),
		Name:     req.AdminName,
		Role:     entity.RoleAdmin,
		IsActive: true,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		// Rollback tenant creation
		s.tenantRepo.Delete(ctx, tenant.ID)
		return nil, errors.NewInternalError("Failed to create tenant admin")
	}

	return s.adminTenantRepo.GetTenantDetail(ctx, tenant.ID)
}

func (s *AdminServiceImpl) UpdateTenant(ctx context.Context, id string, req *UpdateTenantRequest) (*entity.TenantDetail, error) {
	tenant, err := s.tenantRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFoundError("Tenant not found")
	}

	if req.Name != nil {
		tenant.Name = *req.Name
	}
	if req.Email != nil {
		tenant.Email = *req.Email
	}

	if err := s.tenantRepo.Update(ctx, tenant); err != nil {
		return nil, errors.NewInternalError("Failed to update tenant")
	}

	return s.adminTenantRepo.GetTenantDetail(ctx, id)
}

func (s *AdminServiceImpl) DeleteTenant(ctx context.Context, id string) error {
	return s.tenantRepo.Delete(ctx, id)
}

func (s *AdminServiceImpl) SuspendTenant(ctx context.Context, id string, reason string, adminID string) error {
	if err := s.adminTenantRepo.SuspendTenant(ctx, id, reason); err != nil {
		return errors.NewInternalError("Failed to suspend tenant")
	}

	// Get admin info for audit log
	admin, _ := s.adminUserRepo.GetByID(ctx, adminID)
	adminName := "Unknown"
	if admin != nil {
		adminName = admin.Name
	}

	// Create audit log
	s.CreateAuditLog(ctx, adminID, adminName, "SUSPEND", "tenant", id, "Reason: "+reason, "")

	return nil
}

func (s *AdminServiceImpl) ActivateTenant(ctx context.Context, id string, adminID string) error {
	if err := s.adminTenantRepo.ActivateTenant(ctx, id); err != nil {
		return errors.NewInternalError("Failed to activate tenant")
	}

	// Get admin info for audit log
	admin, _ := s.adminUserRepo.GetByID(ctx, adminID)
	adminName := "Unknown"
	if admin != nil {
		adminName = admin.Name
	}

	// Create audit log
	s.CreateAuditLog(ctx, adminID, adminName, "ACTIVATE", "tenant", id, "Tenant activated", "")

	return nil
}

func (s *AdminServiceImpl) ListPlans(ctx context.Context) ([]*entity.SubscriptionPlan, error) {
	return s.planRepo.GetAll(ctx)
}

func (s *AdminServiceImpl) CreatePlan(ctx context.Context, req *CreatePlanRequest) (*entity.SubscriptionPlan, error) {
	// Check if slug already exists
	existing, _ := s.planRepo.FindBySlug(ctx, req.Slug)
	if existing != nil {
		return nil, errors.NewConflictError("Plan slug already exists")
	}

	plan := &entity.SubscriptionPlan{
		Name:         req.Name,
		Slug:         req.Slug,
		Description:  req.Description,
		Price:        req.Price,
		BillingCycle: req.BillingCycle,
		MaxCustomers: req.MaxCustomers,
		MaxUsers:     req.MaxUsers,
		IsActive:     true,
		IsPublic:     true,
		IsTrial:      false,
		SortOrder:    0,
	}

	// Set optional fields
	if req.IsPublic != nil {
		plan.IsPublic = *req.IsPublic
	}
	if req.IsTrial != nil {
		plan.IsTrial = *req.IsTrial
	}
	if req.SortOrder != nil {
		plan.SortOrder = *req.SortOrder
	}

	// Set limits as JSON
	if req.Limits != nil {
		limitsJSON, _ := json.Marshal(req.Limits)
		plan.Limits = string(limitsJSON)
	} else {
		defaultLimits := entity.DefaultStarterLimits()
		limitsJSON, _ := json.Marshal(defaultLimits)
		plan.Limits = string(limitsJSON)
	}

	// Set features as JSON
	if req.PlanFeatures != nil {
		featuresJSON, _ := json.Marshal(req.PlanFeatures)
		plan.PlanFeatures = string(featuresJSON)
	} else {
		defaultFeatures := entity.DefaultStarterFeatures()
		featuresJSON, _ := json.Marshal(defaultFeatures)
		plan.PlanFeatures = string(featuresJSON)
	}

	// Set trial config as JSON
	if req.TrialConfig != nil {
		trialJSON, _ := json.Marshal(req.TrialConfig)
		plan.TrialConfig = string(trialJSON)
	} else {
		defaultTrial := entity.TrialConfig{TrialDays: 14, TrialEnabled: true, RequirePayment: false, AutoConvert: false}
		trialJSON, _ := json.Marshal(defaultTrial)
		plan.TrialConfig = string(trialJSON)
	}

	if err := s.planRepo.Create(ctx, plan); err != nil {
		return nil, errors.NewInternalError("Failed to create plan")
	}

	return plan, nil
}

func (s *AdminServiceImpl) UpdatePlan(ctx context.Context, id string, req *UpdatePlanRequest) (*entity.SubscriptionPlan, error) {
	plan, err := s.planRepo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFoundError("Plan not found")
	}

	if req.Name != nil {
		plan.Name = *req.Name
	}
	if req.Slug != nil {
		// Check if new slug already exists
		existing, _ := s.planRepo.FindBySlug(ctx, *req.Slug)
		if existing != nil && existing.ID != id {
			return nil, errors.NewConflictError("Plan slug already exists")
		}
		plan.Slug = *req.Slug
	}
	if req.Description != nil {
		plan.Description = *req.Description
	}
	if req.Price != nil {
		plan.Price = *req.Price
	}
	if req.BillingCycle != nil {
		plan.BillingCycle = *req.BillingCycle
	}
	if req.MaxCustomers != nil {
		plan.MaxCustomers = *req.MaxCustomers
	}
	if req.MaxUsers != nil {
		plan.MaxUsers = *req.MaxUsers
	}
	if req.IsActive != nil {
		plan.IsActive = *req.IsActive
	}
	if req.IsPublic != nil {
		plan.IsPublic = *req.IsPublic
	}
	if req.IsTrial != nil {
		plan.IsTrial = *req.IsTrial
	}
	if req.SortOrder != nil {
		plan.SortOrder = *req.SortOrder
	}
	if req.Limits != nil {
		limitsJSON, _ := json.Marshal(req.Limits)
		plan.Limits = string(limitsJSON)
	}
	if req.PlanFeatures != nil {
		featuresJSON, _ := json.Marshal(req.PlanFeatures)
		plan.PlanFeatures = string(featuresJSON)
	}
	if req.TrialConfig != nil {
		trialJSON, _ := json.Marshal(req.TrialConfig)
		plan.TrialConfig = string(trialJSON)
	}

	if err := s.planRepo.Update(ctx, plan); err != nil {
		return nil, errors.NewInternalError("Failed to update plan")
	}

	return plan, nil
}

func (s *AdminServiceImpl) DeletePlan(ctx context.Context, id string) error {
	return s.planRepo.Delete(ctx, id)
}

func (s *AdminServiceImpl) ListAdmins(ctx context.Context, page, perPage int) (*AdminListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	admins, total, err := s.adminUserRepo.List(ctx, page, perPage)
	if err != nil {
		return nil, err
	}

	return &AdminListResponse{
		Admins:  admins,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	}, nil
}

func (s *AdminServiceImpl) CreateAdmin(ctx context.Context, req *CreateAdminRequest) (*entity.AdminUser, error) {
	// Check if email already exists
	existing, _ := s.adminUserRepo.GetByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.NewConflictError("Email already exists")
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	admin := &entity.AdminUser{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     req.Role,
		IsActive: req.IsActive,
	}

	if err := s.adminUserRepo.Create(ctx, admin); err != nil {
		return nil, errors.NewInternalError("Failed to create admin")
	}

	return admin, nil
}

func (s *AdminServiceImpl) UpdateAdmin(ctx context.Context, id string, req *UpdateAdminRequest) (*entity.AdminUser, error) {
	admin, err := s.adminUserRepo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFoundError("Admin not found")
	}

	if req.Name != nil {
		admin.Name = *req.Name
	}
	if req.Email != nil {
		admin.Email = *req.Email
	}
	if req.Password != nil {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		admin.Password = string(hashedPassword)
	}
	if req.Role != nil {
		admin.Role = *req.Role
	}
	if req.IsActive != nil {
		admin.IsActive = *req.IsActive
	}

	if err := s.adminUserRepo.Update(ctx, admin); err != nil {
		return nil, errors.NewInternalError("Failed to update admin")
	}

	return admin, nil
}

func (s *AdminServiceImpl) DeleteAdmin(ctx context.Context, id string) error {
	return s.adminUserRepo.Delete(ctx, id)
}

func (s *AdminServiceImpl) ListAuditLogs(ctx context.Context, page, perPage int, adminID string) (*AuditLogListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	logs, total, err := s.auditLogRepo.List(ctx, page, perPage, adminID)
	if err != nil {
		return nil, err
	}

	return &AuditLogListResponse{
		Logs:    logs,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	}, nil
}

func (s *AdminServiceImpl) CreateAuditLog(ctx context.Context, adminID, adminName, action, resourceType, resourceID, details, ipAddress string) error {
	log := &entity.AdminAuditLog{
		AdminID:      adminID,
		AdminName:    adminName,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Details:      details,
		IPAddress:    ipAddress,
		CreatedAt:    time.Now(),
	}

	return s.auditLogRepo.Create(ctx, log)
}

func (s *AdminServiceImpl) ListSupportTickets(ctx context.Context, page, perPage int, status string) (*SupportTicketListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	tickets, total, err := s.supportTicketRepo.List(ctx, page, perPage, status)
	if err != nil {
		return nil, err
	}

	return &SupportTicketListResponse{
		Tickets: tickets,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	}, nil
}

func (s *AdminServiceImpl) UpdateTicketStatus(ctx context.Context, id, status string, assignedTo *string) (*entity.AdminSupportTicket, error) {
	ticket, err := s.supportTicketRepo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFoundError("Ticket not found")
	}

	ticket.Status = status
	if assignedTo != nil {
		ticket.AssignedTo = assignedTo
	}

	now := time.Now()
	if status == entity.TicketStatusResolved {
		ticket.ResolvedAt = &now
	} else if status == entity.TicketStatusClosed {
		ticket.ClosedAt = &now
	}

	if err := s.supportTicketRepo.Update(ctx, ticket); err != nil {
		return nil, errors.NewInternalError("Failed to update ticket")
	}

	return ticket, nil
}

func (s *AdminServiceImpl) GetSupportTicket(ctx context.Context, id string) (*entity.AdminSupportTicket, error) {
	ticket, err := s.supportTicketRepo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFoundError("Ticket not found")
	}

	// Get replies
	replies, err := s.supportTicketRepo.GetRepliesByTicketID(ctx, id)
	if err == nil {
		ticket.Replies = make([]entity.SupportTicketReply, len(replies))
		for i, r := range replies {
			ticket.Replies[i] = *r
		}
	}

	return ticket, nil
}

func (s *AdminServiceImpl) AddTicketReply(ctx context.Context, adminID, ticketID, message string) (*entity.SupportTicketReply, error) {
	// Get ticket
	ticket, err := s.supportTicketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return nil, errors.NewNotFoundError("Ticket not found")
	}

	reply := &entity.SupportTicketReply{
		TicketID: ticketID,
		AdminID:  &adminID,
		Message:  message,
		IsAdmin:  true,
	}

	if err := s.supportTicketRepo.CreateReply(ctx, reply); err != nil {
		return nil, errors.NewInternalError("Failed to add reply")
	}

	// Update ticket status to in_progress if it was open
	if ticket.Status == entity.TicketStatusOpen {
		ticket.Status = entity.TicketStatusInProgress
		ticket.AssignedTo = &adminID
		s.supportTicketRepo.Update(ctx, ticket)
	}

	// Send notification to user about admin reply
	if s.notificationService != nil && ticket.TenantID != "" {
		data, _ := json.Marshal(map[string]interface{}{
			"ticket_id": ticketID,
			"subject":   ticket.Subject,
		})
		notification := &entity.Notification{
			TenantID: ticket.TenantID,
			UserID:   ticket.UserID,
			Type:     entity.NotificationTypeTicket,
			Title:    "Balasan dari Support",
			Message:  "Tim support telah membalas tiket '" + ticket.Subject + "'",
			Data:     string(data),
		}
		s.notificationService.CreateNotification(ctx, notification)
	}

	return reply, nil
}

func (s *AdminServiceImpl) ResolveTicket(ctx context.Context, ticketID string) error {
	ticket, err := s.supportTicketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return errors.NewNotFoundError("Ticket not found")
	}

	now := time.Now()
	ticket.Status = entity.TicketStatusResolved
	ticket.ResolvedAt = &now

	if err := s.supportTicketRepo.Update(ctx, ticket); err != nil {
		return err
	}

	// Send notification to user
	if s.notificationService != nil && ticket.TenantID != "" {
		data, _ := json.Marshal(map[string]interface{}{
			"ticket_id": ticketID,
			"subject":   ticket.Subject,
			"status":    "resolved",
		})
		notification := &entity.Notification{
			TenantID: ticket.TenantID,
			UserID:   ticket.UserID,
			Type:     entity.NotificationTypeSuccess,
			Title:    "Tiket Diselesaikan",
			Message:  "Tiket '" + ticket.Subject + "' telah diselesaikan oleh tim support.",
			Data:     string(data),
		}
		s.notificationService.CreateNotification(ctx, notification)
	}

	return nil
}

func (s *AdminServiceImpl) CloseTicket(ctx context.Context, ticketID string) error {
	ticket, err := s.supportTicketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return errors.NewNotFoundError("Ticket not found")
	}

	now := time.Now()
	ticket.Status = entity.TicketStatusClosed
	ticket.ClosedAt = &now

	if err := s.supportTicketRepo.Update(ctx, ticket); err != nil {
		return err
	}

	// Send notification to user
	if s.notificationService != nil && ticket.TenantID != "" {
		data, _ := json.Marshal(map[string]interface{}{
			"ticket_id": ticketID,
			"subject":   ticket.Subject,
			"status":    "closed",
		})
		notification := &entity.Notification{
			TenantID: ticket.TenantID,
			UserID:   ticket.UserID,
			Type:     entity.NotificationTypeInfo,
			Title:    "Tiket Ditutup",
			Message:  "Tiket '" + ticket.Subject + "' telah ditutup.",
			Data:     string(data),
		}
		s.notificationService.CreateNotification(ctx, notification)
	}

	return nil
}

// Helper function to generate admin JWT token
func generateAdminToken(adminID, email, role, secret string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"admin_id": adminID,
		"email":    email,
		"role":     role,
		"exp":      time.Now().Add(time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	})
	
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return ""
	}
	return tokenString
}

// Helper function to generate admin refresh token
func generateAdminRefreshToken(adminID, secret string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"admin_id": adminID,
		"type":     "refresh",
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(), // 7 days
		"iat":      time.Now().Unix(),
	})
	
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return ""
	}
	return tokenString
}

// Helper function to validate admin refresh token
func validateAdminRefreshToken(refreshToken, secret string) (string, error) {
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.NewUnauthorizedError("Invalid token signing method")
		}
		return []byte(secret), nil
	})
	
	if err != nil || !token.Valid {
		return "", errors.NewUnauthorizedError("Invalid or expired refresh token")
	}
	
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.NewUnauthorizedError("Invalid token claims")
	}
	
	// Check if it's a refresh token
	tokenType, _ := claims["type"].(string)
	if tokenType != "refresh" {
		return "", errors.NewUnauthorizedError("Not a refresh token")
	}
	
	adminID, ok := claims["admin_id"].(string)
	if !ok || adminID == "" {
		return "", errors.NewUnauthorizedError("Invalid admin ID in token")
	}
	
	return adminID, nil
}

// Payment Transaction methods
func (s *AdminServiceImpl) ListPaymentTransactions(ctx context.Context, page, perPage int, status, tenantID, search string) (*PaymentTransactionListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	transactions, total, err := s.paymentTransactionRepo.FindAll(ctx, page, perPage, status, tenantID, search)
	if err != nil {
		return nil, errors.NewInternalError("Failed to list payment transactions")
	}

	// Convert to detail response
	details := make([]*PaymentTransactionDetail, len(transactions))
	for i, tx := range transactions {
		tenantName := ""
		if tx.Tenant != nil {
			tenantName = tx.Tenant.Name
		}
		details[i] = &PaymentTransactionDetail{
			ID:                   tx.ID,
			TenantID:             tx.TenantID,
			TenantName:           tenantName,
			SubscriptionID:       tx.SubscriptionID,
			PlanID:               tx.PlanID,
			OrderID:              tx.OrderID,
			Amount:               tx.Amount,
			Status:               tx.Status,
			PaymentMethod:        tx.PaymentMethod,
			PaymentGateway:       tx.PaymentGateway,
			GatewayTransactionID: tx.GatewayTransactionID,
			PaidAt:               tx.PaidAt,
			ExpiredAt:            tx.ExpiredAt,
			CreatedAt:            tx.CreatedAt,
			UpdatedAt:            tx.UpdatedAt,
		}
	}

	return &PaymentTransactionListResponse{
		Transactions: details,
		Total:        total,
		Page:         page,
		PerPage:      perPage,
	}, nil
}

func (s *AdminServiceImpl) GetPaymentTransaction(ctx context.Context, id string) (*entity.PaymentTransaction, error) {
	return s.paymentTransactionRepo.FindByID(ctx, id)
}

func (s *AdminServiceImpl) GetPaymentStats(ctx context.Context) (*repository.PaymentStats, error) {
	return s.paymentTransactionRepo.GetStats(ctx)
}

func (s *AdminServiceImpl) ReconcilePayment(ctx context.Context, orderID string) (*PaymentReconcileResponse, error) {
	// Get local transaction
	tx, err := s.paymentTransactionRepo.FindByOrderID(ctx, orderID)
	if err != nil {
		return nil, errors.NewNotFoundError("Transaction not found")
	}

	// Check if midtrans client is available
	if s.midtransClient == nil {
		return &PaymentReconcileResponse{
			OrderID:       orderID,
			LocalStatus:   tx.Status,
			GatewayStatus: "unknown",
			IsMatched:     false,
			Message:       "Midtrans client not configured",
		}, nil
	}

	// Get status from Midtrans
	gatewayResp, err := s.midtransClient.GetTransactionStatus(orderID)
	if err != nil {
		return &PaymentReconcileResponse{
			OrderID:       orderID,
			LocalStatus:   tx.Status,
			GatewayStatus: "error",
			IsMatched:     false,
			Message:       "Failed to get status from gateway: " + err.Error(),
		}, nil
	}

	gatewayStatus := gatewayResp.TransactionStatus
	transactionID := gatewayResp.TransactionID

	// Map Midtrans status to local status
	var mappedStatus string
	switch gatewayStatus {
	case "capture", "settlement":
		mappedStatus = entity.TransactionStatusPaid
	case "pending":
		mappedStatus = entity.TransactionStatusPending
	case "deny", "cancel":
		mappedStatus = entity.TransactionStatusFailed
	case "expire":
		mappedStatus = entity.TransactionStatusExpired
	case "refund", "partial_refund":
		mappedStatus = entity.TransactionStatusRefunded
	default:
		mappedStatus = tx.Status
	}

	isMatched := tx.Status == mappedStatus
	response := &PaymentReconcileResponse{
		OrderID:       orderID,
		LocalStatus:   tx.Status,
		GatewayStatus: gatewayStatus,
		IsMatched:     isMatched,
	}

	// Update local status if different
	if !isMatched {
		tx.Status = mappedStatus
		tx.GatewayTransactionID = transactionID
		if mappedStatus == entity.TransactionStatusPaid && tx.PaidAt == nil {
			now := time.Now()
			tx.PaidAt = &now
		}
		if err := s.paymentTransactionRepo.Update(ctx, tx); err != nil {
			response.Message = "Status mismatch detected but failed to update: " + err.Error()
		} else {
			response.Message = "Status updated from " + response.LocalStatus + " to " + mappedStatus
			response.UpdatedStatus = mappedStatus
		}
	} else {
		response.Message = "Status is already synchronized"
	}

	return response, nil
}
