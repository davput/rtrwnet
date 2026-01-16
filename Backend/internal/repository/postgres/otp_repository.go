package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"gorm.io/gorm"
)

type otpRepository struct {
	db *gorm.DB
}

func NewOTPRepository(db *gorm.DB) repository.OTPRepository {
	return &otpRepository{db: db}
}

func (r *otpRepository) Create(ctx context.Context, otp *entity.EmailOTP) error {
	if err := r.db.WithContext(ctx).Create(otp).Error; err != nil {
		return fmt.Errorf("failed to create OTP: %w", err)
	}
	return nil
}

func (r *otpRepository) FindByEmailAndPurpose(ctx context.Context, email, purpose string) (*entity.EmailOTP, error) {
	var otp entity.EmailOTP
	if err := r.db.WithContext(ctx).
		Where("email = ? AND purpose = ? AND is_used = false AND expires_at > ?", email, purpose, time.Now()).
		First(&otp).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find OTP: %w", err)
	}
	return &otp, nil
}

func (r *otpRepository) FindLatestByEmailAndPurpose(ctx context.Context, email, purpose string) (*entity.EmailOTP, error) {
	var otp entity.EmailOTP
	if err := r.db.WithContext(ctx).
		Where("email = ? AND purpose = ? AND is_used = false AND expires_at > ?", email, purpose, time.Now()).
		Order("created_at DESC").
		First(&otp).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.ErrNotFound
		}
		return nil, fmt.Errorf("failed to find OTP: %w", err)
	}
	return &otp, nil
}

func (r *otpRepository) MarkAsUsed(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).
		Model(&entity.EmailOTP{}).
		Where("id = ?", id).
		Update("is_used", true).Error; err != nil {
		return fmt.Errorf("failed to mark OTP as used: %w", err)
	}
	return nil
}

func (r *otpRepository) DeleteExpired(ctx context.Context) error {
	if err := r.db.WithContext(ctx).
		Where("expires_at < ?", time.Now()).
		Delete(&entity.EmailOTP{}).Error; err != nil {
		return fmt.Errorf("failed to delete expired OTPs: %w", err)
	}
	return nil
}

func (r *otpRepository) DeleteByEmailAndPurpose(ctx context.Context, email, purpose string) error {
	if err := r.db.WithContext(ctx).
		Where("email = ? AND purpose = ?", email, purpose).
		Delete(&entity.EmailOTP{}).Error; err != nil {
		return fmt.Errorf("failed to delete OTPs: %w", err)
	}
	return nil
}
