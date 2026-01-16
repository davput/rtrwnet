package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type DeviceHandler struct {
	deviceService usecase.DeviceService
}

func NewDeviceHandler(deviceService usecase.DeviceService) *DeviceHandler {
	return &DeviceHandler{
		deviceService: deviceService,
	}
}

// CreateDevice godoc
// @Summary Create a new device
// @Description Create a new network device
// @Tags devices
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param device body usecase.CreateDeviceRequest true "Device data"
// @Success 201 {object} response.Response{data=entity.Device}
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /devices [post]
func (h *DeviceHandler) CreateDevice(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req usecase.CreateDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	device, err := h.deviceService.CreateDevice(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to create device", err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "Device created successfully", device)
}

// GetDevice godoc
// @Summary Get device by ID
// @Description Get detailed information about a device
// @Tags devices
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Device ID"
// @Success 200 {object} response.Response{data=entity.Device}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /devices/{id} [get]
func (h *DeviceHandler) GetDevice(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	deviceID := c.Param("id")

	device, err := h.deviceService.GetDeviceByID(c.Request.Context(), tenantID, deviceID)
	if err != nil {
		response.SimpleError(c, http.StatusNotFound, "Device not found", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Device retrieved successfully", device)
}

// ListDevices godoc
// @Summary List devices
// @Description Get paginated list of devices with optional filters
// @Tags devices
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param page query int false "Page number" default(1)
// @Param per_page query int false "Items per page" default(10)
// @Param device_type query string false "Filter by device type"
// @Param status query string false "Filter by status"
// @Param customer_id query string false "Filter by customer ID"
// @Param search query string false "Search in device name, serial number, MAC address"
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /devices [get]
func (h *DeviceHandler) ListDevices(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))

	filters := make(map[string]interface{})
	if deviceType := c.Query("device_type"); deviceType != "" {
		filters["device_type"] = deviceType
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if customerID := c.Query("customer_id"); customerID != "" {
		filters["customer_id"] = customerID
	}
	if search := c.Query("search"); search != "" {
		filters["search"] = search
	}

	devices, total, err := h.deviceService.ListDevices(c.Request.Context(), tenantID, page, perPage, filters)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to list devices", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Devices retrieved successfully", map[string]interface{}{
		"devices": devices,
		"pagination": map[string]interface{}{
			"page":     page,
			"per_page": perPage,
			"total":    total,
		},
	})
}

// UpdateDevice godoc
// @Summary Update device
// @Description Update device information
// @Tags devices
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Device ID"
// @Param device body usecase.UpdateDeviceRequest true "Device update data"
// @Success 200 {object} response.Response{data=entity.Device}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /devices/{id} [put]
func (h *DeviceHandler) UpdateDevice(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	deviceID := c.Param("id")

	var req usecase.UpdateDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	device, err := h.deviceService.UpdateDevice(c.Request.Context(), tenantID, deviceID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update device", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Device updated successfully", device)
}

// DeleteDevice godoc
// @Summary Delete device
// @Description Delete a device
// @Tags devices
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Device ID"
// @Success 200 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /devices/{id} [delete]
func (h *DeviceHandler) DeleteDevice(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	deviceID := c.Param("id")

	err := h.deviceService.DeleteDevice(c.Request.Context(), tenantID, deviceID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to delete device", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Device deleted successfully", nil)
}

// TestMikrotikConnection godoc
// @Summary Test Mikrotik connection
// @Description Test connection to a Mikrotik device
// @Tags devices
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Device ID"
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /devices/{id}/test-connection [post]
func (h *DeviceHandler) TestMikrotikConnection(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	deviceID := c.Param("id")

	success, err := h.deviceService.TestMikrotikConnection(c.Request.Context(), tenantID, deviceID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Connection test failed", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Connection test completed", map[string]interface{}{
		"success": success,
	})
}

// SyncMikrotikQueues godoc
// @Summary Sync Mikrotik queues
// @Description Synchronize queues with Mikrotik device
// @Tags devices
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Device ID"
// @Success 200 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /devices/{id}/sync-queues [post]
func (h *DeviceHandler) SyncMikrotikQueues(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	deviceID := c.Param("id")

	err := h.deviceService.SyncMikrotikQueues(c.Request.Context(), tenantID, deviceID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to sync queues", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Queues synchronized successfully", nil)
}

