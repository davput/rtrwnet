package usecase

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/email"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
)

type OTPService interface {
	SendOTP(ctx context.Context, emailAddr, purpose string) error
	VerifyOTP(ctx context.Context, emailAddr, otp, purpose string) error
	IsEmailVerified(ctx context.Context, emailAddr, purpose string) bool
}

type otpService struct {
	otpRepo      repository.OTPRepository
	userRepo     repository.UserRepository
	emailService *email.Service
	otpExpiry    time.Duration
}

func NewOTPService(
	otpRepo repository.OTPRepository,
	userRepo repository.UserRepository,
	emailService *email.Service,
) OTPService {
	return &otpService{
		otpRepo:      otpRepo,
		userRepo:     userRepo,
		emailService: emailService,
		otpExpiry:    10 * time.Minute, // OTP valid for 10 minutes
	}
}

// SendOTP generates and sends OTP to email
func (s *otpService) SendOTP(ctx context.Context, emailAddr, purpose string) error {
	// For registration, check if email already exists
	if purpose == entity.OTPPurposeRegistration {
		existingUser, _ := s.userRepo.FindByEmailGlobal(ctx, emailAddr)
		if existingUser != nil {
			return errors.New("EMAIL_EXISTS", "Email sudah terdaftar", 400)
		}
	}

	// Delete any existing OTP for this email and purpose
	if err := s.otpRepo.DeleteByEmailAndPurpose(ctx, emailAddr, purpose); err != nil {
		logger.Error("Failed to delete existing OTP: %v", err)
		// Continue anyway
	}

	// Generate 6-digit OTP
	otp, err := generateOTP(6)
	if err != nil {
		logger.Error("Failed to generate OTP: %v", err)
		return errors.ErrInternalServer
	}

	// Create OTP record
	otpRecord := &entity.EmailOTP{
		Email:     emailAddr,
		OTP:       otp,
		Purpose:   purpose,
		ExpiresAt: time.Now().Add(s.otpExpiry),
	}

	if err := s.otpRepo.Create(ctx, otpRecord); err != nil {
		logger.Error("Failed to create OTP record: %v", err)
		return errors.ErrInternalServer
	}

	// Send OTP via email
	if s.emailService != nil {
		if err := s.emailService.SendOTP(emailAddr, otp, purpose); err != nil {
			logger.Error("Failed to send OTP email: %v", err)
			// For development, log the OTP
			logger.Info("OTP for %s: %s (email sending failed)", emailAddr, otp)
			// Don't return error - allow testing without email
		} else {
			logger.Info("OTP sent to %s for %s", emailAddr, purpose)
		}
	} else {
		// No email service configured - log OTP for development
		logger.Info("OTP for %s: %s (no email service configured)", emailAddr, otp)
	}

	return nil
}

// VerifyOTP verifies the OTP
func (s *otpService) VerifyOTP(ctx context.Context, emailAddr, otp, purpose string) error {
	// Find the latest OTP for this email and purpose
	otpRecord, err := s.otpRepo.FindLatestByEmailAndPurpose(ctx, emailAddr, purpose)
	if err != nil {
		logger.Error("OTP not found for %s: %v", emailAddr, err)
		return errors.New("INVALID_OTP", "Kode OTP tidak valid atau sudah kadaluarsa", 400)
	}

	// Check if OTP matches
	if otpRecord.OTP != otp {
		logger.Error("OTP mismatch for %s", emailAddr)
		return errors.New("INVALID_OTP", "Kode OTP tidak valid", 400)
	}

	// Check if expired
	if otpRecord.IsExpired() {
		logger.Error("OTP expired for %s", emailAddr)
		return errors.New("OTP_EXPIRED", "Kode OTP sudah kadaluarsa", 400)
	}

	// Mark as used
	if err := s.otpRepo.MarkAsUsed(ctx, otpRecord.ID); err != nil {
		logger.Error("Failed to mark OTP as used: %v", err)
		// Continue anyway - verification was successful
	}

	logger.Info("OTP verified successfully for %s", emailAddr)
	return nil
}

// IsEmailVerified checks if email has been verified (OTP used)
func (s *otpService) IsEmailVerified(ctx context.Context, emailAddr, purpose string) bool {
	// This is a simple check - in production you might want a separate verified_emails table
	// For now, we check if there's a used OTP record within the last hour
	return false // Simplified - always require fresh verification
}

// generateOTP generates a random numeric OTP of specified length
func generateOTP(length int) (string, error) {
	const digits = "0123456789"
	otp := make([]byte, length)
	
	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", fmt.Errorf("failed to generate random number: %w", err)
		}
		otp[i] = digits[num.Int64()]
	}
	
	return string(otp), nil
}
