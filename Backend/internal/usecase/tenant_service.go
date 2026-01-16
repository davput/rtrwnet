package usecase

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
)

type TenantService interface {
	Create(ctx context.Context, name, email string) (*TenantProfile, error)
	GetByID(ctx context.Context, id string) (*TenantProfile, error)
	GetByEmail(ctx context.Context, email string) (*TenantProfile, error)
	List(ctx context.Context) ([]*TenantProfile, error)
	Update(ctx context.Context, id string, name string, isActive bool) (*TenantProfile, error)
	Delete(ctx context.Context, id string) error
}

type TenantProfile struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	IsActive bool   `json:"is_active"`
}

type tenantService struct {
	tenantRepo repository.TenantRepository
}

func NewTenantService(tenantRepo repository.TenantRepository) TenantService {
	return &tenantService{
		tenantRepo: tenantRepo,
	}
}

func (s *tenantService) Create(ctx context.Context, name, email string) (*TenantProfile, error) {
	// Check if email already exists
	existingTenant, err := s.tenantRepo.FindByEmail(ctx, email)
	if err == nil && existingTenant != nil {
		return nil, errors.New("EMAIL_EXISTS", "Email already exists", 409)
	}

	// Create tenant
	tenant := &entity.Tenant{
		Name:     name,
		Email:    email,
		IsActive: true,
	}

	if err := s.tenantRepo.Create(ctx, tenant); err != nil {
		logger.Error("Failed to create tenant: %v", err)
		return nil, errors.ErrInternalServer
	}

	logger.Info("Tenant created successfully: %s (%s)", tenant.Name, tenant.ID)

	return &TenantProfile{
		ID:       tenant.ID,
		Name:     tenant.Name,
		Email:    tenant.Email,
		IsActive: tenant.IsActive,
	}, nil
}

func (s *tenantService) GetByID(ctx context.Context, id string) (*TenantProfile, error) {
	tenant, err := s.tenantRepo.FindByID(ctx, id)
	if err != nil {
		logger.Error("Failed to find tenant: %v", err)
		return nil, errors.ErrNotFound
	}

	if tenant == nil {
		return nil, errors.ErrNotFound
	}

	return &TenantProfile{
		ID:       tenant.ID,
		Name:     tenant.Name,
		Email:    tenant.Email,
		IsActive: tenant.IsActive,
	}, nil
}

func (s *tenantService) GetByEmail(ctx context.Context, email string) (*TenantProfile, error) {
	tenant, err := s.tenantRepo.FindByEmail(ctx, email)
	if err != nil {
		logger.Error("Failed to find tenant by email: %v", err)
		return nil, errors.ErrNotFound
	}

	if tenant == nil {
		return nil, errors.ErrNotFound
	}

	return &TenantProfile{
		ID:       tenant.ID,
		Name:     tenant.Name,
		Email:    tenant.Email,
		IsActive: tenant.IsActive,
	}, nil
}

func (s *tenantService) List(ctx context.Context) ([]*TenantProfile, error) {
	tenants, err := s.tenantRepo.FindAll(ctx)
	if err != nil {
		logger.Error("Failed to list tenants: %v", err)
		return nil, errors.ErrInternalServer
	}

	profiles := make([]*TenantProfile, len(tenants))
	for i, tenant := range tenants {
		profiles[i] = &TenantProfile{
			ID:       tenant.ID,
			Name:     tenant.Name,
			Email:    tenant.Email,
			IsActive: tenant.IsActive,
		}
	}

	return profiles, nil
}

func (s *tenantService) Update(ctx context.Context, id string, name string, isActive bool) (*TenantProfile, error) {
	tenant, err := s.tenantRepo.FindByID(ctx, id)
	if err != nil {
		logger.Error("Failed to find tenant: %v", err)
		return nil, errors.ErrNotFound
	}

	if tenant == nil {
		return nil, errors.ErrNotFound
	}

	tenant.Name = name
	tenant.IsActive = isActive

	if err := s.tenantRepo.Update(ctx, tenant); err != nil {
		logger.Error("Failed to update tenant: %v", err)
		return nil, errors.ErrInternalServer
	}

	logger.Info("Tenant updated successfully: %s (%s)", tenant.Name, tenant.ID)

	return &TenantProfile{
		ID:       tenant.ID,
		Name:     tenant.Name,
		Email:    tenant.Email,
		IsActive: tenant.IsActive,
	}, nil
}

func (s *tenantService) Delete(ctx context.Context, id string) error {
	if err := s.tenantRepo.Delete(ctx, id); err != nil {
		logger.Error("Failed to delete tenant: %v", err)
		return errors.ErrInternalServer
	}

	logger.Info("Tenant deleted successfully: %s", id)

	return nil
}
