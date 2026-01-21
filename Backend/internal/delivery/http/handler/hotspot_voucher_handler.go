package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type HotspotVoucherHandler struct {
	voucherService usecase.HotspotVoucherService
}

func NewHotspotVoucherHandler(voucherService usecase.HotspotVoucherService) *HotspotVoucherHandler {
	return &HotspotVoucherHandler{
		voucherService: voucherService,
	}
}

// GenerateVouchers godoc
// @Summary Generate hotspot vouchers
// @Tags Hotspot
// @Accept json
// @Produce json
// @Param request body dto.GenerateVouchersRequest true "Voucher generation data"
// @Success 201 {object} response.Response{data=[]dto.VoucherResponse}
// @Router /api/v1/tenant/hotspot/vouchers/generate [post]
func (h *HotspotVoucherHandler) GenerateVouchers(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	var req dto.GenerateVouchersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VAL_2001", "Invalid request", map[string]interface{}{"error": err.Error()})
		return
	}

	genReq := &usecase.GenerateVouchersRequest{
		PackageID: req.PackageID,
		Quantity:  req.Quantity,
		Prefix:    req.Prefix,
	}

	vouchers, err := h.voucherService.GenerateVouchers(c.Request.Context(), tenantID, genReq)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to generate vouchers", map[string]interface{}{"error": err.Error()})
		return
	}

	voucherResponses := make([]dto.VoucherResponse, len(vouchers))
	for i, v := range vouchers {
		voucherResponses[i] = toVoucherResponse(v, true) // show password on generation
	}

	response.Success(c, http.StatusCreated, "Vouchers generated successfully", voucherResponses)
}

// ListVouchers godoc
// @Summary List hotspot vouchers
// @Tags Hotspot
// @Produce json
// @Param status query string false "Filter by status"
// @Param package_id query string false "Filter by package ID"
// @Param start_date query string false "Filter by start date"
// @Param end_date query string false "Filter by end date"
// @Param page query int false "Page number"
// @Param per_page query int false "Items per page"
// @Success 200 {object} response.Response{data=[]dto.VoucherResponse}
// @Router /api/v1/tenant/hotspot/vouchers [get]
func (h *HotspotVoucherHandler) ListVouchers(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	// Parse query parameters
	filters := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if packageID := c.Query("package_id"); packageID != "" {
		filters["package_id"] = packageID
	}
	if startDate := c.Query("start_date"); startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			filters["start_date"] = t
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			filters["end_date"] = t
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	vouchers, total, err := h.voucherService.ListVouchers(c.Request.Context(), tenantID, filters, page, perPage)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to list vouchers", map[string]interface{}{"error": err.Error()})
		return
	}

	voucherResponses := make([]dto.VoucherResponse, len(vouchers))
	for i, v := range vouchers {
		voucherResponses[i] = toVoucherResponse(v, false) // don't show password
	}

	totalPages := (total + perPage - 1) / perPage
	meta := &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: totalPages,
	}

	response.SuccessWithMeta(c, http.StatusOK, "Vouchers retrieved successfully", voucherResponses, meta)
}

// GetVoucher godoc
// @Summary Get hotspot voucher by ID
// @Tags Hotspot
// @Produce json
// @Param id path string true "Voucher ID"
// @Success 200 {object} response.Response{data=dto.VoucherResponse}
// @Router /api/v1/tenant/hotspot/vouchers/{id} [get]
func (h *HotspotVoucherHandler) GetVoucher(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	voucherID := c.Param("id")
	voucher, err := h.voucherService.GetVoucher(c.Request.Context(), tenantID, voucherID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "RES_6001", "Voucher not found", map[string]interface{}{"error": err.Error()})
		return
	}

	response.Success(c, http.StatusOK, "Voucher retrieved successfully", toVoucherResponse(voucher, false))
}

// DeleteVoucher godoc
// @Summary Delete hotspot voucher
// @Tags Hotspot
// @Produce json
// @Param id path string true "Voucher ID"
// @Success 200 {object} response.Response
// @Router /api/v1/tenant/hotspot/vouchers/{id} [delete]
func (h *HotspotVoucherHandler) DeleteVoucher(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	voucherID := c.Param("id")
	if err := h.voucherService.DeleteVoucher(c.Request.Context(), tenantID, voucherID); err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to delete voucher", map[string]interface{}{"error": err.Error()})
		return
	}

	response.Success(c, http.StatusOK, "Voucher deleted successfully", nil)
}

// GetVoucherStats godoc
// @Summary Get voucher statistics
// @Tags Hotspot
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} response.Response{data=dto.VoucherStatsResponse}
// @Router /api/v1/tenant/hotspot/vouchers/stats [get]
func (h *HotspotVoucherHandler) GetVoucherStats(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	var startDate, endDate time.Time
	if sd := c.Query("start_date"); sd != "" {
		startDate, _ = time.Parse("2006-01-02", sd)
	}
	if ed := c.Query("end_date"); ed != "" {
		endDate, _ = time.Parse("2006-01-02", ed)
	}

	stats, err := h.voucherService.GetVoucherStats(c.Request.Context(), tenantID, startDate, endDate)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to get voucher stats", map[string]interface{}{"error": err.Error()})
		return
	}

	statsResponse := dto.VoucherStatsResponse{
		TotalVouchers:   stats.TotalVouchers,
		UnusedVouchers:  stats.UnusedVouchers,
		ActiveVouchers:  stats.ActiveVouchers,
		ExpiredVouchers: stats.ExpiredVouchers,
		UsedVouchers:    stats.UsedVouchers,
		PackageStats:    make([]dto.PackageVoucherStats, len(stats.PackageStats)),
		TotalRevenue:    stats.TotalRevenue,
	}

	for i, ps := range stats.PackageStats {
		statsResponse.PackageStats[i] = dto.PackageVoucherStats{
			PackageID:   ps.PackageID,
			PackageName: ps.PackageName,
			Count:       ps.Count,
			Revenue:     ps.Revenue,
		}
	}

	response.Success(c, http.StatusOK, "Voucher stats retrieved successfully", statsResponse)
}

func toVoucherResponse(v *entity.HotspotVoucher, showPassword bool) dto.VoucherResponse {
	resp := dto.VoucherResponse{
		ID:          v.ID.String(),
		TenantID:    v.TenantID.String(),
		PackageID:   v.PackageID.String(),
		VoucherCode: v.VoucherCode,
		Status:      v.Status,
		ActivatedAt: v.ActivatedAt,
		ExpiresAt:   v.ExpiresAt,
		DeviceMAC:   v.DeviceMAC,
		CreatedAt:   v.CreatedAt,
		UpdatedAt:   v.UpdatedAt,
	}

	if v.Package != nil {
		resp.PackageName = v.Package.Name
	}

	// Only show password when generating vouchers
	if showPassword {
		resp.VoucherPassword = v.VoucherPassword
	}

	return resp
}
