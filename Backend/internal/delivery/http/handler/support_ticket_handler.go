package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type SupportTicketHandler struct {
	ticketService usecase.SupportTicketService
}

func NewSupportTicketHandler(ticketService usecase.SupportTicketService) *SupportTicketHandler {
	return &SupportTicketHandler{
		ticketService: ticketService,
	}
}

// CreateTicket handles creating a new support ticket
func (h *SupportTicketHandler) CreateTicket(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	if tenantID == "" || userID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	var req usecase.CreateSupportTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": err.Error(),
		})
		return
	}

	ticket, err := h.ticketService.CreateTicket(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to create ticket")
		}
		return
	}

	response.Created(c, "Ticket created successfully", ticket)
}

// GetTicket handles getting a single ticket
func (h *SupportTicketHandler) GetTicket(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	ticketID := c.Param("id")

	if tenantID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	if ticketID == "" {
		response.BadRequest(c, "VAL_2003", "Ticket ID is required", nil)
		return
	}

	ticket, err := h.ticketService.GetTicket(c.Request.Context(), tenantID, ticketID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to get ticket")
		}
		return
	}

	response.OK(c, "Ticket retrieved successfully", ticket)
}

// ListTickets handles listing tickets for a tenant
func (h *SupportTicketHandler) ListTickets(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	if tenantID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	page := 1
	perPage := 10
	status := c.Query("status")

	if p := c.Query("page"); p != "" {
		if parsed, err := parseInt(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if pp := c.Query("per_page"); pp != "" {
		if parsed, err := parseInt(pp); err == nil && parsed > 0 {
			perPage = parsed
		}
	}

	result, err := h.ticketService.ListTickets(c.Request.Context(), tenantID, page, perPage, status)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to list tickets")
		}
		return
	}

	response.OK(c, "Tickets retrieved successfully", result)
}

// AddReply handles adding a reply to a ticket
func (h *SupportTicketHandler) AddReply(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")
	ticketID := c.Param("id")

	if tenantID == "" || userID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	if ticketID == "" {
		response.BadRequest(c, "VAL_2003", "Ticket ID is required", nil)
		return
	}

	var req struct {
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Message is required", nil)
		return
	}

	reply, err := h.ticketService.AddReply(c.Request.Context(), tenantID, userID, ticketID, req.Message)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to add reply")
		}
		return
	}

	response.Created(c, "Reply added successfully", reply)
}

// GetTicketStats handles getting ticket statistics
func (h *SupportTicketHandler) GetTicketStats(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	if tenantID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	stats, err := h.ticketService.GetTicketStats(c.Request.Context(), tenantID)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to get ticket stats")
		}
		return
	}

	response.OK(c, "Ticket stats retrieved successfully", stats)
}

// Helper function
func parseInt(s string) (int, error) {
	var result int
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, errors.NewValidationError("Invalid number")
		}
		result = result*10 + int(c-'0')
	}
	return result, nil
}
