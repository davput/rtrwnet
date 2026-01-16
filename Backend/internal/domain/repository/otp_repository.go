package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type OTPRepository interface {
	Create(ctx context.Context, otp *entity.EmailOTP) error
	FindByEmailAndPurpose(ctx context.Context, email, purpose string) (*entity.EmailOTP, error)
	FindLatestByEmailAndPurpose(ctx context.Context, email, purpose string) (*entity.EmailOTP, error)
	MarkAsUsed(ctx context.Context, id string) error
	DeleteExpired(ctx context.Context) error
	DeleteByEmailAndPurpose(ctx context.Context, email, purpose string) error
}
