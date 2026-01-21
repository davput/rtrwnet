package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
)

// HotspotSessionService defines the interface for hotspot session business logic
type HotspotSessionService interface {
	GetActiveSessions(ctx context.Context, tenantID string) ([]*entity.HotspotSession, error)
	DisconnectSession(ctx context.Context, tenantID, sessionID string) error
	CheckExpiredSessions(ctx context.Context) error
}

type hotspotSessionService struct {
	voucherRepo repository.HotspotVoucherRepository
	packageRepo repository.HotspotPackageRepository
	radiusServer RadiusServerInterface
}

// RadiusServerInterface defines the interface for RADIUS server operations
type RadiusServerInterface interface {
	GetHotspotActiveSessions(tenantID string) []*entity.HotspotSession
	DisconnectHotspotSession(sessionID string) error
	CheckExpiredHotspotSessions(ctx context.Context) error
}

// NewHotspotSessionService creates a new instance of hotspot session service
func NewHotspotSessionService(
	voucherRepo repository.HotspotVoucherRepository,
	packageRepo repository.HotspotPackageRepository,
	radiusServer RadiusServerInterface,
) HotspotSessionService {
	return &hotspotSessionService{
		voucherRepo:  voucherRepo,
		packageRepo:  packageRepo,
		radiusServer: radiusServer,
	}
}

func (s *hotspotSessionService) GetActiveSessions(ctx context.Context, tenantID string) ([]*entity.HotspotSession, error) {
	if s.radiusServer == nil {
		return []*entity.HotspotSession{}, nil
	}

	sessions := s.radiusServer.GetHotspotActiveSessions(tenantID)
	return sessions, nil
}

func (s *hotspotSessionService) DisconnectSession(ctx context.Context, tenantID, sessionID string) error {
	if s.radiusServer == nil {
		return errors.NewInternalError("RADIUS server not available")
	}

	// Verify session belongs to tenant
	sessions := s.radiusServer.GetHotspotActiveSessions(tenantID)
	found := false
	for _, session := range sessions {
		if session.SessionID == sessionID {
			found = true
			break
		}
	}

	if !found {
		return errors.NewNotFoundError("session not found or does not belong to this tenant")
	}

	if err := s.radiusServer.DisconnectHotspotSession(sessionID); err != nil {
		return fmt.Errorf("failed to disconnect session: %w", err)
	}

	logger.Info("Hotspot session disconnected: %s (tenant: %s)", sessionID, tenantID)
	return nil
}

func (s *hotspotSessionService) CheckExpiredSessions(ctx context.Context) error {
	if s.radiusServer == nil {
		return nil
	}

	logger.Info("Checking for expired hotspot sessions...")

	// Let RADIUS server handle the check and disconnect
	if err := s.radiusServer.CheckExpiredHotspotSessions(ctx); err != nil {
		return fmt.Errorf("failed to check expired sessions: %w", err)
	}

	// Also update expired vouchers in database
	if err := s.voucherRepo.UpdateExpiredVouchers(ctx); err != nil {
		logger.Error("Failed to update expired vouchers: %v", err)
	}

	return nil
}

// StartExpirationChecker starts a background job to check expired sessions
func StartExpirationChecker(service HotspotSessionService, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			ctx := context.Background()
			if err := service.CheckExpiredSessions(ctx); err != nil {
				logger.Error("Expiration checker error: %v", err)
			}
		}
	}()
	logger.Info("Hotspot session expiration checker started (interval: %s)", interval)
}
