package radius

import (
	"context"
	"crypto/hmac"
	"crypto/md5"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"gorm.io/gorm"
	"layeh.com/radius"
	"layeh.com/radius/rfc2865"
	"layeh.com/radius/rfc2866"
)

// RadiusServer handles RADIUS authentication and accounting
type RadiusServer struct {
	db              *gorm.DB
	authServer      *radius.PacketServer
	acctServer      *radius.PacketServer
	authAddr        string
	acctAddr        string
	running         bool
	mu              sync.RWMutex
	activeSessions  map[string]*ActiveSession
}

// ActiveSession represents an active PPPoE session
type ActiveSession struct {
	Username      string
	SessionID     string
	NASIPAddress  string
	FramedIP      string
	StartTime     time.Time
	InputOctets   int64
	OutputOctets  int64
	CustomerID    string
	TenantID      string
}

// Config for RADIUS server
type Config struct {
	AuthPort int
	AcctPort int
}

// NewRadiusServer creates a new RADIUS server instance
func NewRadiusServer(db *gorm.DB, cfg *Config) *RadiusServer {
	if cfg == nil {
		cfg = &Config{
			AuthPort: 1812,
			AcctPort: 1813,
		}
	}

	return &RadiusServer{
		db:             db,
		authAddr:       fmt.Sprintf(":%d", cfg.AuthPort),
		acctAddr:       fmt.Sprintf(":%d", cfg.AcctPort),
		activeSessions: make(map[string]*ActiveSession),
	}
}

// Start starts the RADIUS server
func (s *RadiusServer) Start() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running {
		return fmt.Errorf("RADIUS server already running")
	}

	// Start Authentication server
	s.authServer = &radius.PacketServer{
		Addr:         s.authAddr,
		Network:      "udp",
		SecretSource: s,
		Handler:      radius.HandlerFunc(s.handleAuth),
	}

	// Start Accounting server
	s.acctServer = &radius.PacketServer{
		Addr:         s.acctAddr,
		Network:      "udp",
		SecretSource: s,
		Handler:      radius.HandlerFunc(s.handleAcct),
	}

	// Start auth server in goroutine
	go func() {
		logger.Info("RADIUS Auth server starting on %s", s.authAddr)
		if err := s.authServer.ListenAndServe(); err != nil {
			log.Printf("RADIUS Auth server error: %v", err)
		}
	}()

	// Start accounting server in goroutine
	go func() {
		logger.Info("RADIUS Accounting server starting on %s", s.acctAddr)
		if err := s.acctServer.ListenAndServe(); err != nil {
			log.Printf("RADIUS Accounting server error: %v", err)
		}
	}()

	s.running = true
	logger.Info("RADIUS server started (Auth: %s, Acct: %s)", s.authAddr, s.acctAddr)
	return nil
}

// Stop stops the RADIUS server
func (s *RadiusServer) Stop() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running {
		return nil
	}

	if s.authServer != nil {
		s.authServer.Shutdown(context.Background())
	}
	if s.acctServer != nil {
		s.acctServer.Shutdown(context.Background())
	}

	s.running = false
	logger.Info("RADIUS server stopped")
	return nil
}

// RADIUSSecret implements radius.SecretSource
func (s *RadiusServer) RADIUSSecret(ctx context.Context, remoteAddr net.Addr) ([]byte, error) {
	// Get NAS IP from remote address
	host, _, err := net.SplitHostPort(remoteAddr.String())
	if err != nil {
		host = remoteAddr.String()
	}

	// Find NAS by IP to get configured secret
	var nas entity.RadiusNAS
	if err := s.db.Where("nasname = ? AND is_active = ?", host, true).First(&nas).Error; err == nil {
		logger.Info("RADIUS request from: %s, using NAS '%s' secret: '%s'", host, nas.ShortName, nas.Secret)
		return []byte(nas.Secret), nil
	}

	// Try any active NAS as fallback
	if err := s.db.Where("is_active = ?", true).First(&nas).Error; err == nil {
		logger.Info("RADIUS request from: %s, using fallback NAS '%s' secret: '%s'", host, nas.ShortName, nas.Secret)
		return []byte(nas.Secret), nil
	}

	// Default fallback
	secret := "testing123"
	logger.Warn("RADIUS request from: %s, no NAS found - using default secret: '%s'", host, secret)
	return []byte(secret), nil
}

// getSecret returns the RADIUS secret for a given remote address
func (s *RadiusServer) getSecret(remoteAddr net.Addr) []byte {
	secret, _ := s.RADIUSSecret(context.Background(), remoteAddr)
	return secret
}

// addMessageAuthenticator adds Message-Authenticator attribute (type 80) to the response
// This is calculated as HMAC-MD5 of the entire packet with the attribute set to 16 zero bytes
func addMessageAuthenticator(response *radius.Packet, secret []byte) {
	// Message-Authenticator is attribute type 80
	// First, add a placeholder (16 zero bytes)
	placeholder := make([]byte, 16)
	response.Add(80, placeholder)

	// Encode the packet to get the raw bytes
	encoded, err := response.Encode()
	if err != nil {
		logger.Error("RADIUS: Failed to encode packet for Message-Authenticator: %v", err)
		return
	}

	// Calculate HMAC-MD5 over the entire packet
	h := hmac.New(md5.New, secret)
	h.Write(encoded)
	msgAuth := h.Sum(nil)

	// Replace the placeholder with actual HMAC
	// We need to find and replace the Message-Authenticator attribute
	response.Set(80, msgAuth)
}


// handleAuth handles RADIUS authentication requests
func (s *RadiusServer) handleAuth(w radius.ResponseWriter, r *radius.Request) {
	username := rfc2865.UserName_GetString(r.Packet)
	password := rfc2865.UserPassword_GetString(r.Packet)
	nasIP := rfc2865.NASIPAddress_Get(r.Packet)

	logger.Info("RADIUS Auth request: user=%s, nas=%s, pass_len=%d", username, nasIP, len(password))

	// Check if this is a hotspot voucher request
	// Hotspot vouchers are identified by checking if username exists in hotspot_vouchers table
	var voucherCount int64
	s.db.Model(&entity.HotspotVoucher{}).Where("voucher_code = ?", username).Count(&voucherCount)
	if voucherCount > 0 {
		logger.Info("RADIUS: Detected hotspot voucher request for: %s", username)
		s.handleHotspotAuth(w, r)
		return
	}

	// Find user by username (PPPoE user)
	var user entity.RadiusUser
	if err := s.db.Where("username = ? AND is_active = ?", username, true).First(&user).Error; err != nil {
		logger.Warn("RADIUS Auth failed: user not found: %s, error: %v", username, err)
		if err := w.Write(r.Response(radius.CodeAccessReject)); err != nil {
			logger.Error("RADIUS: Failed to send Access-Reject: %v", err)
		}
		return
	}

	// Check password (for PAP) - trim spaces just in case
	storedPass := user.PasswordPlain
	receivedPass := password
	
	logger.Info("RADIUS Auth: stored_pass='%s' (%d), received_pass='%s' (%d)", 
		storedPass, len(storedPass), receivedPass, len(receivedPass))

	if storedPass != receivedPass {
		logger.Warn("RADIUS Auth failed: wrong password for user: %s", username)
		if err := w.Write(r.Response(radius.CodeAccessReject)); err != nil {
			logger.Error("RADIUS: Failed to send Access-Reject: %v", err)
		}
		return
	}

	if user.ExpireDate != nil && time.Now().After(*user.ExpireDate) {
		logger.Warn("RADIUS Auth failed: user expired: %s", username)
		if err := w.Write(r.Response(radius.CodeAccessReject)); err != nil {
			logger.Error("RADIUS: Failed to send Access-Reject: %v", err)
		}
		return
	}

	// Build Access-Accept response
	response := r.Response(radius.CodeAccessAccept)

	// Add Framed-IP-Address if static IP is set
	if user.IPAddress != "" {
		ip := net.ParseIP(user.IPAddress)
		if ip != nil {
			rfc2865.FramedIPAddress_Set(response, ip)
		}
	}

	// Get rate limit from Customer's Service Plan (Paket Internet)
	if user.CustomerID != nil {
		var customer entity.Customer
		if err := s.db.Preload("ServicePlan").Where("id = ?", *user.CustomerID).First(&customer).Error; err == nil {
			if customer.ServicePlan != nil {
				// Convert Mbps to kbps (MikroTik uses kbps)
				downloadKbps := customer.ServicePlan.SpeedDownload * 1000
				uploadKbps := customer.ServicePlan.SpeedUpload * 1000

				// Format: rx-rate/tx-rate (download/upload from user perspective)
				// MikroTik format: upload/download from router perspective
				rateLimit := fmt.Sprintf("%dk/%dk", uploadKbps, downloadKbps)

				// Check for burst settings
				var advSettings entity.ServicePlanAdvancedSettings
				if err := s.db.Where("service_plan_id = ?", customer.ServicePlan.ID).First(&advSettings).Error; err == nil {
					if advSettings.BurstEnabled && advSettings.BurstLimit > 0 {
						burstKbps := advSettings.BurstLimit * 1000
						thresholdKbps := advSettings.BurstThreshold * 1000
						rateLimit = fmt.Sprintf("%dk/%dk %dk/%dk %dk/%dk %d/%d",
							uploadKbps, downloadKbps,
							burstKbps, burstKbps,
							thresholdKbps, thresholdKbps,
							advSettings.BurstTime, advSettings.BurstTime)
					}
				}

				logger.Info("RADIUS: Setting rate limit for %s: %s (Plan: %s)", username, rateLimit, customer.ServicePlan.Name)

				// MikroTik Vendor ID
				mikrotikVendorID := uint32(14988)

				// Add Mikrotik-Rate-Limit (Type 8)
				rateLimitVSA := buildMikrotikVSA(mikrotikVendorID, 8, []byte(rateLimit))
				response.Add(26, rateLimitVSA)

				// Add Mikrotik-Group (Type 26) - PPP Profile name based on service plan
				// Use service plan name as profile name (sanitized)
				profileName := customer.ServicePlan.Name
				groupVSA := buildMikrotikVSA(mikrotikVendorID, 26, []byte(profileName))
				response.Add(26, groupVSA)

				logger.Info("RADIUS: Setting profile for %s: %s", username, profileName)
			}
		}
	}

	// Update customer online status
	if user.CustomerID != nil {
		s.db.Model(&entity.Customer{}).Where("id = ?", *user.CustomerID).Updates(map[string]interface{}{
			"is_online": true,
			"last_seen": time.Now(),
		})
	}

	// Message-Authenticator disabled - set MikroTik: /radius set 0 require-message-auth=no
	// TODO: Implement proper Message-Authenticator calculation later

	logger.Info("RADIUS Auth success: user=%s, sending Access-Accept", username)
	if err := w.Write(response); err != nil {
		logger.Error("RADIUS: Failed to send Access-Accept for %s: %v", username, err)
	} else {
		logger.Info("RADIUS: Access-Accept sent successfully for %s", username)
	}
}

// handleAcct handles RADIUS accounting requests
func (s *RadiusServer) handleAcct(w radius.ResponseWriter, r *radius.Request) {
	acctStatusType := rfc2866.AcctStatusType_Get(r.Packet)
	username := rfc2865.UserName_GetString(r.Packet)
	sessionID := rfc2866.AcctSessionID_GetString(r.Packet)
	nasIP := rfc2865.NASIPAddress_Get(r.Packet)
	framedIP := rfc2865.FramedIPAddress_Get(r.Packet)

	logger.Info("RADIUS Acct request: type=%d, user=%s, session=%s", acctStatusType, username, sessionID)

	// Check if this is a hotspot voucher request
	var voucherCount int64
	s.db.Model(&entity.HotspotVoucher{}).Where("voucher_code = ?", username).Count(&voucherCount)
	if voucherCount > 0 {
		logger.Info("RADIUS: Detected hotspot accounting request for: %s", username)
		s.handleHotspotAcct(w, r)
		return
	}

	switch acctStatusType {
	case rfc2866.AcctStatusType_Value_Start:
		s.handleAcctStart(username, sessionID, nasIP, framedIP)
	case rfc2866.AcctStatusType_Value_Stop:
		s.handleAcctStop(r, username, sessionID)
	case rfc2866.AcctStatusType_Value_InterimUpdate:
		s.handleAcctInterim(r, username, sessionID)
	}

	// Always respond with Accounting-Response
	w.Write(r.Response(radius.CodeAccountingResponse))
}

func (s *RadiusServer) handleAcctStart(username, sessionID string, nasIP, framedIP net.IP) {
	// Find user
	var user entity.RadiusUser
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		return
	}

	// Create accounting record
	acct := &entity.RadiusAccounting{
		TenantID:        user.TenantID,
		Username:        username,
		AcctSessionID:   sessionID,
		NASIPAddress:    nasIP.String(),
		FramedIPAddress: framedIP.String(),
		AcctStartTime:   timePtr(time.Now()),
	}
	s.db.Create(acct)

	// Store active session
	s.mu.Lock()
	s.activeSessions[sessionID] = &ActiveSession{
		Username:     username,
		SessionID:    sessionID,
		NASIPAddress: nasIP.String(),
		FramedIP:     framedIP.String(),
		StartTime:    time.Now(),
		TenantID:     user.TenantID,
	}
	if user.CustomerID != nil {
		s.activeSessions[sessionID].CustomerID = *user.CustomerID
	}
	s.mu.Unlock()

	// Update customer status
	if user.CustomerID != nil {
		s.db.Model(&entity.Customer{}).Where("id = ?", *user.CustomerID).Updates(map[string]interface{}{
			"is_online":   true,
			"ip_address":  framedIP.String(),
			"last_seen":   time.Now(),
		})

		// Broadcast online event via SSE
		BroadcastCustomerOnline(user.TenantID, *user.CustomerID, username, framedIP.String())
	}

	logger.Info("RADIUS Session started: user=%s, session=%s, ip=%s", username, sessionID, framedIP)
}

func (s *RadiusServer) handleAcctStop(r *radius.Request, username, sessionID string) {
	inputOctets := int64(rfc2866.AcctInputOctets_Get(r.Packet))
	outputOctets := int64(rfc2866.AcctOutputOctets_Get(r.Packet))
	sessionTime := int(rfc2866.AcctSessionTime_Get(r.Packet))
	terminateCause := rfc2866.AcctTerminateCause_Get(r.Packet)

	// Update accounting record
	s.db.Model(&entity.RadiusAccounting{}).
		Where("acct_session_id = ?", sessionID).
		Updates(map[string]interface{}{
			"acct_stop_time":       time.Now(),
			"acct_session_time":    sessionTime,
			"acct_input_octets":    inputOctets,
			"acct_output_octets":   outputOctets,
			"acct_terminate_cause": fmt.Sprintf("%d", terminateCause),
		})

	// Remove from active sessions
	s.mu.Lock()
	session, exists := s.activeSessions[sessionID]
	if exists {
		delete(s.activeSessions, sessionID)
	}
	s.mu.Unlock()

	// Update customer status
	if exists && session.CustomerID != "" {
		s.db.Model(&entity.Customer{}).Where("id = ?", session.CustomerID).Updates(map[string]interface{}{
			"is_online":  false,
			"last_seen":  time.Now(),
		})

		// Broadcast offline event via SSE
		BroadcastCustomerOffline(session.TenantID, session.CustomerID, username)
	}

	logger.Info("RADIUS Session stopped: user=%s, session=%s, time=%ds, in=%d, out=%d",
		username, sessionID, sessionTime, inputOctets, outputOctets)
}

func (s *RadiusServer) handleAcctInterim(r *radius.Request, username, sessionID string) {
	inputOctets := int64(rfc2866.AcctInputOctets_Get(r.Packet))
	outputOctets := int64(rfc2866.AcctOutputOctets_Get(r.Packet))
	sessionTime := int(rfc2866.AcctSessionTime_Get(r.Packet))

	// Update accounting record
	s.db.Model(&entity.RadiusAccounting{}).
		Where("acct_session_id = ?", sessionID).
		Updates(map[string]interface{}{
			"acct_session_time":  sessionTime,
			"acct_input_octets":  inputOctets,
			"acct_output_octets": outputOctets,
		})

	// Update active session
	s.mu.Lock()
	if session, exists := s.activeSessions[sessionID]; exists {
		session.InputOctets = inputOctets
		session.OutputOctets = outputOctets
	}
	s.mu.Unlock()

	// Update customer last_seen
	var user entity.RadiusUser
	if err := s.db.Where("username = ?", username).First(&user).Error; err == nil && user.CustomerID != nil {
		s.db.Model(&entity.Customer{}).Where("id = ?", *user.CustomerID).Update("last_seen", time.Now())
	}
}

// GetActiveSessions returns all active sessions
func (s *RadiusServer) GetActiveSessions() []*ActiveSession {
	s.mu.RLock()
	defer s.mu.RUnlock()

	sessions := make([]*ActiveSession, 0, len(s.activeSessions))
	for _, session := range s.activeSessions {
		sessions = append(sessions, session)
	}
	return sessions
}

// GetActiveSessionsByTenant returns active sessions for a tenant
func (s *RadiusServer) GetActiveSessionsByTenant(tenantID string) []*ActiveSession {
	s.mu.RLock()
	defer s.mu.RUnlock()

	sessions := make([]*ActiveSession, 0)
	for _, session := range s.activeSessions {
		if session.TenantID == tenantID {
			sessions = append(sessions, session)
		}
	}
	return sessions
}

// DisconnectUser sends CoA disconnect to NAS (placeholder)
func (s *RadiusServer) DisconnectUser(username string) error {
	// TODO: Implement CoA (Change of Authorization) to disconnect user
	// This requires sending a Disconnect-Request to the NAS
	logger.Info("Disconnect request for user: %s", username)
	return nil
}

func timePtr(t time.Time) *time.Time {
	return &t
}

// buildMikrotikVSA builds a MikroTik Vendor-Specific Attribute
// Vendor ID: 14988 (MikroTik)
// Format: Vendor-ID (4 bytes big-endian) + Type (1 byte) + Length (1 byte) + Value
func buildMikrotikVSA(vendorID uint32, attrType byte, value []byte) []byte {
	vsa := make([]byte, 0, 6+len(value))
	vsa = append(vsa, byte(vendorID>>24), byte(vendorID>>16), byte(vendorID>>8), byte(vendorID))
	vsa = append(vsa, attrType, byte(len(value)+2))
	vsa = append(vsa, value...)
	return vsa
}

// CustomerEventBroadcaster interface for broadcasting customer events
type CustomerEventBroadcaster interface {
	BroadcastOnline(tenantID, customerID, username, ipAddress string)
	BroadcastOffline(tenantID, customerID, username string)
}

var customerEventBroadcaster CustomerEventBroadcaster

// SetCustomerEventBroadcaster sets the broadcaster for customer events
func SetCustomerEventBroadcaster(b CustomerEventBroadcaster) {
	customerEventBroadcaster = b
}

// BroadcastCustomerOnline broadcasts customer online event
func BroadcastCustomerOnline(tenantID, customerID, username, ipAddress string) {
	if customerEventBroadcaster != nil {
		customerEventBroadcaster.BroadcastOnline(tenantID, customerID, username, ipAddress)
	}
}

// BroadcastCustomerOffline broadcasts customer offline event
func BroadcastCustomerOffline(tenantID, customerID, username string) {
	if customerEventBroadcaster != nil {
		customerEventBroadcaster.BroadcastOffline(tenantID, customerID, username)
	}
}
