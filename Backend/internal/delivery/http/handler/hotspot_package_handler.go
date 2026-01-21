package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type HotspotPackageHandler struct {
	packageService usecase.HotspotPackageService
}

func NewHotspotPackageHandler(packageService usecase.HotspotPackageService) *HotspotPackageHandler {
	return &HotspotPackageHandler{
		packageService: packageService,
	}
}

// CreatePackage godoc
// @Summary Create hotspot package
// @Tags Hotspot
// @Accept json
// @Produce json
// @Param request body dto.CreatePackageRequest true "Package data"
// @Success 201 {object} response.Response{data=dto.PackageResponse}
// @Router /api/v1/tenant/hotspot/packages [post]
func (h *HotspotPackageHandler) CreatePackage(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	var req dto.CreatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VAL_2001", "Invalid request", map[string]interface{}{"error": err.Error()})
		return
	}

	createReq := &usecase.CreatePackageRequest{
		Name:          req.Name,
		Description:   req.Description,
		DurationType:  req.DurationType,
		Duration:      req.Duration,
		Price:         req.Price,
		SpeedUpload:   req.SpeedUpload,
		SpeedDownload: req.SpeedDownload,
		DeviceLimit:   req.DeviceLimit,
		MACBinding:    req.MACBinding,
		SessionLimit:  req.SessionLimit,
	}

	pkg, err := h.packageService.CreatePackage(c.Request.Context(), tenantID, createReq)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to create package", map[string]interface{}{"error": err.Error()})
		return
	}

	response.Success(c, http.StatusCreated, "Package created successfully", toPackageResponse(pkg))
}

// ListPackages godoc
// @Summary List hotspot packages
// @Tags Hotspot
// @Produce json
// @Success 200 {object} response.Response{data=[]dto.PackageResponse}
// @Router /api/v1/tenant/hotspot/packages [get]
func (h *HotspotPackageHandler) ListPackages(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	packages, err := h.packageService.ListPackages(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to list packages", map[string]interface{}{"error": err.Error()})
		return
	}

	packageResponses := make([]dto.PackageResponse, len(packages))
	for i, pkg := range packages {
		packageResponses[i] = toPackageResponse(pkg)
	}

	response.Success(c, http.StatusOK, "Packages retrieved successfully", packageResponses)
}

// GetPackage godoc
// @Summary Get hotspot package by ID
// @Tags Hotspot
// @Produce json
// @Param id path string true "Package ID"
// @Success 200 {object} response.Response{data=dto.PackageResponse}
// @Router /api/v1/tenant/hotspot/packages/{id} [get]
func (h *HotspotPackageHandler) GetPackage(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	packageID := c.Param("id")
	pkg, err := h.packageService.GetPackage(c.Request.Context(), tenantID, packageID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "RES_6001", "Package not found", map[string]interface{}{"error": err.Error()})
		return
	}

	response.Success(c, http.StatusOK, "Package retrieved successfully", toPackageResponse(pkg))
}

// UpdatePackage godoc
// @Summary Update hotspot package
// @Tags Hotspot
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Param request body dto.UpdatePackageRequest true "Package data"
// @Success 200 {object} response.Response
// @Router /api/v1/tenant/hotspot/packages/{id} [put]
func (h *HotspotPackageHandler) UpdatePackage(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	packageID := c.Param("id")
	var req dto.UpdatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VAL_2001", "Invalid request", map[string]interface{}{"error": err.Error()})
		return
	}

	updateReq := &usecase.UpdatePackageRequest{
		Name:          req.Name,
		Description:   req.Description,
		Price:         req.Price,
		SpeedUpload:   req.SpeedUpload,
		SpeedDownload: req.SpeedDownload,
		DeviceLimit:   req.DeviceLimit,
		MACBinding:    req.MACBinding,
		SessionLimit:  req.SessionLimit,
		IsActive:      req.IsActive,
	}

	if err := h.packageService.UpdatePackage(c.Request.Context(), tenantID, packageID, updateReq); err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to update package", map[string]interface{}{"error": err.Error()})
		return
	}

	response.Success(c, http.StatusOK, "Package updated successfully", nil)
}

// DeletePackage godoc
// @Summary Delete hotspot package
// @Tags Hotspot
// @Produce json
// @Param id path string true "Package ID"
// @Success 200 {object} response.Response
// @Router /api/v1/tenant/hotspot/packages/{id} [delete]
func (h *HotspotPackageHandler) DeletePackage(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	packageID := c.Param("id")
	if err := h.packageService.DeletePackage(c.Request.Context(), tenantID, packageID); err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to delete package", map[string]interface{}{"error": err.Error()})
		return
	}

	response.Success(c, http.StatusOK, "Package deleted successfully", nil)
}

func toPackageResponse(pkg *entity.HotspotPackage) dto.PackageResponse {
	return dto.PackageResponse{
		ID:            pkg.ID.String(),
		TenantID:      pkg.TenantID.String(),
		Name:          pkg.Name,
		Description:   pkg.Description,
		DurationType:  pkg.DurationType,
		Duration:      pkg.Duration,
		Price:         pkg.Price,
		SpeedUpload:   pkg.SpeedUpload,
		SpeedDownload: pkg.SpeedDownload,
		DeviceLimit:   pkg.DeviceLimit,
		MACBinding:    pkg.MACBinding,
		SessionLimit:  pkg.SessionLimit,
		IsActive:      pkg.IsActive,
		CreatedAt:     pkg.CreatedAt,
		UpdatedAt:     pkg.UpdatedAt,
	}
}
