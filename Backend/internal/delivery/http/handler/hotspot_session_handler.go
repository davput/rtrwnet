package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type HotspotSessionHandler struct {
	sessionService usecase.HotspotSessionService
}

func NewHotspotSessionHandler(sessionService usecase.HotspotSessionService) *HotspotSessionHandler {
	return &HotspotSessionHandler{
		sessionService: sessionService,
	}
}

// GetActiveSessions godoc
// @Summary Get active hotspot sessions
// @Tags Hotspot
// @Produce json
// @Success 200 {object} response.Response{data=[]dto.SessionResponse}
// @Router /api/v1/tenant/hotspot/sessions [get]
func (h *HotspotSessionHandler) GetActiveSessions(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	sessions, err := h.sessionService.GetActiveSessions(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to get active sessions", map[string]interface{}{"error": err.Error()})
		return
	}

	sessionResponses := make([]dto.SessionResponse, len(sessions))
	for i, s := range sessions {
		sessionResponses[i] = toSessionResponse(s)
	}

	response.Success(c, http.StatusOK, "Active sessions retrieved successfully", sessionResponses)
}

// DisconnectSession godoc
// @Summary Disconnect hotspot session
// @Tags Hotspot
// @Accept json
// @Produce json
// @Param id path string true "Session ID"
// @Success 200 {object} response.Response
// @Router /api/v1/tenant/hotspot/sessions/{id}/disconnect [post]
func (h *HotspotSessionHandler) DisconnectSession(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "AUTH_1002", "Unauthorized", nil)
		return
	}

	sessionID := c.Param("id")
	if sessionID == "" {
		response.Error(c, http.StatusBadRequest, "VAL_2001", "Session ID required", nil)
		return
	}

	if err := h.sessionService.DisconnectSession(c.Request.Context(), tenantID, sessionID); err != nil {
		response.Error(c, http.StatusInternalServerError, "SRV_9001", "Failed to disconnect session", map[string]interface{}{"error": err.Error()})
		return
	}

	response.Success(c, http.StatusOK, "Session disconnected successfully", nil)
}

func toSessionResponse(s *entity.HotspotSession) dto.SessionResponse {
	return dto.SessionResponse{
		SessionID:     s.SessionID,
		Username:      s.Username,
		IPAddress:     s.IPAddress,
		MACAddress:    s.MACAddress,
		NASIPAddress:  s.NASIPAddress,
		StartTime:     s.StartTime.Format("2006-01-02 15:04:05"),
		Duration:      s.GetDurationFormatted(),
		UploadBytes:   s.UploadBytes,
		DownloadBytes: s.DownloadBytes,
		PackageName:   s.PackageName,
		Status:        s.Status,
	}
}
