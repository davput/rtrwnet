package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type SubscriptionHandler struct {
	subscriptionService usecase.SubscriptionService
}

func NewSubscriptionHandler(subscriptionService usecase.SubscriptionService) *SubscriptionHandler {
	return &SubscriptionHandler{
		subscriptionService: subscriptionService,
	}
}

// GetPlans godoc
// @Summary      Get subscription plans
// @Description  Retrieve all available subscription plans with pricing and features
// @Tags         Public
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.SuccessResponse{data=object}  "Plans retrieved successfully"
// @Failure      500  {object}  response.ErrorResponse  "Internal server error"
// @Router       /public/plans [get]
func (h *SubscriptionHandler) GetPlans(c *gin.Context) {
	plans, err := h.subscriptionService.GetPlans(c.Request.Context())
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Plans retrieved successfully", map[string]interface{}{
		"plans": plans,
		"total": len(plans),
	})
}

// SignUp godoc
// @Summary      Sign up new tenant
// @Description  Register a new tenant (ISP) with optional 7-day free trial. Email must be unique globally (one email = one tenant). Creates tenant, admin user, and subscription.
// @Tags         Public
// @Accept       json
// @Produce      json
// @Param        request  body      dto.SignUpRequest  true  "Sign up request with ISP details"
// @Success      201      {object}  response.SuccessResponse{data=dto.SignUpResponse}  "Sign up successful"
// @Failure      400      {object}  response.ErrorResponse  "Validation error - check required fields"
// @Failure      409      {object}  response.ErrorResponse  "Email already registered (TENANT_3005)"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /public/signup [post]
func (h *SubscriptionHandler) SignUp(c *gin.Context) {
	var req dto.SignUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error":      "Invalid request data",
			"isp_name":   "ISP name is required (min 3 characters)",
			"email":      "Valid email is required (must be unique)",
			"password":   "Password is required (min 6 characters)",
			"phone":      "Phone number is required (Indonesian format)",
			"plan_id":    "Plan ID is required",
			"owner_name": "Owner name is required",
		})
		return
	}

	signUpReq := &usecase.SignUpRequest{
		ISPName:   req.ISPName,
		Email:     req.Email,
		Password:  req.Password,
		Phone:     req.Phone,
		PlanID:    req.PlanID,
		OwnerName: req.OwnerName,
		UseTrial:  req.UseTrial,
	}

	signUpResponse, err := h.subscriptionService.SignUp(c.Request.Context(), signUpReq)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	responseData := dto.SignUpResponse{
		TenantID:   signUpResponse.TenantID,
		UserID:     signUpResponse.UserID,
		OrderID:    signUpResponse.OrderID,
		Amount:     signUpResponse.Amount,
		PaymentURL: signUpResponse.PaymentURL,
		SnapToken:  signUpResponse.SnapToken,
		IsTrial:    signUpResponse.IsTrial,
		TrialEnds:  signUpResponse.TrialEnds,
		Message:    signUpResponse.Message,
	}

	response.Created(c, "Sign up successful", responseData)
}

// PaymentWebhook godoc
// @Summary      Payment gateway webhook
// @Description  Handle payment gateway callbacks for subscription payments. Processes payment status updates and activates subscriptions.
// @Tags         Public
// @Accept       json
// @Produce      json
// @Param        request  body      dto.PaymentWebhookRequest  true  "Payment webhook data from gateway"
// @Success      200      {object}  response.SuccessResponse  "Payment processed successfully"
// @Failure      400      {object}  response.ErrorResponse  "Invalid webhook data"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /webhooks/payment [post]
func (h *SubscriptionHandler) PaymentWebhook(c *gin.Context) {
	var req dto.PaymentWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "Invalid webhook request data",
		})
		return
	}

	// TODO: Verify webhook signature from payment gateway

	err := h.subscriptionService.ProcessPayment(
		c.Request.Context(),
		req.OrderID,
		req.Status,
		req.PaymentMethod,
		req.GatewayTransactionID,
	)

	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Payment processed successfully", map[string]interface{}{
		"status": "ok",
	})
}

// MidtransWebhook godoc
// @Summary      Midtrans payment notification webhook
// @Description  Handle Midtrans payment notification callbacks
// @Tags         Public
// @Accept       json
// @Produce      json
// @Success      200      {object}  response.SuccessResponse  "Notification processed"
// @Failure      400      {object}  response.ErrorResponse  "Invalid notification data"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /webhooks/midtrans [post]
func (h *SubscriptionHandler) MidtransWebhook(c *gin.Context) {
	var notification map[string]interface{}
	if err := c.ShouldBindJSON(&notification); err != nil {
		response.BadRequest(c, "VAL_2001", "Invalid notification data", nil)
		return
	}

	orderID, _ := notification["order_id"].(string)
	transactionStatus, _ := notification["transaction_status"].(string)
	fraudStatus, _ := notification["fraud_status"].(string)
	paymentType, _ := notification["payment_type"].(string)
	transactionID, _ := notification["transaction_id"].(string)

	// Determine payment status
	var status string
	switch transactionStatus {
	case "capture":
		if fraudStatus == "accept" {
			status = "paid"
		} else {
			status = "pending"
		}
	case "settlement":
		status = "paid"
	case "pending":
		status = "pending"
	case "deny", "cancel", "expire":
		status = "failed"
	case "refund":
		status = "refunded"
	default:
		status = transactionStatus
	}

	err := h.subscriptionService.ProcessPayment(
		c.Request.Context(),
		orderID,
		status,
		paymentType,
		transactionID,
	)

	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Notification processed", map[string]interface{}{
		"status": "ok",
	})
}

// GetPaymentMethods godoc
// @Summary      Get available payment methods
// @Description  Retrieve all available payment methods for custom payment
// @Tags         Public
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.SuccessResponse  "Payment methods retrieved"
// @Router       /public/payment-methods [get]
func (h *SubscriptionHandler) GetPaymentMethods(c *gin.Context) {
	methods := h.subscriptionService.GetPaymentMethods(c.Request.Context())
	response.OK(c, "Payment methods retrieved", map[string]interface{}{
		"payment_methods": methods,
	})
}

// CreatePayment godoc
// @Summary      Create payment with selected method
// @Description  Create a payment transaction with the selected payment method (VA, e-wallet, QRIS)
// @Tags         Public
// @Accept       json
// @Produce      json
// @Param        request  body      dto.CreatePaymentRequest  true  "Payment request"
// @Success      200      {object}  response.SuccessResponse  "Payment created"
// @Failure      400      {object}  response.ErrorResponse  "Invalid request"
// @Failure      404      {object}  response.ErrorResponse  "Order not found"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /public/payments [post]
func (h *SubscriptionHandler) CreatePayment(c *gin.Context) {
	var req dto.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"order_id":       "Order ID is required",
			"payment_method": "Payment method is required (bca_va, bni_va, bri_va, mandiri_bill, gopay, shopeepay, qris)",
		})
		return
	}

	paymentReq := &usecase.CreatePaymentRequest{
		OrderID:       req.OrderID,
		PaymentMethod: req.PaymentMethod,
	}

	paymentResp, err := h.subscriptionService.CreatePayment(c.Request.Context(), paymentReq)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Payment created", paymentResp)
}

// GetPaymentStatus godoc
// @Summary      Get payment status
// @Description  Get the current status of a payment transaction
// @Tags         Public
// @Accept       json
// @Produce      json
// @Param        order_id  path      string  true  "Order ID"
// @Success      200       {object}  response.SuccessResponse  "Payment status retrieved"
// @Failure      404       {object}  response.ErrorResponse  "Order not found"
// @Router       /public/payments/{order_id}/status [get]
func (h *SubscriptionHandler) GetPaymentStatus(c *gin.Context) {
	orderID := c.Param("order_id")
	if orderID == "" {
		response.BadRequest(c, "VAL_2001", "Order ID is required", nil)
		return
	}

	statusResp, err := h.subscriptionService.GetPaymentStatus(c.Request.Context(), orderID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Payment status retrieved", statusResp)
}
