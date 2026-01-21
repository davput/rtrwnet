package radius

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"golang.org/x/crypto/bcrypt"
	"layeh.com/radius"
	"layeh.com/radius/rfc2865"
	"layeh.com/radius/rfc2866"
)

// handleHotspotAuth handles RADIUS authentication for hotspot vouchers
func (s *RadiusServer) handleHotspotAuth(w radius.ResponseWriter, r *radius.Request) {
	username := rfc2865.UserName_GetString(r.Packet)
	password := rfc2865.UserPassword_GetString(r.Packet)
	nasIP := rfc2865.NASIPAddress_Get(r.Packet)
	callingStationID := rfc2865.CallingStationID_GetString(r.Packet) // MAC address

	logger.Info("RADIUS Hotspot Auth request: user=%s, nas=%s, mac=%s", username, nasIP, callingStationID)

	// Get tenant ID from NAS
	tenantID, err := s.getTenantIDFromNAS(nasIP.String())
	if err != nil {
		logger.Warn("RADIUS Hotspot Auth failed: cannot identify tenant from NAS %s: %v", nasIP, err)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	// Find voucher by code
	var voucher entity.HotspotVoucher
	if err := s.db.Preload("Package").
		Where("tenant_id = ? AND voucher_code = ?", tenantID, username).
		First(&voucher).Error; err != nil {
		logger.Warn("RADIUS Hotspot Auth failed: voucher not found: %s", username)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(voucher.VoucherPassword), []byte(password)); err != nil {
		logger.Warn("RADIUS Hotspot Auth failed: wrong password for voucher: %s", username)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	// Check voucher status
	if voucher.Status == entity.VoucherStatusExpired {
		logger.Warn("RADIUS Hotspot Auth failed: voucher expired: %s", username)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	// Check if voucher has expired by time
	if voucher.IsExpired() {
		logger.Warn("RADIUS Hotspot Auth failed: voucher time expired: %s", username)
		// Mark as expired
		s.db.Model(&voucher).Update("status", entity.VoucherStatusExpired)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	// Activate voucher on first use
	if voucher.Status == entity.VoucherStatusUnused {
		now := time.Now()
		voucher.ActivatedAt = &now
		voucher.Status = entity.VoucherStatusActive
		voucher.DeviceMAC = callingStationID

		// Calculate expiration
		var expiresAt time.Time
		if voucher.Package.DurationType == "hours" {
			expiresAt = now.Add(time.Duration(voucher.Package.Duration) * time.Hour)
		} else if voucher.Package.DurationType == "days" {
			expiresAt = now.Add(time.Duration(voucher.Package.Duration) * 24 * time.Hour)
		}
		voucher.ExpiresAt = &expiresAt

		s.db.Save(&voucher)
		logger.Info("RADIUS Hotspot: Voucher activated: %s, expires: %s", username, expiresAt)
	}

	// Check MAC binding
	if voucher.Package.MACBinding && voucher.DeviceMAC != "" && voucher.DeviceMAC != callingStationID {
		logger.Warn("RADIUS Hotspot Auth failed: MAC binding violation for %s (bound: %s, trying: %s)",
			username, voucher.DeviceMAC, callingStationID)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	// Check device limit
	activeCount := s.countActiveSessionsForVoucher(username)
	if activeCount >= voucher.Package.DeviceLimit {
		logger.Warn("RADIUS Hotspot Auth failed: device limit exceeded for %s (limit: %d, active: %d)",
			username, voucher.Package.DeviceLimit, activeCount)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	// Check session limit
	if activeCount >= voucher.Package.SessionLimit {
		logger.Warn("RADIUS Hotspot Auth failed: session limit exceeded for %s (limit: %d, active: %d)",
			username, voucher.Package.SessionLimit, activeCount)
		w.Write(r.Response(radius.CodeAccessReject))
		return
	}

	// Build Access-Accept response
	response := r.Response(radius.CodeAccessAccept)

	// Add bandwidth limits (Mikrotik-Rate-Limit)
	uploadKbps := voucher.Package.SpeedUpload
	downloadKbps := voucher.Package.SpeedDownload
	rateLimit := fmt.Sprintf("%dk/%dk", uploadKbps, downloadKbps)

	mikrotikVendorID := uint32(14988)
	rateLimitVSA := buildMikrotikVSA(mikrotikVendorID, 8, []byte(rateLimit))
	response.Add(26, rateLimitVSA)

	logger.Info("RADIUS Hotspot Auth success: user=%s, rate_limit=%s, sending Access-Accept", username, rateLimit)
	if err := w.Write(response); err != nil {
		logger.Error("RADIUS: Failed to send Access-Accept for %s: %v", username, err)
	}
}

// handleHotspotAcct handles RADIUS accounting for hotspot sessions
func (s *RadiusServer) handleHotspotAcct(w radius.ResponseWriter, r *radius.Request) {
	acctStatusType := rfc2866.AcctStatusType_Get(r.Packet)
	username := rfc2865.UserName_GetString(r.Packet)
	sessionID := rfc2866.AcctSessionID_GetString(r.Packet)
	nasIP := rfc2865.NASIPAddress_Get(r.Packet)
	framedIP := rfc2865.FramedIPAddress_Get(r.Packet)
	callingStationID := rfc2865.CallingStationID_GetString(r.Packet)

	logger.Info("RADIUS Hotspot Acct request: type=%d, user=%s, session=%s", acctStatusType, username, sessionID)

	switch acctStatusType {
	case rfc2866.AcctStatusType_Value_Start:
		s.handleHotspotAcctStart(username, sessionID, nasIP, framedIP, callingStationID)
	case rfc2866.AcctStatusType_Value_Stop:
		s.handleHotspotAcctStop(r, username, sessionID)
	case rfc2866.AcctStatusType_Value_InterimUpdate:
		s.handleHotspotAcctInterim(r, username, sessionID)
	}

	// Always respond with Accounting-Response
	w.Write(r.Response(radius.CodeAccountingResponse))
}

func (s *RadiusServer) handleHotspotAcctStart(username, sessionID string, nasIP, framedIP net.IP, macAddress string) {
	// Find voucher
	var voucher entity.HotspotVoucher
	if err := s.db.Preload("Package").Where("voucher_code = ?", username).First(&voucher).Error; err != nil {
		logger.Warn("RADIUS Hotspot Acct Start: voucher not found: %s", username)
		return
	}

	// Create accounting record
	acct := &entity.RadiusAccounting{
		TenantID:        voucher.TenantID.String(),
		Username:        username,
		AcctSessionID:   sessionID,
		NASIPAddress:    nasIP.String(),
		FramedIPAddress: framedIP.String(),
		CallingStationID: macAddress,
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
		TenantID:     voucher.TenantID.String(),
	}
	s.mu.Unlock()

	logger.Info("RADIUS Hotspot Session started: user=%s, session=%s, ip=%s, mac=%s",
		username, sessionID, framedIP, macAddress)
}

func (s *RadiusServer) handleHotspotAcctStop(r *radius.Request, username, sessionID string) {
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
	delete(s.activeSessions, sessionID)
	s.mu.Unlock()

	// Check if voucher should be marked as expired based on session time
	var voucher entity.HotspotVoucher
	if err := s.db.Preload("Package").Where("voucher_code = ?", username).First(&voucher).Error; err == nil {
		if voucher.IsExpired() {
			s.db.Model(&voucher).Update("status", entity.VoucherStatusExpired)
			logger.Info("RADIUS Hotspot: Voucher marked as expired: %s", username)
		}
	}

	logger.Info("RADIUS Hotspot Session stopped: user=%s, session=%s, time=%ds, in=%d, out=%d",
		username, sessionID, sessionTime, inputOctets, outputOctets)
}

func (s *RadiusServer) handleHotspotAcctInterim(r *radius.Request, username, sessionID string) {
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
}

// getTenantIDFromNAS gets tenant ID from NAS IP address
func (s *RadiusServer) getTenantIDFromNAS(nasIP string) (string, error) {
	var nas entity.RadiusNAS
	if err := s.db.Where("nasname = ? AND is_active = ?", nasIP, true).First(&nas).Error; err != nil {
		return "", fmt.Errorf("NAS not found: %s", nasIP)
	}
	return nas.TenantID, nil
}

// countActiveSessionsForVoucher counts active sessions for a voucher
func (s *RadiusServer) countActiveSessionsForVoucher(username string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()

	count := 0
	for _, session := range s.activeSessions {
		if session.Username == username {
			count++
		}
	}
	return count
}

// DisconnectHotspotSession disconnects a hotspot session
func (s *RadiusServer) DisconnectHotspotSession(sessionID string) error {
	s.mu.Lock()
	session, exists := s.activeSessions[sessionID]
	if !exists {
		s.mu.Unlock()
		return fmt.Errorf("session not found: %s", sessionID)
	}

	// Update session status in database
	s.db.Model(&entity.RadiusAccounting{}).
		Where("acct_session_id = ?", sessionID).
		Updates(map[string]interface{}{
			"acct_stop_time":       time.Now(),
			"acct_terminate_cause": "Admin-Disconnect",
		})

	// Remove from active sessions
	delete(s.activeSessions, sessionID)
	s.mu.Unlock()

	// TODO: Send CoA Disconnect-Request to NAS
	logger.Info("RADIUS Hotspot: Session disconnected: %s (user: %s)", sessionID, session.Username)
	return nil
}

// GetHotspotActiveSessions returns active hotspot sessions for a tenant
func (s *RadiusServer) GetHotspotActiveSessions(tenantID string) []*entity.HotspotSession {
	s.mu.RLock()
	defer s.mu.RUnlock()

	sessions := make([]*entity.HotspotSession, 0)
	for _, session := range s.activeSessions {
		if session.TenantID == tenantID {
			// Check if this is a hotspot session (voucher code)
			var voucher entity.HotspotVoucher
			if err := s.db.Preload("Package").
				Where("tenant_id = ? AND voucher_code = ?", tenantID, session.Username).
				First(&voucher).Error; err == nil {
				
				duration := int(time.Since(session.StartTime).Seconds())
				hotspotSession := &entity.HotspotSession{
					SessionID:     session.SessionID,
					Username:      session.Username,
					IPAddress:     session.FramedIP,
					MACAddress:    "", // TODO: get from accounting record
					NASIPAddress:  session.NASIPAddress,
					StartTime:     session.StartTime,
					Duration:      duration,
					UploadBytes:   session.InputOctets,
					DownloadBytes: session.OutputOctets,
					PackageName:   voucher.Package.Name,
					Status:        entity.SessionStatusActive,
				}
				sessions = append(sessions, hotspotSession)
			}
		}
	}
	return sessions
}

// CheckExpiredHotspotSessions checks and disconnects expired hotspot sessions
func (s *RadiusServer) CheckExpiredHotspotSessions(ctx context.Context) error {
	s.mu.RLock()
	expiredSessions := make([]string, 0)
	
	for sessionID, session := range s.activeSessions {
		// Check if this is a hotspot session
		var voucher entity.HotspotVoucher
		if err := s.db.Preload("Package").
			Where("voucher_code = ?", session.Username).
			First(&voucher).Error; err == nil {
			
			// Check if voucher has expired
			if voucher.IsExpired() {
				expiredSessions = append(expiredSessions, sessionID)
				logger.Info("RADIUS Hotspot: Found expired session: %s (user: %s)", sessionID, session.Username)
			}
		}
	}
	s.mu.RUnlock()

	// Disconnect expired sessions
	for _, sessionID := range expiredSessions {
		if err := s.DisconnectHotspotSession(sessionID); err != nil {
			logger.Error("RADIUS Hotspot: Failed to disconnect expired session %s: %v", sessionID, err)
		}
	}

	return nil
}
