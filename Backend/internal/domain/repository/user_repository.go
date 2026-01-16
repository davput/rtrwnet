package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type UserRepository interface {
	Create(ctx context.Context, user *entity.User) error
	FindByID(ctx context.Context, id string) (*entity.User, error)
	FindByEmail(ctx context.Context, tenantID, email string) (*entity.User, error)
	FindByEmailGlobal(ctx context.Context, email string) (*entity.User, error)
	FindByTenantIDAndRole(ctx context.Context, tenantID, role string) (*entity.User, error)
	FindAll(ctx context.Context, tenantID string) ([]*entity.User, error)
	Update(ctx context.Context, user *entity.User) error
	Delete(ctx context.Context, id string) error
	CountByTenantID(ctx context.Context, tenantID string) (int, error)
}
