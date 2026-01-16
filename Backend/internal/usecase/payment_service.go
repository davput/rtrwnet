package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"github.com/rtrwnet/saas-backend/pkg/payment"
)

type PaymentService interface {
	GetInvoiceDetails(ctx context.Context, tenantID string, orderID string) (map[string]interface{}, error)
	CreatePaymentToken(ctx context.Context, tenantID string, orderID string, paymentMethod string) (map[string]interface{}, error)
	GetPaymentStatus(ctx context.Context, tenantID string, orderID string) (map[string]interface{}, error)
}

type paymentService struct {
	transactionRepo  repository.PaymentTransactionRepository
	tenantRepo       repository.TenantRepository
	subscriptionRepo repository.TenantSubscriptionRepository
	subPlanRepo      repository.SubscriptionPlanRepository
	userRepo         repository.UserRepository
	midtransClient   *payment.MidtransClient
}

func NewPaymentService(
	transactionRepo repository.PaymentTransactionRepository,
	tenantRepo repository.TenantRepository,
	subscriptionRepo repository.TenantSubscriptionRepository,
	subPlanRepo repository.SubscriptionPlanRepository,
	userRepo repository.UserRepository,
	midtransClient *payment.MidtransClient,
) PaymentService {
	return &paymentService{
		transactionRepo:  transactionRepo,
		tenantRepo:       tenantRepo,
		subscriptionRepo: subscriptionRepo,
		subPlanRepo:      subPlanRepo,
		userRepo:         userRepo,
		midtransClient:   midtransClient,
	}
}

func (s *paymentService) GetInvoiceDetails(ctx context.Context, tenantID string, orderID string) (map[string]interface{}, error) {
	// Get transaction
	transaction, err := s.transactionRepo.FindByOrderID(ctx, orderID)
	if err != nil || transaction == nil {
		return nil, errors.New("TRANSACTION_NOT_FOUND", "Transaction not found", 404)
	}

	// Verify tenant ownership
	if transaction.TenantID != tenantID {
		return nil, errors.ErrUnauthorized
	}

	// Get tenant info
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil || tenant == nil {
		return nil, errors.ErrNotFound
	}

	// Build base response
	result := map[string]interface{}{
		"order_id":     orderID,
		"amount":       transaction.Amount,
		"status":       transaction.Status,
		"tenant_name":  tenant.Name,
		"tenant_email": tenant.Email,
		"created_at":   transaction.CreatedAt,
	}

	// Add plan info if available (for upgrade orders)
	if transaction.PlanID != nil && *transaction.PlanID != "" {
		result["plan_id"] = *transaction.PlanID
		// Get plan details
		plan, err := s.subPlanRepo.FindByID(ctx, *transaction.PlanID)
		if err == nil && plan != nil {
			result["plan_name"] = plan.Name
			result["plan_slug"] = plan.Slug
		}
	}

	// Check if payment already exists (gateway_response is not empty)
	if transaction.GatewayResponse != "" && transaction.GatewayResponse != "{}" {
		var gatewayResponse map[string]interface{}
		if err := json.Unmarshal([]byte(transaction.GatewayResponse), &gatewayResponse); err == nil && gatewayResponse != nil {
			// Add payment info to response
			paymentInfo := make(map[string]interface{})
			hasPayment := false

			// Extract payment type
			if paymentType, ok := gatewayResponse["payment_type"].(string); ok {
				paymentInfo["payment_type"] = paymentType
			}

			// Extract transaction_id
			if txID, ok := gatewayResponse["transaction_id"].(string); ok {
				paymentInfo["transaction_id"] = txID
			}

			// VA Numbers (BCA, BNI, BRI, etc.)
			if vaNumbers, ok := gatewayResponse["va_numbers"].([]interface{}); ok && len(vaNumbers) > 0 {
				paymentInfo["va_numbers"] = vaNumbers
				hasPayment = true
			}

			// Permata VA
			if permataVA, ok := gatewayResponse["permata_va_number"].(string); ok && permataVA != "" {
				paymentInfo["permata_va_number"] = permataVA
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
							paymentInfo["qr_code_url"] = url
							hasPayment = true
						}
						if name == "deeplink-redirect" && url != "" {
							paymentInfo["deeplink_url"] = url
							hasPayment = true
						}
					}
				}
			}

			// Expiry time from gateway
			if expiryTime, ok := gatewayResponse["expiry_time"].(string); ok && expiryTime != "" {
				paymentInfo["expiry_time"] = expiryTime
			}

			if hasPayment {
				result["has_payment"] = true
				result["payment_info"] = paymentInfo
				logger.Info("Invoice has existing payment: order=%s, payment_type=%v", orderID, paymentInfo["payment_type"])
			}
		}
	}

	return result, nil
}

func (s *paymentService) CreatePaymentToken(ctx context.Context, tenantID string, orderID string, paymentMethod string) (map[string]interface{}, error) {
	// Get transaction
	transaction, err := s.transactionRepo.FindByOrderID(ctx, orderID)
	if err != nil || transaction == nil {
		return nil, errors.New("TRANSACTION_NOT_FOUND", "Transaction not found", 404)
	}

	// Verify tenant ownership
	if transaction.TenantID != tenantID {
		return nil, errors.ErrUnauthorized
	}

	// Check if already paid
	if transaction.Status == entity.TransactionStatusPaid {
		return nil, errors.New("ALREADY_PAID", "Transaction already paid", 400)
	}

	// Get tenant info
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil || tenant == nil {
		return nil, errors.ErrNotFound
	}

	// Check if payment already exists in Midtrans
	existingStatus, err := s.midtransClient.GetTransactionStatus(orderID)
	if err == nil && existingStatus != nil && existingStatus.TransactionStatus == "pending" {
		logger.Info("Payment already exists in Midtrans: order=%s, status=%s, type=%s", 
			orderID, existingStatus.TransactionStatus, existingStatus.PaymentType)
		
		// Check if user selected the same payment method
		existingPaymentType := existingStatus.PaymentType
		isSameMethod := false
		
		switch paymentMethod {
		case "bca_va", "bni_va", "bri_va", "permata_va":
			isSameMethod = existingPaymentType == "bank_transfer"
		case "mandiri_bill":
			isSameMethod = existingPaymentType == "echannel"
		case "gopay":
			isSameMethod = existingPaymentType == "gopay"
		case "shopeepay":
			isSameMethod = existingPaymentType == "shopeepay"
		case "qris":
			isSameMethod = existingPaymentType == "qris"
		}
		
		if isSameMethod {
			// Return existing payment data
			result := map[string]interface{}{
				"order_id":       orderID,
				"transaction_id": existingStatus.TransactionID,
				"status":         existingStatus.TransactionStatus,
				"amount":         transaction.Amount,
				"payment_type":   existingStatus.PaymentType,
			}
			
			// Add VA numbers if available
			if existingStatus.VANumbers != nil && len(existingStatus.VANumbers) > 0 {
				result["va_numbers"] = existingStatus.VANumbers
			}
			if existingStatus.PermataVANumber != "" {
				result["permata_va_number"] = existingStatus.PermataVANumber
			}
			if existingStatus.BillerCode != "" {
				result["biller_code"] = existingStatus.BillerCode
				result["bill_key"] = existingStatus.BillKey
			}
			// Add QR code for e-wallet
			if existingStatus.Actions != nil {
				for _, action := range existingStatus.Actions {
					if action.Name == "generate-qr-code" {
						result["qr_code_url"] = action.URL
					}
					if action.Name == "deeplink-redirect" {
						result["deeplink_url"] = action.URL
					}
				}
			}
			
			logger.Info("Returning existing payment: order=%s", orderID)
			return result, nil
		}
		
		// Different payment method selected - need to use new order ID
		// Midtrans doesn't allow reusing order_id after cancel
		logger.Info("Different payment method selected: order=%s, old=%s, new=%s", 
			orderID, existingPaymentType, paymentMethod)
		
		// Add timestamp suffix to create unique order ID
		orderID = fmt.Sprintf("%s-%d", orderID, time.Now().Unix())
		logger.Info("Using new order ID: %s", orderID)
		
	} else if err == nil && existingStatus != nil {
		// If expired/failed, use new order ID
		if existingStatus.TransactionStatus == "expire" || existingStatus.TransactionStatus == "cancel" || existingStatus.TransactionStatus == "deny" {
			logger.Info("Previous payment expired/failed: order=%s, status=%s", orderID, existingStatus.TransactionStatus)
			orderID = fmt.Sprintf("%s-%d", orderID, time.Now().Unix())
			logger.Info("Using new order ID: %s", orderID)
		}
	}

	// Create Midtrans charge request based on payment method
	// Round amount to integer (Midtrans IDR doesn't accept decimals)
	amount := int64(transaction.Amount)
	
	var chargeResp *payment.ChargeResponse
	
	// Parse payment method and create appropriate charge
	switch paymentMethod {
	case "bca_va":
		chargeResp, err = s.midtransClient.ChargeBankTransfer(orderID, float64(amount), "bca", &payment.CustomerDetails{
			FirstName: tenant.Name,
			Email:     tenant.Email,
		}, nil)
	case "bni_va":
		chargeResp, err = s.midtransClient.ChargeBankTransfer(orderID, float64(amount), "bni", &payment.CustomerDetails{
			FirstName: tenant.Name,
			Email:     tenant.Email,
		}, nil)
	case "bri_va":
		chargeResp, err = s.midtransClient.ChargeBankTransfer(orderID, float64(amount), "bri", &payment.CustomerDetails{
			FirstName: tenant.Name,
			Email:     tenant.Email,
		}, nil)
	case "permata_va":
		chargeResp, err = s.midtransClient.ChargeBankTransfer(orderID, float64(amount), "permata", &payment.CustomerDetails{
			FirstName: tenant.Name,
			Email:     tenant.Email,
		}, nil)
	case "mandiri_bill":
		chargeResp, err = s.midtransClient.ChargeMandiriBill(orderID, float64(amount), &payment.CustomerDetails{
			FirstName: tenant.Name,
			Email:     tenant.Email,
		}, nil)
	case "gopay":
		callbackURL := fmt.Sprintf("%s/payment/finish", s.midtransClient.GetClientKey())
		chargeResp, err = s.midtransClient.ChargeGopay(orderID, float64(amount), &payment.CustomerDetails{
			FirstName: tenant.Name,
			Email:     tenant.Email,
		}, nil, callbackURL)
	case "shopeepay":
		callbackURL := fmt.Sprintf("%s/payment/finish", s.midtransClient.GetClientKey())
		chargeResp, err = s.midtransClient.ChargeShopeePay(orderID, float64(amount), &payment.CustomerDetails{
			FirstName: tenant.Name,
			Email:     tenant.Email,
		}, nil, callbackURL)
	case "qris":
		chargeResp, err = s.midtransClient.ChargeQRIS(orderID, float64(amount), &payment.CustomerDetails{
			FirstName: tenant.Name,
			Email:     tenant.Email,
		}, nil)
	default:
		return nil, errors.New("INVALID_PAYMENT_METHOD", "Invalid payment method", 400)
	}

	logger.Info("Creating Midtrans charge: order=%s, amount=%.0f, method=%s, tenant=%s", 
		orderID, float64(amount), paymentMethod, tenant.Name)
	if err != nil {
		logger.Error("Failed to create Midtrans charge: %v", err)
		return nil, errors.New("PAYMENT_FAILED", fmt.Sprintf("Failed to create payment: %v", err), 500)
	}
	
	// Log response for debugging
	respJSON, _ := json.Marshal(chargeResp)
	logger.Info("Midtrans response: %s", string(respJSON))

	logger.Info("Midtrans charge created: order=%s, transaction_id=%s, status=%s", 
		orderID, chargeResp.TransactionID, chargeResp.TransactionStatus)

	// Update transaction with gateway response
	gatewayResponseJSON, _ := json.Marshal(chargeResp)
	transaction.GatewayResponse = string(gatewayResponseJSON)
	transaction.GatewayTransactionID = chargeResp.TransactionID

	// Parse and set expiry time from Midtrans response
	if chargeResp.ExpiryTime != "" {
		// Midtrans expiry time format: "2024-01-15 12:00:00"
		expiryTime, err := time.Parse("2006-01-02 15:04:05", chargeResp.ExpiryTime)
		if err != nil {
			logger.Error("Failed to parse expiry time: %v", err)
		} else {
			transaction.ExpiredAt = &expiryTime
			logger.Info("Set transaction expiry: order=%s, expiry=%s", orderID, expiryTime.Format(time.RFC3339))
		}
	}

	if err := s.transactionRepo.Update(ctx, transaction); err != nil {
		logger.Error("Failed to update transaction: %v", err)
	}

	logger.Info("Payment token created: order=%s, transaction_id=%s", orderID, chargeResp.TransactionID)

	// Return payment data
	result := map[string]interface{}{
		"order_id":       orderID,
		"transaction_id": chargeResp.TransactionID,
		"status":         chargeResp.TransactionStatus,
		"amount":         transaction.Amount,
		"payment_type":   chargeResp.PaymentType,
	}

	// Add expiry time if available
	if chargeResp.ExpiryTime != "" {
		result["expiry_time"] = chargeResp.ExpiryTime
	}

	// Add payment-specific info
	if chargeResp.Actions != nil && len(chargeResp.Actions) > 0 {
		result["actions"] = chargeResp.Actions
	}

	// For QR-based payments (GoPay, QRIS)
	if chargeResp.Actions != nil {
		for _, action := range chargeResp.Actions {
			if action.Name == "generate-qr-code" {
				result["qr_code_url"] = action.URL
			}
			if action.Name == "deeplink-redirect" {
				result["deeplink_url"] = action.URL
			}
		}
	}

	// For VA-based payments
	if chargeResp.VANumbers != nil && len(chargeResp.VANumbers) > 0 {
		result["va_numbers"] = chargeResp.VANumbers
	}

	if chargeResp.PermataVANumber != "" {
		result["permata_va_number"] = chargeResp.PermataVANumber
	}

	if chargeResp.BillerCode != "" {
		result["biller_code"] = chargeResp.BillerCode
		result["bill_key"] = chargeResp.BillKey
	}

	return result, nil
}

func (s *paymentService) GetPaymentStatus(ctx context.Context, tenantID string, orderID string) (map[string]interface{}, error) {
	// Get transaction
	transaction, err := s.transactionRepo.FindByOrderID(ctx, orderID)
	if err != nil || transaction == nil {
		return nil, errors.New("TRANSACTION_NOT_FOUND", "Transaction not found", 404)
	}

	logger.Info("GetPaymentStatus: order=%s, tenant=%s, current_status=%s, plan_id=%v, subscription_id=%v",
		orderID, tenantID, transaction.Status, transaction.PlanID, transaction.SubscriptionID)

	// Verify tenant ownership
	if transaction.TenantID != tenantID {
		return nil, errors.ErrUnauthorized
	}

	// Get status from Midtrans
	statusResp, err := s.midtransClient.GetTransactionStatus(orderID)
	if err != nil {
		logger.Error("Failed to get Midtrans status: %v", err)
		// Return local status if Midtrans fails
		return map[string]interface{}{
			"order_id": orderID,
			"status":   transaction.Status,
			"amount":   transaction.Amount,
		}, nil
	}

	logger.Info("Midtrans status: order=%s, status=%s, payment_type=%s",
		orderID, statusResp.TransactionStatus, statusResp.PaymentType)

	// Update local transaction status
	var newStatus string
	switch statusResp.TransactionStatus {
	case "capture", "settlement":
		newStatus = entity.TransactionStatusPaid
	case "pending":
		newStatus = entity.TransactionStatusPending
	case "deny", "cancel", "expire":
		newStatus = entity.TransactionStatusFailed
	default:
		newStatus = transaction.Status
	}

	// Also check if local status is already paid (e.g., from webhook or manual update)
	// This handles cases where Midtrans returns stale status
	if transaction.Status == entity.TransactionStatusPaid && newStatus != entity.TransactionStatusPaid {
		logger.Info("Local status is paid but Midtrans says %s. Using local status.", statusResp.TransactionStatus)
		newStatus = entity.TransactionStatusPaid
	}

	// Check if we need to process upgrade
	// Process if: payment is confirmed AND (status just changed OR plan not yet upgraded)
	needsUpgrade := false
	if newStatus == entity.TransactionStatusPaid {
		logger.Info("Payment is paid. Checking if upgrade needed...")
		logger.Info("Current transaction.Status=%s, newStatus=%s", transaction.Status, newStatus)
		
		if transaction.Status != entity.TransactionStatusPaid {
			// Status just changed to paid
			needsUpgrade = true
			logger.Info("Payment just confirmed, will process upgrade")
		} else if transaction.PlanID != nil && *transaction.PlanID != "" && transaction.SubscriptionID != nil {
			logger.Info("Transaction already paid. Checking if plan upgrade was applied...")
			logger.Info("transaction.PlanID=%s, transaction.SubscriptionID=%s", *transaction.PlanID, *transaction.SubscriptionID)
			
			// Already paid, but check if plan was actually upgraded
			subscription, err := s.subscriptionRepo.FindByID(ctx, *transaction.SubscriptionID)
			if err == nil && subscription != nil {
				logger.Info("Current subscription.PlanID=%s", subscription.PlanID)
				if subscription.PlanID != *transaction.PlanID {
					// Plan not yet upgraded!
					needsUpgrade = true
					logger.Info("Payment was confirmed but plan not upgraded yet. Current: %s, Target: %s",
						subscription.PlanID, *transaction.PlanID)
				} else {
					logger.Info("Plan already upgraded to %s", subscription.PlanID)
				}
			} else {
				logger.Error("Failed to find subscription: %v", err)
			}
		} else {
			logger.Info("No plan_id or subscription_id in transaction. PlanID=%v, SubscriptionID=%v", 
				transaction.PlanID, transaction.SubscriptionID)
		}
	}

	// Process the upgrade if needed
	if needsUpgrade {
		logger.Info("Processing upgrade: order=%s, tenant=%s, plan_id=%v",
			orderID, tenantID, transaction.PlanID)

		now := time.Now()
		transaction.Status = newStatus
		if transaction.PaidAt == nil {
			transaction.PaidAt = &now
		}
		transaction.PaymentMethod = statusResp.PaymentType
		transaction.GatewayTransactionID = statusResp.TransactionID

		// Update subscription with new plan
		if transaction.SubscriptionID != nil {
			logger.Info("Found subscription_id: %s", *transaction.SubscriptionID)
			subscription, err := s.subscriptionRepo.FindByID(ctx, *transaction.SubscriptionID)
			if err == nil && subscription != nil {
				logger.Info("Current subscription: plan_id=%s, status=%s", subscription.PlanID, subscription.Status)

				// Update plan if transaction has a new plan ID (upgrade)
				if transaction.PlanID != nil && *transaction.PlanID != "" {
					oldPlanID := subscription.PlanID
					subscription.PlanID = *transaction.PlanID
					logger.Info("Upgrading subscription plan: tenant=%s, old_plan=%s, new_plan=%s",
						tenantID, oldPlanID, *transaction.PlanID)
				} else {
					logger.Info("No plan_id in transaction, keeping current plan: %s", subscription.PlanID)
				}

				// Activate/extend subscription
				subscription.Status = entity.SubscriptionStatusActive
				if subscription.StartDate == nil {
					subscription.StartDate = &now
				}
				endDate := now.AddDate(0, 1, 0) // +1 month
				subscription.EndDate = &endDate
				subscription.NextBillingDate = &endDate
				subscription.PaymentMethod = statusResp.PaymentType

				if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
					logger.Error("Failed to update subscription: %v", err)
				} else {
					logger.Info("Subscription updated successfully: tenant=%s, plan=%s, status=%s",
						tenantID, subscription.PlanID, subscription.Status)
				}
			} else {
				logger.Error("Failed to find subscription: %v", err)
			}
		} else {
			logger.Info("No subscription_id in transaction")
		}

		// Activate tenant if not active
		tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
		if err == nil && tenant != nil && !tenant.IsActive {
			tenant.IsActive = true
			if err := s.tenantRepo.Update(ctx, tenant); err != nil {
				logger.Error("Failed to activate tenant: %v", err)
			}
		}

		// Activate users if not active
		users, err := s.userRepo.FindAll(ctx, tenantID)
		if err == nil {
			for _, user := range users {
				if !user.IsActive {
					user.IsActive = true
					s.userRepo.Update(ctx, user)
				}
			}
		}

		// Save transaction
		if err := s.transactionRepo.Update(ctx, transaction); err != nil {
			logger.Error("Failed to update transaction: %v", err)
		}

		logger.Info("Payment processed successfully: order=%s, tenant=%s", orderID, tenantID)
	} else if newStatus != transaction.Status {
		// Just update status
		transaction.Status = newStatus
		if err := s.transactionRepo.Update(ctx, transaction); err != nil {
			logger.Error("Failed to update transaction status: %v", err)
		}
	}

	return map[string]interface{}{
		"order_id":         orderID,
		"transaction_id":   statusResp.TransactionID,
		"status":           statusResp.TransactionStatus,
		"amount":           transaction.Amount,
		"payment_type":     statusResp.PaymentType,
		"transaction_time": statusResp.TransactionTime,
		"fraud_status":     statusResp.FraudStatus,
	}, nil
}
