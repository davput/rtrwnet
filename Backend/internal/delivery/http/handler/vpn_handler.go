package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/usecase"
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
// @Summary Generate MikroTik Script
// @Description Generate a complete RouterOS script for OpenVPN client and RADIUS configuration
// @Tags vpn
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param nas_id path string true "NAS ID"
// @Success 200 {object} response.Response{data=object}
// @Security BearerAuth
// @Router /vpn/mikrotik-script/{nas_id} [get]
func (h *VPNHandler) GenerateMikroTikScript(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	nasID := c.Param("nas_id")

	script, err := h.vpnService.GenerateMikroTikScript(c.Request.Context(), tenantID, nasID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to generate script", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "MikroTik script generated", map[string]interface{}{
		"script": script,
		"instructions": []string{
			"1. Copy the script above",
			"2. Open MikroTik Winbox or Terminal",
			"3. Paste and execute the script",
			"4. Import certificates via System > Certificates > Import",
			"5. Verify VPN connection with /interface ovpn-client print",
			"6. Test RADIUS with /radius print and /ping to RADIUS server",
		},
	})
}

// GetClientConfig gets OpenVPN client configuration
// @Summary Get OpenVPN Client Config
// @Description Get OpenVPN client configuration for a NAS
// @Tags vpn
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param nas_id path string true "NAS ID"
// @Success 200 {object} response.Response{data=usecase.VPNClientConfig}
// @Security BearerAuth
// @Router /vpn/client-config/{nas_id} [get]
func (h *VPNHandler) GetClientConfig(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	nasID := c.Param("nas_id")

	config, err := h.vpnService.GenerateClientConfig(c.Request.Context(), tenantID, nasID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to generate client config", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Client config generated", config)
}

// DownloadClientConfig downloads OpenVPN client configuration as .ovpn file
// @Summary Download OpenVPN Config
// @Description Download OpenVPN client configuration as .ovpn file
// @Tags vpn
// @Produce text/plain
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param nas_id path string true "NAS ID"
// @Success 200 {string} string "OpenVPN config file"
// @Security BearerAuth
// @Router /vpn/download/{nas_id} [get]
func (h *VPNHandler) DownloadClientConfig(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	nasID := c.Param("nas_id")

	config, err := h.vpnService.GenerateClientConfig(c.Request.Context(), tenantID, nasID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to generate client config", err.Error())
		return
	}

	filename := config.ClientName + ".ovpn"
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/x-openvpn-profile")
	c.String(http.StatusOK, config.ConfigFile)
}

// ListVPNConnections lists all VPN connections
// @Summary List VPN Connections
// @Description Get all VPN connections for the tenant
// @Tags vpn
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {object} response.Response{data=[]entity.VPNConnection}
// @Security BearerAuth
// @Router /vpn/connections [get]
func (h *VPNHandler) ListVPNConnections(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	connections, err := h.vpnService.ListVPNConnections(c.Request.Context(), tenantID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to list connections", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "VPN connections retrieved", map[string]interface{}{
		"connections": connections,
	})
}

// CreateVPNConnection creates a new VPN connection
// @Summary Create VPN Connection
// @Description Create a new VPN connection for a NAS
// @Tags vpn
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param request body usecase.CreateVPNConnectionRequest true "VPN connection data"
// @Success 201 {object} response.Response{data=entity.VPNConnection}
// @Security BearerAuth
// @Router /vpn/connections [post]
func (h *VPNHandler) CreateVPNConnection(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req usecase.CreateVPNConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	conn, err := h.vpnService.CreateVPNConnection(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to create connection", err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "VPN connection created", conn)
}

// DeleteVPNConnection deletes a VPN connection
// @Summary Delete VPN Connection
// @Description Delete a VPN connection
// @Tags vpn
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Connection ID"
// @Success 200 {object} response.Response
// @Security BearerAuth
// @Router /vpn/connections/{id} [delete]
func (h *VPNHandler) DeleteVPNConnection(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	connectionID := c.Param("id")

	if err := h.vpnService.DeleteVPNConnection(c.Request.Context(), tenantID, connectionID); err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to delete connection", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "VPN connection deleted", nil)
}
