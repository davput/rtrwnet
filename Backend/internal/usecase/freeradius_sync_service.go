package usecase

import (
	"fmt"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"gorm.io/gorm"
)

// FreeRADIUSSyncService handles synchronization between application tables and FreeRADIUS tables
type FreeRADIUSSyncService struct {
	db *gorm.DB
}

// NewFreeRADIUSSyncService creates a new FreeRADIUS sync service
func NewFreeRADIUSSyncService(db *gorm.DB) *FreeRADIUSSyncService {
	return &FreeRADIUSSyncService{
		db: db,
	}
}

// SyncRadiusUser syncs a RADIUS user to FreeRADIUS tables (radcheck and radreply)
func (s *FreeRADIUSSyncService) SyncRadiusUser(user *entity.RadiusUser) error {
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete existing entries for this user
	if err := tx.Exec("DELETE FROM radcheck WHERE username = ?", user.Username).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete old radcheck entries: %w", err)
	}

	if err := tx.Exec("DELETE FROM radreply WHERE username = ?", user.Username).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete old radreply entries: %w", err)
	}

	// Only sync if user is active
	if !user.IsActive {
		logger.Info("FreeRADIUS: User %s is inactive, skipping sync", user.Username)
		return tx.Commit().Error
	}

	// Insert Cleartext-Password to radcheck
	if err := tx.Exec(`
		INSERT INTO radcheck (username, attribute, op, value, is_active, tenant_id)
		VALUES (?, 'Cleartext-Password', ':=', ?, true, ?)
	`, user.Username, user.PasswordPlain, user.TenantID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to insert password to radcheck: %w", err)
	}

	// Check expiration
	if user.ExpireDate != nil && time.Now().After(*user.ExpireDate) {
		// User expired, add Expiration attribute to reject
		if err := tx.Exec(`
			INSERT INTO radcheck (username, attribute, op, value, is_active, tenant_id)
			VALUES (?, 'Expiration', ':=', ?, true, ?)
		`, user.Username, user.ExpireDate.Format("Jan 02 2006 15:04:05"), user.TenantID).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to insert expiration to radcheck: %w", err)
		}
	}

	// Add static IP if configured
	if user.IPAddress != "" {
		if err := tx.Exec(`
			INSERT INTO radreply (username, attribute, op, value, is_active, tenant_id)
			VALUES (?, 'Framed-IP-Address', ':=', ?, true, ?)
		`, user.Username, user.IPAddress, user.TenantID).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to insert IP address to radreply: %w", err)
		}
	}

	// Get customer's service plan for rate limiting
	if user.CustomerID != nil {
		var customer entity.Customer
		if err := tx.Preload("ServicePlan").Where("id = ?", *user.CustomerID).First(&customer).Error; err == nil {
			if customer.ServicePlan != nil {
				// Add MikroTik rate limit
				downloadKbps := customer.ServicePlan.SpeedDownload * 1000
				uploadKbps := customer.ServicePlan.SpeedUpload * 1000
				rateLimit := fmt.Sprintf("%dk/%dk", uploadKbps, downloadKbps)

				// Check for burst settings
				var advSettings entity.ServicePlanAdvancedSettings
				if err := tx.Where("service_plan_id = ?", customer.ServicePlan.ID).First(&advSettings).Error; err == nil {
					if advSettings.BurstEnabled && advSettings.BurstLimit > 0 {
						burstKbps := advSettings.BurstLimit * 1000
						thresholdKbps := advSettings.BurstThreshold * 1000
						rateLimit = fmt.Sprintf("%dk/%dk %dk/%dk %dk/%dk %d/%d",
							uploadKbps, downloadKbps,
							burstKbps, burstKbps,
							thresholdKbps, thresholdKbps,
							advSettings.BurstTime, advSettings.BurstTime)
					}
				}

				// Insert Mikrotik-Rate-Limit
				if err := tx.Exec(`
					INSERT INTO radreply (username, attribute, op, value, is_active, tenant_id)
					VALUES (?, 'Mikrotik-Rate-Limit', ':=', ?, true, ?)
				`, user.Username, rateLimit, user.TenantID).Error; err != nil {
					tx.Rollback()
					return fmt.Errorf("failed to insert rate limit to radreply: %w", err)
				}

				// Insert Mikrotik-Group (PPP Profile)
				profileName := customer.ServicePlan.Name
				if err := tx.Exec(`
					INSERT INTO radreply (username, attribute, op, value, is_active, tenant_id)
					VALUES (?, 'Mikrotik-Group', ':=', ?, true, ?)
				`, user.Username, profileName, user.TenantID).Error; err != nil {
					tx.Rollback()
					return fmt.Errorf("failed to insert profile to radreply: %w", err)
				}

				logger.Info("FreeRADIUS: Synced user %s with rate limit %s and profile %s", 
					user.Username, rateLimit, profileName)
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	logger.Info("FreeRADIUS: Successfully synced user %s", user.Username)
	return nil
}

// SyncHotspotVoucher syncs a hotspot voucher to FreeRADIUS tables
func (s *FreeRADIUSSyncService) SyncHotspotVoucher(voucher *entity.HotspotVoucher) error {
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete existing entries
	if err := tx.Exec("DELETE FROM radcheck WHERE username = ?", voucher.VoucherCode).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete old radcheck entries: %w", err)
	}

	if err := tx.Exec("DELETE FROM radreply WHERE username = ?", voucher.VoucherCode).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete old radreply entries: %w", err)
	}

	// Only sync if voucher is active and not used
	if voucher.Status != "active" {
		logger.Info("FreeRADIUS: Voucher %s is not active, skipping sync", voucher.VoucherCode)
		return tx.Commit().Error
	}

	// Insert password
	if err := tx.Exec(`
		INSERT INTO radcheck (username, attribute, op, value, is_active, tenant_id)
		VALUES (?, 'Cleartext-Password', ':=', ?, true, ?)
	`, voucher.VoucherCode, voucher.VoucherPassword, voucher.TenantID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to insert voucher password: %w", err)
	}

	// Get hotspot package for rate limiting
	var pkg entity.HotspotPackage
	if err := tx.Where("id = ?", voucher.PackageID).First(&pkg).Error; err == nil {
		// Add rate limit
		downloadKbps := pkg.SpeedDownload * 1000
		uploadKbps := pkg.SpeedUpload * 1000
		rateLimit := fmt.Sprintf("%dk/%dk", uploadKbps, downloadKbps)

		if err := tx.Exec(`
			INSERT INTO radreply (username, attribute, op, value, is_active, tenant_id)
			VALUES (?, 'Mikrotik-Rate-Limit', ':=', ?, true, ?)
		`, voucher.VoucherCode, rateLimit, voucher.TenantID).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to insert voucher rate limit: %w", err)
		}

		// Note: Session timeout and idle timeout can be added here if needed
		// For now, we rely on package duration settings

		logger.Info("FreeRADIUS: Synced voucher %s with rate limit %s", voucher.VoucherCode, rateLimit)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	logger.Info("FreeRADIUS: Successfully synced voucher %s", voucher.VoucherCode)
	return nil
}

// SyncCustomerHotspot syncs customer hotspot credentials to FreeRADIUS
func (s *FreeRADIUSSyncService) SyncCustomerHotspot(customer *entity.Customer) error {
	if !customer.HotspotEnabled || customer.HotspotUsername == "" {
		// Remove from FreeRADIUS if disabled
		s.db.Exec("DELETE FROM radcheck WHERE username = ?", customer.HotspotUsername)
		s.db.Exec("DELETE FROM radreply WHERE username = ?", customer.HotspotUsername)
		return nil
	}

	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete existing entries
	if err := tx.Exec("DELETE FROM radcheck WHERE username = ?", customer.HotspotUsername).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete old radcheck entries: %w", err)
	}

	if err := tx.Exec("DELETE FROM radreply WHERE username = ?", customer.HotspotUsername).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete old radreply entries: %w", err)
	}

	// Insert password
	if err := tx.Exec(`
		INSERT INTO radcheck (username, attribute, op, value, is_active, tenant_id)
		VALUES (?, 'Cleartext-Password', ':=', ?, true, ?)
	`, customer.HotspotUsername, customer.HotspotPassword, customer.TenantID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to insert hotspot password: %w", err)
	}

	// Get service plan for rate limiting
	if customer.ServicePlanID != "" {
		var plan entity.ServicePlan
		if err := tx.Where("id = ?", customer.ServicePlanID).First(&plan).Error; err == nil {
			downloadKbps := plan.SpeedDownload * 1000
			uploadKbps := plan.SpeedUpload * 1000
			rateLimit := fmt.Sprintf("%dk/%dk", uploadKbps, downloadKbps)

			if err := tx.Exec(`
				INSERT INTO radreply (username, attribute, op, value, is_active, tenant_id)
				VALUES (?, 'Mikrotik-Rate-Limit', ':=', ?, true, ?)
			`, customer.HotspotUsername, rateLimit, customer.TenantID).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("failed to insert rate limit: %w", err)
			}

			logger.Info("FreeRADIUS: Synced customer hotspot %s with rate limit %s", 
				customer.HotspotUsername, rateLimit)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	logger.Info("FreeRADIUS: Successfully synced customer hotspot %s", customer.HotspotUsername)
	return nil
}

// SyncAllUsers syncs all active RADIUS users to FreeRADIUS
func (s *FreeRADIUSSyncService) SyncAllUsers() error {
	var users []entity.RadiusUser
	if err := s.db.Where("is_active = ?", true).Find(&users).Error; err != nil {
		return fmt.Errorf("failed to fetch users: %w", err)
	}

	successCount := 0
	errorCount := 0

	for _, user := range users {
		if err := s.SyncRadiusUser(&user); err != nil {
			logger.Error("FreeRADIUS: Failed to sync user %s: %v", user.Username, err)
			errorCount++
		} else {
			successCount++
		}
	}

	logger.Info("FreeRADIUS: Bulk sync completed - success: %d, errors: %d", successCount, errorCount)
	return nil
}

// SyncAllVouchers syncs all active vouchers to FreeRADIUS
func (s *FreeRADIUSSyncService) SyncAllVouchers() error {
	var vouchers []entity.HotspotVoucher
	if err := s.db.Where("status = ?", "active").Find(&vouchers).Error; err != nil {
		return fmt.Errorf("failed to fetch vouchers: %w", err)
	}

	successCount := 0
	errorCount := 0

	for _, voucher := range vouchers {
		if err := s.SyncHotspotVoucher(&voucher); err != nil {
			logger.Error("FreeRADIUS: Failed to sync voucher %s: %v", voucher.VoucherCode, err)
			errorCount++
		} else {
			successCount++
		}
	}

	logger.Info("FreeRADIUS: Voucher sync completed - success: %d, errors: %d", successCount, errorCount)
	return nil
}

// DeleteUser removes user from FreeRADIUS tables
func (s *FreeRADIUSSyncService) DeleteUser(username string) error {
	tx := s.db.Begin()
	
	if err := tx.Exec("DELETE FROM radcheck WHERE username = ?", username).Error; err != nil {
		tx.Rollback()
		return err
	}
	
	if err := tx.Exec("DELETE FROM radreply WHERE username = ?", username).Error; err != nil {
		tx.Rollback()
		return err
	}
	
	return tx.Commit().Error
}
