package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/middleware"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type BillingHandler struct {
	billingService usecase.BillingService
}

func NewBillingHandler(billingService usecase.BillingService) *BillingHandler {
	return &BillingHandler{
		billingService: billingService,
	}
}

// GetBillingDashboard godoc
// @Summary      Get billing dashboard
// @Description  Retrieve complete billing information including tenant details, current subscription, usage statistics, available plans, and recent invoices. Requires authentication and tenant ID.
// @Tags         Billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Success      200  {object}  response.SuccessResponse{data=dto.BillingDashboardResponse}  "Billing dashboard retrieved successfully"
// @Failure      401  {object}  response.ErrorResponse  "Unauthorized - invalid or missing token"
// @Failure      404  {object}  response.ErrorResponse  "No subscription found for tenant"
// @Failure      500  {object}  response.ErrorResponse  "Internal server error"
// @Router       /billing [get]
func (h *BillingHandler) GetBillingDashboard(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	dashboard, err := h.billingService.GetBillingDashboard(c.Request.Context(), tenantID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Billing dashboard retrieved successfully", dashboard)
}

// UpdateSubscription godoc
// @Summary      Update subscription plan
// @Description  Change subscription plan, payment method, or auto-renewal settings. If upgrading, creates an order for payment. If downgrading, applies immediately.
// @Tags         Billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Param        request  body      dto.UpdateSubscriptionRequest  true  "Subscription update data"
// @Success      200      {object}  response.SuccessResponse{data=dto.UpdateSubscriptionResponse}  "Subscription updated successfully"
// @Failure      400      {object}  response.ErrorResponse  "Invalid plan or validation error"
// @Failure      401      {object}  response.ErrorResponse  "Unauthorized"
// @Failure      404      {object}  response.ErrorResponse  "No subscription found"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /billing/subscription [put]
func (h *BillingHandler) UpdateSubscription(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	var req dto.UpdateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error":   "Invalid request data",
			"plan_id": "Plan ID is required",
		})
		return
	}

	result, err := h.billingService.UpdateSubscription(c.Request.Context(), tenantID, &req)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, result.Message, result)
}

// UpdateTenantSettings godoc
// @Summary      Update tenant settings
// @Description  Update tenant information such as name, email, or phone number.
// @Tags         Billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Param        request  body      dto.UpdateTenantSettingsRequest  true  "Tenant settings data"
// @Success      200      {object}  response.SuccessResponse  "Settings updated successfully"
// @Failure      400      {object}  response.ErrorResponse  "Validation error"
// @Failure      401      {object}  response.ErrorResponse  "Unauthorized"
// @Failure      404      {object}  response.ErrorResponse  "Tenant not found"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /billing/settings [put]
func (h *BillingHandler) UpdateTenantSettings(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	var req dto.UpdateTenantBasicInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "Invalid request data",
		})
		return
	}

	if err := h.billingService.UpdateTenantSettings(c.Request.Context(), tenantID, &req); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Settings updated successfully", nil)
}

// CancelSubscription godoc
// @Summary      Cancel subscription
// @Description  Cancel current subscription. Subscription will be marked as cancelled and auto-renewal will be disabled. Optionally provide cancellation reason.
// @Tags         Billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Param        request  body      dto.CancelSubscriptionRequest  true  "Cancellation request with optional reason"
// @Success      200      {object}  response.SuccessResponse  "Subscription cancelled successfully"
// @Failure      401      {object}  response.ErrorResponse  "Unauthorized"
// @Failure      404      {object}  response.ErrorResponse  "No subscription found"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /billing/cancel [post]
func (h *BillingHandler) CancelSubscription(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	var req dto.CancelSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "Invalid request data",
		})
		return
	}

	if err := h.billingService.CancelSubscription(c.Request.Context(), tenantID, &req); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Subscription cancelled successfully", nil)
}

// UpdatePaymentMethod godoc
// @Summary      Update payment method
// @Description  Update payment method for subscription. Can include credit card details or other payment method information.
// @Tags         Billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Param        request  body      dto.UpdatePaymentMethodRequest  true  "Payment method data"
// @Success      200      {object}  response.SuccessResponse  "Payment method updated successfully"
// @Failure      400      {object}  response.ErrorResponse  "Validation error - payment method required"
// @Failure      401      {object}  response.ErrorResponse  "Unauthorized"
// @Failure      404      {object}  response.ErrorResponse  "No subscription found"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /billing/payment-method [put]
func (h *BillingHandler) UpdatePaymentMethod(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	var req dto.UpdatePaymentMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error":          "Invalid request data",
			"payment_method": "Payment method is required",
		})
		return
	}

	if err := h.billingService.UpdatePaymentMethod(c.Request.Context(), tenantID, &req); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Payment method updated successfully", nil)
}

// CreateOrder godoc
// @Summary      Create subscription order
// @Description  Create a new order for subscription payment. Returns order_id to be used with payment API.
// @Tags         Billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Param        request  body      dto.CreateOrderRequest  true  "Order request with plan_id"
// @Success      200      {object}  response.SuccessResponse{data=dto.CreateOrderResponse}  "Order created successfully"
// @Failure      400      {object}  response.ErrorResponse  "Invalid plan"
// @Failure      401      {object}  response.ErrorResponse  "Unauthorized"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /billing/order [post]
func (h *BillingHandler) CreateOrder(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	var req dto.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error":   "Invalid request data",
			"plan_id": "Plan ID is required",
		})
		return
	}

	orderResp, err := h.billingService.CreateSubscriptionOrder(c.Request.Context(), tenantID, req.PlanID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Order created successfully", orderResp)
}

// GetPendingOrder godoc
// @Summary      Get pending order
// @Description  Get the pending payment order for the current tenant
// @Tags         Billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Success      200      {object}  response.SuccessResponse{data=dto.CreateOrderResponse}  "Pending order found"
// @Failure      401      {object}  response.ErrorResponse  "Unauthorized"
// @Failure      404      {object}  response.ErrorResponse  "No pending order"
// @Router       /billing/pending-order [get]
func (h *BillingHandler) GetPendingOrder(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	orderResp, err := h.billingService.GetPendingOrder(c.Request.Context(), tenantID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.NotFound(c, "NOT_FOUND", "No pending order found")
		}
		return
	}

	response.OK(c, "Pending order found", orderResp)
}
