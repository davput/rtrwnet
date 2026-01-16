package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/middleware"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
	"github.com/rtrwnet/saas-backend/pkg/validator"
)

type DashboardHandler struct {
	dashboardService usecase.DashboardService
}

func NewDashboardHandler(dashboardService usecase.DashboardService) *DashboardHandler {
	return &DashboardHandler{
		dashboardService: dashboardService,
	}
}

// GetOverview handles dashboard overview request
func (h *DashboardHandler) GetOverview(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	overview, err := h.dashboardService.GetOverview(c.Request.Context(), tenantID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Dashboard overview retrieved successfully", overview)
}

// ListCustomers handles customer list request
func (h *DashboardHandler) ListCustomers(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	var params dto.CustomerQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		validationErrors := validator.ParseValidationErrors(err, params)
		response.BadRequest(c, "VAL_2005", "Invalid query parameters", validationErrors.ToMap())
		return
	}

	customers, err := h.dashboardService.ListCustomers(c.Request.Context(), tenantID, params)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Customers retrieved successfully", customers)
}

// GetCustomerDetail handles customer detail request
func (h *DashboardHandler) GetCustomerDetail(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	customerID := c.Param("id")
	if customerID == "" {
		response.BadRequest(c, "VAL_2003", "Customer ID is required", map[string]interface{}{
			"field": "id",
			"message": "Customer ID parameter is missing",
		})
		return
	}

	customer, err := h.dashboardService.GetCustomerDetail(c.Request.Context(), tenantID, customerID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Customer detail retrieved successfully", customer)
}

// CreateCustomer handles customer creation request
func (h *DashboardHandler) CreateCustomer(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	var req dto.CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		validationErrors := validator.ParseValidationErrors(err, req)
		response.BadRequest(c, "VAL_2001", "Validation failed", validationErrors.ToMap())
		return
	}

	customer, err := h.dashboardService.CreateCustomer(c.Request.Context(), tenantID, &req)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.Created(c, "Customer created successfully", customer)
}

// UpdateCustomer handles customer update request
func (h *DashboardHandler) UpdateCustomer(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	customerID := c.Param("id")
	if customerID == "" {
		response.BadRequest(c, "VAL_2003", "Customer ID is required", map[string]interface{}{
			"field": "id",
			"message": "Customer ID parameter is missing",
		})
		return
	}

	var req dto.UpdateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		validationErrors := validator.ParseValidationErrors(err, req)
		response.BadRequest(c, "VAL_2001", "Validation failed", validationErrors.ToMap())
		return
	}

	if err := h.dashboardService.UpdateCustomer(c.Request.Context(), tenantID, customerID, &req); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Customer updated successfully", nil)
}

// DeleteCustomer handles customer deletion request
func (h *DashboardHandler) DeleteCustomer(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	customerID := c.Param("id")
	if customerID == "" {
		response.BadRequest(c, "VAL_2003", "Customer ID is required", map[string]interface{}{
			"field": "id",
			"message": "Customer ID parameter is missing",
		})
		return
	}

	if err := h.dashboardService.DeleteCustomer(c.Request.Context(), tenantID, customerID); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Customer deleted successfully", nil)
}

// ListPayments handles payment list request
func (h *DashboardHandler) ListPayments(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	var params dto.PaymentQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		validationErrors := validator.ParseValidationErrors(err, params)
		response.BadRequest(c, "VAL_2005", "Invalid query parameters", validationErrors.ToMap())
		return
	}

	payments, err := h.dashboardService.ListPayments(c.Request.Context(), tenantID, params)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Payments retrieved successfully", payments)
}

// RecordPayment handles payment recording request
func (h *DashboardHandler) RecordPayment(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	var req dto.RecordPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		validationErrors := validator.ParseValidationErrors(err, req)
		response.BadRequest(c, "VAL_2001", "Validation failed", validationErrors.ToMap())
		return
	}

	if err := h.dashboardService.RecordPayment(c.Request.Context(), tenantID, &req); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.Created(c, "Payment recorded successfully", nil)
}

// ListServicePlans handles service plan list request
func (h *DashboardHandler) ListServicePlans(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	plans, err := h.dashboardService.ListServicePlans(c.Request.Context(), tenantID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Service plans retrieved successfully", plans)
}

// CreateServicePlan handles service plan creation request
func (h *DashboardHandler) CreateServicePlan(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	var req dto.CreateServicePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		validationErrors := validator.ParseValidationErrors(err, req)
		response.BadRequest(c, "VAL_2001", "Validation failed", validationErrors.ToMap())
		return
	}

	plan, err := h.dashboardService.CreateServicePlan(c.Request.Context(), tenantID, &req)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.Created(c, "Service plan created successfully", plan)
}

// UpdateServicePlan handles service plan update request
func (h *DashboardHandler) UpdateServicePlan(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	planID := c.Param("id")
	if planID == "" {
		response.BadRequest(c, "VAL_2003", "Service plan ID is required", map[string]interface{}{
			"field": "id",
			"message": "Service plan ID parameter is missing",
		})
		return
	}

	var req dto.UpdateServicePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		validationErrors := validator.ParseValidationErrors(err, req)
		response.BadRequest(c, "VAL_2001", "Validation failed", validationErrors.ToMap())
		return
	}

	if err := h.dashboardService.UpdateServicePlan(c.Request.Context(), tenantID, planID, &req); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Service plan updated successfully", nil)
}

// DeleteServicePlan handles service plan deletion request
func (h *DashboardHandler) DeleteServicePlan(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	planID := c.Param("id")
	if planID == "" {
		response.BadRequest(c, "VAL_2003", "Service plan ID is required", map[string]interface{}{
			"field": "id",
			"message": "Service plan ID parameter is missing",
		})
		return
	}

	if err := h.dashboardService.DeleteServicePlan(c.Request.Context(), tenantID, planID); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Service plan deleted successfully", nil)
}

// GetOnboardingStatus handles onboarding status request
func (h *DashboardHandler) GetOnboardingStatus(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	status, err := h.dashboardService.GetOnboardingStatus(c.Request.Context(), tenantID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Onboarding status retrieved successfully", status)
}

// UpdateOnboardingStep handles onboarding step update request
func (h *DashboardHandler) UpdateOnboardingStep(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	var req dto.UpdateOnboardingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", nil)
		return
	}

	if err := h.dashboardService.UpdateOnboardingStep(c.Request.Context(), tenantID, req.Step, req.Completed); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Onboarding step updated successfully", nil)
}

// CompleteOnboarding handles onboarding completion request
func (h *DashboardHandler) CompleteOnboarding(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	if err := h.dashboardService.CompleteOnboarding(c.Request.Context(), tenantID); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Onboarding completed successfully", nil)
}

// GetPlanLimits handles getting current plan limits and usage
func (h *DashboardHandler) GetPlanLimits(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	limits, err := h.dashboardService.GetPlanLimits(c.Request.Context(), tenantID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Plan limits retrieved successfully", limits)
}

// ActivateCustomer handles customer activation request
func (h *DashboardHandler) ActivateCustomer(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	customerID := c.Param("id")
	if customerID == "" {
		response.BadRequest(c, "VAL_2003", "Customer ID is required", map[string]interface{}{
			"field":   "id",
			"message": "Customer ID parameter is missing",
		})
		return
	}

	if err := h.dashboardService.ActivateCustomer(c.Request.Context(), tenantID, customerID); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Customer activated successfully", nil)
}

// SuspendCustomer handles customer suspension request
func (h *DashboardHandler) SuspendCustomer(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	customerID := c.Param("id")
	if customerID == "" {
		response.BadRequest(c, "VAL_2003", "Customer ID is required", map[string]interface{}{
			"field":   "id",
			"message": "Customer ID parameter is missing",
		})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	if err := h.dashboardService.SuspendCustomer(c.Request.Context(), tenantID, customerID, req.Reason); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Customer suspended successfully", nil)
}

// TerminateCustomer handles customer termination request
func (h *DashboardHandler) TerminateCustomer(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	customerID := c.Param("id")
	if customerID == "" {
		response.BadRequest(c, "VAL_2003", "Customer ID is required", map[string]interface{}{
			"field":   "id",
			"message": "Customer ID parameter is missing",
		})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	if err := h.dashboardService.TerminateCustomer(c.Request.Context(), tenantID, customerID, req.Reason); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Customer terminated successfully", nil)
}
