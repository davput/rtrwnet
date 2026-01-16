package handler

import (
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/internal/middleware"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type ExportHandler struct {
	customerRepo    repository.CustomerRepository
	servicePlanRepo repository.ServicePlanRepository
}

func NewExportHandler(customerRepo repository.CustomerRepository, servicePlanRepo repository.ServicePlanRepository) *ExportHandler {
	return &ExportHandler{
		customerRepo:    customerRepo,
		servicePlanRepo: servicePlanRepo,
	}
}

// ExportCustomers exports customers to CSV
func (h *ExportHandler) ExportCustomers(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	// Get all customers
	customers, _, err := h.customerRepo.FindByTenantID(c.Request.Context(), tenantID, 1, 10000, nil)
	if err != nil {
		response.InternalServerError(c, "EXP_001", "Failed to fetch customers")
		return
	}

	// Set headers for CSV download
	filename := fmt.Sprintf("customers_%s.csv", time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	header := []string{
		"customer_code", "name", "email", "phone", "address",
		"latitude", "longitude", "service_plan", "service_plan_id", "service_type",
		"pppoe_username", "pppoe_password", "static_ip", "static_gateway", "static_dns",
		"status", "due_date", "monthly_fee", "notes",
	}
	writer.Write(header)

	// Write data
	for _, customer := range customers {
		servicePlanName := ""
		if customer.ServicePlan != nil {
			servicePlanName = customer.ServicePlan.Name
		}
		row := []string{
			customer.CustomerCode,
			customer.Name,
			customer.Email,
			customer.Phone,
			customer.Address,
			fmt.Sprintf("%f", customer.Latitude),
			fmt.Sprintf("%f", customer.Longitude),
			servicePlanName,
			customer.ServicePlanID,
			customer.ServiceType,
			customer.PPPoEUsername,
			customer.PPPoEPassword,
			customer.StaticIP,
			customer.StaticGateway,
			customer.StaticDNS,
			customer.Status,
			strconv.Itoa(customer.DueDate),
			fmt.Sprintf("%.2f", customer.MonthlyFee),
			customer.Notes,
		}
		writer.Write(row)
	}

	logger.Info("Exported %d customers for tenant %s", len(customers), tenantID)
}

// DownloadTemplate downloads CSV template for import
func (h *ExportHandler) DownloadTemplate(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=customer_import_template.csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write instructions as comments
	writer.Write([]string{"# Template Import Pelanggan - Kolom dengan * wajib diisi"})
	writer.Write([]string{"# service_plan: Gunakan nama paket atau ID paket"})
	writer.Write([]string{"# service_type: dhcp, pppoe, atau static"})

	// Get service plans to show available options
	plans, _ := h.servicePlanRepo.FindByTenantID(c.Request.Context(), tenantID)
	if len(plans) > 0 {
		planNames := make([]string, 0)
		for _, p := range plans {
			planNames = append(planNames, fmt.Sprintf("%s (ID: %s)", p.Name, p.ID))
		}
		writer.Write([]string{fmt.Sprintf("# Paket tersedia: %s", strings.Join(planNames, ", "))})
	}

	writer.Write([]string{""}) // Empty row

	// Write header
	header := []string{
		"name*", "phone*", "email", "address",
		"latitude", "longitude", "service_plan*", "service_type*",
		"pppoe_username", "pppoe_password", "static_ip", "static_gateway", "static_dns",
		"due_date", "monthly_fee", "notes",
	}
	writer.Write(header)

	// Write example row
	planExample := "Nama Paket atau UUID"
	if len(plans) > 0 {
		planExample = plans[0].Name
	}
	example := []string{
		"John Doe", "081234567890", "john@example.com", "Jl. Contoh No. 123",
		"-6.123456", "106.123456", planExample, "dhcp",
		"", "", "", "", "",
		"15", "150000", "Catatan pelanggan",
	}
	writer.Write(example)
}


// ImportCustomers imports customers from CSV
func (h *ExportHandler) ImportCustomers(c *gin.Context) {
	tenantID, err := middleware.GetTenantIDFromContext(c)
	if err != nil {
		response.ErrorFromAppError(c, err.(*errors.AppError))
		return
	}

	// Get uploaded file
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "IMP_001", "File is required", nil)
		return
	}
	defer file.Close()

	// Parse CSV
	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		response.BadRequest(c, "IMP_002", "Invalid CSV format", nil)
		return
	}

	if len(records) < 2 {
		response.BadRequest(c, "IMP_003", "CSV file is empty or has no data rows", nil)
		return
	}

	// Get service plans for validation - support both ID and name lookup
	plans, err := h.servicePlanRepo.FindByTenantID(c.Request.Context(), tenantID)
	if err != nil {
		response.InternalServerError(c, "IMP_004", "Failed to fetch service plans")
		return
	}
	planByID := make(map[string]*entity.ServicePlan)
	planByName := make(map[string]*entity.ServicePlan)
	for _, p := range plans {
		planByID[p.ID] = p
		planByName[strings.ToLower(p.Name)] = p
	}

	// Skip header row (and comment rows starting with #)
	var dataRows [][]string
	for _, row := range records {
		if len(row) > 0 && !strings.HasPrefix(row[0], "#") && row[0] != "" {
			// Skip header row
			if strings.Contains(strings.ToLower(row[0]), "name") {
				continue
			}
			dataRows = append(dataRows, row)
		}
	}
	
	var imported int
	var failed int
	var errorMessages []string

	for i, row := range dataRows {
		rowNum := i + 2 // Account for header and 0-index

		if len(row) < 8 {
			errorMessages = append(errorMessages, fmt.Sprintf("Row %d: insufficient columns", rowNum))
			failed++
			continue
		}

		// Parse required fields
		name := strings.TrimSpace(row[0])
		phone := strings.TrimSpace(row[1])
		email := strings.TrimSpace(row[2])
		address := strings.TrimSpace(row[3])
		servicePlanInput := strings.TrimSpace(row[6])
		serviceType := strings.TrimSpace(row[7])

		// Validate required fields
		if name == "" {
			errorMessages = append(errorMessages, fmt.Sprintf("Row %d: name is required", rowNum))
			failed++
			continue
		}
		if phone == "" {
			errorMessages = append(errorMessages, fmt.Sprintf("Row %d: phone is required", rowNum))
			failed++
			continue
		}
		if servicePlanInput == "" {
			errorMessages = append(errorMessages, fmt.Sprintf("Row %d: service_plan is required", rowNum))
			failed++
			continue
		}

		// Find service plan by ID or name
		var plan *entity.ServicePlan
		var exists bool
		
		// First try by ID
		plan, exists = planByID[servicePlanInput]
		if !exists {
			// Try by name (case-insensitive)
			plan, exists = planByName[strings.ToLower(servicePlanInput)]
		}
		
		if !exists {
			// List available plans in error message
			availablePlans := make([]string, 0)
			for _, p := range plans {
				availablePlans = append(availablePlans, p.Name)
			}
			errorMessages = append(errorMessages, fmt.Sprintf("Row %d: service plan '%s' not found. Available: %s", rowNum, servicePlanInput, strings.Join(availablePlans, ", ")))
			failed++
			continue
		}
		
		servicePlanID := plan.ID

		// Validate service type
		if serviceType == "" {
			serviceType = entity.ServiceTypeDHCP
		}
		if serviceType != entity.ServiceTypeDHCP && serviceType != entity.ServiceTypePPPoE && serviceType != entity.ServiceTypeStatic {
			errorMessages = append(errorMessages, fmt.Sprintf("Row %d: invalid service_type (must be dhcp, pppoe, or static)", rowNum))
			failed++
			continue
		}

		// Parse optional fields
		var latitude, longitude float64
		if len(row) > 4 && row[4] != "" {
			latitude, _ = strconv.ParseFloat(row[4], 64)
		}
		if len(row) > 5 && row[5] != "" {
			longitude, _ = strconv.ParseFloat(row[5], 64)
		}

		var pppoeUsername, pppoePassword string
		if len(row) > 8 {
			pppoeUsername = strings.TrimSpace(row[8])
		}
		if len(row) > 9 {
			pppoePassword = strings.TrimSpace(row[9])
		}

		var staticIP, staticGateway, staticDNS string
		if len(row) > 10 {
			staticIP = strings.TrimSpace(row[10])
		}
		if len(row) > 11 {
			staticGateway = strings.TrimSpace(row[11])
		}
		if len(row) > 12 {
			staticDNS = strings.TrimSpace(row[12])
		}

		dueDate := 15
		if len(row) > 13 && row[13] != "" {
			dueDate, _ = strconv.Atoi(row[13])
			if dueDate < 1 || dueDate > 28 {
				dueDate = 15
			}
		}

		monthlyFee := plan.Price
		if len(row) > 14 && row[14] != "" {
			monthlyFee, _ = strconv.ParseFloat(row[14], 64)
		}

		var notes string
		if len(row) > 15 {
			notes = strings.TrimSpace(row[15])
		}

		// Generate customer code
		customerCode, err := h.customerRepo.GenerateCustomerCode(c.Request.Context(), tenantID)
		if err != nil {
			errorMessages = append(errorMessages, fmt.Sprintf("Row %d: failed to generate customer code", rowNum))
			failed++
			continue
		}

		// Create customer
		customer := &entity.Customer{
			TenantID:      tenantID,
			CustomerCode:  customerCode,
			Name:          name,
			Email:         email,
			Phone:         phone,
			Address:       address,
			Latitude:      latitude,
			Longitude:     longitude,
			ServicePlanID: servicePlanID,
			ServiceType:   serviceType,
			PPPoEUsername: pppoeUsername,
			PPPoEPassword: pppoePassword,
			StaticIP:      staticIP,
			StaticGateway: staticGateway,
			StaticDNS:     staticDNS,
			Status:        entity.CustomerStatusPendingActivation,
			DueDate:       dueDate,
			MonthlyFee:    monthlyFee,
			Notes:         notes,
			InstallationDate: time.Now(),
		}

		if err := h.customerRepo.Create(c.Request.Context(), customer); err != nil {
			errorMessages = append(errorMessages, fmt.Sprintf("Row %d: failed to create customer - %v", rowNum, err))
			failed++
			continue
		}

		imported++
	}

	logger.Info("Import completed for tenant %s: %d imported, %d failed", tenantID, imported, failed)

	response.OK(c, "Import completed", gin.H{
		"imported": imported,
		"failed":   failed,
		"errors":   errorMessages,
	})
}
