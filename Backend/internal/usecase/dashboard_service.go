package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"gorm.io/gorm"
)

type DashboardService interface {
	GetOverview(ctx context.Context, tenantID string) (*dto.DashboardOverviewResponse, error)
	
	// Customer Management
	ListCustomers(ctx context.Context, tenantID string, params dto.CustomerQueryParams) (*dto.CustomerListResponse, error)
	GetCustomerDetail(ctx context.Context, tenantID, customerID string) (*dto.CustomerDetailResponse, error)
	CreateCustomer(ctx context.Context, tenantID string, req *dto.CreateCustomerRequest) (*dto.CustomerDetailResponse, error)
	UpdateCustomer(ctx context.Context, tenantID, customerID string, req *dto.UpdateCustomerRequest) error
	DeleteCustomer(ctx context.Context, tenantID, customerID string) error
	ActivateCustomer(ctx context.Context, tenantID, customerID string) error
	SuspendCustomer(ctx context.Context, tenantID, customerID, reason string) error
	TerminateCustomer(ctx context.Context, tenantID, customerID, reason string) error
	
	// Payment Management
	ListPayments(ctx context.Context, tenantID string, params dto.PaymentQueryParams) (*dto.PaymentListResponse, error)
	RecordPayment(ctx context.Context, tenantID string, req *dto.RecordPaymentRequest) error
	
	// Service Plan Management
	ListServicePlans(ctx context.Context, tenantID string) (*dto.ServicePlanListResponse, error)
	CreateServicePlan(ctx context.Context, tenantID string, req *dto.CreateServicePlanRequest) (*dto.ServicePlanSummary, error)
	UpdateServicePlan(ctx context.Context, tenantID, planID string, req *dto.UpdateServicePlanRequest) error
	DeleteServicePlan(ctx context.Context, tenantID, planID string) error

	// Onboarding
	GetOnboardingStatus(ctx context.Context, tenantID string) (*dto.OnboardingStatusResponse, error)
	UpdateOnboardingStep(ctx context.Context, tenantID string, step int, completed bool) error
	CompleteOnboarding(ctx context.Context, tenantID string) error

	// Plan Limits
	GetPlanLimits(ctx context.Context, tenantID string) (*dto.PlanLimitsResponse, error)
}

type dashboardService struct {
	db                 *gorm.DB
	customerRepo       repository.CustomerRepository
	paymentRepo        repository.PaymentRepository
	servicePlanRepo    repository.ServicePlanRepository
	tenantRepo         repository.TenantRepository
	userRepo           repository.UserRepository
	subscriptionRepo   repository.TenantSubscriptionRepository
	subPlanRepo        repository.SubscriptionPlanRepository
}

func NewDashboardService(
	db *gorm.DB,
	customerRepo repository.CustomerRepository,
	paymentRepo repository.PaymentRepository,
	servicePlanRepo repository.ServicePlanRepository,
	tenantRepo repository.TenantRepository,
	userRepo repository.UserRepository,
	subscriptionRepo repository.TenantSubscriptionRepository,
	subPlanRepo repository.SubscriptionPlanRepository,
) DashboardService {
	return &dashboardService{
		db:               db,
		customerRepo:     customerRepo,
		paymentRepo:      paymentRepo,
		servicePlanRepo:  servicePlanRepo,
		tenantRepo:       tenantRepo,
		userRepo:         userRepo,
		subscriptionRepo: subscriptionRepo,
		subPlanRepo:      subPlanRepo,
	}
}

func (s *dashboardService) GetOverview(ctx context.Context, tenantID string) (*dto.DashboardOverviewResponse, error) {
	// Get statistics
	totalCustomers, _ := s.customerRepo.CountByTenantID(ctx, tenantID)
	activeCustomers, _ := s.customerRepo.CountByStatus(ctx, tenantID, entity.CustomerStatusActive)
	suspendedCustomers, _ := s.customerRepo.CountByStatus(ctx, tenantID, entity.CustomerStatusSuspended)
	newCustomersMonth, _ := s.customerRepo.CountNewCustomersThisMonth(ctx, tenantID)
	
	pendingPayments, _ := s.paymentRepo.CountByStatus(ctx, tenantID, entity.PaymentStatusPending)
	overduePayments, _ := s.paymentRepo.CountByStatus(ctx, tenantID, entity.PaymentStatusOverdue)
	
	// Get revenue info
	now := time.Now()
	thisMonth, _ := s.paymentRepo.SumByMonth(ctx, tenantID, int(now.Month()), now.Year())
	lastMonth, _ := s.paymentRepo.SumByMonth(ctx, tenantID, int(now.AddDate(0, -1, 0).Month()), now.AddDate(0, -1, 0).Year())
	
	collected, _ := s.paymentRepo.SumByStatus(ctx, tenantID, entity.PaymentStatusPaid)
	pending, _ := s.paymentRepo.SumByStatus(ctx, tenantID, entity.PaymentStatusPending)
	overdue, _ := s.paymentRepo.SumByStatus(ctx, tenantID, entity.PaymentStatusOverdue)
	
	growth := float64(0)
	if lastMonth > 0 {
		growth = ((thisMonth - lastMonth) / lastMonth) * 100
	}
	
	collectionRate := float64(0)
	totalExpected := collected + pending + overdue
	if totalExpected > 0 {
		collectionRate = (collected / totalExpected) * 100
	}
	
	// Get recent activities
	recentPayments, _ := s.paymentRepo.GetRecentPayments(ctx, tenantID, 5)
	recentCustomers, _, _ := s.customerRepo.FindByTenantID(ctx, tenantID, 1, 5, map[string]interface{}{
		"sort_by": "created_at",
		"sort_order": "desc",
	})
	
	// Build response
	response := &dto.DashboardOverviewResponse{
		Statistics: dto.DashboardStatistics{
			TotalCustomers:     totalCustomers,
			ActiveCustomers:    activeCustomers,
			SuspendedCustomers: suspendedCustomers,
			NewCustomersMonth:  newCustomersMonth,
			TotalRevenue:       collected,
			MonthlyRevenue:     thisMonth,
			PendingPayments:    pendingPayments,
			OverduePayments:    overduePayments,
		},
		Revenue: dto.RevenueInfo{
			ThisMonth:      thisMonth,
			LastMonth:      lastMonth,
			Growth:         growth,
			Collected:      collected,
			Pending:        pending,
			Overdue:        overdue,
			CollectionRate: collectionRate,
		},
		Recent: dto.RecentActivities{
			RecentPayments:  s.buildRecentPayments(recentPayments),
			RecentCustomers: s.buildRecentCustomers(recentCustomers),
			Alerts:          s.buildAlerts(overduePayments, suspendedCustomers, newCustomersMonth),
		},
		Charts: dto.DashboardCharts{
			RevenueChart:  []dto.ChartData{}, // Will be implemented
			CustomerChart: []dto.ChartData{}, // Will be implemented
			PaymentStatus: dto.ChartData{},   // Will be implemented
		},
	}
	
	return response, nil
}

func (s *dashboardService) ListCustomers(ctx context.Context, tenantID string, params dto.CustomerQueryParams) (*dto.CustomerListResponse, error) {
	// Set defaults
	if params.Page == 0 {
		params.Page = 1
	}
	if params.PerPage == 0 {
		params.PerPage = 20
	}
	
	// Build filters
	filters := make(map[string]interface{})
	if params.Search != "" {
		filters["search"] = params.Search
	}
	if params.Status != "" {
		filters["status"] = params.Status
	}
	if params.ServiceType != "" {
		filters["service_type"] = params.ServiceType
	}
	if params.ServicePlanID != "" {
		filters["service_plan_id"] = params.ServicePlanID
	}
	if params.SortBy != "" {
		filters["sort_by"] = params.SortBy
	}
	if params.SortOrder != "" {
		filters["sort_order"] = params.SortOrder
	}
	
	customers, total, err := s.customerRepo.FindByTenantID(ctx, tenantID, params.Page, params.PerPage, filters)
	if err != nil {
		logger.Error("Failed to list customers: %v", err)
		return nil, errors.ErrInternalServer
	}
	
	return &dto.CustomerListResponse{
		Customers: s.buildCustomerSummaries(customers),
		Total:     total,
		Page:      params.Page,
		PerPage:   params.PerPage,
	}, nil
}

func (s *dashboardService) GetCustomerDetail(ctx context.Context, tenantID, customerID string) (*dto.CustomerDetailResponse, error) {
	customer, err := s.customerRepo.FindByID(ctx, customerID)
	if err != nil || customer == nil {
		return nil, errors.ErrNotFound
	}
	
	if customer.TenantID != tenantID {
		return nil, errors.ErrUnauthorized
	}
	
	// Get payment history
	payments, _ := s.paymentRepo.FindByCustomerID(ctx, customerID, 12)
	
	// Calculate statistics
	totalPayments := len(payments)
	paidPayments := 0
	pendingPayments := 0
	overduePayments := 0
	totalPaid := float64(0)
	totalPending := float64(0)
	
	for _, p := range payments {
		switch p.Status {
		case entity.PaymentStatusPaid:
			paidPayments++
			totalPaid += p.Amount
		case entity.PaymentStatusPending:
			pendingPayments++
			totalPending += p.Amount
		case entity.PaymentStatusOverdue:
			overduePayments++
			totalPending += p.Amount
		}
	}
	
	onTimeRate := float64(0)
	if totalPayments > 0 {
		onTimeRate = (float64(paidPayments) / float64(totalPayments)) * 100
	}
	
	return &dto.CustomerDetailResponse{
		ID:               customer.ID,
		CustomerCode:     customer.CustomerCode,
		Name:             customer.Name,
		Email:            customer.Email,
		Phone:            customer.Phone,
		Address:          customer.Address,
		Latitude:         customer.Latitude,
		Longitude:        customer.Longitude,
		ServicePlan:      s.buildServicePlanInfo(customer.ServicePlan),
		ServiceType:      customer.ServiceType,
		PPPoEUsername:    customer.PPPoEUsername,
		PPPoEPassword:    customer.PPPoEPassword,
		StaticIP:         customer.StaticIP,
		StaticGateway:    customer.StaticGateway,
		StaticDNS:        customer.StaticDNS,
		IsOnline:         customer.IsOnline,
		IPAddress:        customer.IPAddress,
		LastSeen:         customer.LastSeen,
		Status:           customer.Status,
		InstallationDate: customer.InstallationDate,
		DueDate:          customer.DueDate,
		MonthlyFee:       customer.MonthlyFee,
		Notes:            customer.Notes,
		PaymentHistory:   s.buildPaymentHistory(payments),
		Statistics: dto.CustomerStatistics{
			TotalPayments:   totalPayments,
			PaidPayments:    paidPayments,
			PendingPayments: pendingPayments,
			OverduePayments: overduePayments,
			TotalPaid:       totalPaid,
			TotalPending:    totalPending,
			OnTimeRate:      onTimeRate,
		},
		CreatedAt:        customer.CreatedAt,
		UpdatedAt:        customer.UpdatedAt,
	}, nil
}

func (s *dashboardService) CreateCustomer(ctx context.Context, tenantID string, req *dto.CreateCustomerRequest) (*dto.CustomerDetailResponse, error) {
	// Generate customer code
	customerCode, err := s.customerRepo.GenerateCustomerCode(ctx, tenantID)
	if err != nil {
		logger.Error("Failed to generate customer code: %v", err)
		return nil, errors.ErrInternalServer
	}
	
	// Parse installation date
	installationDate := time.Now()
	if req.InstallationDate != "" {
		if parsed, err := time.Parse(time.RFC3339, req.InstallationDate); err == nil {
			installationDate = parsed
		} else if parsed, err := time.Parse("2006-01-02", req.InstallationDate); err == nil {
			installationDate = parsed
		}
	}
	
	// Set default service type
	serviceType := req.ServiceType
	if serviceType == "" {
		serviceType = entity.ServiceTypeDHCP
	}
	
	// Set default due date
	dueDate := req.DueDate
	if dueDate == 0 {
		dueDate = 15
	}
	
	// Create customer
	customer := &entity.Customer{
		TenantID:         tenantID,
		CustomerCode:     customerCode,
		Name:             req.Name,
		Email:            req.Email,
		Phone:            req.Phone,
		Address:          req.Address,
		Latitude:         req.Latitude,
		Longitude:        req.Longitude,
		ServicePlanID:    req.ServicePlanID,
		ServiceType:      serviceType,
		PPPoEUsername:    req.PPPoEUsername,
		PPPoEPassword:    req.PPPoEPassword,
		StaticIP:         req.StaticIP,
		StaticGateway:    req.StaticGateway,
		StaticDNS:        req.StaticDNS,
		Status:           entity.CustomerStatusPendingActivation,
		InstallationDate: installationDate,
		DueDate:          dueDate,
		MonthlyFee:       req.MonthlyFee,
		Notes:            req.Notes,
	}
	
	if err := s.customerRepo.Create(ctx, customer); err != nil {
		logger.Error("Failed to create customer: %v", err)
		return nil, errors.ErrInternalServer
	}

	// Auto-create RADIUS user for PPPoE customers
	if customer.ServiceType == entity.ServiceTypePPPoE && customer.PPPoEUsername != "" {
		s.createRadiusUserForCustomer(ctx, tenantID, customer)
	}
	
	logger.Info("Customer created: %s (%s)", customer.Name, customer.ID)
	
	return s.GetCustomerDetail(ctx, tenantID, customer.ID)
}

func (s *dashboardService) UpdateCustomer(ctx context.Context, tenantID, customerID string, req *dto.UpdateCustomerRequest) error {
	customer, err := s.customerRepo.FindByID(ctx, customerID)
	if err != nil || customer == nil {
		return errors.ErrNotFound
	}
	
	if customer.TenantID != tenantID {
		return errors.ErrUnauthorized
	}
	
	// Update fields only if provided
	if req.Name != "" {
		customer.Name = req.Name
	}
	if req.Email != "" {
		customer.Email = req.Email
	}
	if req.Phone != "" {
		customer.Phone = req.Phone
	}
	customer.Address = req.Address
	customer.Latitude = req.Latitude
	customer.Longitude = req.Longitude
	if req.ServicePlanID != "" {
		customer.ServicePlanID = req.ServicePlanID
	}
	if req.ServiceType != "" {
		customer.ServiceType = req.ServiceType
	}
	customer.PPPoEUsername = req.PPPoEUsername
	customer.PPPoEPassword = req.PPPoEPassword
	customer.StaticIP = req.StaticIP
	customer.StaticGateway = req.StaticGateway
	customer.StaticDNS = req.StaticDNS
	if req.DueDate > 0 {
		customer.DueDate = req.DueDate
	}
	if req.MonthlyFee > 0 {
		customer.MonthlyFee = req.MonthlyFee
	}
	if req.Status != "" {
		customer.Status = req.Status
	}
	customer.Notes = req.Notes
	
	if err := s.customerRepo.Update(ctx, customer); err != nil {
		logger.Error("Failed to update customer: %v", err)
		return errors.ErrInternalServer
	}
	
	logger.Info("Customer updated: %s (%s)", customer.Name, customer.ID)
	return nil
}

func (s *dashboardService) DeleteCustomer(ctx context.Context, tenantID, customerID string) error {
	customer, err := s.customerRepo.FindByID(ctx, customerID)
	if err != nil || customer == nil {
		return errors.ErrNotFound
	}
	
	if customer.TenantID != tenantID {
		return errors.ErrUnauthorized
	}
	
	if err := s.customerRepo.Delete(ctx, customerID); err != nil {
		logger.Error("Failed to delete customer: %v", err)
		return errors.ErrInternalServer
	}
	
	logger.Info("Customer deleted: %s (%s)", customer.Name, customer.ID)
	return nil
}

func (s *dashboardService) ListPayments(ctx context.Context, tenantID string, params dto.PaymentQueryParams) (*dto.PaymentListResponse, error) {
	// Set defaults
	if params.Page == 0 {
		params.Page = 1
	}
	if params.PerPage == 0 {
		params.PerPage = 20
	}
	
	// Build filters
	filters := make(map[string]interface{})
	if params.Status != "" {
		filters["status"] = params.Status
	}
	if params.CustomerID != "" {
		filters["customer_id"] = params.CustomerID
	}
	if params.Month > 0 {
		filters["month"] = params.Month
	}
	if params.Year > 0 {
		filters["year"] = params.Year
	}
	if params.SortBy != "" {
		filters["sort_by"] = params.SortBy
	}
	if params.SortOrder != "" {
		filters["sort_order"] = params.SortOrder
	}
	
	payments, total, err := s.paymentRepo.FindByTenantID(ctx, tenantID, params.Page, params.PerPage, filters)
	if err != nil {
		logger.Error("Failed to list payments: %v", err)
		return nil, errors.ErrInternalServer
	}
	
	return &dto.PaymentListResponse{
		Payments: s.buildPaymentSummaries(payments),
		Total:    total,
		Page:     params.Page,
		PerPage:  params.PerPage,
	}, nil
}

func (s *dashboardService) RecordPayment(ctx context.Context, tenantID string, req *dto.RecordPaymentRequest) error {
	// Verify customer belongs to tenant
	customer, err := s.customerRepo.FindByID(ctx, req.CustomerID)
	if err != nil || customer == nil {
		return errors.ErrNotFound
	}
	
	if customer.TenantID != tenantID {
		return errors.ErrUnauthorized
	}
	
	// Determine status and payment date
	var paymentDate *time.Time
	status := entity.PaymentStatusPending // Default: invoice (pending)
	paymentMethod := req.PaymentMethod
	
	// If payment_date is provided, it's a paid payment
	if req.PaymentDate != "" {
		parsed, err := time.Parse(time.RFC3339, req.PaymentDate)
		if err != nil {
			// Try other formats
			parsed, err = time.Parse("2006-01-02", req.PaymentDate)
		}
		if err == nil {
			paymentDate = &parsed
			status = entity.PaymentStatusPaid
		}
	}
	
	// Calculate due date (current date + invoice_due_days or default 14 days)
	dueDate := time.Now().AddDate(0, 0, 14)
	
	// Create payment/invoice
	payment := &entity.Payment{
		TenantID:      tenantID,
		CustomerID:    req.CustomerID,
		Amount:        req.Amount,
		PaymentDate:   paymentDate,
		DueDate:       dueDate,
		Status:        status,
		PaymentMethod: paymentMethod,
		Notes:         req.Notes,
	}
	
	if err := s.paymentRepo.Create(ctx, payment); err != nil {
		logger.Error("Failed to record payment: %v", err)
		return errors.ErrInternalServer
	}
	
	if status == entity.PaymentStatusPaid {
		logger.Info("Payment recorded: %s - %.2f", customer.Name, req.Amount)
	} else {
		logger.Info("Invoice created: %s - %.2f", customer.Name, req.Amount)
	}
	return nil
}

func (s *dashboardService) ListServicePlans(ctx context.Context, tenantID string) (*dto.ServicePlanListResponse, error) {
	plans, err := s.servicePlanRepo.FindByTenantID(ctx, tenantID)
	if err != nil {
		logger.Error("Failed to list service plans: %v", err)
		return nil, errors.ErrInternalServer
	}
	
	summaries := make([]dto.ServicePlanSummary, 0, len(plans))
	for _, plan := range plans {
		customerCount, _ := s.servicePlanRepo.CountCustomersByPlanID(ctx, plan.ID)
		summaries = append(summaries, dto.ServicePlanSummary{
			ID:            plan.ID,
			Name:          plan.Name,
			Description:   plan.Description,
			SpeedDownload: plan.SpeedDownload,
			SpeedUpload:   plan.SpeedUpload,
			Price:         plan.Price,
			IsActive:      plan.IsActive,
			CustomerCount: customerCount,
		})
	}
	
	return &dto.ServicePlanListResponse{
		Plans: summaries,
		Total: len(summaries),
	}, nil
}

func (s *dashboardService) CreateServicePlan(ctx context.Context, tenantID string, req *dto.CreateServicePlanRequest) (*dto.ServicePlanSummary, error) {
	plan := &entity.ServicePlan{
		TenantID:      tenantID,
		Name:          req.Name,
		Description:   req.Description,
		SpeedDownload: req.SpeedDownload,
		SpeedUpload:   req.SpeedUpload,
		Price:         req.Price,
		IsActive:      true,
	}
	
	if err := s.servicePlanRepo.Create(ctx, plan); err != nil {
		logger.Error("Failed to create service plan: %v", err)
		return nil, errors.ErrInternalServer
	}
	
	logger.Info("Service plan created: %s (%s)", plan.Name, plan.ID)
	
	return &dto.ServicePlanSummary{
		ID:            plan.ID,
		Name:          plan.Name,
		Description:   plan.Description,
		SpeedDownload: plan.SpeedDownload,
		SpeedUpload:   plan.SpeedUpload,
		Price:         plan.Price,
		IsActive:      plan.IsActive,
		CustomerCount: 0,
	}, nil
}

func (s *dashboardService) UpdateServicePlan(ctx context.Context, tenantID, planID string, req *dto.UpdateServicePlanRequest) error {
	plan, err := s.servicePlanRepo.FindByID(ctx, planID)
	if err != nil || plan == nil {
		return errors.ErrNotFound
	}
	
	if plan.TenantID != tenantID {
		return errors.ErrUnauthorized
	}
	
	plan.Name = req.Name
	plan.Description = req.Description
	plan.SpeedDownload = req.SpeedDownload
	plan.SpeedUpload = req.SpeedUpload
	plan.Price = req.Price
	plan.IsActive = req.IsActive
	
	if err := s.servicePlanRepo.Update(ctx, plan); err != nil {
		logger.Error("Failed to update service plan: %v", err)
		return errors.ErrInternalServer
	}
	
	logger.Info("Service plan updated: %s (%s)", plan.Name, plan.ID)
	return nil
}

func (s *dashboardService) DeleteServicePlan(ctx context.Context, tenantID, planID string) error {
	plan, err := s.servicePlanRepo.FindByID(ctx, planID)
	if err != nil || plan == nil {
		return errors.ErrNotFound
	}
	
	if plan.TenantID != tenantID {
		return errors.ErrUnauthorized
	}
	
	// Check if plan has customers
	customerCount, _ := s.servicePlanRepo.CountCustomersByPlanID(ctx, planID)
	if customerCount > 0 {
		return errors.New("PLAN_HAS_CUSTOMERS", "Cannot delete plan with active customers", 400)
	}
	
	if err := s.servicePlanRepo.Delete(ctx, planID); err != nil {
		logger.Error("Failed to delete service plan: %v", err)
		return errors.ErrInternalServer
	}
	
	logger.Info("Service plan deleted: %s (%s)", plan.Name, plan.ID)
	return nil
}

// Helper functions
func (s *dashboardService) buildRecentPayments(payments []*entity.Payment) []dto.RecentPayment {
	result := make([]dto.RecentPayment, 0, len(payments))
	for _, p := range payments {
		if p.Customer != nil && p.PaymentDate != nil {
			result = append(result, dto.RecentPayment{
				ID:            p.ID,
				CustomerName:  p.Customer.Name,
				CustomerCode:  p.Customer.CustomerCode,
				Amount:        p.Amount,
				PaymentDate:   *p.PaymentDate,
				PaymentMethod: p.PaymentMethod,
			})
		}
	}
	return result
}

func (s *dashboardService) buildRecentCustomers(customers []*entity.Customer) []dto.RecentCustomer {
	result := make([]dto.RecentCustomer, 0, len(customers))
	for _, c := range customers {
		servicePlanName := ""
		if c.ServicePlan != nil {
			servicePlanName = c.ServicePlan.Name
		}
		result = append(result, dto.RecentCustomer{
			ID:               c.ID,
			Name:             c.Name,
			CustomerCode:     c.CustomerCode,
			ServicePlan:      servicePlanName,
			InstallationDate: c.InstallationDate,
			Status:           c.Status,
		})
	}
	return result
}

func (s *dashboardService) buildAlerts(overdueCount, suspendedCount, newCustomersCount int) []dto.Alert {
	alerts := []dto.Alert{}
	
	if overdueCount > 0 {
		alerts = append(alerts, dto.Alert{
			Type:     "overdue",
			Message:  "Overdue payments need attention",
			Count:    overdueCount,
			Severity: "error",
			Date:     time.Now(),
		})
	}
	
	if suspendedCount > 0 {
		alerts = append(alerts, dto.Alert{
			Type:     "suspended",
			Message:  "Suspended customers",
			Count:    suspendedCount,
			Severity: "warning",
			Date:     time.Now(),
		})
	}
	
	if newCustomersCount > 0 {
		alerts = append(alerts, dto.Alert{
			Type:     "new_customer",
			Message:  "New customers this month",
			Count:    newCustomersCount,
			Severity: "info",
			Date:     time.Now(),
		})
	}
	
	return alerts
}

func (s *dashboardService) buildCustomerSummaries(customers []*entity.Customer) []dto.CustomerSummary {
	result := make([]dto.CustomerSummary, 0, len(customers))
	for _, c := range customers {
		var servicePlan *dto.ServicePlanInfo
		if c.ServicePlan != nil {
			servicePlan = &dto.ServicePlanInfo{
				ID:            c.ServicePlan.ID,
				Name:          c.ServicePlan.Name,
				SpeedDownload: c.ServicePlan.SpeedDownload,
				SpeedUpload:   c.ServicePlan.SpeedUpload,
				Price:         c.ServicePlan.Price,
			}
		}
		result = append(result, dto.CustomerSummary{
			ID:               c.ID,
			CustomerCode:     c.CustomerCode,
			Name:             c.Name,
			Phone:            c.Phone,
			Email:            c.Email,
			Address:          c.Address,
			ServicePlanID:    c.ServicePlanID,
			ServicePlan:      servicePlan,
			ServiceType:      c.ServiceType,
			MonthlyFee:       c.MonthlyFee,
			Status:           c.Status,
			IsOnline:         c.IsOnline,
			InstallationDate: c.InstallationDate,
			PaymentStatus:    "pending", // Will be calculated from payments
		})
	}
	return result
}

func (s *dashboardService) buildServicePlanInfo(plan *entity.ServicePlan) dto.ServicePlanInfo {
	if plan == nil {
		return dto.ServicePlanInfo{}
	}
	return dto.ServicePlanInfo{
		ID:            plan.ID,
		Name:          plan.Name,
		SpeedDownload: plan.SpeedDownload,
		SpeedUpload:   plan.SpeedUpload,
		Price:         plan.Price,
	}
}

func (s *dashboardService) buildPaymentHistory(payments []*entity.Payment) []dto.PaymentHistory {
	result := make([]dto.PaymentHistory, 0, len(payments))
	for _, p := range payments {
		result = append(result, dto.PaymentHistory{
			ID:            p.ID,
			Amount:        p.Amount,
			PaymentDate:   p.PaymentDate,
			DueDate:       p.DueDate,
			Status:        p.Status,
			PaymentMethod: p.PaymentMethod,
			Notes:         p.Notes,
		})
	}
	return result
}

func (s *dashboardService) buildPaymentSummaries(payments []*entity.Payment) []dto.PaymentSummary {
	result := make([]dto.PaymentSummary, 0, len(payments))
	for _, p := range payments {
		customerName := ""
		customerCode := ""
		if p.Customer != nil {
			customerName = p.Customer.Name
			customerCode = p.Customer.CustomerCode
		}
		
		daysOverdue := 0
		if p.Status == entity.PaymentStatusOverdue {
			daysOverdue = int(time.Since(p.DueDate).Hours() / 24)
		}
		
		result = append(result, dto.PaymentSummary{
			ID:            p.ID,
			CustomerID:    p.CustomerID,
			CustomerName:  customerName,
			CustomerCode:  customerCode,
			Amount:        p.Amount,
			PaymentDate:   p.PaymentDate,
			DueDate:       p.DueDate,
			Status:        p.Status,
			PaymentMethod: p.PaymentMethod,
			DaysOverdue:   daysOverdue,
		})
	}
	return result
}

// Onboarding Methods
func (s *dashboardService) GetOnboardingStatus(ctx context.Context, tenantID string) (*dto.OnboardingStatusResponse, error) {
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil || tenant == nil {
		return nil, errors.ErrNotFound
	}

	// Check if service plan exists
	hasServicePlan := false
	plans, _ := s.servicePlanRepo.FindByTenantID(ctx, tenantID)
	hasServicePlan = len(plans) > 0

	// Simplified steps - only check service plan
	steps := []dto.OnboardingStep{
		{
			Step:        1,
			Title:       "Akun Bisnis",
			Description: "Akun bisnis RT/RW Net Anda sudah aktif",
			Completed:   true, // Always completed after registration
			Required:    true,
		},
		{
			Step:        2,
			Title:       "Paket Internet",
			Description: "Buat paket layanan internet untuk pelanggan",
			Completed:   hasServicePlan,
			Required:    false, // Not required, can skip
		},
	}

	// Calculate progress - 50% for account, 50% for service plan
	progress := 50
	if hasServicePlan {
		progress = 100
	}

	return &dto.OnboardingStatusResponse{
		Completed:   tenant.OnboardingCompleted,
		CurrentStep: tenant.OnboardingStep,
		Steps:       steps,
		Progress:    progress,
	}, nil
}

func (s *dashboardService) UpdateOnboardingStep(ctx context.Context, tenantID string, step int, completed bool) error {
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil || tenant == nil {
		return errors.ErrNotFound
	}

	if completed && step > tenant.OnboardingStep {
		tenant.OnboardingStep = step
	}

	if err := s.tenantRepo.Update(ctx, tenant); err != nil {
		logger.Error("Failed to update onboarding step: %v", err)
		return errors.ErrInternalServer
	}

	return nil
}

func (s *dashboardService) CompleteOnboarding(ctx context.Context, tenantID string) error {
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil || tenant == nil {
		return errors.ErrNotFound
	}

	tenant.OnboardingCompleted = true
	
	if err := s.tenantRepo.Update(ctx, tenant); err != nil {
		logger.Error("Failed to complete onboarding: %v", err)
		return errors.ErrInternalServer
	}

	logger.Info("Onboarding completed for tenant: %s", tenantID)
	return nil
}

// GetPlanLimits returns the current plan limits and usage for a tenant
func (s *dashboardService) GetPlanLimits(ctx context.Context, tenantID string) (*dto.PlanLimitsResponse, error) {
	// Get active subscription
	subscription, err := s.subscriptionRepo.FindActiveByTenantID(ctx, tenantID)
	if err != nil || subscription == nil {
		return nil, errors.ErrSubscriptionRequired
	}

	logger.Info("[GetPlanLimits] tenant=%s, subscription_id=%s, plan_id=%s, status=%s",
		tenantID, subscription.ID, subscription.PlanID, subscription.Status)

	// Get plan details
	plan, err := s.subPlanRepo.FindByID(ctx, subscription.PlanID)
	if err != nil || plan == nil {
		return nil, errors.ErrInvalidPlan
	}

	logger.Info("[GetPlanLimits] plan found: id=%s, name=%s, slug=%s",
		plan.ID, plan.Name, plan.Slug)

	// Parse limits from JSON
	var limits dto.PlanLimits
	if plan.Limits != "" {
		json.Unmarshal([]byte(plan.Limits), &limits)
	} else {
		// Fallback to legacy fields
		limits = dto.PlanLimits{
			MaxCustomers: plan.MaxCustomers,
			MaxUsers:     plan.MaxUsers,
		}
	}

	// Parse features from JSON
	var features dto.PlanFeatures
	if plan.PlanFeatures != "" {
		json.Unmarshal([]byte(plan.PlanFeatures), &features)
	}

	// Parse trial config
	var trialConfig dto.TrialConfig
	if plan.TrialConfig != "" {
		json.Unmarshal([]byte(plan.TrialConfig), &trialConfig)
	}

	// Get current usage
	customersUsed, _ := s.customerRepo.CountByTenantID(ctx, tenantID)
	usersUsed, _ := s.userRepo.CountByTenantID(ctx, tenantID)

	// Calculate trial end date if applicable
	trialEndsAt := ""
	if subscription.Status == entity.SubscriptionStatusTrial && subscription.EndDate != nil {
		trialEndsAt = subscription.EndDate.Format("2006-01-02T15:04:05Z07:00")
	}

	return &dto.PlanLimitsResponse{
		PlanID:      plan.ID,
		PlanName:    plan.Name,
		PlanSlug:    plan.Slug,
		IsTrial:     plan.IsTrial || subscription.Status == entity.SubscriptionStatusTrial,
		TrialEndsAt: trialEndsAt,
		Limits:      limits,
		Features:    features,
		Usage: dto.PlanUsage{
			CurrentCustomers: customersUsed,
			CurrentUsers:     usersUsed,
		},
		TrialConfig: trialConfig,
	}, nil
}

// createRadiusUserForCustomer creates a RADIUS user for PPPoE customer
func (s *dashboardService) createRadiusUserForCustomer(ctx context.Context, tenantID string, customer *entity.Customer) {
	// Check if RADIUS user already exists
	var existingUser entity.RadiusUser
	if err := s.db.Where("username = ? AND tenant_id = ?", customer.PPPoEUsername, tenantID).First(&existingUser).Error; err == nil {
		logger.Info("RADIUS user already exists for customer: %s", customer.PPPoEUsername)
		return
	}

	// Get profile name from service plan
	profileName := ""
	if customer.ServicePlanID != "" {
		var plan entity.ServicePlan
		if err := s.db.Where("id = ?", customer.ServicePlanID).First(&plan).Error; err == nil {
			profileName = plan.Name
		}
	}

	// Create RADIUS user
	radiusUser := &entity.RadiusUser{
		TenantID:        tenantID,
		CustomerID:      &customer.ID,
		Username:        customer.PPPoEUsername,
		PasswordHash:    customer.PPPoEPassword, // Will be hashed by RADIUS server
		PasswordPlain:   customer.PPPoEPassword,
		AuthType:        entity.AuthTypePAP,
		ProfileName:     profileName,
		IPAddress:       customer.StaticIP,
		IsActive:        true,
		SimultaneousUse: 1,
	}

	if err := s.db.Create(radiusUser).Error; err != nil {
		logger.Error("Failed to create RADIUS user for customer %s: %v", customer.Name, err)
		return
	}

	logger.Info("RADIUS user created for customer: %s (%s)", customer.Name, customer.PPPoEUsername)
}

// ActivateCustomer activates a customer and their RADIUS user
func (s *dashboardService) ActivateCustomer(ctx context.Context, tenantID, customerID string) error {
	customer, err := s.customerRepo.FindByID(ctx, customerID)
	if err != nil || customer == nil {
		return errors.ErrNotFound
	}

	if customer.TenantID != tenantID {
		return errors.ErrUnauthorized
	}

	// Update customer status to active
	customer.Status = entity.CustomerStatusActive
	if customer.InstallationDate.IsZero() {
		customer.InstallationDate = time.Now()
	}

	if err := s.customerRepo.Update(ctx, customer); err != nil {
		logger.Error("Failed to activate customer: %v", err)
		return errors.ErrInternalServer
	}

	// Activate RADIUS user if exists
	if customer.PPPoEUsername != "" {
		var radiusUser entity.RadiusUser
		if err := s.db.Where("username = ? AND tenant_id = ?", customer.PPPoEUsername, tenantID).First(&radiusUser).Error; err == nil {
			radiusUser.IsActive = true
			s.db.Save(&radiusUser)
			logger.Info("RADIUS user activated: %s", customer.PPPoEUsername)
		}
	}

	logger.Info("Customer activated: %s (%s)", customer.Name, customer.ID)
	return nil
}

// SuspendCustomer suspends a customer and their RADIUS user
func (s *dashboardService) SuspendCustomer(ctx context.Context, tenantID, customerID, reason string) error {
	customer, err := s.customerRepo.FindByID(ctx, customerID)
	if err != nil || customer == nil {
		return errors.ErrNotFound
	}

	if customer.TenantID != tenantID {
		return errors.ErrUnauthorized
	}

	// Update customer status to suspended
	customer.Status = entity.CustomerStatusSuspended
	customer.Notes = reason

	if err := s.customerRepo.Update(ctx, customer); err != nil {
		logger.Error("Failed to suspend customer: %v", err)
		return errors.ErrInternalServer
	}

	// Suspend RADIUS user if exists
	if customer.PPPoEUsername != "" {
		var radiusUser entity.RadiusUser
		if err := s.db.Where("username = ? AND tenant_id = ?", customer.PPPoEUsername, tenantID).First(&radiusUser).Error; err == nil {
			radiusUser.IsActive = false
			s.db.Save(&radiusUser)
			logger.Info("RADIUS user suspended: %s", customer.PPPoEUsername)
		}
	}

	logger.Info("Customer suspended: %s (%s) - Reason: %s", customer.Name, customer.ID, reason)
	return nil
}

// TerminateCustomer terminates a customer and their RADIUS user
func (s *dashboardService) TerminateCustomer(ctx context.Context, tenantID, customerID, reason string) error {
	customer, err := s.customerRepo.FindByID(ctx, customerID)
	if err != nil || customer == nil {
		return errors.ErrNotFound
	}

	if customer.TenantID != tenantID {
		return errors.ErrUnauthorized
	}

	// Update customer status to terminated
	customer.Status = entity.CustomerStatusTerminated
	customer.Notes = reason

	if err := s.customerRepo.Update(ctx, customer); err != nil {
		logger.Error("Failed to terminate customer: %v", err)
		return errors.ErrInternalServer
	}

	// Deactivate RADIUS user if exists
	if customer.PPPoEUsername != "" {
		var radiusUser entity.RadiusUser
		if err := s.db.Where("username = ? AND tenant_id = ?", customer.PPPoEUsername, tenantID).First(&radiusUser).Error; err == nil {
			radiusUser.IsActive = false
			s.db.Save(&radiusUser)
			logger.Info("RADIUS user terminated: %s", customer.PPPoEUsername)
		}
	}

	logger.Info("Customer terminated: %s (%s) - Reason: %s", customer.Name, customer.ID, reason)
	return nil
}
