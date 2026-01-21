package usecase

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"golang.org/x/crypto/bcrypt"
)

// HotspotVoucherService defines the interface for hotspot voucher business logic
type HotspotVoucherService interface {
	GenerateVouchers(ctx context.Context, tenantID string, req *GenerateVouchersRequest) ([]*entity.HotspotVoucher, error)
	ListVouchers(ctx context.Context, tenantID string, filters map[string]interface{}, page, perPage int) ([]*entity.HotspotVoucher, int, error)
	GetVoucher(ctx context.Context, tenantID, voucherID string) (*entity.HotspotVoucher, error)
	DeleteVoucher(ctx context.Context, tenantID, voucherID string) error
	ActivateVoucher(ctx context.Context, tenantID, voucherCode, macAddress string) error
	GetVoucherStats(ctx context.Context, tenantID string, startDate, endDate time.Time) (*VoucherStats, error)
}

type hotspotVoucherService struct {
	voucherRepo    repository.HotspotVoucherRepository
	packageRepo    repository.HotspotPackageRepository
	freeradiusSync *FreeRADIUSSyncService
}

// NewHotspotVoucherService creates a new instance of hotspot voucher service
func NewHotspotVoucherService(
	voucherRepo repository.HotspotVoucherRepository,
	packageRepo repository.HotspotPackageRepository,
	freeradiusSync *FreeRADIUSSyncService,
) HotspotVoucherService {
	return &hotspotVoucherService{
		voucherRepo:    voucherRepo,
		packageRepo:    packageRepo,
		freeradiusSync: freeradiusSync,
	}
}

// GenerateVouchersRequest represents the request to generate vouchers
type GenerateVouchersRequest struct {
	PackageID string `json:"package_id" validate:"required"`
	Quantity  int    `json:"quantity" validate:"required,gt=0,lte=100"`
	Prefix    string `json:"prefix"` // optional prefix for voucher codes
}

// VoucherStats represents voucher statistics
type VoucherStats struct {
	TotalVouchers   int                    `json:"total_vouchers"`
	UnusedVouchers  int                    `json:"unused_vouchers"`
	ActiveVouchers  int                    `json:"active_vouchers"`
	ExpiredVouchers int                    `json:"expired_vouchers"`
	UsedVouchers    int                    `json:"used_vouchers"`
	PackageStats    []PackageVoucherStats  `json:"package_stats"`
	TotalRevenue    int                    `json:"total_revenue"`
}

// PackageVoucherStats represents voucher statistics per package
type PackageVoucherStats struct {
	PackageID   string `json:"package_id"`
	PackageName string `json:"package_name"`
	Count       int    `json:"count"`
	Revenue     int    `json:"revenue"`
}

func (s *hotspotVoucherService) GenerateVouchers(ctx context.Context, tenantID string, req *GenerateVouchersRequest) ([]*entity.HotspotVoucher, error) {
	tenantUUID, err := uuid.Parse(tenantID)
	if err != nil {
		return nil, errors.NewValidationError("invalid tenant_id")
	}

	// Validate package exists and belongs to tenant
	pkg, err := s.packageRepo.FindByID(ctx, req.PackageID)
	if err != nil {
		return nil, fmt.Errorf("failed to find package: %w", err)
	}
	if pkg == nil {
		return nil, errors.NewNotFoundError("package not found")
	}
	if pkg.TenantID.String() != tenantID {
		return nil, errors.NewForbiddenError("package does not belong to this tenant")
	}
	if !pkg.IsActive {
		return nil, errors.NewValidationError("package is not active")
	}

	// Generate vouchers
	vouchers := make([]*entity.HotspotVoucher, req.Quantity)
	for i := 0; i < req.Quantity; i++ {
		code := generateVoucherCode(req.Prefix)
		password := generateVoucherPassword()
		hashedPassword, err := hashPassword(password)
		if err != nil {
			return nil, fmt.Errorf("failed to hash password: %w", err)
		}

		vouchers[i] = &entity.HotspotVoucher{
			TenantID:        tenantUUID,
			PackageID:       pkg.ID,
			VoucherCode:     code,
			VoucherPassword: hashedPassword,
			Status:          entity.VoucherStatusUnused,
		}
	}

	// Save vouchers in batch
	if err := s.voucherRepo.CreateBatch(ctx, vouchers); err != nil {
		return nil, fmt.Errorf("failed to create vouchers: %w", err)
	}

	// Load package info for response
	for _, v := range vouchers {
		v.Package = pkg
	}

	return vouchers, nil
}

func (s *hotspotVoucherService) ListVouchers(ctx context.Context, tenantID string, filters map[string]interface{}, page, perPage int) ([]*entity.HotspotVoucher, int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	vouchers, total, err := s.voucherRepo.FindByTenantID(ctx, tenantID, filters, page, perPage)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list vouchers: %w", err)
	}

	return vouchers, total, nil
}

func (s *hotspotVoucherService) GetVoucher(ctx context.Context, tenantID, voucherID string) (*entity.HotspotVoucher, error) {
	voucher, err := s.voucherRepo.FindByID(ctx, voucherID)
	if err != nil {
		return nil, fmt.Errorf("failed to get voucher: %w", err)
	}
	if voucher == nil {
		return nil, errors.NewNotFoundError("voucher not found")
	}

	// Verify tenant ownership
	if voucher.TenantID.String() != tenantID {
		return nil, errors.NewForbiddenError("voucher does not belong to this tenant")
	}

	return voucher, nil
}

func (s *hotspotVoucherService) DeleteVoucher(ctx context.Context, tenantID, voucherID string) error {
	voucher, err := s.GetVoucher(ctx, tenantID, voucherID)
	if err != nil {
		return err
	}

	// Don't allow deleting active vouchers
	if voucher.Status == entity.VoucherStatusActive {
		return errors.NewConflictError("cannot delete active voucher")
	}

	if err := s.voucherRepo.Delete(ctx, voucherID); err != nil {
		return fmt.Errorf("failed to delete voucher: %w", err)
	}

	return nil
}

func (s *hotspotVoucherService) ActivateVoucher(ctx context.Context, tenantID, voucherCode, macAddress string) error {
	voucher, err := s.voucherRepo.FindByCode(ctx, tenantID, voucherCode)
	if err != nil {
		return fmt.Errorf("failed to find voucher: %w", err)
	}
	if voucher == nil {
		return errors.NewNotFoundError("voucher not found")
	}

	if !voucher.CanBeActivated() {
		return errors.NewValidationError("voucher cannot be activated")
	}

	// Load package info
	pkg, err := s.packageRepo.FindByID(ctx, voucher.PackageID.String())
	if err != nil {
		return fmt.Errorf("failed to find package: %w", err)
	}
	if pkg == nil {
		return errors.NewNotFoundError("package not found")
	}

	// Activate voucher
	voucher.Activate(pkg.Duration, pkg.DurationType)
	voucher.DeviceMAC = macAddress

	if err := s.voucherRepo.Update(ctx, voucher); err != nil {
		return fmt.Errorf("failed to activate voucher: %w", err)
	}

	return nil
}

func (s *hotspotVoucherService) GetVoucherStats(ctx context.Context, tenantID string, startDate, endDate time.Time) (*VoucherStats, error) {
	stats := &VoucherStats{}

	// Count by status
	unused, err := s.voucherRepo.CountByStatus(ctx, tenantID, entity.VoucherStatusUnused)
	if err != nil {
		return nil, fmt.Errorf("failed to count unused vouchers: %w", err)
	}
	stats.UnusedVouchers = unused

	active, err := s.voucherRepo.CountByStatus(ctx, tenantID, entity.VoucherStatusActive)
	if err != nil {
		return nil, fmt.Errorf("failed to count active vouchers: %w", err)
	}
	stats.ActiveVouchers = active

	expired, err := s.voucherRepo.CountByStatus(ctx, tenantID, entity.VoucherStatusExpired)
	if err != nil {
		return nil, fmt.Errorf("failed to count expired vouchers: %w", err)
	}
	stats.ExpiredVouchers = expired

	used, err := s.voucherRepo.CountByStatus(ctx, tenantID, entity.VoucherStatusUsed)
	if err != nil {
		return nil, fmt.Errorf("failed to count used vouchers: %w", err)
	}
	stats.UsedVouchers = used

	stats.TotalVouchers = unused + active + expired + used

	// Get package stats
	packages, err := s.packageRepo.FindByTenantID(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get packages: %w", err)
	}

	packageStats := make([]PackageVoucherStats, 0, len(packages))
	totalRevenue := 0

	for _, pkg := range packages {
		count, err := s.voucherRepo.CountByPackageAndDateRange(ctx, tenantID, pkg.ID.String(), startDate, endDate)
		if err != nil {
			return nil, fmt.Errorf("failed to count vouchers for package: %w", err)
		}

		if count > 0 {
			revenue := count * pkg.Price
			totalRevenue += revenue

			packageStats = append(packageStats, PackageVoucherStats{
				PackageID:   pkg.ID.String(),
				PackageName: pkg.Name,
				Count:       count,
				Revenue:     revenue,
			})
		}
	}

	stats.PackageStats = packageStats
	stats.TotalRevenue = totalRevenue

	return stats, nil
}

// generateVoucherCode generates a random voucher code
func generateVoucherCode(prefix string) string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const length = 8

	code := make([]byte, length)
	for i := range code {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		code[i] = charset[n.Int64()]
	}

	if prefix != "" {
		return prefix + string(code)
	}
	return string(code)
}

// generateVoucherPassword generates a random password
func generateVoucherPassword() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const length = 8

	password := make([]byte, length)
	for i := range password {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		password[i] = charset[n.Int64()]
	}

	return string(password)
}

// hashPassword hashes a password using bcrypt
func hashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedBytes), nil
}

// verifyPassword verifies a password against a hash
func verifyPassword(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}
