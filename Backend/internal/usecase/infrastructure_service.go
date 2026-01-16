package usecase

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
)

type InfrastructureService interface {
	// OLT operations
	CreateOLT(ctx context.Context, tenantID string, req *CreateOLTRequest) (*entity.OLT, error)
	UpdateOLT(ctx context.Context, tenantID, oltID string, req *UpdateOLTRequest) (*entity.OLT, error)
	GetOLTByID(ctx context.Context, tenantID, oltID string) (*entity.OLT, error)
	ListOLTs(ctx context.Context, tenantID string, isActive *bool) ([]*entity.OLT, error)
	DeleteOLT(ctx context.Context, tenantID, oltID string) error

	// ODC operations
	CreateODC(ctx context.Context, tenantID string, req *CreateODCRequest) (*entity.ODC, error)
	UpdateODC(ctx context.Context, tenantID, odcID string, req *UpdateODCRequest) (*entity.ODC, error)
	GetODCByID(ctx context.Context, tenantID, odcID string) (*entity.ODC, error)
	ListODCs(ctx context.Context, tenantID string, oltID string, isActive *bool) ([]*entity.ODC, error)
	DeleteODC(ctx context.Context, tenantID, odcID string) error

	// ODP operations
	CreateODP(ctx context.Context, tenantID string, req *CreateODPRequest) (*entity.ODP, error)
	UpdateODP(ctx context.Context, tenantID, odpID string, req *UpdateODPRequest) (*entity.ODP, error)
	GetODPByID(ctx context.Context, tenantID, odpID string) (*entity.ODP, error)
	ListODPs(ctx context.Context, tenantID string, odcID string, isActive *bool) ([]*entity.ODP, error)
	DeleteODP(ctx context.Context, tenantID, odpID string) error
}

type infrastructureService struct {
	infraRepo repository.InfrastructureRepository
}

func NewInfrastructureService(infraRepo repository.InfrastructureRepository) InfrastructureService {
	return &infrastructureService{
		infraRepo: infraRepo,
	}
}

// OLT DTOs
type CreateOLTRequest struct {
	Name           string  `json:"name" binding:"required"`
	IPAddress      string  `json:"ip_address" binding:"required"`
	SNMPCommunity  string  `json:"snmp_community"`
	TelnetUsername string  `json:"telnet_username"`
	TelnetPassword string  `json:"telnet_password"`
	Location       string  `json:"location"`
	Latitude       float64 `json:"latitude"`
	Longitude      float64 `json:"longitude"`
	Vendor         string  `json:"vendor"`
	Model          string  `json:"model"`
}

type UpdateOLTRequest struct {
	Name           string  `json:"name"`
	IPAddress      string  `json:"ip_address"`
	SNMPCommunity  string  `json:"snmp_community"`
	TelnetUsername string  `json:"telnet_username"`
	TelnetPassword string  `json:"telnet_password"`
	Location       string  `json:"location"`
	Latitude       float64 `json:"latitude"`
	Longitude      float64 `json:"longitude"`
	Vendor         string  `json:"vendor"`
	Model          string  `json:"model"`
	IsActive       *bool   `json:"is_active"`
}

// ODC DTOs
type CreateODCRequest struct {
	OLTID     string  `json:"olt_id" binding:"required"`
	Name      string  `json:"name" binding:"required"`
	Location  string  `json:"location" binding:"required"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Capacity  int     `json:"capacity"`
}

type UpdateODCRequest struct {
	Name      string  `json:"name"`
	Location  string  `json:"location"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Capacity  int     `json:"capacity"`
	IsActive  *bool   `json:"is_active"`
}

// ODP DTOs
type CreateODPRequest struct {
	ODCID     string  `json:"odc_id" binding:"required"`
	Name      string  `json:"name" binding:"required"`
	Location  string  `json:"location" binding:"required"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Capacity  int     `json:"capacity"`
}

type UpdateODPRequest struct {
	Name      string  `json:"name"`
	Location  string  `json:"location"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Capacity  int     `json:"capacity"`
	IsActive  *bool   `json:"is_active"`
}

// OLT operations
func (s *infrastructureService) CreateOLT(ctx context.Context, tenantID string, req *CreateOLTRequest) (*entity.OLT, error) {
	olt := &entity.OLT{
		TenantID:       tenantID,
		Name:           req.Name,
		IPAddress:      req.IPAddress,
		SNMPCommunity:  req.SNMPCommunity,
		TelnetUsername: req.TelnetUsername,
		TelnetPassword: req.TelnetPassword, // TODO: Encrypt password
		Location:       req.Location,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		Vendor:         req.Vendor,
		Model:          req.Model,
		IsActive:       true,
	}

	if err := s.infraRepo.CreateOLT(ctx, olt); err != nil {
		return nil, err
	}

	return olt, nil
}

func (s *infrastructureService) UpdateOLT(ctx context.Context, tenantID, oltID string, req *UpdateOLTRequest) (*entity.OLT, error) {
	olt, err := s.infraRepo.GetOLTByID(ctx, oltID)
	if err != nil {
		return nil, errors.NewNotFoundError("OLT not found")
	}
	if olt.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("OLT does not belong to this tenant")
	}

	if req.Name != "" {
		olt.Name = req.Name
	}
	if req.IPAddress != "" {
		olt.IPAddress = req.IPAddress
	}
	if req.SNMPCommunity != "" {
		olt.SNMPCommunity = req.SNMPCommunity
	}
	if req.TelnetUsername != "" {
		olt.TelnetUsername = req.TelnetUsername
	}
	if req.TelnetPassword != "" {
		olt.TelnetPassword = req.TelnetPassword // TODO: Encrypt password
	}
	if req.Location != "" {
		olt.Location = req.Location
	}
	if req.Latitude != 0 {
		olt.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		olt.Longitude = req.Longitude
	}
	if req.Vendor != "" {
		olt.Vendor = req.Vendor
	}
	if req.Model != "" {
		olt.Model = req.Model
	}
	if req.IsActive != nil {
		olt.IsActive = *req.IsActive
	}

	if err := s.infraRepo.UpdateOLT(ctx, olt); err != nil {
		return nil, err
	}

	return olt, nil
}

func (s *infrastructureService) GetOLTByID(ctx context.Context, tenantID, oltID string) (*entity.OLT, error) {
	olt, err := s.infraRepo.GetOLTByID(ctx, oltID)
	if err != nil {
		return nil, errors.NewNotFoundError("OLT not found")
	}
	if olt.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("OLT does not belong to this tenant")
	}
	return olt, nil
}

func (s *infrastructureService) ListOLTs(ctx context.Context, tenantID string, isActive *bool) ([]*entity.OLT, error) {
	return s.infraRepo.ListOLTs(ctx, tenantID, isActive)
}

func (s *infrastructureService) DeleteOLT(ctx context.Context, tenantID, oltID string) error {
	olt, err := s.infraRepo.GetOLTByID(ctx, oltID)
	if err != nil {
		return errors.NewNotFoundError("OLT not found")
	}
	if olt.TenantID != tenantID {
		return errors.NewUnauthorizedError("OLT does not belong to this tenant")
	}

	// Check if OLT has ODCs
	odcs, err := s.infraRepo.ListODCs(ctx, tenantID, oltID, nil)
	if err != nil {
		return err
	}
	if len(odcs) > 0 {
		return errors.NewValidationError("Cannot delete OLT with existing ODCs")
	}

	return s.infraRepo.DeleteOLT(ctx, oltID)
}

// ODC operations
func (s *infrastructureService) CreateODC(ctx context.Context, tenantID string, req *CreateODCRequest) (*entity.ODC, error) {
	// Verify OLT exists and belongs to tenant
	olt, err := s.infraRepo.GetOLTByID(ctx, req.OLTID)
	if err != nil {
		return nil, errors.NewNotFoundError("OLT not found")
	}
	if olt.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("OLT does not belong to this tenant")
	}

	odc := &entity.ODC{
		TenantID:  tenantID,
		OLTID:     req.OLTID,
		Name:      req.Name,
		Location:  req.Location,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Capacity:  req.Capacity,
		IsActive:  true,
	}

	if err := s.infraRepo.CreateODC(ctx, odc); err != nil {
		return nil, err
	}

	return odc, nil
}

func (s *infrastructureService) UpdateODC(ctx context.Context, tenantID, odcID string, req *UpdateODCRequest) (*entity.ODC, error) {
	odc, err := s.infraRepo.GetODCByID(ctx, odcID)
	if err != nil {
		return nil, errors.NewNotFoundError("ODC not found")
	}
	if odc.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("ODC does not belong to this tenant")
	}

	if req.Name != "" {
		odc.Name = req.Name
	}
	if req.Location != "" {
		odc.Location = req.Location
	}
	if req.Latitude != 0 {
		odc.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		odc.Longitude = req.Longitude
	}
	if req.Capacity > 0 {
		odc.Capacity = req.Capacity
	}
	if req.IsActive != nil {
		odc.IsActive = *req.IsActive
	}

	if err := s.infraRepo.UpdateODC(ctx, odc); err != nil {
		return nil, err
	}

	return odc, nil
}

func (s *infrastructureService) GetODCByID(ctx context.Context, tenantID, odcID string) (*entity.ODC, error) {
	odc, err := s.infraRepo.GetODCByID(ctx, odcID)
	if err != nil {
		return nil, errors.NewNotFoundError("ODC not found")
	}
	if odc.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("ODC does not belong to this tenant")
	}
	return odc, nil
}

func (s *infrastructureService) ListODCs(ctx context.Context, tenantID string, oltID string, isActive *bool) ([]*entity.ODC, error) {
	return s.infraRepo.ListODCs(ctx, tenantID, oltID, isActive)
}

func (s *infrastructureService) DeleteODC(ctx context.Context, tenantID, odcID string) error {
	odc, err := s.infraRepo.GetODCByID(ctx, odcID)
	if err != nil {
		return errors.NewNotFoundError("ODC not found")
	}
	if odc.TenantID != tenantID {
		return errors.NewUnauthorizedError("ODC does not belong to this tenant")
	}

	// Check if ODC has ODPs
	odps, err := s.infraRepo.ListODPs(ctx, tenantID, odcID, nil)
	if err != nil {
		return err
	}
	if len(odps) > 0 {
		return errors.NewValidationError("Cannot delete ODC with existing ODPs")
	}

	return s.infraRepo.DeleteODC(ctx, odcID)
}

// ODP operations
func (s *infrastructureService) CreateODP(ctx context.Context, tenantID string, req *CreateODPRequest) (*entity.ODP, error) {
	// Verify ODC exists and belongs to tenant
	odc, err := s.infraRepo.GetODCByID(ctx, req.ODCID)
	if err != nil {
		return nil, errors.NewNotFoundError("ODC not found")
	}
	if odc.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("ODC does not belong to this tenant")
	}

	odp := &entity.ODP{
		TenantID:  tenantID,
		ODCID:     req.ODCID,
		Name:      req.Name,
		Location:  req.Location,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Capacity:  req.Capacity,
		IsActive:  true,
	}

	if err := s.infraRepo.CreateODP(ctx, odp); err != nil {
		return nil, err
	}

	return odp, nil
}

func (s *infrastructureService) UpdateODP(ctx context.Context, tenantID, odpID string, req *UpdateODPRequest) (*entity.ODP, error) {
	odp, err := s.infraRepo.GetODPByID(ctx, odpID)
	if err != nil {
		return nil, errors.NewNotFoundError("ODP not found")
	}
	if odp.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("ODP does not belong to this tenant")
	}

	if req.Name != "" {
		odp.Name = req.Name
	}
	if req.Location != "" {
		odp.Location = req.Location
	}
	if req.Latitude != 0 {
		odp.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		odp.Longitude = req.Longitude
	}
	if req.Capacity > 0 {
		odp.Capacity = req.Capacity
	}
	if req.IsActive != nil {
		odp.IsActive = *req.IsActive
	}

	if err := s.infraRepo.UpdateODP(ctx, odp); err != nil {
		return nil, err
	}

	return odp, nil
}

func (s *infrastructureService) GetODPByID(ctx context.Context, tenantID, odpID string) (*entity.ODP, error) {
	odp, err := s.infraRepo.GetODPByID(ctx, odpID)
	if err != nil {
		return nil, errors.NewNotFoundError("ODP not found")
	}
	if odp.TenantID != tenantID {
		return nil, errors.NewUnauthorizedError("ODP does not belong to this tenant")
	}
	return odp, nil
}

func (s *infrastructureService) ListODPs(ctx context.Context, tenantID string, odcID string, isActive *bool) ([]*entity.ODP, error) {
	return s.infraRepo.ListODPs(ctx, tenantID, odcID, isActive)
}

func (s *infrastructureService) DeleteODP(ctx context.Context, tenantID, odpID string) error {
	odp, err := s.infraRepo.GetODPByID(ctx, odpID)
	if err != nil {
		return errors.NewNotFoundError("ODP not found")
	}
	if odp.TenantID != tenantID {
		return errors.NewUnauthorizedError("ODP does not belong to this tenant")
	}

	return s.infraRepo.DeleteODP(ctx, odpID)
}
