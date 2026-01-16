package dto

import "time"

// Billing Management DTOs

type BillingDashboardResponse struct {
	Tenant       TenantBillingInfo       `json:"tenant"`
	Subscription SubscriptionBillingInfo `json:"subscription"`
	Billing      BillingDetails          `json:"billing"`
	Usage        UsageInfo               `json:"usage"`
	Invoices     []InvoiceInfo           `json:"invoices"`
}

type TenantBillingInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	IsActive bool   `json:"is_active"`
}

type SubscriptionBillingInfo struct {
	ID              string     `json:"id"`
	PlanID          string     `json:"plan_id"`
	PlanName        string     `json:"plan_name"`
	PlanSlug        string     `json:"plan_slug"`
	Status          string     `json:"status"`
	IsTrial         bool       `json:"is_trial"`
	StartDate       *time.Time `json:"start_date,omitempty"`
	EndDate         *time.Time `json:"end_date,omitempty"`
	NextBillingDate *time.Time `json:"next_billing_date,omitempty"`
	DaysLeft        int        `json:"days_left,omitempty"`
	AutoRenew       bool       `json:"auto_renew"`
	PaymentMethod   string     `json:"payment_method,omitempty"`
}

type BillingDetails struct {
	CurrentPlan     string  `json:"current_plan"`
	MonthlyPrice    float64 `json:"monthly_price"`
	Currency        string  `json:"currency"`
	NextBilling     string  `json:"next_billing,omitempty"`
	PaymentMethod   string  `json:"payment_method,omitempty"`
	CanUpgrade      bool    `json:"can_upgrade"`
	CanDowngrade    bool    `json:"can_downgrade"`
	AvailablePlans  []PlanOption `json:"available_plans"`
}

type PlanOption struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Price       float64 `json:"price"`
	Description string  `json:"description"`
	IsCurrent   bool    `json:"is_current"`
}

type UsageInfo struct {
	CurrentPeriodStart *time.Time `json:"current_period_start"`
	CurrentPeriodEnd   *time.Time `json:"current_period_end"`
	DaysUsed           int        `json:"days_used"`
	DaysRemaining      int        `json:"days_remaining"`
}

type InvoiceInfo struct {
	ID          string     `json:"id"`
	InvoiceNo   string     `json:"invoice_no"`
	Amount      float64    `json:"amount"`
	Status      string     `json:"status"`
	IssuedDate  *time.Time `json:"issued_date"`
	DueDate     *time.Time `json:"due_date"`
	PaidDate    *time.Time `json:"paid_date,omitempty"`
	DownloadURL string     `json:"download_url,omitempty"`
}

// Update Subscription Request
type UpdateSubscriptionRequest struct {
	PlanID        string `json:"plan_id" binding:"required"`
	PaymentMethod string `json:"payment_method,omitempty"`
	AutoRenew     *bool  `json:"auto_renew,omitempty"`
}

// Update Subscription Response
type UpdateSubscriptionResponse struct {
	Success      bool    `json:"success"`
	Message      string  `json:"message"`
	OrderID      string  `json:"order_id,omitempty"`
	RequiresPay  bool    `json:"requires_payment,omitempty"`
	ActionType   string  `json:"action_type,omitempty"` // "upgrade", "downgrade", "settings"
	NewPlanName  string  `json:"new_plan_name,omitempty"`
	NewPlanPrice float64 `json:"new_plan_price,omitempty"`
}

// Update Tenant Basic Info Request (for billing context)
type UpdateTenantBasicInfoRequest struct {
	Name  string `json:"name,omitempty"`
	Email string `json:"email,omitempty"`
	Phone string `json:"phone,omitempty"`
}

// Cancel Subscription Request
type CancelSubscriptionRequest struct {
	Reason string `json:"reason,omitempty"`
}

// Payment Method Request
type UpdatePaymentMethodRequest struct {
	PaymentMethod string `json:"payment_method" binding:"required"`
	CardNumber    string `json:"card_number,omitempty"`
	CardHolder    string `json:"card_holder,omitempty"`
	ExpiryMonth   int    `json:"expiry_month,omitempty"`
	ExpiryYear    int    `json:"expiry_year,omitempty"`
}

// Create Order Response
type CreateOrderResponse struct {
	OrderID       string                 `json:"order_id"`
	Amount        float64                `json:"amount"`
	PlanName      string                 `json:"plan_name"`
	ExpiresAt     string                 `json:"expires_at"`
	PaymentMethod string                 `json:"payment_method,omitempty"`
	PaymentType   string                 `json:"payment_type,omitempty"`
	PaymentInfo   map[string]interface{} `json:"payment_info,omitempty"`
	HasPayment    bool                   `json:"has_payment"`
}

// Create Order Request
type CreateOrderRequest struct {
	PlanID string `json:"plan_id" binding:"required"`
}
