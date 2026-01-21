package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type CaptivePortalHandler struct {
	portalService usecase.CaptivePortalService
}

func NewCaptivePortalHandler(portalService usecase.CaptivePortalService) *CaptivePortalHandler {
	return &CaptivePortalHandler{
		portalService: portalService,
	}
}

// GetPortalSettings godoc
// @Summary Get captive portal settings
// @Tags Hotspot
// @Produce json
// @Success 200 {object} response.Response{data=dto.PortalSettingsResponse}
// @Router /api/v1/tenant/hotspot/portal/settings [get]
func (h *CaptivePortalHandler) GetPortalSettings(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	settings, err := h.portalService.GetPortalSettings(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to get portal settings", map[string]interface{}{"error": err.Error()})
		return
	}

	response.Success(c, http.StatusOK, "Portal settings retrieved successfully", toPortalSettingsResponse(settings))
}

// UpdatePortalSettings godoc
// @Summary Update captive portal settings
// @Tags Hotspot
// @Accept json
// @Produce json
// @Param request body dto.UpdatePortalSettingsRequest true "Portal settings"
// @Success 200 {object} response.Response
// @Router /api/v1/tenant/hotspot/portal/settings [put]
func (h *CaptivePortalHandler) UpdatePortalSettings(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	var req dto.UpdatePortalSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VAL_2001", "Invalid request", map[string]interface{}{"error": err.Error()})
		return
	}

	updateReq := &usecase.UpdatePortalSettingsRequest{
		LogoURL:         req.LogoURL,
		PromotionalText: req.PromotionalText,
		RedirectURL:     req.RedirectURL,
		PrimaryColor:    req.PrimaryColor,
		SecondaryColor:  req.SecondaryColor,
	}

	if err := h.portalService.UpdatePortalSettings(c.Request.Context(), tenantID, updateReq); err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to update portal settings", map[string]interface{}{"error": err.Error()})
		return
	}

	response.Success(c, http.StatusOK, "Portal settings updated successfully", nil)
}

// GetPortalPage godoc
// @Summary Get captive portal page (public)
// @Tags Hotspot
// @Produce json
// @Param tenant_id path string true "Tenant ID"
// @Success 200 {object} response.Response{data=dto.PortalSettingsResponse}
// @Router /api/v1/public/hotspot/portal/{tenant_id} [get]
func (h *CaptivePortalHandler) GetPortalPage(c *gin.Context) {
	tenantID := c.Param("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusBadRequest, "VAL_2001", "Tenant ID required", nil)
		return
	}

	settings, err := h.portalService.GetPortalSettings(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to get portal settings", map[string]interface{}{"error": err.Error()})
		return
	}

	response.Success(c, http.StatusOK, "Portal page retrieved successfully", toPortalSettingsResponse(settings))
}

// AuthenticateUser godoc
// @Summary Authenticate hotspot user (public)
// @Tags Hotspot
// @Accept json
// @Produce json
// @Param request body dto.AuthenticateRequest true "Authentication credentials"
// @Success 200 {object} response.Response{data=dto.AuthResponse}
// @Router /api/v1/public/hotspot/login [post]
func (h *CaptivePortalHandler) AuthenticateUser(c *gin.Context) {
	var req dto.AuthenticateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VAL_2001", "Invalid request", map[string]interface{}{"error": err.Error()})
		return
	}

	authResp, err := h.portalService.AuthenticateUser(
		c.Request.Context(),
		req.NASIP,
		req.Username,
		req.Password,
		req.MACAddress,
	)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Authentication failed", map[string]interface{}{"error": err.Error()})
		return
	}

	respDTO := dto.AuthResponse{
		Success:     authResp.Success,
		Message:     authResp.Message,
		RedirectURL: authResp.RedirectURL,
		Username:    authResp.Username,
	}

	if authResp.Success {
		response.Success(c, http.StatusOK, "Authentication successful", respDTO)
	} else {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", authResp.Message, nil)
	}
}

func toPortalSettingsResponse(s *entity.CaptivePortalSettings) dto.PortalSettingsResponse {
	return dto.PortalSettingsResponse{
		ID:              s.ID,
		TenantID:        s.TenantID,
		LogoURL:         s.LogoURL,
		PromotionalText: s.PromotionalText,
		RedirectURL:     s.RedirectURL,
		PrimaryColor:    s.PrimaryColor,
		SecondaryColor:  s.SecondaryColor,
		UpdatedAt:       s.UpdatedAt,
	}
}
