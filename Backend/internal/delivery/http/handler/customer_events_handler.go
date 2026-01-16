package handler

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/rtrwnet/saas-backend/pkg/logger"
)

// CustomerEvent represents a customer status change event
type CustomerEvent struct {
	Type       string      `json:"type"` // "online", "offline", "status_change"
	CustomerID string      `json:"customer_id"`
	TenantID   string      `json:"tenant_id"`
	Data       interface{} `json:"data"`
	Timestamp  time.Time   `json:"timestamp"`
}

// CustomerEventsHub manages SSE connections for customer events
type CustomerEventsHub struct {
	clients    map[string]map[chan CustomerEvent]bool // tenantID -> channels
	register   chan clientRegistration
	unregister chan clientRegistration
	broadcast  chan CustomerEvent
	mu         sync.RWMutex
}

type clientRegistration struct {
	tenantID string
	ch       chan CustomerEvent
}

// Global hub instance
var customerEventsHub *CustomerEventsHub
var hubOnce sync.Once

// GetCustomerEventsHub returns the singleton hub instance
func GetCustomerEventsHub() *CustomerEventsHub {
	hubOnce.Do(func() {
		customerEventsHub = &CustomerEventsHub{
			clients:    make(map[string]map[chan CustomerEvent]bool),
			register:   make(chan clientRegistration),
			unregister: make(chan clientRegistration),
			broadcast:  make(chan CustomerEvent, 100),
		}
		go customerEventsHub.run()
	})
	return customerEventsHub
}

func (h *CustomerEventsHub) run() {
	for {
		select {
		case reg := <-h.register:
			h.mu.Lock()
			if h.clients[reg.tenantID] == nil {
				h.clients[reg.tenantID] = make(map[chan CustomerEvent]bool)
			}
			h.clients[reg.tenantID][reg.ch] = true
			h.mu.Unlock()
			logger.Info("SSE client registered for tenant: %s", reg.tenantID)

		case reg := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[reg.tenantID]; ok {
				if _, ok := clients[reg.ch]; ok {
					delete(clients, reg.ch)
					close(reg.ch)
				}
			}
			h.mu.Unlock()
			logger.Info("SSE client unregistered for tenant: %s", reg.tenantID)

		case event := <-h.broadcast:
			h.mu.RLock()
			if clients, ok := h.clients[event.TenantID]; ok {
				for ch := range clients {
					select {
					case ch <- event:
					default:
						// Channel full, skip
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastEvent sends an event to all clients of a tenant
func (h *CustomerEventsHub) BroadcastEvent(event CustomerEvent) {
	select {
	case h.broadcast <- event:
	default:
		logger.Warn("Customer events broadcast channel full")
	}
}

// CustomerEventsHandler handles SSE connections for customer events
type CustomerEventsHandler struct {
	hub       *CustomerEventsHub
	jwtSecret string
}

// NewCustomerEventsHandler creates a new handler
func NewCustomerEventsHandler(jwtSecret string) *CustomerEventsHandler {
	return &CustomerEventsHandler{
		hub:       GetCustomerEventsHub(),
		jwtSecret: jwtSecret,
	}
}

// validateToken validates JWT token from query params
func (h *CustomerEventsHandler) validateToken(tokenString string) (string, error) {
	// Remove "Bearer " prefix if present
	tokenString = strings.TrimPrefix(tokenString, "Bearer ")

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(h.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid claims")
	}

	tenantID, ok := claims["tenant_id"].(string)
	if !ok || tenantID == "" {
		return "", fmt.Errorf("tenant_id not found in token")
	}

	return tenantID, nil
}

// StreamEvents handles SSE connection for customer events
func (h *CustomerEventsHandler) StreamEvents(c *gin.Context) {
	// Get token from query params (EventSource doesn't support headers)
	token := c.Query("token")
	if token == "" {
		c.JSON(401, gin.H{"error": "Token required"})
		return
	}

	// Validate token and get tenant ID
	tenantID, err := h.validateToken(token)
	if err != nil {
		logger.Warn("SSE auth failed: %v", err)
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	// Create channel for this client
	eventChan := make(chan CustomerEvent, 10)

	// Register client
	h.hub.register <- clientRegistration{tenantID: tenantID, ch: eventChan}

	// Cleanup on disconnect
	defer func() {
		h.hub.unregister <- clientRegistration{tenantID: tenantID, ch: eventChan}
	}()

	// Send initial ping
	c.SSEvent("ping", gin.H{"message": "connected", "tenant_id": tenantID})
	c.Writer.Flush()

	// Keep-alive ticker
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	clientGone := c.Request.Context().Done()

	for {
		select {
		case <-clientGone:
			logger.Info("SSE client disconnected for tenant: %s", tenantID)
			return

		case event := <-eventChan:
			data, _ := json.Marshal(event)
			c.SSEvent("customer_event", string(data))
			c.Writer.Flush()

		case <-ticker.C:
			c.SSEvent("ping", fmt.Sprintf(`{"time":"%s"}`, time.Now().Format(time.RFC3339)))
			c.Writer.Flush()
		}
	}
}

// Helper function to broadcast customer online event
func BroadcastCustomerOnline(tenantID, customerID, username, ipAddress string) {
	hub := GetCustomerEventsHub()
	hub.BroadcastEvent(CustomerEvent{
		Type:       "online",
		CustomerID: customerID,
		TenantID:   tenantID,
		Data: map[string]interface{}{
			"username":   username,
			"ip_address": ipAddress,
			"is_online":  true,
		},
		Timestamp: time.Now(),
	})
}

// Helper function to broadcast customer offline event
func BroadcastCustomerOffline(tenantID, customerID, username string) {
	hub := GetCustomerEventsHub()
	hub.BroadcastEvent(CustomerEvent{
		Type:       "offline",
		CustomerID: customerID,
		TenantID:   tenantID,
		Data: map[string]interface{}{
			"username":  username,
			"is_online": false,
		},
		Timestamp: time.Now(),
	})
}

// CustomerEventBroadcasterImpl implements the broadcaster interface
type CustomerEventBroadcasterImpl struct{}

func (b *CustomerEventBroadcasterImpl) BroadcastOnline(tenantID, customerID, username, ipAddress string) {
	BroadcastCustomerOnline(tenantID, customerID, username, ipAddress)
}

func (b *CustomerEventBroadcasterImpl) BroadcastOffline(tenantID, customerID, username string) {
	BroadcastCustomerOffline(tenantID, customerID, username)
}

// GetBroadcaster returns the broadcaster implementation
func GetBroadcaster() *CustomerEventBroadcasterImpl {
	return &CustomerEventBroadcasterImpl{}
}
