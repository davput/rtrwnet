package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type InfrastructureRepository interface {
	// OLT operations
	CreateOLT(ctx context.Context, olt *entity.OLT) error
	UpdateOLT(ctx context.Context, olt *entity.OLT) error
	GetOLTByID(ctx context.Context, id string) (*entity.OLT, error)
	ListOLTs(ctx context.Context, tenantID string, isActive *bool) ([]*entity.OLT, error)
	DeleteOLT(ctx context.Context, id string) error

	// ODC operations
	CreateODC(ctx context.Context, odc *entity.ODC) error
	UpdateODC(ctx context.Context, odc *entity.ODC) error
	GetODCByID(ctx context.Context, id string) (*entity.ODC, error)
	ListODCs(ctx context.Context, tenantID string, oltID string, isActive *bool) ([]*entity.ODC, error)
	DeleteODC(ctx context.Context, id string) error

	// ODP operations
	CreateODP(ctx context.Context, odp *entity.ODP) error
	UpdateODP(ctx context.Context, odp *entity.ODP) error
	GetODPByID(ctx context.Context, id string) (*entity.ODP, error)
	ListODPs(ctx context.Context, tenantID string, odcID string, isActive *bool) ([]*entity.ODP, error)
	DeleteODP(ctx context.Context, id string) error
}
