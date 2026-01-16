package handler

import (
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type NotificationHandler struct {
	notificationService usecase.NotificationService
}

func NewNotificationHandler(notificationService usecase.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: notificationService,
	}
}

// GetNotifications handles getting notifications for a user
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	if tenantID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	unreadOnly := c.Query("unread_only") == "true"

	var userIDPtr *string
	if userID != "" {
		userIDPtr = &userID
	}

	notifications, total, err := h.notificationService.GetNotifications(c.Request.Context(), tenantID, userIDPtr, page, perPage, unreadOnly)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get notifications")
		return
	}

	response.OK(c, "Notifications retrieved successfully", map[string]interface{}{
		"notifications": notifications,
		"total":         total,
		"page":          page,
		"per_page":      perPage,
	})
}

// GetUnreadCount handles getting unread notification count
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	if tenantID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	var userIDPtr *string
	if userID != "" {
		userIDPtr = &userID
	}

	count, err := h.notificationService.GetUnreadCount(c.Request.Context(), tenantID, userIDPtr)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get unread count")
		return
	}

	response.OK(c, "Unread count retrieved successfully", map[string]interface{}{
		"unread_count": count,
	})
}

// MarkAsRead handles marking a notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	notificationID := c.Param("id")

	if tenantID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	if notificationID == "" {
		response.BadRequest(c, "VAL_2003", "Notification ID is required", nil)
		return
	}

	if err := h.notificationService.MarkAsRead(c.Request.Context(), tenantID, notificationID); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to mark notification as read")
		}
		return
	}

	response.OK(c, "Notification marked as read", nil)
}

// MarkAllAsRead handles marking all notifications as read
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	if tenantID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	var userIDPtr *string
	if userID != "" {
		userIDPtr = &userID
	}

	if err := h.notificationService.MarkAllAsRead(c.Request.Context(), tenantID, userIDPtr); err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to mark all notifications as read")
		return
	}

	response.OK(c, "All notifications marked as read", nil)
}

// DeleteNotification handles deleting a notification
func (h *NotificationHandler) DeleteNotification(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	notificationID := c.Param("id")

	if tenantID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	if notificationID == "" {
		response.BadRequest(c, "VAL_2003", "Notification ID is required", nil)
		return
	}

	if err := h.notificationService.DeleteNotification(c.Request.Context(), tenantID, notificationID); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to delete notification")
		}
		return
	}

	response.OK(c, "Notification deleted successfully", nil)
}


// Admin notification handlers

// GetAdminNotifications handles getting notifications for admin
func (h *NotificationHandler) GetAdminNotifications(c *gin.Context) {
	adminID := c.GetString("admin_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	unreadOnly := c.Query("unread_only") == "true"

	var adminIDPtr *string
	if adminID != "" {
		adminIDPtr = &adminID
	}

	notifications, total, err := h.notificationService.GetAdminNotifications(c.Request.Context(), adminIDPtr, page, perPage, unreadOnly)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get notifications")
		return
	}

	response.OK(c, "Notifications retrieved successfully", map[string]interface{}{
		"notifications": notifications,
		"total":         total,
		"page":          page,
		"per_page":      perPage,
	})
}

// GetAdminUnreadCount handles getting unread notification count for admin
func (h *NotificationHandler) GetAdminUnreadCount(c *gin.Context) {
	adminID := c.GetString("admin_id")

	var adminIDPtr *string
	if adminID != "" {
		adminIDPtr = &adminID
	}

	count, err := h.notificationService.GetAdminUnreadCount(c.Request.Context(), adminIDPtr)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get unread count")
		return
	}

	response.OK(c, "Unread count retrieved successfully", map[string]interface{}{
		"unread_count": count,
	})
}

// MarkAdminAsRead handles marking an admin notification as read
func (h *NotificationHandler) MarkAdminAsRead(c *gin.Context) {
	notificationID := c.Param("id")

	if notificationID == "" {
		response.BadRequest(c, "VAL_2003", "Notification ID is required", nil)
		return
	}

	if err := h.notificationService.MarkAdminAsRead(c.Request.Context(), notificationID); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to mark notification as read")
		}
		return
	}

	response.OK(c, "Notification marked as read", nil)
}

// MarkAllAdminAsRead handles marking all admin notifications as read
func (h *NotificationHandler) MarkAllAdminAsRead(c *gin.Context) {
	adminID := c.GetString("admin_id")

	var adminIDPtr *string
	if adminID != "" {
		adminIDPtr = &adminID
	}

	if err := h.notificationService.MarkAllAdminAsRead(c.Request.Context(), adminIDPtr); err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to mark all notifications as read")
		return
	}

	response.OK(c, "All notifications marked as read", nil)
}

// DeleteAdminNotification handles deleting an admin notification
func (h *NotificationHandler) DeleteAdminNotification(c *gin.Context) {
	notificationID := c.Param("id")

	if notificationID == "" {
		response.BadRequest(c, "VAL_2003", "Notification ID is required", nil)
		return
	}

	if err := h.notificationService.DeleteAdminNotification(c.Request.Context(), notificationID); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Failed to delete notification")
		}
		return
	}

	response.OK(c, "Notification deleted successfully", nil)
}

// SSE Handlers for real-time notifications

// StreamNotifications handles SSE stream for user notifications
func (h *NotificationHandler) StreamNotifications(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetString("user_id")

	if tenantID == "" {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("X-Accel-Buffering", "no")

	// Determine channel based on user
	channel := usecase.TenantNotificationChannel + tenantID
	if userID != "" {
		channel = usecase.UserNotificationChannel + userID
	}

	logger.Info("SSE: Client connected for notifications - tenant=%s, user=%s, channel=%s", tenantID, userID, channel)

	// Subscribe to Redis channel
	msgChan, cleanup := h.notificationService.SubscribeNotifications(c.Request.Context(), channel)
	defer cleanup()

	// Send initial connection event
	fmt.Fprintf(c.Writer, "event: connected\ndata: {\"status\":\"connected\",\"channel\":\"%s\"}\n\n", channel)
	c.Writer.Flush()

	// Stream notifications
	clientGone := c.Request.Context().Done()
	for {
		select {
		case msg, ok := <-msgChan:
			if !ok {
				return
			}
			fmt.Fprintf(c.Writer, "event: notification\ndata: %s\n\n", msg.Payload)
			c.Writer.Flush()
			logger.Info("SSE: Sent notification to tenant=%s, user=%s", tenantID, userID)
		case <-clientGone:
			logger.Info("SSE: Client disconnected - tenant=%s, user=%s", tenantID, userID)
			return
		}
	}
}

// SimplifiedStreamAdminNotifications - simpler version for admin SSE
func (h *NotificationHandler) SimplifiedStreamAdminNotifications(c *gin.Context) {
	adminID := c.GetString("admin_id")

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("X-Accel-Buffering", "no")

	logger.Info("SSE: Admin client connected - admin=%s", adminID)

	// Subscribe to global admin channel
	msgChan, cleanup := h.notificationService.SubscribeNotifications(c.Request.Context(), usecase.GlobalAdminChannel)
	defer cleanup()

	// Send initial connection event
	fmt.Fprintf(c.Writer, "event: connected\ndata: {\"status\":\"connected\"}\n\n")
	c.Writer.Flush()

	// Stream notifications
	clientGone := c.Request.Context().Done()
	for {
		select {
		case msg, ok := <-msgChan:
			if !ok {
				return
			}
			fmt.Fprintf(c.Writer, "event: notification\ndata: %s\n\n", msg.Payload)
			c.Writer.Flush()
			logger.Info("SSE: Sent notification to admin=%s", adminID)
		case <-clientGone:
			logger.Info("SSE: Admin client disconnected - admin=%s", adminID)
			return
		}
	}
}
