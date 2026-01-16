package postgres

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

type infrastructureRepository struct {
	db *gorm.DB
}

func NewInfrastructureRepository(db *gorm.DB) repository.InfrastructureRepository {
	return &infrastructureRepository{db: db}
}

// OLT operations
func (r *infrastructureRepository) CreateOLT(ctx context.Context, olt *entity.OLT) error {
	return r.db.WithContext(ctx).Create(olt).Error
}

func (r *infrastructureRepository) UpdateOLT(ctx context.Context, olt *entity.OLT) error {
	return r.db.WithContext(ctx).Save(olt).Error
}

func (r *infrastructureRepository) GetOLTByID(ctx context.Context, id string) (*entity.OLT, error) {
	var olt entity.OLT
	err := r.db.WithContext(ctx).First(&olt, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &olt, nil
}

func (r *infrastructureRepository) ListOLTs(ctx context.Context, tenantID string, isActive *bool) ([]*entity.OLT, error) {
	var olts []*entity.OLT
	query := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)

	if isActive != nil {
		query = query.Where("is_active = ?", *isActive)
	}

	err := query.Order("name ASC").Find(&olts).Error
	if err != nil {
		return nil, err
	}
	return olts, nil
}

func (r *infrastructureRepository) DeleteOLT(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.OLT{}, "id = ?", id).Error
}

// ODC operations
func (r *infrastructureRepository) CreateODC(ctx context.Context, odc *entity.ODC) error {
	return r.db.WithContext(ctx).Create(odc).Error
}

func (r *infrastructureRepository) UpdateODC(ctx context.Context, odc *entity.ODC) error {
	return r.db.WithContext(ctx).Save(odc).Error
}

func (r *infrastructureRepository) GetODCByID(ctx context.Context, id string) (*entity.ODC, error) {
	var odc entity.ODC
	err := r.db.WithContext(ctx).Preload("OLT").First(&odc, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &odc, nil
}

func (r *infrastructureRepository) ListODCs(ctx context.Context, tenantID string, oltID string, isActive *bool) ([]*entity.ODC, error) {
	var odcs []*entity.ODC
	query := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)

	if oltID != "" {
		query = query.Where("olt_id = ?", oltID)
	}
	if isActive != nil {
		query = query.Where("is_active = ?", *isActive)
	}

	err := query.Preload("OLT").Order("name ASC").Find(&odcs).Error
	if err != nil {
		return nil, err
	}
	return odcs, nil
}

func (r *infrastructureRepository) DeleteODC(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.ODC{}, "id = ?", id).Error
}

// ODP operations
func (r *infrastructureRepository) CreateODP(ctx context.Context, odp *entity.ODP) error {
	return r.db.WithContext(ctx).Create(odp).Error
}

func (r *infrastructureRepository) UpdateODP(ctx context.Context, odp *entity.ODP) error {
	return r.db.WithContext(ctx).Save(odp).Error
}

func (r *infrastructureRepository) GetODPByID(ctx context.Context, id string) (*entity.ODP, error) {
	var odp entity.ODP
	err := r.db.WithContext(ctx).
		Preload("ODC").
		Preload("ODC.OLT").
		First(&odp, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &odp, nil
}

func (r *infrastructureRepository) ListODPs(ctx context.Context, tenantID string, odcID string, isActive *bool) ([]*entity.ODP, error) {
	var odps []*entity.ODP
	query := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)

	if odcID != "" {
		query = query.Where("odc_id = ?", odcID)
	}
	if isActive != nil {
		query = query.Where("is_active = ?", *isActive)
	}

	err := query.Preload("ODC").Preload("ODC.OLT").Order("name ASC").Find(&odps).Error
	if err != nil {
		return nil, err
	}
	return odps, nil
}

func (r *infrastructureRepository) DeleteODP(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&entity.ODP{}, "id = ?", id).Error
}
