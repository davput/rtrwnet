package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/middleware"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/payment"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type PaymentHandler struct {
	paymentService usecase.PaymentService
}

func NewPaymentHandler(paymentService usecase.PaymentService) *PaymentHandler {
	return &PaymentHandler{
		paymentService: paymentService,
	}
}

// GetPaymentMethods returns available payment methods
// @Summary      Get payment methods
// @Description  Get list of available payment methods
// @Tags         Payment
// @Produce      json
// @Success      200  {object}  response.SuccessResponse{data=[]map[string]interface{}}
// @Router       /payment/methods [get]
func (h *PaymentHandler) GetPaymentMethods(c *gin.Context) {
	methods := payment.AvailablePaymentMethods()
	response.OK(c, "Payment methods retrieved successfully", methods)
}

// GetInvoiceDetails gets invoice details for payment
// @Summary      Get invoice details
// @Description  Get invoice/transaction details before payment
// @Tags         Payment
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Param        order_id  path      string  true  "Order ID / Invoice Number"
// @Success      200       {object}  response.SuccessResponse{data=map[string]interface{}}
// @Failure      404       {object}  response.ErrorResponse
// @Router       /payment/{order_id}/details [get]
func (h *PaymentHandler) GetInvoiceDetails(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	orderID := c.Param("order_id")
	if orderID == "" {
		response.BadRequest(c, "VAL_2003", "Order ID is required", nil)
		return
	}

	details, err := h.paymentService.GetInvoiceDetails(c.Request.Context(), tenantID, orderID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Invoice details retrieved successfully", details)
}

// CreatePaymentTokenRequest represents payment token creation request
type CreatePaymentTokenRequest struct {
	PaymentMethod string `json:"payment_method" binding:"required"` // bca_va, bni_va, gopay, etc
}

// CreatePaymentToken creates Midtrans payment token for an invoice
// @Summary      Create payment token
// @Description  Generate Midtrans payment token for pending invoice/transaction
// @Tags         Payment
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Param        order_id  path      string  true  "Order ID / Invoice Number"
// @Param        request   body      CreatePaymentTokenRequest  true  "Payment method selection"
// @Success      200       {object}  response.SuccessResponse{data=map[string]interface{}}
// @Failure      400       {object}  response.ErrorResponse
// @Failure      404       {object}  response.ErrorResponse
// @Router       /payment/{order_id}/token [post]
func (h *PaymentHandler) CreatePaymentToken(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	orderID := c.Param("order_id")
	if orderID == "" {
		response.BadRequest(c, "VAL_2003", "Order ID is required", nil)
		return
	}

	var req CreatePaymentTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Invalid request body", nil)
		return
	}

	paymentData, err := h.paymentService.CreatePaymentToken(c.Request.Context(), tenantID, orderID, req.PaymentMethod)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Payment token created successfully", paymentData)
}

// GetPaymentStatus gets payment status for an order
// @Summary      Get payment status
// @Description  Get current payment status and details for an order
// @Tags         Payment
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Param        order_id  path      string  true  "Order ID / Invoice Number"
// @Success      200       {object}  response.SuccessResponse{data=map[string]interface{}}
// @Failure      404       {object}  response.ErrorResponse
// @Router       /payment/{order_id}/status [get]
func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	orderID := c.Param("order_id")
	if orderID == "" {
		response.BadRequest(c, "VAL_2003", "Order ID is required", nil)
		return
	}

	status, err := h.paymentService.GetPaymentStatus(c.Request.Context(), tenantID, orderID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Payment status retrieved successfully", status)
}
