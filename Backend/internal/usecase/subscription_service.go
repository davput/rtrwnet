package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/auth"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"github.com/rtrwnet/saas-backend/pkg/payment"
)

type SubscriptionService interface {
	GetPlans(ctx context.Context) ([]*SubscriptionPlanProfile, error)
	GetPaymentMethods(ctx context.Context) []map[string]interface{}
	SignUp(ctx context.Context, req *SignUpRequest) (*SignUpResponse, error)
	CreatePayment(ctx context.Context, req *CreatePaymentRequest) (*CreatePaymentResponse, error)
	GetPaymentStatus(ctx context.Context, orderID string) (*PaymentStatusResponse, error)
	ProcessPayment(ctx context.Context, orderID string, status string, paymentMethod string, gatewayTxID string) error
}

type SubscriptionPlanProfile struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Slug         string                 `json:"slug"`
	Description  string                 `json:"description"`
	Price        float64                `json:"price"`
	BillingCycle string                 `json:"billing_cycle"`
	MaxCustomers int                    `json:"max_customers"`
	MaxUsers     int                    `json:"max_users"`
	Features     map[string]interface{} `json:"features"`
}

type SignUpRequest struct {
	ISPName   string
	Email     string
	Password  string
	Phone     string
	PlanID    string
	OwnerName string
	UseTrial  bool
}

type SignUpResponse struct {
	TenantID   string
	UserID     string
	OrderID    string
	Amount     float64
	PaymentURL string
	SnapToken  string
	IsTrial    bool
	TrialEnds  string
	Message    string
}

// CreatePaymentRequest for custom payment
type CreatePaymentRequest struct {
	OrderID       string
	PaymentMethod string // bca_va, bni_va, bri_va, mandiri_bill, gopay, shopeepay, qris
}

// CreatePaymentResponse contains payment details
type CreatePaymentResponse struct {
	OrderID           string                 `json:"order_id"`
	PaymentType       string                 `json:"payment_type"`
	TransactionStatus string                 `json:"transaction_status"`
	GrossAmount       float64                `json:"gross_amount"`
	ExpiryTime        string                 `json:"expiry_time"`
	PaymentInfo       map[string]interface{} `json:"payment_info"`
}

// PaymentStatusResponse contains payment status
type PaymentStatusResponse struct {
	OrderID           string  `json:"order_id"`
	TransactionStatus string  `json:"transaction_status"`
	PaymentType       string  `json:"payment_type"`
	GrossAmount       float64 `json:"gross_amount"`
	PaidAt            string  `json:"paid_at,omitempty"`
}

type subscriptionService struct {
	planRepo         repository.SubscriptionPlanRepository
	tenantRepo       repository.TenantRepository
	userRepo         repository.UserRepository
	subscriptionRepo repository.TenantSubscriptionRepository
	transactionRepo  repository.PaymentTransactionRepository
}

func NewSubscriptionService(
	planRepo repository.SubscriptionPlanRepository,
	tenantRepo repository.TenantRepository,
	userRepo repository.UserRepository,
	subscriptionRepo repository.TenantSubscriptionRepository,
	transactionRepo repository.PaymentTransactionRepository,
) SubscriptionService {
	return &subscriptionService{
		planRepo:         planRepo,
		tenantRepo:       tenantRepo,
		userRepo:         userRepo,
		subscriptionRepo: subscriptionRepo,
		transactionRepo:  transactionRepo,
	}
}

func (s *subscriptionService) GetPlans(ctx context.Context) ([]*SubscriptionPlanProfile, error) {
	// Use FindPublicPlans to exclude trial plans
	plans, err := s.planRepo.FindPublicPlans(ctx)
	if err != nil {
		logger.Error("Failed to get subscription plans: %v", err)
		return nil, errors.ErrInternalServer
	}

	profiles := make([]*SubscriptionPlanProfile, len(plans))
	for i, plan := range plans {
		var features map[string]interface{}
		if plan.Features != "" {
			json.Unmarshal([]byte(plan.Features), &features)
		}

		profiles[i] = &SubscriptionPlanProfile{
			ID:           plan.ID,
			Name:         plan.Name,
			Slug:         plan.Slug,
			Description:  plan.Description,
			Price:        plan.Price,
			BillingCycle: plan.BillingCycle,
			MaxCustomers: plan.MaxCustomers,
			MaxUsers:     plan.MaxUsers,
			Features:     features,
		}
	}

	return profiles, nil
}

func (s *subscriptionService) GetPaymentMethods(ctx context.Context) []map[string]interface{} {
	return payment.AvailablePaymentMethods()
}

func (s *subscriptionService) SignUp(ctx context.Context, req *SignUpRequest) (*SignUpResponse, error) {
	// 1. Check if email already exists (one email per tenant)
	existingTenant, err := s.tenantRepo.FindByEmail(ctx, req.Email)
	if err == nil && existingTenant != nil {
		return nil, errors.NewWithDetails("TENANT_3005", "Email is already registered", 409, map[string]interface{}{
			"email": fmt.Sprintf("The email '%s' is already registered. Please use another email or login.", req.Email),
		})
	}

	// 2. Get plan
	plan, err := s.planRepo.FindByID(ctx, req.PlanID)
	if err != nil {
		logger.Error("Failed to find plan: %v", err)
		return nil, errors.ErrInvalidPlan
	}

	if plan == nil {
		return nil, errors.ErrInvalidPlan
	}

	// 3. Create tenant
	tenant := &entity.Tenant{
		Name:     req.ISPName,
		Email:    req.Email,
		IsActive: req.UseTrial, // Active immediately if trial
	}
	if err := s.tenantRepo.Create(ctx, tenant); err != nil {
		logger.Error("Failed to create tenant: %v", err)
		return nil, errors.ErrInternalServer
	}

	// 4. Create admin user
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		logger.Error("Failed to hash password: %v", err)
		return nil, errors.ErrInternalServer
	}

	user := &entity.User{
		TenantID: tenant.ID,
		Email:    req.Email,
		Password: hashedPassword,
		Name:     req.OwnerName,
		Role:     entity.RoleAdmin,
		IsActive: req.UseTrial, // Active immediately if trial
	}
	if err := s.userRepo.Create(ctx, user); err != nil {
		logger.Error("Failed to create user: %v", err)
		return nil, errors.ErrInternalServer
	}

	// 5. Handle Trial vs Paid
	if req.UseTrial {
		// FREE TRIAL - Activate immediately for 7 days
		now := time.Now()
		trialEnd := now.AddDate(0, 0, 7) // +7 days

		subscription := &entity.TenantSubscription{
			TenantID:        tenant.ID,
			PlanID:          plan.ID,
			Status:          entity.SubscriptionStatusTrial,
			StartDate:       &now,
			EndDate:         &trialEnd,
			NextBillingDate: &trialEnd,
			AutoRenew:       true,
		}
		if err := s.subscriptionRepo.Create(ctx, subscription); err != nil {
			logger.Error("Failed to create subscription: %v", err)
			return nil, errors.ErrInternalServer
		}

		logger.Info("Trial sign up completed: tenant=%s, user=%s, trial_ends=%s", tenant.ID, user.ID, trialEnd.Format("2006-01-02"))

		return &SignUpResponse{
			TenantID:  tenant.ID,
			UserID:    user.ID,
			IsTrial:   true,
			TrialEnds: trialEnd.Format("2006-01-02"),
			Message:   "Your 7-day free trial has started! You can start using the platform immediately.",
		}, nil
	}

	// PAID - Require payment first
	subscription := &entity.TenantSubscription{
		TenantID:  tenant.ID,
		PlanID:    plan.ID,
		Status:    entity.SubscriptionStatusPending,
		AutoRenew: true,
	}
	if err := s.subscriptionRepo.Create(ctx, subscription); err != nil {
		logger.Error("Failed to create subscription: %v", err)
		return nil, errors.ErrInternalServer
	}

	// 6. Create payment transaction
	orderID := generateOrderID()
	expiredAt := time.Now().Add(24 * time.Hour) // 24 hours to pay

	transaction := &entity.PaymentTransaction{
		TenantID:        tenant.ID,
		SubscriptionID:  &subscription.ID,
		OrderID:         orderID,
		Amount:          plan.Price,
		Status:          entity.PaymentStatusPending,
		PaymentGateway:  "midtrans",
		GatewayResponse: "{}",
		ExpiredAt:       &expiredAt,
	}
	if err := s.transactionRepo.Create(ctx, transaction); err != nil {
		logger.Error("Failed to create transaction: %v", err)
		return nil, errors.ErrInternalServer
	}

	logger.Info("Paid sign up completed: tenant=%s, user=%s, order=%s", tenant.ID, user.ID, orderID)

	// Return order_id for custom payment flow
	paymentURL := fmt.Sprintf("%s/payment/%s", os.Getenv("FRONTEND_URL"), orderID)

	return &SignUpResponse{
		TenantID:   tenant.ID,
		UserID:     user.ID,
		OrderID:    orderID,
		Amount:     plan.Price,
		PaymentURL: paymentURL,
		IsTrial:    false,
		Message:    "Please complete payment within 24 hours to activate your account",
	}, nil
}

// CreatePayment creates a payment with selected payment method using Midtrans Core API
func (s *subscriptionService) CreatePayment(ctx context.Context, req *CreatePaymentRequest) (*CreatePaymentResponse, error) {
	// 1. Find transaction
	transaction, err := s.transactionRepo.FindByOrderID(ctx, req.OrderID)
	if err != nil {
		logger.Error("Failed to find transaction: %v", err)
		return nil, errors.ErrNotFound
	}

	if transaction == nil {
		return nil, errors.ErrNotFound
	}

	// Check if already paid
	if transaction.Status == entity.PaymentStatusPaid {
		return nil, errors.NewWithDetails("PAY_4001", "Transaction already paid", 400, nil)
	}

	// 2. Get tenant info for customer details
	tenant, err := s.tenantRepo.FindByID(ctx, transaction.TenantID)
	if err != nil {
		logger.Error("Failed to find tenant: %v", err)
		return nil, errors.ErrInternalServer
	}

	// Get user info
	users, err := s.userRepo.FindAll(ctx, tenant.ID)
	if err != nil || len(users) == 0 {
		logger.Error("Failed to find users: %v", err)
		return nil, errors.ErrInternalServer
	}
	user := users[0]

	// 3. Initialize Midtrans client
	midtransConfig := &payment.MidtransConfig{
		ServerKey:    os.Getenv("MIDTRANS_SERVER_KEY"),
		ClientKey:    os.Getenv("MIDTRANS_CLIENT_KEY"),
		IsProduction: os.Getenv("MIDTRANS_IS_PRODUCTION") == "true",
	}

	if midtransConfig.ServerKey == "" {
		return nil, errors.NewWithDetails("PAY_4002", "Payment gateway not configured", 500, nil)
	}

	midtransClient := payment.NewMidtransClient(midtransConfig)

	customer := &payment.CustomerDetails{
		FirstName: user.Name,
		Email:     user.Email,
	}

	items := []payment.ItemDetail{
		{
			ID:       req.OrderID,
			Name:     "Subscription Payment",
			Price:    transaction.Amount,
			Quantity: 1,
		},
	}

	callbackURL := os.Getenv("MIDTRANS_FINISH_URL")

	// 4. Create charge based on payment method
	var chargeResp *payment.ChargeResponse
	var chargeErr error

	switch req.PaymentMethod {
	case "bca_va":
		chargeResp, chargeErr = midtransClient.ChargeBankTransfer(req.OrderID, transaction.Amount, "bca", customer, items)
	case "bni_va":
		chargeResp, chargeErr = midtransClient.ChargeBankTransfer(req.OrderID, transaction.Amount, "bni", customer, items)
	case "bri_va":
		chargeResp, chargeErr = midtransClient.ChargeBankTransfer(req.OrderID, transaction.Amount, "bri", customer, items)
	case "permata_va":
		chargeResp, chargeErr = midtransClient.ChargeBankTransfer(req.OrderID, transaction.Amount, "permata", customer, items)
	case "mandiri_bill":
		chargeResp, chargeErr = midtransClient.ChargeMandiriBill(req.OrderID, transaction.Amount, customer, items)
	case "gopay":
		chargeResp, chargeErr = midtransClient.ChargeGopay(req.OrderID, transaction.Amount, customer, items, callbackURL)
	case "shopeepay":
		chargeResp, chargeErr = midtransClient.ChargeShopeePay(req.OrderID, transaction.Amount, customer, items, callbackURL)
	case "qris":
		chargeResp, chargeErr = midtransClient.ChargeQRIS(req.OrderID, transaction.Amount, customer, items)
	default:
		return nil, errors.NewWithDetails("PAY_4003", "Invalid payment method", 400, nil)
	}

	if chargeErr != nil {
		logger.Error("Failed to create charge: %v", chargeErr)
		return nil, errors.NewWithDetails("PAY_4004", "Failed to create payment", 500, map[string]interface{}{
			"error": chargeErr.Error(),
		})
	}

	// 5. Update transaction with gateway response
	responseJSON, _ := json.Marshal(chargeResp)
	transaction.GatewayResponse = string(responseJSON)
	transaction.PaymentMethod = req.PaymentMethod
	transaction.GatewayTransactionID = chargeResp.TransactionID

	if err := s.transactionRepo.Update(ctx, transaction); err != nil {
		logger.Error("Failed to update transaction: %v", err)
	}

	// 6. Build payment info based on payment type
	paymentInfo := make(map[string]interface{})

	switch req.PaymentMethod {
	case "bca_va", "bni_va", "bri_va":
		if len(chargeResp.VANumbers) > 0 {
			paymentInfo["bank"] = chargeResp.VANumbers[0].Bank
			paymentInfo["va_number"] = chargeResp.VANumbers[0].VANumber
		}
	case "permata_va":
		paymentInfo["bank"] = "permata"
		paymentInfo["va_number"] = chargeResp.PermataVANumber
	case "mandiri_bill":
		paymentInfo["biller_code"] = chargeResp.BillerCode
		paymentInfo["bill_key"] = chargeResp.BillKey
	case "gopay", "shopeepay":
		for _, action := range chargeResp.Actions {
			if action.Name == "generate-qr-code" {
				paymentInfo["qr_url"] = action.URL
			}
			if action.Name == "deeplink-redirect" {
				paymentInfo["deeplink"] = action.URL
			}
		}
	case "qris":
		paymentInfo["qr_string"] = chargeResp.QRString
	}

	logger.Info("Payment created: order=%s, method=%s, tx_id=%s", req.OrderID, req.PaymentMethod, chargeResp.TransactionID)

	return &CreatePaymentResponse{
		OrderID:           chargeResp.OrderID,
		PaymentType:       chargeResp.PaymentType,
		TransactionStatus: chargeResp.TransactionStatus,
		GrossAmount:       transaction.Amount,
		ExpiryTime:        chargeResp.ExpiryTime,
		PaymentInfo:       paymentInfo,
	}, nil
}

// GetPaymentStatus gets the current payment status and syncs with Midtrans if pending
func (s *subscriptionService) GetPaymentStatus(ctx context.Context, orderID string) (*PaymentStatusResponse, error) {
	transaction, err := s.transactionRepo.FindByOrderID(ctx, orderID)
	if err != nil {
		return nil, errors.ErrNotFound
	}

	if transaction == nil {
		return nil, errors.ErrNotFound
	}

	// If status is still pending, check with Midtrans for latest status
	if transaction.Status == entity.PaymentStatusPending {
		midtransConfig := &payment.MidtransConfig{
			ServerKey:    os.Getenv("MIDTRANS_SERVER_KEY"),
			ClientKey:    os.Getenv("MIDTRANS_CLIENT_KEY"),
			IsProduction: os.Getenv("MIDTRANS_IS_PRODUCTION") == "true",
		}
		midtransClient := payment.NewMidtransClient(midtransConfig)

		statusResp, err := midtransClient.GetTransactionStatus(orderID)
		if err == nil && statusResp != nil {
			// Map Midtrans status to our status
			var newStatus string
			switch statusResp.TransactionStatus {
			case "capture":
				if statusResp.FraudStatus == "accept" {
					newStatus = entity.PaymentStatusPaid
				}
			case "settlement":
				newStatus = entity.PaymentStatusPaid
			case "pending":
				newStatus = entity.PaymentStatusPending
			case "deny", "cancel", "expire":
				newStatus = "failed"
			}

			// If status changed, update database
			if newStatus != "" && newStatus != transaction.Status {
				transaction.Status = newStatus
				transaction.GatewayTransactionID = statusResp.TransactionID

				if newStatus == entity.PaymentStatusPaid {
					now := time.Now()
					transaction.PaidAt = &now

					// Also activate subscription
					if transaction.SubscriptionID != nil {
						subscription, err := s.subscriptionRepo.FindByID(ctx, *transaction.SubscriptionID)
						if err == nil && subscription != nil {
							subscription.Status = entity.SubscriptionStatusActive
							subscription.StartDate = &now
							endDate := now.AddDate(0, 1, 0)
							subscription.EndDate = &endDate
							subscription.NextBillingDate = &endDate
							subscription.PaymentMethod = statusResp.PaymentType
							s.subscriptionRepo.Update(ctx, subscription)
						}
					}
				}

				s.transactionRepo.Update(ctx, transaction)
			}
		}
	}

	var paidAt string
	if transaction.PaidAt != nil {
		paidAt = transaction.PaidAt.Format(time.RFC3339)
	}

	return &PaymentStatusResponse{
		OrderID:           transaction.OrderID,
		TransactionStatus: transaction.Status,
		PaymentType:       transaction.PaymentMethod,
		GrossAmount:       transaction.Amount,
		PaidAt:            paidAt,
	}, nil
}

func (s *subscriptionService) ProcessPayment(ctx context.Context, orderID string, status string, paymentMethod string, gatewayTxID string) error {
	// 1. Find transaction
	transaction, err := s.transactionRepo.FindByOrderID(ctx, orderID)
	if err != nil {
		logger.Error("Failed to find transaction: %v", err)
		return errors.ErrNotFound
	}

	if transaction == nil {
		// Try to find by order ID with suffix (e.g., ORD-123-1234567890)
		// This handles cases where we added timestamp suffix for new payment method
		logger.Info("Transaction not found for order: %s, trying base order ID", orderID)
		return errors.ErrNotFound
	}

	// 2. Update transaction
	transaction.Status = status
	transaction.PaymentMethod = paymentMethod
	transaction.GatewayTransactionID = gatewayTxID

	if status == "paid" || status == entity.PaymentStatusPaid {
		now := time.Now()
		transaction.PaidAt = &now
		transaction.Status = entity.PaymentStatusPaid

		// 3. Activate/Upgrade subscription
		if transaction.SubscriptionID != nil {
			subscription, err := s.subscriptionRepo.FindByID(ctx, *transaction.SubscriptionID)
			if err != nil {
				logger.Error("Failed to find subscription: %v", err)
				return errors.ErrInternalServer
			}

			if subscription != nil {
				// Update plan if transaction has a new plan ID (upgrade)
				if transaction.PlanID != nil && *transaction.PlanID != "" {
					subscription.PlanID = *transaction.PlanID
					logger.Info("Upgrading subscription plan: tenant=%s, new_plan=%s", transaction.TenantID, *transaction.PlanID)
				}
				
				// Activate subscription
				subscription.Status = entity.SubscriptionStatusActive
				subscription.StartDate = &now
				endDate := now.AddDate(0, 1, 0) // +1 month
				subscription.EndDate = &endDate
				subscription.NextBillingDate = &endDate
				subscription.PaymentMethod = paymentMethod

				if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
					logger.Error("Failed to update subscription: %v", err)
					return errors.ErrInternalServer
				}

				logger.Info("Subscription activated/upgraded: tenant=%s, plan=%s", transaction.TenantID, subscription.PlanID)
			}
		}

		// 4. Activate tenant
		tenant, err := s.tenantRepo.FindByID(ctx, transaction.TenantID)
		if err != nil {
			logger.Error("Failed to find tenant: %v", err)
			return errors.ErrInternalServer
		}

		if tenant != nil && !tenant.IsActive {
			tenant.IsActive = true
			if err := s.tenantRepo.Update(ctx, tenant); err != nil {
				logger.Error("Failed to update tenant: %v", err)
				return errors.ErrInternalServer
			}
		}

		// 5. Activate users
		users, err := s.userRepo.FindAll(ctx, transaction.TenantID)
		if err != nil {
			logger.Error("Failed to find users: %v", err)
			return errors.ErrInternalServer
		}

		for _, user := range users {
			if !user.IsActive {
				user.IsActive = true
				if err := s.userRepo.Update(ctx, user); err != nil {
					logger.Error("Failed to update user: %v", err)
				}
			}
		}

		logger.Info("Payment processed successfully: order=%s, tenant=%s, status=%s", orderID, transaction.TenantID, status)
	}

	if err := s.transactionRepo.Update(ctx, transaction); err != nil {
		logger.Error("Failed to update transaction: %v", err)
		return errors.ErrInternalServer
	}

	return nil
}

func generateOrderID() string {
	return fmt.Sprintf("ORD-%d", time.Now().Unix())
}
