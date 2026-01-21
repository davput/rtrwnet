package handler

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/internal/middleware"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type CustomerHotspotHandler struct {
	customerRepo   repository.CustomerRepository
	freeradiusSync *usecase.FreeRADIUSSyncService
}

func NewCustomerHotspotHandler(
	customerRepo repository.CustomerRepository,
	freeradiusSync *usecase.FreeRADIUSSyncService,
) *CustomerHotspotHandler {
	return &CustomerHotspotHandler{
		customerRepo:   customerRepo,
		freeradiusSync: freeradiusSync,
	}
}

// EnableHotspot enables hotspot access for a customer
func (h *CustomerHotspotHandler) EnableHotspot(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	customerID := c.Param("id")
	if customerID == "" {
		response.BadRequest(c, "VAL_2003", "Customer ID is required", nil)
		return
	}

	// Get customer
	customer, err := h.customerRepo.FindByID(c.Request.Context(), customerID)
	if err != nil {
		response.NotFound(c, "CUST_4001", "Customer not found")
		return
	}

	// Check tenant
	if customer.TenantID != tenantID {
		response.NotFound(c, "CUST_4001", "Customer not found")
		return
	}

	// Check if already enabled
	if customer.HotspotEnabled {
		response.OK(c, "Hotspot already enabled", dto.CustomerHotspotResponse{
			Enabled:  true,
			Username: customer.HotspotUsername,
			Password: customer.HotspotPassword,
		})
		return
	}

	// Generate credentials
	username := fmt.Sprintf("cust_%s", customer.CustomerCode)
	password := generateRandomPassword(12)

	// Update customer
	customer.HotspotEnabled = true
	customer.HotspotUsername = username
	customer.HotspotPassword = password

	if err := h.customerRepo.Update(c.Request.Context(), customer); err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to enable hotspot")
		return
	}

	// Sync to FreeRADIUS
	if err := h.freeradiusSync.SyncCustomerHotspot(customer); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to sync customer hotspot to FreeRADIUS: %v\n", err)
	}

	response.OK(c, "Hotspot enabled successfully", dto.CustomerHotspotResponse{
		Enabled:  true,
		Username: username,
		Password: password,
	})
}

// DisableHotspot disables hotspot access for a customer
func (h *CustomerHotspotHandler) DisableHotspot(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	customerID := c.Param("id")
	if customerID == "" {
		response.BadRequest(c, "VAL_2003", "Customer ID is required", nil)
		return
	}

	// Get customer
	customer, err := h.customerRepo.FindByID(c.Request.Context(), customerID)
	if err != nil {
		response.NotFound(c, "CUST_4001", "Customer not found")
		return
	}

	// Check tenant
	if customer.TenantID != tenantID {
		response.NotFound(c, "CUST_4001", "Customer not found")
		return
	}

	// Update customer
	customer.HotspotEnabled = false

	if err := h.customerRepo.Update(c.Request.Context(), customer); err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to disable hotspot")
		return
	}

	// Sync to FreeRADIUS (will remove user)
	if err := h.freeradiusSync.SyncCustomerHotspot(customer); err != nil {
		fmt.Printf("Failed to sync customer hotspot to FreeRADIUS: %v\n", err)
	}

	response.OK(c, "Hotspot disabled successfully", nil)
}

// RegenerateHotspotPassword regenerates hotspot password for a customer
func (h *CustomerHotspotHandler) RegenerateHotspotPassword(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	customerID := c.Param("id")
	if customerID == "" {
		response.BadRequest(c, "VAL_2003", "Customer ID is required", nil)
		return
	}

	// Get customer
	customer, err := h.customerRepo.FindByID(c.Request.Context(), customerID)
	if err != nil {
		response.NotFound(c, "CUST_4001", "Customer not found")
		return
	}

	// Check tenant
	if customer.TenantID != tenantID {
		response.NotFound(c, "CUST_4001", "Customer not found")
		return
	}

	if !customer.HotspotEnabled {
		response.BadRequest(c, "CUST_4002", "Hotspot is not enabled for this customer", nil)
		return
	}

	// Generate new password
	password := generateRandomPassword(12)

	// Update customer
	customer.HotspotPassword = password

	if err := h.customerRepo.Update(c.Request.Context(), customer); err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to regenerate password")
		return
	}

	// Sync to FreeRADIUS
	if err := h.freeradiusSync.SyncCustomerHotspot(customer); err != nil {
		fmt.Printf("Failed to sync customer hotspot to FreeRADIUS: %v\n", err)
	}

	response.OK(c, "Password regenerated successfully", dto.CustomerHotspotResponse{
		Enabled:  true,
		Username: customer.HotspotUsername,
		Password: password,
	})
}

// GetHotspotCredentials gets hotspot credentials for a customer
func (h *CustomerHotspotHandler) GetHotspotCredentials(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	customerID := c.Param("id")
	if customerID == "" {
		response.BadRequest(c, "VAL_2003", "Customer ID is required", nil)
		return
	}

	// Get customer
	customer, err := h.customerRepo.FindByID(c.Request.Context(), customerID)
	if err != nil {
		response.NotFound(c, "CUST_4001", "Customer not found")
		return
	}

	// Check tenant
	if customer.TenantID != tenantID {
		response.NotFound(c, "CUST_4001", "Customer not found")
		return
	}

	response.OK(c, "Hotspot credentials retrieved", dto.CustomerHotspotResponse{
		Enabled:  customer.HotspotEnabled,
		Username: customer.HotspotUsername,
		Password: customer.HotspotPassword,
	})
}

// generateRandomPassword generates a random password
func generateRandomPassword(length int) string {
	b := make([]byte, length)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)[:length]
}
