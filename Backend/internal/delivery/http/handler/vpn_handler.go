package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/middleware"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type VPNHandler struct {
	vpnService usecase.VPNService
}

func NewVPNHandler(vpnService usecase.VPNService) *VPNHandler {
	return &VPNHandler{
		vpnService: vpnService,
	}
}

// GenerateMikroTikScript generates a complete MikroTik script for VPN + RADIUS setup
// @Summary Generate MikroTik setup script
// @Description Generates a complete MikroTik RouterOS script that includes OpenVPN client configuration and RADIUS setup
// @Tags VPN
// @Accept json
// @Produce json
// @Param id path string true "NAS ID"
// @Success 200 {object} response.Response{data=MikroTikScriptResponse}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tenant/vpn/mikrotik-script/{id} [get]
func (h *VPNHandler) GenerateMikroTikScript(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	nasID := c.Param("id")
	if nasID == "" {
		response.BadRequest(c, "VAL_2003", "NAS ID is required", nil)
		return
	}

	script, err := h.vpnService.GenerateMikroTikScript(c.Request.Context(), tenantID, nasID)
	if err != nil {
		if err == errors.ErrNotFound {
			response.NotFound(c, "NAS_4001", "NAS not found")
			return
		}
		response.InternalServerError(c, "SRV_9001", "Failed to generate MikroTik script")
		return
	}

	// Get client config for additional info
	clientConfig, _ := h.vpnService.GenerateClientConfig(c.Request.Context(), tenantID, nasID)

	resp := MikroTikScriptResponse{
		Script:     script,
		ServerIP:   clientConfig.ServerIP,
		ServerPort: clientConfig.ServerPort,
		ClientIP:   clientConfig.ClientIP,
		ClientName: clientConfig.ClientName,
		Instructions: []string{
			"1. Copy the entire script below",
			"2. Open MikroTik Terminal (Winbox or SSH)",
			"3. Paste the script and press Enter",
			"4. Import certificates via Winbox: System > Certificates > Import",
			"5. Verify connection: /interface ovpn-client print",
			"6. Test RADIUS: /radius print",
		},
	}

	response.OK(c, "MikroTik script generated successfully", resp)
}

// GetClientConfig gets OpenVPN client configuration
// @Summary Get OpenVPN client config
// @Description Gets OpenVPN client configuration for a NAS device
// @Tags VPN
// @Accept json
// @Produce json
// @Param id path string true "NAS ID"
// @Success 200 {object} response.Response{data=usecase.VPNClientConfig}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tenant/vpn/client-config/{id} [get]
func (h *VPNHandler) GetClientConfig(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	nasID := c.Param("id")
	if nasID == "" {
		response.BadRequest(c, "VAL_2003", "NAS ID is required", nil)
		return
	}

	config, err := h.vpnService.GenerateClientConfig(c.Request.Context(), tenantID, nasID)
	if err != nil {
		if err == errors.ErrNotFound {
			response.NotFound(c, "NAS_4001", "NAS not found")
			return
		}
		response.InternalServerError(c, "SRV_9001", "Failed to generate client config")
		return
	}

	response.OK(c, "Client config generated successfully", config)
}

// DownloadOVPNFile downloads .ovpn file for a NAS
// @Summary Download OVPN file
// @Description Downloads OpenVPN configuration file (.ovpn) for a NAS device
// @Tags VPN
// @Accept json
// @Produce application/x-openvpn-profile
// @Param id path string true "NAS ID"
// @Success 200 {file} file
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tenant/vpn/download-ovpn/{id} [get]
func (h *VPNHandler) DownloadOVPNFile(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	nasID := c.Param("id")
	if nasID == "" {
		response.BadRequest(c, "VAL_2003", "NAS ID is required", nil)
		return
	}

	config, err := h.vpnService.GenerateClientConfig(c.Request.Context(), tenantID, nasID)
	if err != nil {
		if err == errors.ErrNotFound {
			response.NotFound(c, "NAS_4001", "NAS not found")
			return
		}
		response.InternalServerError(c, "SRV_9001", "Failed to generate client config")
		return
	}

	filename := config.ClientName + ".ovpn"
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/x-openvpn-profile")
	c.String(200, config.ConfigFile)
}

// ListVPNConnections lists all VPN connections
// @Summary List VPN connections
// @Description Lists all VPN connections for the tenant
// @Tags VPN
// @Accept json
// @Produce json
// @Success 200 {object} response.Response{data=[]entity.VPNConnection}
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tenant/vpn/connections [get]
func (h *VPNHandler) ListVPNConnections(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	connections, err := h.vpnService.ListVPNConnections(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to list VPN connections")
		return
	}

	response.OK(c, "VPN connections retrieved successfully", connections)
}

// CreateVPNConnection creates a new VPN connection
// @Summary Create VPN connection
// @Description Creates a new VPN connection for a NAS device
// @Tags VPN
// @Accept json
// @Produce json
// @Param request body usecase.CreateVPNConnectionRequest true "VPN connection request"
// @Success 201 {object} response.Response{data=entity.VPNConnection}
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tenant/vpn/connections [post]
func (h *VPNHandler) CreateVPNConnection(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	var req usecase.CreateVPNConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Invalid request body", nil)
		return
	}

	connection, err := h.vpnService.CreateVPNConnection(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to create VPN connection")
		return
	}

	response.Created(c, "VPN connection created successfully", connection)
}

// DeleteVPNConnection deletes a VPN connection
// @Summary Delete VPN connection
// @Description Deletes a VPN connection
// @Tags VPN
// @Accept json
// @Produce json
// @Param id path string true "Connection ID"
// @Success 200 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tenant/vpn/connections/{id} [delete]
func (h *VPNHandler) DeleteVPNConnection(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	connectionID := c.Param("id")
	if connectionID == "" {
		response.BadRequest(c, "VAL_2003", "Connection ID is required", nil)
		return
	}

	if err := h.vpnService.DeleteVPNConnection(c.Request.Context(), tenantID, connectionID); err != nil {
		if err == errors.ErrNotFound {
			response.NotFound(c, "VPN_4001", "VPN connection not found")
			return
		}
		response.InternalServerError(c, "SRV_9001", "Failed to delete VPN connection")
		return
	}

	response.OK(c, "VPN connection deleted successfully", nil)
}

// Response types
type MikroTikScriptResponse struct {
	Script       string   `json:"script"`
	ServerIP     string   `json:"server_ip"`
	ServerPort   int      `json:"server_port"`
	ClientIP     string   `json:"client_ip"`
	ClientName   string   `json:"client_name"`
	Instructions []string `json:"instructions"`
}
