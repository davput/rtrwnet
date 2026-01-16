package websocket

import (
	"context"
	"encoding/json"
	"sync"

	"github.com/redis/go-redis/v9"
	"github.com/rtrwnet/saas-backend/pkg/logger"
)

// Message types
const (
	MsgTypeChat       = "chat"
	MsgTypeJoin       = "join"
	MsgTypeLeave      = "leave"
	MsgTypeTyping     = "typing"
	MsgTypeRead       = "read"
	MsgTypeRoomUpdate = "room_update"
)

// Redis channel names
const (
	RedisChatChannel  = "chat:messages"
	RedisAdminChannel = "chat:admin"
)

// ChatMessage represents a WebSocket message
type ChatMessage struct {
	Type       string      `json:"type"`
	RoomID     string      `json:"room_id"`
	SenderID   string      `json:"sender_id"`
	SenderName string      `json:"sender_name"`
	SenderType string      `json:"sender_type"`
	Message    string      `json:"message,omitempty"`
	Data       interface{} `json:"data,omitempty"`
	Timestamp  float64     `json:"timestamp"`
}

// RedisMessage wraps message with target info for Redis pub/sub
type RedisMessage struct {
	Target  string      `json:"target"`  // "room" or "admins"
	RoomID  string      `json:"room_id"` // for room messages
	Payload interface{} `json:"payload"`
}

// Client represents a WebSocket client
type Client struct {
	ID       string
	UserType string // "user" or "admin"
	RoomID   string
	Send     chan []byte
	Hub      *Hub
}

// Hub maintains active clients and broadcasts messages
type Hub struct {
	// Registered clients by room
	rooms map[string]map[*Client]bool
	
	// All admin clients (for broadcasting new chat requests)
	admins map[*Client]bool

	// Register requests
	register chan *Client

	// Unregister requests
	unregister chan *Client

	// Broadcast to room
	broadcast chan *RoomMessage

	// Broadcast to all admins
	adminBroadcast chan []byte

	// Redis client for pub/sub
	redisClient *redis.Client

	mu sync.RWMutex
}

type RoomMessage struct {
	RoomID  string
	Message []byte
}

// NewHub creates a new Hub
func NewHub() *Hub {
	return &Hub{
		rooms:          make(map[string]map[*Client]bool),
		admins:         make(map[*Client]bool),
		register:       make(chan *Client),
		unregister:     make(chan *Client),
		broadcast:      make(chan *RoomMessage),
		adminBroadcast: make(chan []byte),
	}
}

// NewHubWithRedis creates a new Hub with Redis support
func NewHubWithRedis(redisClient *redis.Client) *Hub {
	hub := &Hub{
		rooms:          make(map[string]map[*Client]bool),
		admins:         make(map[*Client]bool),
		register:       make(chan *Client),
		unregister:     make(chan *Client),
		broadcast:      make(chan *RoomMessage),
		adminBroadcast: make(chan []byte),
		redisClient:    redisClient,
	}
	return hub
}

// Run starts the hub
func (h *Hub) Run() {
	// Start Redis subscriber if Redis is configured
	if h.redisClient != nil {
		go h.subscribeRedis()
	}

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.rooms[client.RoomID]; !ok {
				h.rooms[client.RoomID] = make(map[*Client]bool)
			}
			h.rooms[client.RoomID][client] = true
			
			if client.UserType == "admin" {
				h.admins[client] = true
			}
			h.mu.Unlock()
			
			logger.Info("Client registered: %s (type: %s, room: %s)", client.ID, client.UserType, client.RoomID)

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.rooms[client.RoomID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.rooms, client.RoomID)
					}
				}
			}
			delete(h.admins, client)
			h.mu.Unlock()
			
			logger.Info("Client unregistered: %s", client.ID)

		case roomMsg := <-h.broadcast:
			h.broadcastToRoomLocal(roomMsg.RoomID, roomMsg.Message)

		case message := <-h.adminBroadcast:
			h.broadcastToAdminsLocal(message)
		}
	}
}

// subscribeRedis subscribes to Redis channels for cross-instance messaging
func (h *Hub) subscribeRedis() {
	ctx := context.Background()
	pubsub := h.redisClient.Subscribe(ctx, RedisChatChannel, RedisAdminChannel)
	defer pubsub.Close()

	logger.Info("Redis pub/sub subscriber started")

	for msg := range pubsub.Channel() {
		var redisMsg RedisMessage
		if err := json.Unmarshal([]byte(msg.Payload), &redisMsg); err != nil {
			logger.Error("Failed to unmarshal Redis message: %v", err)
			continue
		}

		payloadBytes, err := json.Marshal(redisMsg.Payload)
		if err != nil {
			logger.Error("Failed to marshal payload: %v", err)
			continue
		}

		switch redisMsg.Target {
		case "room":
			h.broadcastToRoomLocal(redisMsg.RoomID, payloadBytes)
		case "admins":
			h.broadcastToAdminsLocal(payloadBytes)
		}
	}
}

// broadcastToRoomLocal sends message to local clients in a room
func (h *Hub) broadcastToRoomLocal(roomID string, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	
	if clients, ok := h.rooms[roomID]; ok {
		for client := range clients {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(clients, client)
			}
		}
	}
}

// broadcastToAdminsLocal sends message to local admin clients
func (h *Hub) broadcastToAdminsLocal(message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	
	for client := range h.admins {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(h.admins, client)
		}
	}
}

// Register adds a client to the hub
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister removes a client from the hub
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// BroadcastToRoom sends a message to all clients in a room
func (h *Hub) BroadcastToRoom(roomID string, message interface{}) {
	data, err := json.Marshal(message)
	if err != nil {
		logger.Error("Failed to marshal message: %v", err)
		return
	}

	// Always broadcast locally first for immediate delivery
	h.broadcast <- &RoomMessage{RoomID: roomID, Message: data}

	// If Redis is configured, also publish to Redis for cross-instance delivery
	if h.redisClient != nil {
		redisMsg := RedisMessage{
			Target:  "room",
			RoomID:  roomID,
			Payload: message,
		}
		msgBytes, _ := json.Marshal(redisMsg)
		if err := h.redisClient.Publish(context.Background(), RedisChatChannel, msgBytes).Err(); err != nil {
			logger.Error("Failed to publish to Redis: %v", err)
		}
	}
}

// BroadcastToAdmins sends a message to all admin clients
func (h *Hub) BroadcastToAdmins(message interface{}) {
	data, err := json.Marshal(message)
	if err != nil {
		logger.Error("Failed to marshal admin message: %v", err)
		return
	}

	// Always broadcast locally first for immediate delivery
	h.adminBroadcast <- data

	// If Redis is configured, also publish to Redis for cross-instance delivery
	if h.redisClient != nil {
		redisMsg := RedisMessage{
			Target:  "admins",
			Payload: message,
		}
		msgBytes, _ := json.Marshal(redisMsg)
		if err := h.redisClient.Publish(context.Background(), RedisAdminChannel, msgBytes).Err(); err != nil {
			logger.Error("Failed to publish to Redis: %v", err)
		}
	}
}

// GetRoomClientCount returns the number of clients in a room
func (h *Hub) GetRoomClientCount(roomID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if clients, ok := h.rooms[roomID]; ok {
		return len(clients)
	}
	return 0
}
