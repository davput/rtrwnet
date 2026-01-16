package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type InfrastructureHandler struct {
	infraService usecase.InfrastructureService
}

func NewInfrastructureHandler(infraService usecase.InfrastructureService) *InfrastructureHandler {
	return &InfrastructureHandler{
		infraService: infraService,
	}
}

// OLT Handlers

// CreateOLT godoc
// @Summary Create a new OLT
// @Description Create a new Optical Line Terminal
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param olt body usecase.CreateOLTRequest true "OLT data"
// @Success 201 {object} response.Response{data=entity.OLT}
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/olts [post]
func (h *InfrastructureHandler) CreateOLT(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req usecase.CreateOLTRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	olt, err := h.infraService.CreateOLT(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to create OLT", err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "OLT created successfully", olt)
}

// ListOLTs godoc
// @Summary List OLTs
// @Description Get list of Optical Line Terminals
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param is_active query boolean false "Filter by active status"
// @Success 200 {object} response.Response{data=[]entity.OLT}
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/olts [get]
func (h *InfrastructureHandler) ListOLTs(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var isActive *bool
	if isActiveStr := c.Query("is_active"); isActiveStr != "" {
		val, _ := strconv.ParseBool(isActiveStr)
		isActive = &val
	}

	olts, err := h.infraService.ListOLTs(c.Request.Context(), tenantID, isActive)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to list OLTs", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "OLTs retrieved successfully", olts)
}

// GetOLT godoc
// @Summary Get OLT by ID
// @Description Get detailed information about an OLT
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "OLT ID"
// @Success 200 {object} response.Response{data=entity.OLT}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/olts/{id} [get]
func (h *InfrastructureHandler) GetOLT(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	oltID := c.Param("id")

	olt, err := h.infraService.GetOLTByID(c.Request.Context(), tenantID, oltID)
	if err != nil {
		response.SimpleError(c, http.StatusNotFound, "OLT not found", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "OLT retrieved successfully", olt)
}

// UpdateOLT godoc
// @Summary Update OLT
// @Description Update OLT information
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "OLT ID"
// @Param olt body usecase.UpdateOLTRequest true "OLT update data"
// @Success 200 {object} response.Response{data=entity.OLT}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/olts/{id} [put]
func (h *InfrastructureHandler) UpdateOLT(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	oltID := c.Param("id")

	var req usecase.UpdateOLTRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	olt, err := h.infraService.UpdateOLT(c.Request.Context(), tenantID, oltID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update OLT", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "OLT updated successfully", olt)
}

// DeleteOLT godoc
// @Summary Delete OLT
// @Description Delete an OLT
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "OLT ID"
// @Success 200 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/olts/{id} [delete]
func (h *InfrastructureHandler) DeleteOLT(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	oltID := c.Param("id")

	err := h.infraService.DeleteOLT(c.Request.Context(), tenantID, oltID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to delete OLT", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "OLT deleted successfully", nil)
}

// ODC Handlers

// CreateODC godoc
// @Summary Create a new ODC
// @Description Create a new Optical Distribution Cabinet
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param odc body usecase.CreateODCRequest true "ODC data"
// @Success 201 {object} response.Response{data=entity.ODC}
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/odcs [post]
func (h *InfrastructureHandler) CreateODC(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req usecase.CreateODCRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	odc, err := h.infraService.CreateODC(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to create ODC", err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "ODC created successfully", odc)
}

// ListODCs godoc
// @Summary List ODCs
// @Description Get list of Optical Distribution Cabinets
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param olt_id query string false "Filter by OLT ID"
// @Param is_active query boolean false "Filter by active status"
// @Success 200 {object} response.Response{data=[]entity.ODC}
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/odcs [get]
func (h *InfrastructureHandler) ListODCs(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	oltID := c.Query("olt_id")

	var isActive *bool
	if isActiveStr := c.Query("is_active"); isActiveStr != "" {
		val, _ := strconv.ParseBool(isActiveStr)
		isActive = &val
	}

	odcs, err := h.infraService.ListODCs(c.Request.Context(), tenantID, oltID, isActive)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to list ODCs", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "ODCs retrieved successfully", odcs)
}

// GetODC godoc
// @Summary Get ODC by ID
// @Description Get detailed information about an ODC
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "ODC ID"
// @Success 200 {object} response.Response{data=entity.ODC}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/odcs/{id} [get]
func (h *InfrastructureHandler) GetODC(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	odcID := c.Param("id")

	odc, err := h.infraService.GetODCByID(c.Request.Context(), tenantID, odcID)
	if err != nil {
		response.SimpleError(c, http.StatusNotFound, "ODC not found", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "ODC retrieved successfully", odc)
}

// UpdateODC godoc
// @Summary Update ODC
// @Description Update ODC information
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "ODC ID"
// @Param odc body usecase.UpdateODCRequest true "ODC update data"
// @Success 200 {object} response.Response{data=entity.ODC}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/odcs/{id} [put]
func (h *InfrastructureHandler) UpdateODC(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	odcID := c.Param("id")

	var req usecase.UpdateODCRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	odc, err := h.infraService.UpdateODC(c.Request.Context(), tenantID, odcID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update ODC", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "ODC updated successfully", odc)
}

// DeleteODC godoc
// @Summary Delete ODC
// @Description Delete an ODC
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "ODC ID"
// @Success 200 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/odcs/{id} [delete]
func (h *InfrastructureHandler) DeleteODC(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	odcID := c.Param("id")

	err := h.infraService.DeleteODC(c.Request.Context(), tenantID, odcID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to delete ODC", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "ODC deleted successfully", nil)
}

// ODP Handlers

// CreateODP godoc
// @Summary Create a new ODP
// @Description Create a new Optical Distribution Point
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param odp body usecase.CreateODPRequest true "ODP data"
// @Success 201 {object} response.Response{data=entity.ODP}
// @Failure 400 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/odps [post]
func (h *InfrastructureHandler) CreateODP(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req usecase.CreateODPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	odp, err := h.infraService.CreateODP(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to create ODP", err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "ODP created successfully", odp)
}

// ListODPs godoc
// @Summary List ODPs
// @Description Get list of Optical Distribution Points
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param odc_id query string false "Filter by ODC ID"
// @Param is_active query boolean false "Filter by active status"
// @Success 200 {object} response.Response{data=[]entity.ODP}
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/odps [get]
func (h *InfrastructureHandler) ListODPs(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	odcID := c.Query("odc_id")

	var isActive *bool
	if isActiveStr := c.Query("is_active"); isActiveStr != "" {
		val, _ := strconv.ParseBool(isActiveStr)
		isActive = &val
	}

	odps, err := h.infraService.ListODPs(c.Request.Context(), tenantID, odcID, isActive)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to list ODPs", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "ODPs retrieved successfully", odps)
}

// GetODP godoc
// @Summary Get ODP by ID
// @Description Get detailed information about an ODP
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "ODP ID"
// @Success 200 {object} response.Response{data=entity.ODP}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/odps/{id} [get]
func (h *InfrastructureHandler) GetODP(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	odpID := c.Param("id")

	odp, err := h.infraService.GetODPByID(c.Request.Context(), tenantID, odpID)
	if err != nil {
		response.SimpleError(c, http.StatusNotFound, "ODP not found", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "ODP retrieved successfully", odp)
}

// UpdateODP godoc
// @Summary Update ODP
// @Description Update ODP information
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "ODP ID"
// @Param odp body usecase.UpdateODPRequest true "ODP update data"
// @Success 200 {object} response.Response{data=entity.ODP}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/odps/{id} [put]
func (h *InfrastructureHandler) UpdateODP(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	odpID := c.Param("id")

	var req usecase.UpdateODPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	odp, err := h.infraService.UpdateODP(c.Request.Context(), tenantID, odpID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update ODP", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "ODP updated successfully", odp)
}

// DeleteODP godoc
// @Summary Delete ODP
// @Description Delete an ODP
// @Tags infrastructure
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "ODP ID"
// @Success 200 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /infrastructure/odps/{id} [delete]
func (h *InfrastructureHandler) DeleteODP(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	odpID := c.Param("id")

	err := h.infraService.DeleteODP(c.Request.Context(), tenantID, odpID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to delete ODP", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "ODP deleted successfully", nil)
}

