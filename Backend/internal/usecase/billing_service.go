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
)

type BillingService interface {
	GetBillingDashboard(ctx context.Context, tenantID string) (*dto.BillingDashboardResponse, error)
	UpdateSubscription(ctx context.Context, tenantID string, req *dto.UpdateSubscriptionRequest) (*dto.UpdateSubscriptionResponse, error)
	CreateSubscriptionOrder(ctx context.Context, tenantID string, planID string) (*dto.CreateOrderResponse, error)
	GetPendingOrder(ctx context.Context, tenantID string) (*dto.CreateOrderResponse, error)
	UpdateTenantSettings(ctx context.Context, tenantID string, req *dto.UpdateTenantBasicInfoRequest) error
	CancelSubscription(ctx context.Context, tenantID string, req *dto.CancelSubscriptionRequest) error
	UpdatePaymentMethod(ctx context.Context, tenantID string, req *dto.UpdatePaymentMethodRequest) error
}

type billingService struct {
	tenantRepo       repository.TenantRepository
	subscriptionRepo repository.TenantSubscriptionRepository
	planRepo         repository.SubscriptionPlanRepository
	transactionRepo  repository.PaymentTransactionRepository
}

func NewBillingService(
	tenantRepo repository.TenantRepository,
	subscriptionRepo repository.TenantSubscriptionRepository,
	planRepo repository.SubscriptionPlanRepository,
	transactionRepo repository.PaymentTransactionRepository,
) BillingService {
	return &billingService{
		tenantRepo:       tenantRepo,
		subscriptionRepo: subscriptionRepo,
		planRepo:         planRepo,
		transactionRepo:  transactionRepo,
	}
}

func (s *billingService) GetBillingDashboard(ctx context.Context, tenantID string) (*dto.BillingDashboardResponse, error) {
	// Get tenant
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil || tenant == nil {
		logger.Error("Failed to find tenant: %v", err)
		return nil, errors.ErrNotFound
	}

	// Get subscription
	subscription, err := s.subscriptionRepo.FindByTenantID(ctx, tenantID)
	if err != nil || subscription == nil {
		logger.Error("Failed to find subscription: %v", err)
		return nil, errors.New("NO_SUBSCRIPTION", "No subscription found", 404)
	}

	// Get plan
	plan, err := s.planRepo.FindByID(ctx, subscription.PlanID)
	if err != nil || plan == nil {
		logger.Error("Failed to find plan: %v", err)
		return nil, errors.ErrInternalServer
	}

	// Get all available plans (exclude trial plans)
	allPlans, err := s.planRepo.FindPublicPlans(ctx)
	if err != nil {
		logger.Error("Failed to get plans: %v", err)
		allPlans = []*entity.SubscriptionPlan{}
	}

	// Calculate days left
	var daysLeft int
	if subscription.EndDate != nil {
		daysLeft = int(time.Until(*subscription.EndDate).Hours() / 24)
		if daysLeft < 0 {
			daysLeft = 0
		}
	}

	// Calculate usage
	var daysUsed, daysRemaining int
	if subscription.StartDate != nil && subscription.EndDate != nil {
		totalDays := int(subscription.EndDate.Sub(*subscription.StartDate).Hours() / 24)
		daysUsed = totalDays - daysLeft
		daysRemaining = daysLeft
	}

	// Get transactions/invoices
	transactions, err := s.transactionRepo.FindByTenantID(ctx, tenantID)
	if err != nil {
		logger.Error("Failed to get transactions: %v", err)
		transactions = []*entity.PaymentTransaction{}
	}

	// Build invoices from transactions
	invoices := s.buildInvoices(transactions)

	// Build response
	response := &dto.BillingDashboardResponse{
		Tenant: dto.TenantBillingInfo{
			ID:       tenant.ID,
			Name:     tenant.Name,
			Email:    tenant.Email,
			IsActive: tenant.IsActive,
		},
		Subscription: dto.SubscriptionBillingInfo{
			ID:              subscription.ID,
			PlanID:          subscription.PlanID,
			PlanName:        plan.Name,
			PlanSlug:        plan.Slug,
			Status:          subscription.Status,
			IsTrial:         subscription.Status == entity.SubscriptionStatusTrial,
			StartDate:       subscription.StartDate,
			EndDate:         subscription.EndDate,
			NextBillingDate: subscription.NextBillingDate,
			DaysLeft:        daysLeft,
			AutoRenew:       subscription.AutoRenew,
			PaymentMethod:   subscription.PaymentMethod,
		},
		Billing: dto.BillingDetails{
			CurrentPlan:    plan.Name,
			MonthlyPrice:   plan.Price,
			Currency:       "IDR",
			CanUpgrade:     true,
			CanDowngrade:   true,
			AvailablePlans: s.buildPlanOptions(allPlans, plan.ID),
		},
		Usage: dto.UsageInfo{
			CurrentPeriodStart: subscription.StartDate,
			CurrentPeriodEnd:   subscription.EndDate,
			DaysUsed:           daysUsed,
			DaysRemaining:      daysRemaining,
		},
		Invoices: invoices,
	}

	if subscription.NextBillingDate != nil {
		response.Billing.NextBilling = subscription.NextBillingDate.Format("2006-01-02")
	}

	if subscription.PaymentMethod != "" {
		response.Billing.PaymentMethod = subscription.PaymentMethod
	}

	return response, nil
}

func (s *billingService) UpdateSubscription(ctx context.Context, tenantID string, req *dto.UpdateSubscriptionRequest) (*dto.UpdateSubscriptionResponse, error) {
	// Get current subscription
	subscription, err := s.subscriptionRepo.FindByTenantID(ctx, tenantID)
	if err != nil || subscription == nil {
		return nil, errors.New("NO_SUBSCRIPTION", "No subscription found", 404)
	}

	// Get current plan
	currentPlan, err := s.planRepo.FindByID(ctx, subscription.PlanID)
	if err != nil || currentPlan == nil {
		return nil, errors.New("INVALID_PLAN", "Current plan not found", 404)
	}

	// Get new plan
	newPlan, err := s.planRepo.FindByID(ctx, req.PlanID)
	if err != nil || newPlan == nil {
		return nil, errors.New("INVALID_PLAN", "Invalid plan selected", 400)
	}

	// If same plan, just update settings
	if currentPlan.ID == newPlan.ID {
		if req.PaymentMethod != "" {
			subscription.PaymentMethod = req.PaymentMethod
		}
		if req.AutoRenew != nil {
			subscription.AutoRenew = *req.AutoRenew
		}
		if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
			logger.Error("Failed to update subscription settings: %v", err)
			return nil, errors.ErrInternalServer
		}
		return &dto.UpdateSubscriptionResponse{
			Success: true,
			Message: "Settings updated",
		}, nil
	}

	// Determine if upgrade or downgrade
	isUpgrade := newPlan.Price > currentPlan.Price
	isDowngrade := newPlan.Price < currentPlan.Price

	// If upgrading from trial, create order for payment
	if subscription.Status == entity.SubscriptionStatusTrial {
		// Create order for payment
		orderID := generateBillingOrderID()
		expiredAt := time.Now().Add(24 * time.Hour)

		newPlanID := req.PlanID
		transaction := &entity.PaymentTransaction{
			TenantID:        tenantID,
			SubscriptionID:  &subscription.ID,
			PlanID:          &newPlanID,
			OrderID:         orderID,
			Amount:          newPlan.Price,
			Status:          entity.TransactionStatusPending,
			PaymentGateway:  "midtrans",
			GatewayResponse: "{}",
			ExpiredAt:       &expiredAt,
		}

		if err := s.transactionRepo.Create(ctx, transaction); err != nil {
			logger.Error("Failed to create trial upgrade transaction: %v", err)
			return nil, errors.ErrInternalServer
		}

		logger.Info("Trial upgrade order created: tenant=%s, plan=%s, order=%s", tenantID, newPlan.Name, orderID)
		return &dto.UpdateSubscriptionResponse{
			Success:      true,
			Message:      "Order created for trial upgrade",
			OrderID:      orderID,
			RequiresPay:  true,
			ActionType:   "upgrade",
			NewPlanName:  newPlan.Name,
			NewPlanPrice: newPlan.Price,
		}, nil
	}

	// Handle UPGRADE - Create order for payment first, don't change plan immediately
	if isUpgrade {
		// Create order for upgrade payment
		orderID := generateBillingOrderID()
		expiredAt := time.Now().Add(24 * time.Hour)

		// Store the new plan ID in transaction so it can be applied after payment
		newPlanID := req.PlanID
		logger.Info("Creating upgrade order: tenant=%s, current_plan=%s, new_plan=%s, new_plan_id=%s",
			tenantID, currentPlan.Name, newPlan.Name, newPlanID)

		transaction := &entity.PaymentTransaction{
			TenantID:        tenantID,
			SubscriptionID:  &subscription.ID,
			PlanID:          &newPlanID, // Store the plan to upgrade to
			OrderID:         orderID,
			Amount:          newPlan.Price, // Full price for new plan
			Status:          entity.TransactionStatusPending,
			PaymentGateway:  "midtrans",
			GatewayResponse: "{}",
			ExpiredAt:       &expiredAt,
		}

		logger.Info("Transaction to create: order=%s, plan_id=%v, subscription_id=%v",
			orderID, transaction.PlanID, transaction.SubscriptionID)

		if err := s.transactionRepo.Create(ctx, transaction); err != nil {
			logger.Error("Failed to create upgrade transaction: %v", err)
			return nil, errors.ErrInternalServer
		}

		logger.Info("Upgrade order created successfully: tenant=%s, order=%s, plan_id=%s",
			tenantID, orderID, newPlanID)

		// Return success with order ID - frontend should redirect to payment page
		return &dto.UpdateSubscriptionResponse{
			Success:      true,
			Message:      "Order created for upgrade",
			OrderID:      orderID,
			RequiresPay:  true,
			ActionType:   "upgrade",
			NewPlanName:  newPlan.Name,
			NewPlanPrice: newPlan.Price,
		}, nil
	}

	// Handle DOWNGRADE - apply immediately (or schedule for next billing period)
	if isDowngrade {
		// For downgrade, apply immediately
		// In production, you might want to schedule this for next billing period
		subscription.PlanID = req.PlanID
		if req.PaymentMethod != "" {
			subscription.PaymentMethod = req.PaymentMethod
		}
		if req.AutoRenew != nil {
			subscription.AutoRenew = *req.AutoRenew
		}

		if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
			logger.Error("Failed to downgrade subscription: %v", err)
			return nil, errors.ErrInternalServer
		}

		logger.Info("Subscription downgraded: tenant=%s, from=%s to=%s", tenantID, currentPlan.Name, newPlan.Name)
		return &dto.UpdateSubscriptionResponse{
			Success:      true,
			Message:      "Subscription downgraded successfully",
			ActionType:   "downgrade",
			NewPlanName:  newPlan.Name,
			NewPlanPrice: newPlan.Price,
		}, nil
	}

	// Fallback: just update the plan
	subscription.PlanID = req.PlanID
	if req.PaymentMethod != "" {
		subscription.PaymentMethod = req.PaymentMethod
	}
	if req.AutoRenew != nil {
		subscription.AutoRenew = *req.AutoRenew
	}

	if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
		logger.Error("Failed to update subscription: %v", err)
		return nil, errors.ErrInternalServer
	}

	return &dto.UpdateSubscriptionResponse{
		Success: true,
		Message: "Subscription updated",
	}, nil
}

func (s *billingService) CreateSubscriptionOrder(ctx context.Context, tenantID string, planID string) (*dto.CreateOrderResponse, error) {
	// Get plan
	plan, err := s.planRepo.FindByID(ctx, planID)
	if err != nil || plan == nil {
		return nil, errors.New("INVALID_PLAN", "Invalid plan selected", 400)
	}

	// Get or create subscription
	subscription, err := s.subscriptionRepo.FindByTenantID(ctx, tenantID)
	if err != nil || subscription == nil {
		// Create new subscription with pending status
		subscription = &entity.TenantSubscription{
			TenantID:  tenantID,
			PlanID:    planID,
			Status:    entity.SubscriptionStatusPending,
			AutoRenew: true,
		}
		if err := s.subscriptionRepo.Create(ctx, subscription); err != nil {
			logger.Error("Failed to create subscription: %v", err)
			return nil, errors.ErrInternalServer
		}
	}
	// Note: Don't change existing subscription status or plan here
	// The plan will be updated when payment is confirmed

	// Create payment transaction with the new plan ID stored
	orderID := generateBillingOrderID()
	expiredAt := time.Now().Add(24 * time.Hour)

	logger.Info("Creating transaction with plan_id: tenant=%s, plan_id=%s, order=%s", tenantID, planID, orderID)

	transaction := &entity.PaymentTransaction{
		TenantID:        tenantID,
		SubscriptionID:  &subscription.ID,
		PlanID:          &planID, // Store the plan to upgrade to
		OrderID:         orderID,
		Amount:          plan.Price,
		Status:          entity.TransactionStatusPending,
		PaymentGateway:  "midtrans",
		GatewayResponse: "{}",
		ExpiredAt:       &expiredAt,
	}

	logger.Info("Transaction object created: plan_id=%v", transaction.PlanID)

	if err := s.transactionRepo.Create(ctx, transaction); err != nil {
		logger.Error("Failed to create transaction: %v", err)
		return nil, errors.ErrInternalServer
	}

	logger.Info("Subscription order created: tenant=%s, plan=%s, plan_id=%s, order=%s", tenantID, plan.Name, planID, orderID)

	return &dto.CreateOrderResponse{
		OrderID:   orderID,
		Amount:    plan.Price,
		PlanName:  plan.Name,
		ExpiresAt: expiredAt.Format(time.RFC3339),
	}, nil
}

func generateBillingOrderID() string {
	return "ORD-" + time.Now().Format("20060102150405")
}

func (s *billingService) GetPendingOrder(ctx context.Context, tenantID string) (*dto.CreateOrderResponse, error) {
	// Find pending transactions for this tenant
	transactions, err := s.transactionRepo.FindByTenantID(ctx, tenantID)
	if err != nil {
		logger.Error("Failed to find transactions: %v", err)
		return nil, errors.ErrNotFound
	}

	// Find the most recent pending transaction
	for _, tx := range transactions {
		if tx.Status == entity.TransactionStatusPending {
			// Get plan name
			planName := ""
			if tx.SubscriptionID != nil {
				subscription, err := s.subscriptionRepo.FindByID(ctx, *tx.SubscriptionID)
				if err == nil && subscription != nil {
					plan, err := s.planRepo.FindByID(ctx, subscription.PlanID)
					if err == nil && plan != nil {
						planName = plan.Name
					}
				}
			}

			expiresAt := ""
			if tx.ExpiredAt != nil {
				expiresAt = tx.ExpiredAt.Format(time.RFC3339)
			}

			// Parse gateway response to get payment info
			var gatewayResponse map[string]interface{}
			paymentInfo := make(map[string]interface{})
			hasPayment := false

			if tx.GatewayResponse != "" && tx.GatewayResponse != "{}" {
				if err := json.Unmarshal([]byte(tx.GatewayResponse), &gatewayResponse); err == nil && gatewayResponse != nil {
					// Extract payment info based on payment type
					// VA Numbers (BCA, BNI, BRI, etc.)
					if vaNumbers, ok := gatewayResponse["va_numbers"].([]interface{}); ok && len(vaNumbers) > 0 {
						if va, ok := vaNumbers[0].(map[string]interface{}); ok {
							paymentInfo["bank"] = va["bank"]
							paymentInfo["va_number"] = va["va_number"]
							hasPayment = true
						}
					}

					// Permata VA
					if permataVA, ok := gatewayResponse["permata_va_number"].(string); ok && permataVA != "" {
						paymentInfo["bank"] = "permata"
						paymentInfo["va_number"] = permataVA
						hasPayment = true
					}

					// Mandiri Bill
					if billerCode, ok := gatewayResponse["biller_code"].(string); ok && billerCode != "" {
						paymentInfo["biller_code"] = billerCode
						if billKey, ok := gatewayResponse["bill_key"].(string); ok {
							paymentInfo["bill_key"] = billKey
						}
						hasPayment = true
					}

					// QR String (QRIS)
					if qrString, ok := gatewayResponse["qr_string"].(string); ok && qrString != "" {
						paymentInfo["qr_string"] = qrString
						hasPayment = true
					}

					// Actions (GoPay, ShopeePay - contains QR URL and deeplink)
					if actions, ok := gatewayResponse["actions"].([]interface{}); ok && len(actions) > 0 {
						for _, action := range actions {
							if act, ok := action.(map[string]interface{}); ok {
								name, _ := act["name"].(string)
								url, _ := act["url"].(string)
								if name == "generate-qr-code" && url != "" {
									paymentInfo["qr_url"] = url
									hasPayment = true
								}
								if name == "deeplink-redirect" && url != "" {
									paymentInfo["deeplink"] = url
									hasPayment = true
								}
							}
						}
					}

					// Expiry time from gateway
					if expiryTime, ok := gatewayResponse["expiry_time"].(string); ok && expiryTime != "" {
						expiresAt = expiryTime
					}
				}
			}

			return &dto.CreateOrderResponse{
				OrderID:       tx.OrderID,
				Amount:        tx.Amount,
				PlanName:      planName,
				ExpiresAt:     expiresAt,
				PaymentMethod: tx.PaymentMethod,
				PaymentType:   tx.PaymentGateway,
				PaymentInfo:   paymentInfo,
				HasPayment:    hasPayment,
			}, nil
		}
	}

	return nil, errors.New("NO_PENDING_ORDER", "No pending order found", 404)
}

func (s *billingService) UpdateTenantSettings(ctx context.Context, tenantID string, req *dto.UpdateTenantBasicInfoRequest) error {
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil || tenant == nil {
		return errors.ErrNotFound
	}

	if req.Name != "" {
		tenant.Name = req.Name
	}
	// Email and Phone will be added when tenant entity has these fields
	// if req.Email != "" {
	// 	tenant.Email = req.Email
	// }
	// if req.Phone != "" {
	// 	tenant.Phone = req.Phone
	// }

	if err := s.tenantRepo.Update(ctx, tenant); err != nil {
		logger.Error("Failed to update tenant: %v", err)
		return errors.ErrInternalServer
	}

	return nil
}

func (s *billingService) CancelSubscription(ctx context.Context, tenantID string, req *dto.CancelSubscriptionRequest) error {
	subscription, err := s.subscriptionRepo.FindByTenantID(ctx, tenantID)
	if err != nil || subscription == nil {
		return errors.New("NO_SUBSCRIPTION", "No subscription found", 404)
	}

	// Set to cancelled status
	subscription.Status = entity.SubscriptionStatusCancelled
	subscription.AutoRenew = false

	if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
		logger.Error("Failed to cancel subscription: %v", err)
		return errors.ErrInternalServer
	}

	logger.Info("Subscription cancelled for tenant %s. Reason: %s", tenantID, req.Reason)
	return nil
}

func (s *billingService) UpdatePaymentMethod(ctx context.Context, tenantID string, req *dto.UpdatePaymentMethodRequest) error {
	subscription, err := s.subscriptionRepo.FindByTenantID(ctx, tenantID)
	if err != nil || subscription == nil {
		return errors.New("NO_SUBSCRIPTION", "No subscription found", 404)
	}

	subscription.PaymentMethod = req.PaymentMethod

	if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
		logger.Error("Failed to update payment method: %v", err)
		return errors.ErrInternalServer
	}

	return nil
}

func (s *billingService) buildPlanOptions(plans []*entity.SubscriptionPlan, currentPlanID string) []dto.PlanOption {
	options := make([]dto.PlanOption, 0, len(plans))
	for _, plan := range plans {
		options = append(options, dto.PlanOption{
			ID:          plan.ID,
			Name:        plan.Name,
			Slug:        plan.Slug,
			Price:       plan.Price,
			Description: plan.Description,
			IsCurrent:   plan.ID == currentPlanID,
		})
	}
	return options
}

// buildInvoices will be implemented when transaction entity is ready
// func (s *billingService) buildInvoices(transactions []*entity.Transaction) []dto.InvoiceInfo {
// 	invoices := make([]dto.InvoiceInfo, 0)
// 	
// 	// Get last 5 transactions
// 	count := 0
// 	for _, tx := range transactions {
// 		if count >= 5 {
// 			break
// 		}
// 		
// 		invoice := dto.InvoiceInfo{
// 			ID:         tx.ID,
// 			InvoiceNo:  tx.InvoiceNumber,
// 			Amount:     tx.Amount,
// 			Status:     tx.Status,
// 			IssuedDate: tx.CreatedAt,
// 		}
// 		
// 		if tx.Status == entity.TransactionStatusSuccess && tx.CreatedAt != nil {
// 			invoice.PaidDate = tx.CreatedAt
// 		}
// 		
// 		invoices = append(invoices, invoice)
// 		count++
// 	}
// 	
// 	return invoices
// }


// buildInvoices converts payment transactions to invoice info
func (s *billingService) buildInvoices(transactions []*entity.PaymentTransaction) []dto.InvoiceInfo {
	invoices := make([]dto.InvoiceInfo, 0, len(transactions))
	
	for _, tx := range transactions {
		// Map payment status to invoice status
		var status string
		switch tx.Status {
		case entity.TransactionStatusPending:
			status = "pending"
		case entity.TransactionStatusPaid:
			status = "paid"
		case entity.TransactionStatusFailed, entity.TransactionStatusExpired:
			status = "failed"
		case entity.TransactionStatusCancelled:
			status = "cancelled"
		default:
			status = "pending"
		}

		// Use order_id as invoice number
		invoiceNo := tx.OrderID
		if invoiceNo == "" {
			invoiceNo = "INV-" + tx.ID[:8]
		}

		invoice := dto.InvoiceInfo{
			ID:          tx.ID,
			InvoiceNo:   invoiceNo,
			Amount:      tx.Amount,
			IssuedDate:  &tx.CreatedAt,
			DueDate:     tx.ExpiredAt,
			PaidDate:    tx.PaidAt,
			Status:      status,
			DownloadURL: "", // Will be implemented later
		}

		invoices = append(invoices, invoice)
	}

	return invoices
}
