package handler

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type RadiusHandler struct {
	radiusService usecase.RadiusService
}

func NewRadiusHandler(radiusService usecase.RadiusService) *RadiusHandler {
	return &RadiusHandler{
		radiusService: radiusService,
	}
}

// ==================== NAS Management ====================

// CreateNAS godoc
// @Summary Create NAS
// @Description Register a new MikroTik router as RADIUS NAS
// @Tags radius
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param nas body dto.CreateNASRequest true "NAS data"
// @Success 201 {object} response.Response{data=dto.NASResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Security BearerAuth
// @Router /radius/nas [post]
func (h *RadiusHandler) CreateNAS(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.CreateNASRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	serviceReq := &usecase.CreateNASRequest{
		NASName:     req.NASName,
		ShortName:   req.ShortName,
		Type:        req.Type,
		Ports:       req.Ports,
		Secret:      req.Secret,
		Server:      req.Server,
		Community:   req.Community,
		Description: req.Description,
	}

	nas, err := h.radiusService.CreateNAS(c.Request.Context(), tenantID, serviceReq)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to create NAS", err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "NAS created successfully", nas)
}

// ListNAS godoc
// @Summary List NAS
// @Description Get all registered NAS devices
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {object} response.Response{data=[]dto.NASResponse}
// @Failure 401 {object} response.Response
// @Security BearerAuth
// @Router /radius/nas [get]
func (h *RadiusHandler) ListNAS(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	nasList, err := h.radiusService.ListNAS(c.Request.Context(), tenantID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to list NAS", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "NAS list retrieved", nasList)
}


// GetNAS godoc
// @Summary Get NAS
// @Description Get NAS by ID
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "NAS ID"
// @Success 200 {object} response.Response{data=dto.NASResponse}
// @Failure 404 {object} response.Response
// @Security BearerAuth
// @Router /radius/nas/{id} [get]
func (h *RadiusHandler) GetNAS(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	nasID := c.Param("id")

	nas, err := h.radiusService.GetNAS(c.Request.Context(), tenantID, nasID)
	if err != nil {
		response.SimpleError(c, http.StatusNotFound, "NAS not found", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "NAS retrieved", nas)
}

// UpdateNAS godoc
// @Summary Update NAS
// @Description Update NAS configuration
// @Tags radius
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "NAS ID"
// @Param nas body dto.UpdateNASRequest true "NAS data"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Security BearerAuth
// @Router /radius/nas/{id} [put]
func (h *RadiusHandler) UpdateNAS(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	nasID := c.Param("id")

	var req dto.UpdateNASRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	serviceReq := &usecase.UpdateNASRequest{
		NASName:     req.NASName,
		ShortName:   req.ShortName,
		Type:        req.Type,
		Ports:       req.Ports,
		Secret:      req.Secret,
		Server:      req.Server,
		Community:   req.Community,
		Description: req.Description,
		IsActive:    req.IsActive,
	}

	if err := h.radiusService.UpdateNAS(c.Request.Context(), tenantID, nasID, serviceReq); err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update NAS", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "NAS updated successfully", nil)
}

// DeleteNAS godoc
// @Summary Delete NAS
// @Description Remove NAS from system
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "NAS ID"
// @Success 200 {object} response.Response
// @Failure 404 {object} response.Response
// @Security BearerAuth
// @Router /radius/nas/{id} [delete]
func (h *RadiusHandler) DeleteNAS(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	nasID := c.Param("id")

	if err := h.radiusService.DeleteNAS(c.Request.Context(), tenantID, nasID); err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to delete NAS", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "NAS deleted successfully", nil)
}

// ==================== User Management ====================

// CreateUser godoc
// @Summary Create RADIUS User
// @Description Create a new PPPoE/Hotspot user
// @Tags radius
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param user body dto.CreateRadiusUserRequest true "User data"
// @Success 201 {object} response.Response{data=dto.RadiusUserResponse}
// @Failure 400 {object} response.Response
// @Security BearerAuth
// @Router /radius/users [post]
func (h *RadiusHandler) CreateUser(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.CreateRadiusUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	serviceReq := &usecase.CreateRadiusUserRequest{
		CustomerID:      req.CustomerID,
		Username:        req.Username,
		Password:        req.Password,
		AuthType:        req.AuthType,
		ProfileName:     req.ProfileName,
		IPAddress:       req.IPAddress,
		MACAddress:      req.MACAddress,
		SimultaneousUse: req.SimultaneousUse,
		ExpireDays:      req.ExpireDays,
	}

	user, err := h.radiusService.CreateUser(c.Request.Context(), tenantID, serviceReq)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to create user", err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "User created successfully", user)
}

// ListUsers godoc
// @Summary List RADIUS Users
// @Description Get all RADIUS users
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param customer_id query string false "Filter by customer ID"
// @Param is_active query bool false "Filter by active status"
// @Success 200 {object} response.Response{data=[]dto.RadiusUserResponse}
// @Security BearerAuth
// @Router /radius/users [get]
func (h *RadiusHandler) ListUsers(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	filters := make(map[string]interface{})
	if customerID := c.Query("customer_id"); customerID != "" {
		filters["customer_id"] = customerID
	}
	if isActive := c.Query("is_active"); isActive != "" {
		filters["is_active"] = isActive == "true"
	}

	users, err := h.radiusService.ListUsers(c.Request.Context(), tenantID, filters)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to list users", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Users retrieved", users)
}


// GetUser godoc
// @Summary Get RADIUS User
// @Description Get user by ID
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "User ID"
// @Success 200 {object} response.Response{data=dto.RadiusUserResponse}
// @Failure 404 {object} response.Response
// @Security BearerAuth
// @Router /radius/users/{id} [get]
func (h *RadiusHandler) GetUser(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.Param("id")

	user, err := h.radiusService.GetUser(c.Request.Context(), tenantID, userID)
	if err != nil {
		response.SimpleError(c, http.StatusNotFound, "User not found", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "User retrieved", user)
}

// UpdateUser godoc
// @Summary Update RADIUS User
// @Description Update user configuration
// @Tags radius
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "User ID"
// @Param user body dto.UpdateRadiusUserRequest true "User data"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Security BearerAuth
// @Router /radius/users/{id} [put]
func (h *RadiusHandler) UpdateUser(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.Param("id")

	var req dto.UpdateRadiusUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	serviceReq := &usecase.UpdateRadiusUserRequest{
		Password:        req.Password,
		AuthType:        req.AuthType,
		ProfileName:     req.ProfileName,
		IPAddress:       req.IPAddress,
		MACAddress:      req.MACAddress,
		SimultaneousUse: req.SimultaneousUse,
		ExpireDays:      req.ExpireDays,
		IsActive:        req.IsActive,
	}

	if err := h.radiusService.UpdateUser(c.Request.Context(), tenantID, userID, serviceReq); err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update user", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "User updated successfully", nil)
}

// DeleteUser godoc
// @Summary Delete RADIUS User
// @Description Remove user from system
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "User ID"
// @Success 200 {object} response.Response
// @Failure 404 {object} response.Response
// @Security BearerAuth
// @Router /radius/users/{id} [delete]
func (h *RadiusHandler) DeleteUser(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.Param("id")

	if err := h.radiusService.DeleteUser(c.Request.Context(), tenantID, userID); err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to delete user", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "User deleted successfully", nil)
}

// SuspendUser godoc
// @Summary Suspend RADIUS User
// @Description Suspend user (disable authentication)
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "User ID"
// @Success 200 {object} response.Response
// @Security BearerAuth
// @Router /radius/users/{id}/suspend [post]
func (h *RadiusHandler) SuspendUser(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.Param("id")

	if err := h.radiusService.SuspendUser(c.Request.Context(), tenantID, userID); err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to suspend user", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "User suspended successfully", nil)
}

// ActivateUser godoc
// @Summary Activate RADIUS User
// @Description Activate suspended user
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "User ID"
// @Success 200 {object} response.Response
// @Security BearerAuth
// @Router /radius/users/{id}/activate [post]
func (h *RadiusHandler) ActivateUser(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.Param("id")

	if err := h.radiusService.ActivateUser(c.Request.Context(), tenantID, userID); err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to activate user", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "User activated successfully", nil)
}

// ==================== Profile Management ====================

// CreateProfile godoc
// @Summary Create RADIUS Profile
// @Description Create a new bandwidth profile
// @Tags radius
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param profile body dto.CreateRadiusProfileRequest true "Profile data"
// @Success 201 {object} response.Response{data=dto.ProfileResponse}
// @Failure 400 {object} response.Response
// @Security BearerAuth
// @Router /radius/profiles [post]
func (h *RadiusHandler) CreateProfile(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.CreateRadiusProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	serviceReq := &usecase.CreateProfileRequest{
		ServicePlanID:    req.ServicePlanID,
		Name:             req.Name,
		Description:      req.Description,
		RateLimitRx:      req.RateLimitRx,
		RateLimitTx:      req.RateLimitTx,
		BurstLimitRx:     req.BurstLimitRx,
		BurstLimitTx:     req.BurstLimitTx,
		BurstThresholdRx: req.BurstThresholdRx,
		BurstThresholdTx: req.BurstThresholdTx,
		BurstTime:        req.BurstTime,
		SessionTimeout:   req.SessionTimeout,
		IdleTimeout:      req.IdleTimeout,
		IPPool:           req.IPPool,
	}

	profile, err := h.radiusService.CreateProfile(c.Request.Context(), tenantID, serviceReq)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to create profile", err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "Profile created successfully", profile)
}

// ListProfiles godoc
// @Summary List RADIUS Profiles
// @Description Get all bandwidth profiles
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {object} response.Response{data=[]dto.ProfileResponse}
// @Security BearerAuth
// @Router /radius/profiles [get]
func (h *RadiusHandler) ListProfiles(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	profiles, err := h.radiusService.ListProfiles(c.Request.Context(), tenantID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to list profiles", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Profiles retrieved", profiles)
}


// GetProfile godoc
// @Summary Get RADIUS Profile
// @Description Get profile by ID
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Profile ID"
// @Success 200 {object} response.Response{data=dto.ProfileResponse}
// @Failure 404 {object} response.Response
// @Security BearerAuth
// @Router /radius/profiles/{id} [get]
func (h *RadiusHandler) GetProfile(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	profileID := c.Param("id")

	profile, err := h.radiusService.GetProfile(c.Request.Context(), tenantID, profileID)
	if err != nil {
		response.SimpleError(c, http.StatusNotFound, "Profile not found", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Profile retrieved", profile)
}

// UpdateProfile godoc
// @Summary Update RADIUS Profile
// @Description Update profile configuration
// @Tags radius
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Profile ID"
// @Param profile body dto.UpdateRadiusProfileRequest true "Profile data"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Security BearerAuth
// @Router /radius/profiles/{id} [put]
func (h *RadiusHandler) UpdateProfile(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	profileID := c.Param("id")

	var req dto.UpdateRadiusProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	serviceReq := &usecase.UpdateProfileRequest{
		Name:             req.Name,
		Description:      req.Description,
		RateLimitRx:      req.RateLimitRx,
		RateLimitTx:      req.RateLimitTx,
		BurstLimitRx:     req.BurstLimitRx,
		BurstLimitTx:     req.BurstLimitTx,
		BurstThresholdRx: req.BurstThresholdRx,
		BurstThresholdTx: req.BurstThresholdTx,
		BurstTime:        req.BurstTime,
		SessionTimeout:   req.SessionTimeout,
		IdleTimeout:      req.IdleTimeout,
		IPPool:           req.IPPool,
		IsActive:         req.IsActive,
	}

	if err := h.radiusService.UpdateProfile(c.Request.Context(), tenantID, profileID, serviceReq); err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update profile", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Profile updated successfully", nil)
}

// DeleteProfile godoc
// @Summary Delete RADIUS Profile
// @Description Remove profile from system
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Profile ID"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Security BearerAuth
// @Router /radius/profiles/{id} [delete]
func (h *RadiusHandler) DeleteProfile(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	profileID := c.Param("id")

	if err := h.radiusService.DeleteProfile(c.Request.Context(), tenantID, profileID); err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to delete profile", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Profile deleted successfully", nil)
}

// SyncProfileFromServicePlan godoc
// @Summary Sync Profile from Service Plan
// @Description Create/update RADIUS profile from service plan
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param service_plan_id path string true "Service Plan ID"
// @Success 200 {object} response.Response{data=dto.ProfileResponse}
// @Security BearerAuth
// @Router /radius/profiles/sync/{service_plan_id} [post]
func (h *RadiusHandler) SyncProfileFromServicePlan(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	servicePlanID := c.Param("service_plan_id")

	profile, err := h.radiusService.SyncProfileFromServicePlan(c.Request.Context(), tenantID, servicePlanID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to sync profile", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Profile synced successfully", profile)
}

// ==================== Accounting ====================

// GetUserSessions godoc
// @Summary Get User Sessions
// @Description Get session history for a user
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "User ID"
// @Param limit query int false "Limit results"
// @Success 200 {object} response.Response{data=[]dto.AccountingResponse}
// @Security BearerAuth
// @Router /radius/users/{id}/sessions [get]
func (h *RadiusHandler) GetUserSessions(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.Param("id")
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	sessions, err := h.radiusService.GetUserSessions(c.Request.Context(), tenantID, userID, limit)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to get sessions", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Sessions retrieved", sessions)
}

// GetActiveSessions godoc
// @Summary Get Active Sessions
// @Description Get all currently active sessions
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {object} response.Response{data=[]dto.AccountingResponse}
// @Security BearerAuth
// @Router /radius/sessions/active [get]
func (h *RadiusHandler) GetActiveSessions(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	sessions, err := h.radiusService.GetActiveSessions(c.Request.Context(), tenantID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to get active sessions", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Active sessions retrieved", sessions)
}

// GetUsageStats godoc
// @Summary Get Usage Stats
// @Description Get usage statistics for a user
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "User ID"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} response.Response{data=dto.UsageStatsResponse}
// @Security BearerAuth
// @Router /radius/users/{id}/usage [get]
func (h *RadiusHandler) GetUsageStats(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.Param("id")

	var startDate, endDate time.Time
	if sd := c.Query("start_date"); sd != "" {
		if parsed, err := time.Parse("2006-01-02", sd); err == nil {
			startDate = parsed
		}
	}
	if ed := c.Query("end_date"); ed != "" {
		if parsed, err := time.Parse("2006-01-02", ed); err == nil {
			endDate = parsed
		}
	}

	stats, err := h.radiusService.GetUsageStats(c.Request.Context(), tenantID, userID, startDate, endDate)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to get usage stats", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Usage stats retrieved", stats)
}

// ==================== MikroTik Script Generator ====================

// GenerateMikroTikScript godoc
// @Summary Generate MikroTik Script
// @Description Generate complete MikroTik script for VPN + RADIUS setup
// @Tags radius
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param request body dto.GenerateScriptRequest true "Script generation request"
// @Success 200 {object} response.Response
// @Security BearerAuth
// @Router /radius/generate-script [post]
func (h *RadiusHandler) GenerateMikroTikScript(c *gin.Context) {
	var req struct {
		NASName string `json:"nas_name" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", "nas_name is required")
		return
	}

	// Get VPN config from environment
	vpnServerIP := os.Getenv("VPN_SERVER_IP")
	if vpnServerIP == "" {
		response.SimpleError(c, http.StatusInternalServerError, "Server not configured", "VPN_SERVER_IP not set")
		return
	}
	
	radiusInternalIP := os.Getenv("RADIUS_INTERNAL_IP")
	if radiusInternalIP == "" {
		radiusInternalIP = "10.8.0.1"
	}

	// Generate random secret
	secretBytes := make([]byte, 16)
	rand.Read(secretBytes)
	secret := hex.EncodeToString(secretBytes)[:16]

	// Generate script
	script := generateMikroTikSetupScript(req.NASName, secret, vpnServerIP, radiusInternalIP)

	response.Success(c, http.StatusOK, "Script generated", map[string]interface{}{
		"script":     script,
		"nas_name":   req.NASName,
		"secret":     secret,
		"server_ip":  vpnServerIP,
		"radius_ip":  radiusInternalIP,
	})
}

// GetServerConfig returns VPN server configuration
// @Summary Get Server Config
// @Description Get VPN/RADIUS server configuration
// @Tags radius
// @Produce json
// @Success 200 {object} response.Response
// @Security BearerAuth
// @Router /radius/server-config [get]
func (h *RadiusHandler) GetServerConfig(c *gin.Context) {
	vpnServerIP := os.Getenv("VPN_SERVER_IP")
	vpnServerPort := os.Getenv("VPN_SERVER_PORT")
	if vpnServerPort == "" {
		vpnServerPort = "1194"
	}
	radiusInternalIP := os.Getenv("RADIUS_INTERNAL_IP")
	if radiusInternalIP == "" {
		radiusInternalIP = "10.8.0.1"
	}

	response.Success(c, http.StatusOK, "Server config", map[string]interface{}{
		"vpn_server_ip":     vpnServerIP,
		"vpn_server_port":   vpnServerPort,
		"radius_internal_ip": radiusInternalIP,
	})
}

func generateMikroTikSetupScript(nasName, secret, vpnServerIP, radiusInternalIP string) string {
	return fmt.Sprintf(`# ============================================
# MikroTik VPN + RADIUS Configuration
# Router: %s
# Generated by RT/RW Net SaaS
# ============================================
# Copy SEMUA script ini dan paste ke Terminal MikroTik
# ============================================

# ============================================
# STEP 1: Setup OpenVPN Client
# ============================================

# Hapus koneksi VPN lama jika ada
/interface ovpn-client remove [find name=ovpn-rtrwnet]

# Buat OpenVPN Client interface
/interface ovpn-client add \
    name=ovpn-rtrwnet \
    connect-to=%s \
    port=1194 \
    mode=ip \
    protocol=udp \
    user=%s \
    password="" \
    cipher=aes256-cbc \
    auth=sha256 \
    add-default-route=no \
    disabled=no \
    comment="VPN to RT/RW Net SaaS"

# Tunggu VPN connect
:delay 5s

# ============================================
# STEP 2: Setup RADIUS (via VPN)
# ============================================

# Hapus RADIUS lama jika ada
/radius remove [find comment~"RADIUS-%s"]

# Tambah RADIUS Server (via VPN tunnel)
/radius add \
    address=%s \
    secret="%s" \
    service=ppp,hotspot,login \
    authentication-port=1812 \
    accounting-port=1813 \
    timeout=3s \
    comment="RADIUS-%s"

# Enable RADIUS untuk PPPoE
/ppp aaa set use-radius=yes accounting=yes interim-update=1m

# ============================================
# STEP 3: Setup PPP Profile
# ============================================

# Buat IP Pool untuk pelanggan (jika belum ada)
:if ([:len [/ip pool find name=pool-pelanggan]] = 0) do={
    /ip pool add name=pool-pelanggan ranges=10.50.50.2-10.50.50.254
}

# Buat PPP Profile untuk RADIUS
:if ([:len [/ppp profile find name=profile-radius]] = 0) do={
    /ppp profile add \
        name=profile-radius \
        local-address=10.50.50.1 \
        remote-address=pool-pelanggan \
        dns-server=8.8.8.8,8.8.4.4 \
        change-tcp-mss=yes \
        comment="Profile for RADIUS users"
}

# ============================================
# STEP 4: Firewall Rules
# ============================================

/ip firewall filter
# Allow VPN traffic
:if ([:len [find comment="Allow OpenVPN"]] = 0) do={
    add chain=input action=accept protocol=udp dst-port=1194 comment="Allow OpenVPN"
}

# Allow RADIUS from VPN
:if ([:len [find comment="Allow RADIUS VPN"]] = 0) do={
    add chain=input action=accept src-address=%s comment="Allow RADIUS VPN"
}

# NAT for VPN
/ip firewall nat
:if ([:len [find comment="NAT VPN"]] = 0) do={
    add chain=srcnat out-interface=ovpn-rtrwnet action=masquerade comment="NAT VPN"
}

# ============================================
# STEP 5: Routes
# ============================================

/ip route
:if ([:len [find comment="Route VPN"]] = 0) do={
    add dst-address=10.8.0.0/24 gateway=ovpn-rtrwnet comment="Route VPN"
}

# ============================================
# VERIFIKASI
# ============================================

:put "============================================"
:put "Setup selesai! Verifikasi:"
:put "============================================"
:put ""
:put "1. Cek VPN status:"
:put "   /interface ovpn-client print"
:put ""
:put "2. Cek RADIUS:"
:put "   /radius print"
:put ""
:put "3. Test ping ke RADIUS:"
:put "   /ping %s count=3"
:put ""
:put "============================================"
:put "Router %s siap digunakan!"
:put "============================================"
`, nasName, vpnServerIP, nasName, nasName, radiusInternalIP, secret, nasName, radiusInternalIP, radiusInternalIP, nasName)
}


// ==================== Online Status ====================

// SyncOnlineStatus godoc
// @Summary Sync Customer Online Status
// @Description Sync online status from radacct to customers table
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {object} response.Response
// @Security BearerAuth
// @Router /radius/sync-online-status [post]
func (h *RadiusHandler) SyncOnlineStatus(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	if err := h.radiusService.SyncCustomerOnlineStatus(c.Request.Context(), tenantID); err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to sync online status", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Online status synced successfully", nil)
}

// GetCustomerOnlineStatus godoc
// @Summary Get Customer Online Status
// @Description Get real-time online status for a customer from radacct
// @Tags radius
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param customer_id path string true "Customer ID"
// @Success 200 {object} response.Response{data=usecase.CustomerOnlineStatus}
// @Failure 404 {object} response.Response
// @Security BearerAuth
// @Router /radius/customers/{customer_id}/online-status [get]
func (h *RadiusHandler) GetCustomerOnlineStatus(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	customerID := c.Param("customer_id")

	status, err := h.radiusService.GetCustomerOnlineStatus(c.Request.Context(), tenantID, customerID)
	if err != nil {
		response.SimpleError(c, http.StatusNotFound, "Customer not found", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Online status retrieved", status)
}
