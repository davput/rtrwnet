package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type TenantHandler struct {
	tenantService usecase.TenantService
}

func NewTenantHandler(tenantService usecase.TenantService) *TenantHandler {
	return &TenantHandler{
		tenantService: tenantService,
	}
}

// Create godoc
// @Summary      Create new tenant
// @Description  Create a new tenant with name and email. Email must be unique. This is an admin operation.
// @Tags         Tenants
// @Accept       json
// @Produce      json
// @Param        request  body      dto.CreateTenantRequest  true  "Tenant creation data"
// @Success      201      {object}  response.SuccessResponse{data=dto.TenantResponse}  "Tenant created successfully"
// @Failure      400      {object}  response.ErrorResponse  "Validation error"
// @Failure      409      {object}  response.ErrorResponse  "Email already exists"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /tenants [post]
func (h *TenantHandler) Create(c *gin.Context) {
	var req dto.CreateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "Invalid request data",
			"name":  "Tenant name is required",
			"email": "Email is required",
		})
		return
	}

	tenant, err := h.tenantService.Create(c.Request.Context(), req.Name, req.Email)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	resp := dto.TenantResponse{
		ID:       tenant.ID,
		Name:     tenant.Name,
		Email:    tenant.Email,
		IsActive: tenant.IsActive,
		Message:  "Tenant created successfully",
	}

	response.Created(c, "Tenant created successfully", resp)
}

// GetByID godoc
// @Summary      Get tenant by ID
// @Description  Retrieve tenant information by tenant ID
// @Tags         Tenants
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Tenant ID (UUID)"
// @Success      200  {object}  response.SuccessResponse{data=usecase.TenantProfile}  "Tenant retrieved successfully"
// @Failure      404  {object}  response.ErrorResponse  "Tenant not found"
// @Failure      500  {object}  response.ErrorResponse  "Internal server error"
// @Router       /tenants/{id} [get]
func (h *TenantHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	tenant, err := h.tenantService.GetByID(c.Request.Context(), id)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Tenant retrieved successfully", tenant)
}

// List godoc
// @Summary      List all tenants
// @Description  Retrieve list of all tenants in the system. This is an admin operation.
// @Tags         Tenants
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.SuccessResponse{data=object}  "Tenants retrieved successfully"
// @Failure      500  {object}  response.ErrorResponse  "Internal server error"
// @Router       /tenants [get]
func (h *TenantHandler) List(c *gin.Context) {
	tenants, err := h.tenantService.List(c.Request.Context())
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Tenants retrieved successfully", map[string]interface{}{
		"tenants": tenants,
		"total":   len(tenants),
	})
}

// Update godoc
// @Summary      Update tenant
// @Description  Update tenant information including name and active status. This is an admin operation.
// @Tags         Tenants
// @Accept       json
// @Produce      json
// @Param        id       path      string                   true  "Tenant ID (UUID)"
// @Param        request  body      dto.UpdateTenantRequest  true  "Tenant update data"
// @Success      200      {object}  response.SuccessResponse{data=dto.TenantResponse}  "Tenant updated successfully"
// @Failure      400      {object}  response.ErrorResponse  "Validation error"
// @Failure      404      {object}  response.ErrorResponse  "Tenant not found"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /tenants/{id} [put]
func (h *TenantHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "Invalid request data",
		})
		return
	}

	tenant, err := h.tenantService.Update(c.Request.Context(), id, req.Name, req.IsActive)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	resp := dto.TenantResponse{
		ID:       tenant.ID,
		Name:     tenant.Name,
		Email:    tenant.Email,
		IsActive: tenant.IsActive,
		Message:  "Tenant updated successfully",
	}

	response.OK(c, "Tenant updated successfully", resp)
}

// Delete godoc
// @Summary      Delete tenant
// @Description  Delete tenant from the system. This is an admin operation and should be used with caution.
// @Tags         Tenants
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Tenant ID (UUID)"
// @Success      200  {object}  response.SuccessResponse  "Tenant deleted successfully"
// @Failure      404  {object}  response.ErrorResponse  "Tenant not found"
// @Failure      500  {object}  response.ErrorResponse  "Internal server error"
// @Router       /tenants/{id} [delete]
func (h *TenantHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.tenantService.Delete(c.Request.Context(), id); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Tenant deleted successfully", nil)
}
