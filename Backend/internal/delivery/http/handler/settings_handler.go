package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type SettingsHandler struct {
	settingsService usecase.SettingsService
}

func NewSettingsHandler(settingsService usecase.SettingsService) *SettingsHandler {
	return &SettingsHandler{
		settingsService: settingsService,
	}
}

// ==================== USER SETTINGS ====================

// GetUserSettings godoc
// @Summary Get user settings
// @Description Get current user's settings
// @Tags settings
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {object} response.Response{data=dto.UserSettingsResponse}
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /settings/user [get]
func (h *SettingsHandler) GetUserSettings(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	settings, err := h.settingsService.GetUserSettings(c.Request.Context(), tenantID, userID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to get user settings", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "User settings retrieved successfully", settings)
}

// UpdateUserSettings godoc
// @Summary Update user settings
// @Description Update current user's settings
// @Tags settings
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param settings body dto.UpdateUserSettingsRequest true "User settings"
// @Success 200 {object} response.Response{data=dto.UserSettingsResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /settings/user [put]
func (h *SettingsHandler) UpdateUserSettings(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	var req dto.UpdateUserSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	settings, err := h.settingsService.UpdateUserSettings(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update user settings", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "User settings updated successfully", settings)
}

// UpdateNotificationSettings godoc
// @Summary Update notification settings
// @Description Update user's notification preferences
// @Tags settings
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param settings body dto.UpdateNotificationSettingsRequest true "Notification settings"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /settings/notifications [put]
func (h *SettingsHandler) UpdateNotificationSettings(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	var req dto.UpdateNotificationSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := h.settingsService.UpdateNotificationSettings(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update notification settings", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Notification settings updated successfully", nil)
}

// ==================== TENANT SETTINGS ====================

// GetTenantSettings godoc
// @Summary Get tenant settings
// @Description Get tenant/ISP settings (admin only)
// @Tags settings
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {object} response.Response{data=dto.TenantSettingsResponse}
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /settings/tenant [get]
func (h *SettingsHandler) GetTenantSettings(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	settings, err := h.settingsService.GetTenantSettings(c.Request.Context(), tenantID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to get tenant settings", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Tenant settings retrieved successfully", settings)
}

// UpdateTenantSettings godoc
// @Summary Update tenant settings
// @Description Update tenant/ISP settings (admin only)
// @Tags settings
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param settings body dto.UpdateTenantSettingsRequest true "Tenant settings"
// @Success 200 {object} response.Response{data=dto.TenantSettingsResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /settings/tenant [put]
func (h *SettingsHandler) UpdateTenantSettings(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.UpdateTenantSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	settings, err := h.settingsService.UpdateTenantSettings(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update tenant settings", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Tenant settings updated successfully", settings)
}

// UpdateIntegrationSettings godoc
// @Summary Update integration settings
// @Description Update WhatsApp/Telegram integration settings (admin only)
// @Tags settings
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param settings body dto.UpdateIntegrationSettingsRequest true "Integration settings"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /settings/integrations [put]
func (h *SettingsHandler) UpdateIntegrationSettings(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.UpdateIntegrationSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := h.settingsService.UpdateIntegrationSettings(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update integration settings", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Integration settings updated successfully", nil)
}

// ==================== PROFILE ====================

// UpdateProfile godoc
// @Summary Update user profile
// @Description Update current user's profile information
// @Tags settings
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param profile body dto.UpdateProfileRequest true "Profile data"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /settings/profile [put]
func (h *SettingsHandler) UpdateProfile(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := h.settingsService.UpdateProfile(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update profile", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Profile updated successfully", nil)
}

// ChangePassword godoc
// @Summary Change password
// @Description Change current user's password
// @Tags settings
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param password body dto.ChangePasswordRequest true "Password data"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /settings/password [put]
func (h *SettingsHandler) ChangePassword(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := h.settingsService.ChangePassword(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to change password", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Password changed successfully", nil)
}
