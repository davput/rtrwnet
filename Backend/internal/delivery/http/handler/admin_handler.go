package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type AdminHandler struct {
	adminService usecase.AdminService
}

func NewAdminHandler(adminService usecase.AdminService) *AdminHandler {
	return &AdminHandler{
		adminService: adminService,
	}
}

// Login handles admin login
func (h *AdminHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "Email and password are required",
		})
		return
	}

	resp, err := h.adminService.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Login successful", resp)
}

// Logout handles admin logout
func (h *AdminHandler) Logout(c *gin.Context) {
	// In production, invalidate the token
	response.OK(c, "Logged out successfully", nil)
}

// RefreshToken handles admin token refresh
func (h *AdminHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "refresh_token is required",
		})
		return
	}

	resp, err := h.adminService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.Unauthorized(c, "AUTH_1003", "Invalid or expired refresh token")
		}
		return
	}

	response.OK(c, "Token refreshed successfully", resp)
}

// GetProfile handles getting admin profile
func (h *AdminHandler) GetProfile(c *gin.Context) {
	adminID := c.GetString("admin_id")
	if adminID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	admin, err := h.adminService.GetProfile(c.Request.Context(), adminID)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get profile")
		return
	}

	response.OK(c, "Profile retrieved successfully", admin)
}

// GetDashboardStats handles getting dashboard statistics
func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.adminService.GetDashboardStats(c.Request.Context())
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get dashboard stats")
		return
	}

	response.OK(c, "Dashboard stats retrieved successfully", stats)
}

// GetRevenueData handles getting revenue data
func (h *AdminHandler) GetRevenueData(c *gin.Context) {
	months := 12
	if m := c.Query("months"); m != "" {
		if parsed, err := strconv.Atoi(m); err == nil {
			months = parsed
		}
	}

	data, err := h.adminService.GetRevenueData(c.Request.Context(), months)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get revenue data")
		return
	}

	response.OK(c, "Revenue data retrieved successfully", data)
}

// GetTenantGrowthData handles getting tenant growth data
func (h *AdminHandler) GetTenantGrowthData(c *gin.Context) {
	months := 12
	if m := c.Query("months"); m != "" {
		if parsed, err := strconv.Atoi(m); err == nil {
			months = parsed
		}
	}

	data, err := h.adminService.GetTenantGrowthData(c.Request.Context(), months)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get growth data")
		return
	}

	response.OK(c, "Tenant growth data retrieved successfully", data)
}

// ListTenants handles listing all tenants
func (h *AdminHandler) ListTenants(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	search := c.Query("search")
	status := c.Query("status")
	planID := c.Query("plan_id")

	resp, err := h.adminService.ListTenants(c.Request.Context(), page, perPage, search, status, planID)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to list tenants")
		return
	}

	response.OK(c, "Tenants retrieved successfully", resp)
}

// GetTenant handles getting a single tenant
func (h *AdminHandler) GetTenant(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Tenant ID is required", nil)
		return
	}

	tenant, err := h.adminService.GetTenant(c.Request.Context(), id)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to get tenant")
		}
		return
	}

	response.OK(c, "Tenant retrieved successfully", tenant)
}

// CreateTenant handles creating a new tenant
func (h *AdminHandler) CreateTenant(c *gin.Context) {
	var req usecase.CreateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": err.Error(),
		})
		return
	}

	tenant, err := h.adminService.CreateTenant(c.Request.Context(), &req)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to create tenant")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "CREATE", "tenant", tenant.ID, "Created tenant: "+tenant.Name, c.ClientIP())

	response.Created(c, "Tenant created successfully", tenant)
}

// UpdateTenant handles updating a tenant
func (h *AdminHandler) UpdateTenant(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Tenant ID is required", nil)
		return
	}

	var req usecase.UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": err.Error(),
		})
		return
	}

	tenant, err := h.adminService.UpdateTenant(c.Request.Context(), id, &req)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to update tenant")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "UPDATE", "tenant", id, "Updated tenant", c.ClientIP())

	response.OK(c, "Tenant updated successfully", tenant)
}

// DeleteTenant handles deleting a tenant
func (h *AdminHandler) DeleteTenant(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Tenant ID is required", nil)
		return
	}

	if err := h.adminService.DeleteTenant(c.Request.Context(), id); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to delete tenant")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "DELETE", "tenant", id, "Deleted tenant", c.ClientIP())

	response.OK(c, "Tenant deleted successfully", nil)
}

// SuspendTenant handles suspending a tenant
func (h *AdminHandler) SuspendTenant(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Tenant ID is required", nil)
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Reason is required", nil)
		return
	}

	adminID := c.GetString("admin_id")
	if err := h.adminService.SuspendTenant(c.Request.Context(), id, req.Reason, adminID); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to suspend tenant")
		}
		return
	}

	response.OK(c, "Tenant suspended successfully", nil)
}

// ActivateTenant handles activating a tenant
func (h *AdminHandler) ActivateTenant(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Tenant ID is required", nil)
		return
	}

	adminID := c.GetString("admin_id")
	if err := h.adminService.ActivateTenant(c.Request.Context(), id, adminID); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to activate tenant")
		}
		return
	}

	response.OK(c, "Tenant activated successfully", nil)
}

// ListPlans handles listing subscription plans
func (h *AdminHandler) ListPlans(c *gin.Context) {
	plans, err := h.adminService.ListPlans(c.Request.Context())
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to list plans")
		return
	}

	response.OK(c, "Plans retrieved successfully", plans)
}

// CreatePlan handles creating a subscription plan
func (h *AdminHandler) CreatePlan(c *gin.Context) {
	var req usecase.CreatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": err.Error(),
		})
		return
	}

	plan, err := h.adminService.CreatePlan(c.Request.Context(), &req)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to create plan")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "CREATE", "plan", plan.ID, "Created plan: "+plan.Name, c.ClientIP())

	response.Created(c, "Plan created successfully", plan)
}

// UpdatePlan handles updating a subscription plan
func (h *AdminHandler) UpdatePlan(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Plan ID is required", nil)
		return
	}

	var req usecase.UpdatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": err.Error(),
		})
		return
	}

	plan, err := h.adminService.UpdatePlan(c.Request.Context(), id, &req)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to update plan")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "UPDATE", "plan", id, "Updated plan", c.ClientIP())

	response.OK(c, "Plan updated successfully", plan)
}

// DeletePlan handles deleting a subscription plan
func (h *AdminHandler) DeletePlan(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Plan ID is required", nil)
		return
	}

	if err := h.adminService.DeletePlan(c.Request.Context(), id); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to delete plan")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "DELETE", "plan", id, "Deleted plan", c.ClientIP())

	response.OK(c, "Plan deleted successfully", nil)
}

// ListAdmins handles listing admin users
func (h *AdminHandler) ListAdmins(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))

	resp, err := h.adminService.ListAdmins(c.Request.Context(), page, perPage)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to list admins")
		return
	}

	response.OK(c, "Admins retrieved successfully", resp)
}

// CreateAdmin handles creating an admin user
func (h *AdminHandler) CreateAdmin(c *gin.Context) {
	var req usecase.CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": err.Error(),
		})
		return
	}

	admin, err := h.adminService.CreateAdmin(c.Request.Context(), &req)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to create admin")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "CREATE", "admin", admin.ID, "Created admin: "+admin.Name, c.ClientIP())

	response.Created(c, "Admin created successfully", admin)
}

// UpdateAdmin handles updating an admin user
func (h *AdminHandler) UpdateAdmin(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Admin ID is required", nil)
		return
	}

	var req usecase.UpdateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": err.Error(),
		})
		return
	}

	admin, err := h.adminService.UpdateAdmin(c.Request.Context(), id, &req)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to update admin")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "UPDATE", "admin", id, "Updated admin", c.ClientIP())

	response.OK(c, "Admin updated successfully", admin)
}

// DeleteAdmin handles deleting an admin user
func (h *AdminHandler) DeleteAdmin(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Admin ID is required", nil)
		return
	}

	if err := h.adminService.DeleteAdmin(c.Request.Context(), id); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to delete admin")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "DELETE", "admin", id, "Deleted admin", c.ClientIP())

	response.OK(c, "Admin deleted successfully", nil)
}

// ListAuditLogs handles listing audit logs
func (h *AdminHandler) ListAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	adminID := c.Query("admin_id")

	resp, err := h.adminService.ListAuditLogs(c.Request.Context(), page, perPage, adminID)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to list audit logs")
		return
	}

	response.OK(c, "Audit logs retrieved successfully", resp)
}

// ListSupportTickets handles listing support tickets
func (h *AdminHandler) ListSupportTickets(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	status := c.Query("status")

	resp, err := h.adminService.ListSupportTickets(c.Request.Context(), page, perPage, status)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to list support tickets")
		return
	}

	response.OK(c, "Support tickets retrieved successfully", resp)
}

// UpdateSupportTicket handles updating a support ticket
func (h *AdminHandler) UpdateSupportTicket(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Ticket ID is required", nil)
		return
	}

	var req struct {
		Status     string  `json:"status"`
		AssignedTo *string `json:"assigned_to"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", nil)
		return
	}

	ticket, err := h.adminService.UpdateTicketStatus(c.Request.Context(), id, req.Status, req.AssignedTo)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to update ticket")
		}
		return
	}

	response.OK(c, "Ticket updated successfully", ticket)
}

// GetSupportTicket handles getting a single support ticket with replies
func (h *AdminHandler) GetSupportTicket(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Ticket ID is required", nil)
		return
	}

	ticket, err := h.adminService.GetSupportTicket(c.Request.Context(), id)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to get ticket")
		}
		return
	}

	response.OK(c, "Ticket retrieved successfully", ticket)
}

// AddTicketReply handles adding a reply to a support ticket from admin
func (h *AdminHandler) AddTicketReply(c *gin.Context) {
	id := c.Param("id")
	adminID := c.GetString("admin_id")

	if id == "" {
		response.BadRequest(c, "VAL_2003", "Ticket ID is required", nil)
		return
	}

	if adminID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	var req struct {
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Message is required", nil)
		return
	}

	reply, err := h.adminService.AddTicketReply(c.Request.Context(), adminID, id, req.Message)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to add reply")
		}
		return
	}

	response.Created(c, "Reply added successfully", reply)
}

// ResolveTicket handles marking a ticket as resolved
func (h *AdminHandler) ResolveTicket(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Ticket ID is required", nil)
		return
	}

	if err := h.adminService.ResolveTicket(c.Request.Context(), id); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to resolve ticket")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "RESOLVE", "ticket", id, "Ticket resolved", c.ClientIP())

	response.OK(c, "Ticket resolved successfully", nil)
}

// CloseTicket handles marking a ticket as closed
func (h *AdminHandler) CloseTicket(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Ticket ID is required", nil)
		return
	}

	if err := h.adminService.CloseTicket(c.Request.Context(), id); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to close ticket")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "CLOSE", "ticket", id, "Ticket closed", c.ClientIP())

	response.OK(c, "Ticket closed successfully", nil)
}


// ListPaymentTransactions handles listing all payment transactions
func (h *AdminHandler) ListPaymentTransactions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	status := c.Query("status")
	tenantID := c.Query("tenant_id")
	search := c.Query("search")

	resp, err := h.adminService.ListPaymentTransactions(c.Request.Context(), page, perPage, status, tenantID, search)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to list payment transactions")
		return
	}

	response.OK(c, "Payment transactions retrieved successfully", resp)
}

// GetPaymentTransaction handles getting a single payment transaction
func (h *AdminHandler) GetPaymentTransaction(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "VAL_2003", "Transaction ID is required", nil)
		return
	}

	tx, err := h.adminService.GetPaymentTransaction(c.Request.Context(), id)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to get payment transaction")
		}
		return
	}

	response.OK(c, "Payment transaction retrieved successfully", tx)
}

// GetPaymentStats handles getting payment statistics
func (h *AdminHandler) GetPaymentStats(c *gin.Context) {
	stats, err := h.adminService.GetPaymentStats(c.Request.Context())
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get payment stats")
		return
	}

	response.OK(c, "Payment stats retrieved successfully", stats)
}

// ReconcilePayment handles reconciling a payment with the gateway
func (h *AdminHandler) ReconcilePayment(c *gin.Context) {
	orderID := c.Param("order_id")
	if orderID == "" {
		response.BadRequest(c, "VAL_2003", "Order ID is required", nil)
		return
	}

	resp, err := h.adminService.ReconcilePayment(c.Request.Context(), orderID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to reconcile payment")
		}
		return
	}

	// Create audit log
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")
	h.adminService.CreateAuditLog(c.Request.Context(), adminID, adminName, "RECONCILE", "payment", orderID, resp.Message, c.ClientIP())

	response.OK(c, "Payment reconciliation completed", resp)
}
