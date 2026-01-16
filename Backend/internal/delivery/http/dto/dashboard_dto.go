package dto

import "time"

// Dashboard Overview Response
type DashboardOverviewResponse struct {
	Statistics DashboardStatistics `json:"statistics"`
	Revenue    RevenueInfo         `json:"revenue"`
	Recent     RecentActivities    `json:"recent"`
	Charts     DashboardCharts     `json:"charts"`
}

type DashboardStatistics struct {
	TotalCustomers    int     `json:"total_customers"`
	ActiveCustomers   int     `json:"active_customers"`
	SuspendedCustomers int    `json:"suspended_customers"`
	NewCustomersMonth int     `json:"new_customers_month"`
	TotalRevenue      float64 `json:"total_revenue"`
	MonthlyRevenue    float64 `json:"monthly_revenue"`
	PendingPayments   int     `json:"pending_payments"`
	OverduePayments   int     `json:"overdue_payments"`
}

type RevenueInfo struct {
	ThisMonth     float64 `json:"this_month"`
	LastMonth     float64 `json:"last_month"`
	Growth        float64 `json:"growth"` // percentage
	Collected     float64 `json:"collected"`
	Pending       float64 `json:"pending"`
	Overdue       float64 `json:"overdue"`
	CollectionRate float64 `json:"collection_rate"` // percentage
}

type RecentActivities struct {
	RecentPayments  []RecentPayment  `json:"recent_payments"`
	RecentCustomers []RecentCustomer `json:"recent_customers"`
	Alerts          []Alert          `json:"alerts"`
}

type RecentPayment struct {
	ID            string    `json:"id"`
	CustomerName  string    `json:"customer_name"`
	CustomerCode  string    `json:"customer_code"`
	Amount        float64   `json:"amount"`
	PaymentDate   time.Time `json:"payment_date"`
	PaymentMethod string    `json:"payment_method"`
}

type RecentCustomer struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	CustomerCode     string    `json:"customer_code"`
	ServicePlan      string    `json:"service_plan"`
	InstallationDate time.Time `json:"installation_date"`
	Status           string    `json:"status"`
}

type Alert struct {
	Type     string    `json:"type"` // overdue, suspended, new_customer
	Message  string    `json:"message"`
	Count    int       `json:"count,omitempty"`
	Severity string    `json:"severity"` // info, warning, error
	Date     time.Time `json:"date"`
}

type DashboardCharts struct {
	RevenueChart  []ChartData `json:"revenue_chart"`  // Last 12 months
	CustomerChart []ChartData `json:"customer_chart"` // Last 12 months
	PaymentStatus ChartData   `json:"payment_status"` // Current month
}

type ChartData struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
}

// Customer List Response
type CustomerListResponse struct {
	Customers []CustomerSummary `json:"customers"`
	Total     int               `json:"total"`
	Page      int               `json:"page"`
	PerPage   int               `json:"per_page"`
}

type CustomerSummary struct {
	ID               string           `json:"id"`
	CustomerCode     string           `json:"customer_code"`
	Name             string           `json:"name"`
	Phone            string           `json:"phone"`
	Email            string           `json:"email,omitempty"`
	Address          string           `json:"address"`
	ServicePlanID    string           `json:"service_plan_id"`
	ServicePlan      *ServicePlanInfo `json:"service_plan,omitempty"`
	ServiceType      string           `json:"service_type"`
	MonthlyFee       float64          `json:"monthly_fee"`
	Status           string           `json:"status"`
	IsOnline         bool             `json:"is_online"`
	InstallationDate time.Time        `json:"installation_date"`
	LastPayment      *time.Time       `json:"last_payment,omitempty"`
	PaymentStatus    string           `json:"payment_status"` // paid, pending, overdue
}

// Customer Detail Response
type CustomerDetailResponse struct {
	ID               string                `json:"id"`
	CustomerCode     string                `json:"customer_code"`
	Name             string                `json:"name"`
	Email            string                `json:"email"`
	Phone            string                `json:"phone"`
	Address          string                `json:"address"`
	Latitude         float64               `json:"latitude"`
	Longitude        float64               `json:"longitude"`
	ServicePlan      ServicePlanInfo       `json:"service_plan"`
	ServiceType      string                `json:"service_type"`
	
	// PPPoE settings
	PPPoEUsername    string                `json:"pppoe_username,omitempty"`
	PPPoEPassword    string                `json:"pppoe_password,omitempty"`
	
	// Static IP settings
	StaticIP         string                `json:"static_ip,omitempty"`
	StaticGateway    string                `json:"static_gateway,omitempty"`
	StaticDNS        string                `json:"static_dns,omitempty"`
	
	// Connection status
	IsOnline         bool                  `json:"is_online"`
	IPAddress        string                `json:"ip_address,omitempty"`
	LastSeen         *time.Time            `json:"last_seen,omitempty"`
	
	Status           string                `json:"status"`
	InstallationDate time.Time             `json:"installation_date"`
	DueDate          int                   `json:"due_date"`
	MonthlyFee       float64               `json:"monthly_fee"`
	Notes            string                `json:"notes"`
	PaymentHistory   []PaymentHistory      `json:"payment_history"`
	Statistics       CustomerStatistics    `json:"statistics"`
	CreatedAt        time.Time             `json:"created_at"`
	UpdatedAt        time.Time             `json:"updated_at"`
}

type ServicePlanInfo struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	SpeedDownload int     `json:"speed_download"`
	SpeedUpload   int     `json:"speed_upload"`
	Price         float64 `json:"price"`
}

type PaymentHistory struct {
	ID            string     `json:"id"`
	Amount        float64    `json:"amount"`
	PaymentDate   *time.Time `json:"payment_date,omitempty"`
	DueDate       time.Time  `json:"due_date"`
	Status        string     `json:"status"`
	PaymentMethod string     `json:"payment_method,omitempty"`
	Notes         string     `json:"notes,omitempty"`
}

type CustomerStatistics struct {
	TotalPayments   int     `json:"total_payments"`
	PaidPayments    int     `json:"paid_payments"`
	PendingPayments int     `json:"pending_payments"`
	OverduePayments int     `json:"overdue_payments"`
	TotalPaid       float64 `json:"total_paid"`
	TotalPending    float64 `json:"total_pending"`
	OnTimeRate      float64 `json:"on_time_rate"` // percentage
}

// Create Customer Request
type CreateCustomerRequest struct {
	Name             string    `json:"name" binding:"required"`
	Email            string    `json:"email" binding:"omitempty,email"`
	Phone            string    `json:"phone" binding:"required"`
	Address          string    `json:"address"`
	Latitude         float64   `json:"latitude"`
	Longitude        float64   `json:"longitude"`
	ServicePlanID    string    `json:"service_plan_id" binding:"required"`
	ServiceType      string    `json:"service_type" binding:"omitempty,oneof=dhcp pppoe static"`
	
	// PPPoE settings
	PPPoEUsername    string    `json:"pppoe_username"`
	PPPoEPassword    string    `json:"pppoe_password"`
	
	// Static IP settings
	StaticIP         string    `json:"static_ip"`
	StaticGateway    string    `json:"static_gateway"`
	StaticDNS        string    `json:"static_dns"`
	
	InstallationDate string    `json:"installation_date"`
	DueDate          int       `json:"due_date" binding:"omitempty,min=1,max=31"`
	MonthlyFee       float64   `json:"monthly_fee" binding:"omitempty,min=0"`
	Notes            string    `json:"notes"`
}

// Update Customer Request
type UpdateCustomerRequest struct {
	Name          string  `json:"name"`
	Email         string  `json:"email" binding:"omitempty,email"`
	Phone         string  `json:"phone"`
	Address       string  `json:"address"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	ServicePlanID string  `json:"service_plan_id"`
	ServiceType   string  `json:"service_type" binding:"omitempty,oneof=dhcp pppoe static"`
	
	// PPPoE settings
	PPPoEUsername string  `json:"pppoe_username"`
	PPPoEPassword string  `json:"pppoe_password"`
	
	// Static IP settings
	StaticIP      string  `json:"static_ip"`
	StaticGateway string  `json:"static_gateway"`
	StaticDNS     string  `json:"static_dns"`
	
	DueDate       int     `json:"due_date" binding:"omitempty,min=1,max=31"`
	MonthlyFee    float64 `json:"monthly_fee" binding:"omitempty,min=0"`
	Status        string  `json:"status" binding:"omitempty,oneof=pending_activation active suspended inactive terminated"`
	Notes         string  `json:"notes"`
}

// Payment List Response
type PaymentListResponse struct {
	Payments []PaymentSummary `json:"payments"`
	Total    int              `json:"total"`
	Page     int              `json:"page"`
	PerPage  int              `json:"per_page"`
}

type PaymentSummary struct {
	ID            string     `json:"id"`
	CustomerID    string     `json:"customer_id"`
	CustomerName  string     `json:"customer_name"`
	CustomerCode  string     `json:"customer_code"`
	Amount        float64    `json:"amount"`
	PaymentDate   *time.Time `json:"payment_date,omitempty"`
	DueDate       time.Time  `json:"due_date"`
	Status        string     `json:"status"`
	PaymentMethod string     `json:"payment_method,omitempty"`
	DaysOverdue   int        `json:"days_overdue,omitempty"`
}

// Record Payment Request
type RecordPaymentRequest struct {
	CustomerID    string  `json:"customer_id" binding:"required"`
	Amount        float64 `json:"amount" binding:"required,min=0"`
	PaymentDate   string  `json:"payment_date"` // Optional for invoice (empty = pending invoice)
	PaymentMethod string  `json:"payment_method"` // Optional for invoice
	Notes         string  `json:"notes"`
}

// Service Plan List Response
type ServicePlanListResponse struct {
	Plans   []ServicePlanSummary `json:"plans"`
	Total   int                  `json:"total"`
}

type ServicePlanSummary struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	SpeedDownload int     `json:"speed_download"`
	SpeedUpload   int     `json:"speed_upload"`
	Price         float64 `json:"price"`
	IsActive      bool    `json:"is_active"`
	CustomerCount int     `json:"customer_count"`
}

// Create Service Plan Request
type CreateServicePlanRequest struct {
	Name          string  `json:"name" binding:"required"`
	Description   string  `json:"description"`
	SpeedDownload int     `json:"speed_download" binding:"required,min=1"`
	SpeedUpload   int     `json:"speed_upload" binding:"required,min=1"`
	Price         float64 `json:"price" binding:"required,min=0"`
}

// Update Service Plan Request
type UpdateServicePlanRequest struct {
	Name          string  `json:"name" binding:"required"`
	Description   string  `json:"description"`
	SpeedDownload int     `json:"speed_download" binding:"required,min=1"`
	SpeedUpload   int     `json:"speed_upload" binding:"required,min=1"`
	Price         float64 `json:"price" binding:"required,min=0"`
	IsActive      bool    `json:"is_active"`
}

// Query Parameters
type CustomerQueryParams struct {
	Page          int    `form:"page" binding:"omitempty,min=1"`
	PerPage       int    `form:"per_page" binding:"omitempty,min=1,max=100"`
	Search        string `form:"search"`
	Status        string `form:"status" binding:"omitempty,oneof=pending_activation active suspended inactive terminated"`
	ServiceType   string `form:"service_type" binding:"omitempty,oneof=dhcp pppoe static"`
	ServicePlanID string `form:"service_plan_id"`
	SortBy        string `form:"sort_by" binding:"omitempty,oneof=name customer_code installation_date created_at"`
	SortOrder     string `form:"sort_order" binding:"omitempty,oneof=asc desc"`
}

type PaymentQueryParams struct {
	Page       int    `form:"page" binding:"omitempty,min=1"`
	PerPage    int    `form:"per_page" binding:"omitempty,min=1,max=100"`
	Status     string `form:"status" binding:"omitempty,oneof=pending paid overdue"`
	CustomerID string `form:"customer_id"`
	Month      int    `form:"month" binding:"omitempty,min=1,max=12"`
	Year       int    `form:"year" binding:"omitempty,min=2020"`
	SortBy     string `form:"sort_by" binding:"omitempty,oneof=due_date payment_date amount"`
	SortOrder  string `form:"sort_order" binding:"omitempty,oneof=asc desc"`
}

// Onboarding DTOs
type OnboardingStatusResponse struct {
	Completed       bool                `json:"completed"`
	CurrentStep     int                 `json:"current_step"`
	Steps           []OnboardingStep    `json:"steps"`
	Progress        int                 `json:"progress"` // percentage
}

type OnboardingStep struct {
	Step        int    `json:"step"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Completed   bool   `json:"completed"`
	Required    bool   `json:"required"`
}

type UpdateOnboardingRequest struct {
	Step      int  `json:"step" binding:"required,min=1,max=5"`
	Completed bool `json:"completed"`
}

// Plan Limits DTOs moved to subscription_dto.go
