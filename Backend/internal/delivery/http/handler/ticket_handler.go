package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type TicketHandler struct {
	ticketService usecase.TicketService
}

func NewTicketHandler(ticketService usecase.TicketService) *TicketHandler {
	return &TicketHandler{
		ticketService: ticketService,
	}
}

// CreateTicket godoc
// @Summary Create a new ticket
// @Description Create a new support ticket for a customer
// @Tags tickets
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param ticket body usecase.CreateTicketRequest true "Ticket data"
// @Success 201 {object} response.Response{data=entity.Ticket}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tickets [post]
func (h *TicketHandler) CreateTicket(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	var req usecase.CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	ticket, err := h.ticketService.CreateTicket(c.Request.Context(), tenantID, req.CustomerID, userID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to create ticket", err.Error())
		return
	}

	response.Success(c, http.StatusCreated, "Ticket created successfully", ticket)
}

// GetTicket godoc
// @Summary Get ticket by ID
// @Description Get detailed information about a ticket including activities
// @Tags tickets
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Ticket ID"
// @Success 200 {object} response.Response{data=usecase.TicketDetail}
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tickets/{id} [get]
func (h *TicketHandler) GetTicket(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	ticketID := c.Param("id")

	ticket, err := h.ticketService.GetTicketByID(c.Request.Context(), tenantID, ticketID)
	if err != nil {
		response.SimpleError(c, http.StatusNotFound, "Ticket not found", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Ticket retrieved successfully", ticket)
}

// ListTickets godoc
// @Summary List tickets
// @Description Get paginated list of tickets with optional filters
// @Tags tickets
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param page query int false "Page number" default(1)
// @Param per_page query int false "Items per page" default(10)
// @Param status query string false "Filter by status"
// @Param priority query string false "Filter by priority"
// @Param customer_id query string false "Filter by customer ID"
// @Param assigned_to query string false "Filter by assigned user ID"
// @Param search query string false "Search in ticket number, title, description"
// @Success 200 {object} response.Response{data=map[string]interface{}}
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tickets [get]
func (h *TicketHandler) ListTickets(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))

	filters := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if priority := c.Query("priority"); priority != "" {
		filters["priority"] = priority
	}
	if customerID := c.Query("customer_id"); customerID != "" {
		filters["customer_id"] = customerID
	}
	if assignedTo := c.Query("assigned_to"); assignedTo != "" {
		filters["assigned_to"] = assignedTo
	}
	if search := c.Query("search"); search != "" {
		filters["search"] = search
	}

	tickets, total, err := h.ticketService.ListTickets(c.Request.Context(), tenantID, page, perPage, filters)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to list tickets", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Tickets retrieved successfully", map[string]interface{}{
		"tickets": tickets,
		"pagination": map[string]interface{}{
			"page":     page,
			"per_page": perPage,
			"total":    total,
		},
	})
}

// UpdateTicket godoc
// @Summary Update ticket
// @Description Update ticket information
// @Tags tickets
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Ticket ID"
// @Param ticket body usecase.UpdateTicketRequest true "Ticket update data"
// @Success 200 {object} response.Response{data=entity.Ticket}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tickets/{id} [put]
func (h *TicketHandler) UpdateTicket(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")
	ticketID := c.Param("id")

	var req usecase.UpdateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	ticket, err := h.ticketService.UpdateTicket(c.Request.Context(), tenantID, ticketID, userID, &req)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to update ticket", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Ticket updated successfully", ticket)
}

// AssignTicket godoc
// @Summary Assign ticket to user
// @Description Assign a ticket to a specific user
// @Tags tickets
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Ticket ID"
// @Param body body map[string]string true "Assignment data"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tickets/{id}/assign [post]
func (h *TicketHandler) AssignTicket(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")
	ticketID := c.Param("id")

	var req struct {
		AssignedTo string `json:"assigned_to" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := h.ticketService.AssignTicket(c.Request.Context(), tenantID, ticketID, req.AssignedTo, userID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to assign ticket", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Ticket assigned successfully", nil)
}

// ResolveTicket godoc
// @Summary Resolve ticket
// @Description Mark a ticket as resolved
// @Tags tickets
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Ticket ID"
// @Param body body map[string]string true "Resolution data"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tickets/{id}/resolve [post]
func (h *TicketHandler) ResolveTicket(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")
	ticketID := c.Param("id")

	var req struct {
		ResolutionNotes string `json:"resolution_notes" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.SimpleError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	err := h.ticketService.ResolveTicket(c.Request.Context(), tenantID, ticketID, userID, req.ResolutionNotes)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to resolve ticket", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Ticket resolved successfully", nil)
}

// CloseTicket godoc
// @Summary Close ticket
// @Description Mark a ticket as closed
// @Tags tickets
// @Accept json
// @Produce json
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path string true "Ticket ID"
// @Success 200 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Security BearerAuth
// @Router /tickets/{id}/close [post]
func (h *TicketHandler) CloseTicket(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")
	ticketID := c.Param("id")

	err := h.ticketService.CloseTicket(c.Request.Context(), tenantID, ticketID, userID)
	if err != nil {
		response.SimpleError(c, http.StatusInternalServerError, "Failed to close ticket", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Ticket closed successfully", nil)
}
