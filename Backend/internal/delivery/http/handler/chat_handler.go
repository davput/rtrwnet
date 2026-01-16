package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"github.com/rtrwnet/saas-backend/pkg/response"
	ws "github.com/rtrwnet/saas-backend/pkg/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

type ChatHandler struct {
	chatRepo  repository.ChatRepository
	hub       *ws.Hub
	jwtSecret string
}

func NewChatHandler(chatRepo repository.ChatRepository, hub *ws.Hub, jwtSecret string) *ChatHandler {
	return &ChatHandler{
		chatRepo:  chatRepo,
		hub:       hub,
		jwtSecret: jwtSecret,
	}
}

// validateToken validates JWT token and returns user ID
func (h *ChatHandler) validateToken(tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return "", err
	}
	
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", jwt.ErrTokenInvalidClaims
	}
	
	userID, ok := claims["user_id"].(string)
	if !ok {
		// Try admin_id for admin tokens
		userID, ok = claims["admin_id"].(string)
		if !ok {
			return "", jwt.ErrTokenInvalidClaims
		}
	}
	
	return userID, nil
}

// StartChat creates a new chat room for user
func (h *ChatHandler) StartChat(c *gin.Context) {
	userID := c.GetString("user_id")
	tenantID := c.GetString("tenant_id")
	
	if userID == "" || tenantID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	// Check if user already has an active chat
	existingRoom, _ := h.chatRepo.GetActiveRoomByUserID(c.Request.Context(), userID)
	if existingRoom != nil {
		response.OK(c, "Chat room found", existingRoom)
		return
	}

	var req struct {
		Subject  string `json:"subject"`
		UserName string `json:"user_name"`
		Email    string `json:"email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Invalid request", nil)
		return
	}

	room := &entity.ChatRoom{
		TenantID:  tenantID,
		UserID:    userID,
		UserName:  req.UserName,
		UserEmail: req.Email,
		Subject:   req.Subject,
		Status:    entity.ChatStatusWaiting,
	}

	if err := h.chatRepo.CreateRoom(c.Request.Context(), room); err != nil {
		logger.Error("Failed to create chat room: %v", err)
		response.InternalServerError(c, "SRV_9001", "Failed to create chat")
		return
	}

	// Notify admins about new chat request
	h.hub.BroadcastToAdmins(ws.ChatMessage{
		Type:       ws.MsgTypeRoomUpdate,
		RoomID:     room.ID,
		SenderName: req.UserName,
		Data:       room,
		Timestamp:  float64(time.Now().Unix()),
	})

	response.Created(c, "Chat started", room)
}

// GetUserChat gets user's active chat room
func (h *ChatHandler) GetUserChat(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	room, err := h.chatRepo.GetActiveRoomByUserID(c.Request.Context(), userID)
	if err != nil {
		response.NotFound(c, "CHAT_4001", "No active chat found")
		return
	}

	response.OK(c, "Chat room found", room)
}

// GetChatMessages gets messages for a chat room
func (h *ChatHandler) GetChatMessages(c *gin.Context) {
	roomID := c.Param("room_id")
	userID := c.GetString("user_id")
	
	// Verify user owns this room
	room, err := h.chatRepo.GetRoomByID(c.Request.Context(), roomID)
	if err != nil || room.UserID != userID {
		response.Forbidden(c, "CHAT_4003", "Access denied")
		return
	}

	messages, err := h.chatRepo.GetMessagesByRoomID(c.Request.Context(), roomID, 100)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get messages")
		return
	}

	// Mark messages as read
	h.chatRepo.MarkMessagesAsRead(c.Request.Context(), roomID, "user")

	response.OK(c, "Messages retrieved", messages)
}

// CloseChat closes a chat room
func (h *ChatHandler) CloseChat(c *gin.Context) {
	roomID := c.Param("room_id")
	userID := c.GetString("user_id")
	
	room, err := h.chatRepo.GetRoomByID(c.Request.Context(), roomID)
	if err != nil || room.UserID != userID {
		response.Forbidden(c, "CHAT_4003", "Access denied")
		return
	}

	now := time.Now()
	room.Status = entity.ChatStatusClosed
	room.ClosedAt = &now

	if err := h.chatRepo.UpdateRoom(c.Request.Context(), room); err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to close chat")
		return
	}

	// Notify room participants
	h.hub.BroadcastToRoom(roomID, ws.ChatMessage{
		Type:      ws.MsgTypeRoomUpdate,
		RoomID:    roomID,
		Data:      map[string]string{"status": "closed"},
		Timestamp: float64(time.Now().Unix()),
	})

	response.OK(c, "Chat closed", nil)
}

// WebSocket handler for user chat
func (h *ChatHandler) HandleUserWebSocket(c *gin.Context) {
	roomID := c.Param("room_id")
	userName := c.Query("name")
	token := c.Query("token")

	// Validate token from query param
	userID, err := h.validateToken(token)
	if err != nil {
		logger.Error("WebSocket auth failed: %v", err)
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	// Verify room access
	room, err := h.chatRepo.GetRoomByID(context.Background(), roomID)
	if err != nil || room.UserID != userID {
		c.JSON(403, gin.H{"error": "Access denied"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Error("WebSocket upgrade failed: %v", err)
		return
	}

	client := &ws.Client{
		ID:       userID,
		UserType: "user",
		RoomID:   roomID,
		Send:     make(chan []byte, 256),
		Hub:      h.hub,
	}

	h.hub.Register(client)

	go h.writePump(conn, client)
	go h.readPump(conn, client, userName)
}

// Admin handlers

// GetWaitingChats gets all waiting chat rooms for admin
func (h *ChatHandler) GetWaitingChats(c *gin.Context) {
	rooms, err := h.chatRepo.GetWaitingRooms(c.Request.Context())
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get chats")
		return
	}
	response.OK(c, "Waiting chats retrieved", rooms)
}

// GetAllActiveChats gets all active chats for admin
func (h *ChatHandler) GetAllActiveChats(c *gin.Context) {
	rooms, err := h.chatRepo.GetAllActiveRooms(c.Request.Context())
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get chats")
		return
	}
	response.OK(c, "Active chats retrieved", rooms)
}

// GetAdminChats gets chats assigned to admin
func (h *ChatHandler) GetAdminChats(c *gin.Context) {
	adminID := c.GetString("admin_id")
	rooms, err := h.chatRepo.GetRoomsByAdminID(c.Request.Context(), adminID)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get chats")
		return
	}
	response.OK(c, "Admin chats retrieved", rooms)
}

// JoinChat allows admin to join a chat room
func (h *ChatHandler) JoinChat(c *gin.Context) {
	roomID := c.Param("room_id")
	adminID := c.GetString("admin_id")
	adminName := c.GetString("admin_name")

	room, err := h.chatRepo.GetRoomByID(c.Request.Context(), roomID)
	if err != nil {
		response.NotFound(c, "CHAT_4001", "Chat not found")
		return
	}

	room.AdminID = &adminID
	room.AdminName = &adminName
	room.Status = entity.ChatStatusActive

	if err := h.chatRepo.UpdateRoom(c.Request.Context(), room); err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to join chat")
		return
	}

	// Notify room
	h.hub.BroadcastToRoom(roomID, ws.ChatMessage{
		Type:       ws.MsgTypeJoin,
		RoomID:     roomID,
		SenderID:   adminID,
		SenderName: adminName,
		SenderType: "admin",
		Timestamp:  float64(time.Now().Unix()),
	})

	response.OK(c, "Joined chat", room)
}

// GetAdminChatMessages gets messages for admin
func (h *ChatHandler) GetAdminChatMessages(c *gin.Context) {
	roomID := c.Param("room_id")

	messages, err := h.chatRepo.GetMessagesByRoomID(c.Request.Context(), roomID, 100)
	if err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to get messages")
		return
	}

	// Mark messages as read by admin
	h.chatRepo.MarkMessagesAsRead(c.Request.Context(), roomID, "admin")

	response.OK(c, "Messages retrieved", messages)
}

// AdminCloseChat closes a chat room by admin
func (h *ChatHandler) AdminCloseChat(c *gin.Context) {
	roomID := c.Param("room_id")

	room, err := h.chatRepo.GetRoomByID(c.Request.Context(), roomID)
	if err != nil {
		response.NotFound(c, "CHAT_4001", "Chat not found")
		return
	}

	now := time.Now()
	room.Status = entity.ChatStatusClosed
	room.ClosedAt = &now

	if err := h.chatRepo.UpdateRoom(c.Request.Context(), room); err != nil {
		response.InternalServerError(c, "SRV_9001", "Failed to close chat")
		return
	}

	h.hub.BroadcastToRoom(roomID, ws.ChatMessage{
		Type:      ws.MsgTypeRoomUpdate,
		RoomID:    roomID,
		Data:      map[string]string{"status": "closed"},
		Timestamp: float64(time.Now().Unix()),
	})

	response.OK(c, "Chat closed", nil)
}

// WebSocket handler for admin chat
func (h *ChatHandler) HandleAdminWebSocket(c *gin.Context) {
	roomID := c.Param("room_id")
	adminName := c.Query("name")
	token := c.Query("token")

	// Validate token from query param
	adminID, err := h.validateToken(token)
	if err != nil {
		logger.Error("WebSocket admin auth failed: %v", err)
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Error("WebSocket upgrade failed: %v", err)
		return
	}

	client := &ws.Client{
		ID:       adminID,
		UserType: "admin",
		RoomID:   roomID,
		Send:     make(chan []byte, 256),
		Hub:      h.hub,
	}

	h.hub.Register(client)

	go h.writePump(conn, client)
	go h.readPump(conn, client, adminName)
}

// writePump pumps messages from hub to websocket connection
func (h *ChatHandler) writePump(conn *websocket.Conn, client *ws.Client) {
	defer func() {
		conn.Close()
	}()

	for message := range client.Send {
		if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
			return
		}
	}
}

// readPump pumps messages from websocket to hub
func (h *ChatHandler) readPump(conn *websocket.Conn, client *ws.Client, senderName string) {
	defer func() {
		h.hub.Unregister(client)
		conn.Close()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			logger.Info("WebSocket read error for client %s: %v", client.ID, err)
			break
		}

		logger.Info("Received WebSocket message from %s (%s): %s", client.ID, client.UserType, string(message))

		var msg ws.ChatMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			logger.Error("Failed to unmarshal message: %v", err)
			continue
		}

		msg.SenderID = client.ID
		msg.SenderName = senderName
		msg.SenderType = client.UserType
		msg.RoomID = client.RoomID
		msg.Timestamp = float64(time.Now().Unix())

		// Save message to database
		if msg.Type == ws.MsgTypeChat && msg.Message != "" {
			ctx := context.Background()
			dbMsg := &entity.ChatMessage{
				RoomID:     client.RoomID,
				SenderID:   client.ID,
				SenderName: senderName,
				SenderType: client.UserType,
				Message:    msg.Message,
			}
			if err := h.chatRepo.CreateMessage(ctx, dbMsg); err != nil {
				logger.Error("Failed to save chat message: %v", err)
			} else {
				logger.Info("Chat message saved to database for room %s", client.RoomID)
			}

			// Update room's last message
			room, _ := h.chatRepo.GetRoomByID(ctx, client.RoomID)
			if room != nil {
				room.LastMessage = &msg.Message
				now := time.Now()
				room.LastMsgAt = &now
				h.chatRepo.UpdateRoom(ctx, room)
			}
		}

		// Broadcast to room
		logger.Info("Broadcasting message to room %s", client.RoomID)
		h.hub.BroadcastToRoom(client.RoomID, msg)
	}
}
