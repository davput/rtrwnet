package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"golang.org/x/crypto/bcrypt"
)

type SettingsService interface {
	// User Settings
	GetUserSettings(ctx context.Context, tenantID, userID string) (*dto.UserSettingsResponse, error)
	UpdateUserSettings(ctx context.Context, tenantID, userID string, req *dto.UpdateUserSettingsRequest) (*dto.UserSettingsResponse, error)
	UpdateNotificationSettings(ctx context.Context, tenantID, userID string, req *dto.UpdateNotificationSettingsRequest) error

	// Tenant Settings
	GetTenantSettings(ctx context.Context, tenantID string) (*dto.TenantSettingsResponse, error)
	UpdateTenantSettings(ctx context.Context, tenantID string, req *dto.UpdateTenantSettingsRequest) (*dto.TenantSettingsResponse, error)
	UpdateIntegrationSettings(ctx context.Context, tenantID string, req *dto.UpdateIntegrationSettingsRequest) error

	// Profile
	UpdateProfile(ctx context.Context, tenantID, userID string, req *dto.UpdateProfileRequest) error
	ChangePassword(ctx context.Context, tenantID, userID string, req *dto.ChangePasswordRequest) error
}

type settingsService struct {
	settingsRepo repository.SettingsRepository
	userRepo     repository.UserRepository
}

func NewSettingsService(settingsRepo repository.SettingsRepository, userRepo repository.UserRepository) SettingsService {
	return &settingsService{
		settingsRepo: settingsRepo,
		userRepo:     userRepo,
	}
}

// ==================== USER SETTINGS ====================

func (s *settingsService) GetUserSettings(ctx context.Context, tenantID, userID string) (*dto.UserSettingsResponse, error) {
	settings, err := s.settingsRepo.GetUserSettings(ctx, tenantID, userID)
	if err != nil {
		// If not found, create default settings
		if err == errors.ErrNotFound {
			settings = s.createDefaultUserSettings(tenantID, userID)
			if err := s.settingsRepo.CreateUserSettings(ctx, settings); err != nil {
				logger.Error("Failed to create default user settings: %v", err)
				return nil, errors.ErrInternalServer
			}
		} else {
			logger.Error("Failed to get user settings: %v", err)
			return nil, errors.ErrInternalServer
		}
	}

	return s.toUserSettingsResponse(settings), nil
}

func (s *settingsService) UpdateUserSettings(ctx context.Context, tenantID, userID string, req *dto.UpdateUserSettingsRequest) (*dto.UserSettingsResponse, error) {
	settings, err := s.settingsRepo.GetUserSettings(ctx, tenantID, userID)
	if err != nil {
		if err == errors.ErrNotFound {
			settings = s.createDefaultUserSettings(tenantID, userID)
		} else {
			logger.Error("Failed to get user settings: %v", err)
			return nil, errors.ErrInternalServer
		}
	}

	// Update fields
	if req.EmailNotifications != nil {
		settings.EmailNotifications = *req.EmailNotifications
	}
	if req.PaymentNotifications != nil {
		settings.PaymentNotifications = *req.PaymentNotifications
	}
	if req.SystemNotifications != nil {
		settings.SystemNotifications = *req.SystemNotifications
	}
	if req.MarketingNotifications != nil {
		settings.MarketingNotifications = *req.MarketingNotifications
	}
	if req.Language != "" {
		settings.Language = req.Language
	}
	if req.Timezone != "" {
		settings.Timezone = req.Timezone
	}
	if req.DateFormat != "" {
		settings.DateFormat = req.DateFormat
	}

	if settings.ID == uuid.Nil {
		if err := s.settingsRepo.CreateUserSettings(ctx, settings); err != nil {
			logger.Error("Failed to create user settings: %v", err)
			return nil, errors.ErrInternalServer
		}
	} else {
		if err := s.settingsRepo.UpdateUserSettings(ctx, settings); err != nil {
			logger.Error("Failed to update user settings: %v", err)
			return nil, errors.ErrInternalServer
		}
	}

	return s.toUserSettingsResponse(settings), nil
}

func (s *settingsService) UpdateNotificationSettings(ctx context.Context, tenantID, userID string, req *dto.UpdateNotificationSettingsRequest) error {
	settings, err := s.settingsRepo.GetUserSettings(ctx, tenantID, userID)
	if err != nil {
		if err == errors.ErrNotFound {
			settings = s.createDefaultUserSettings(tenantID, userID)
		} else {
			logger.Error("Failed to get user settings: %v", err)
			return errors.ErrInternalServer
		}
	}

	settings.EmailNotifications = req.EmailNotifications
	settings.PaymentNotifications = req.PaymentNotifications
	settings.SystemNotifications = req.SystemNotifications
	settings.MarketingNotifications = req.MarketingNotifications

	if settings.ID == uuid.Nil {
		if err := s.settingsRepo.CreateUserSettings(ctx, settings); err != nil {
			logger.Error("Failed to create user settings: %v", err)
			return errors.ErrInternalServer
		}
	} else {
		if err := s.settingsRepo.UpdateUserSettings(ctx, settings); err != nil {
			logger.Error("Failed to update notification settings: %v", err)
			return errors.ErrInternalServer
		}
	}

	return nil
}

// ==================== TENANT SETTINGS ====================

func (s *settingsService) GetTenantSettings(ctx context.Context, tenantID string) (*dto.TenantSettingsResponse, error) {
	settings, err := s.settingsRepo.GetTenantSettings(ctx, tenantID)
	if err != nil {
		if err == errors.ErrNotFound {
			settings = s.createDefaultTenantSettings(tenantID)
			if err := s.settingsRepo.CreateTenantSettings(ctx, settings); err != nil {
				logger.Error("Failed to create default tenant settings: %v", err)
				return nil, errors.ErrInternalServer
			}
		} else {
			logger.Error("Failed to get tenant settings: %v", err)
			return nil, errors.ErrInternalServer
		}
	}

	return s.toTenantSettingsResponse(settings), nil
}

func (s *settingsService) UpdateTenantSettings(ctx context.Context, tenantID string, req *dto.UpdateTenantSettingsRequest) (*dto.TenantSettingsResponse, error) {
	settings, err := s.settingsRepo.GetTenantSettings(ctx, tenantID)
	if err != nil {
		if err == errors.ErrNotFound {
			settings = s.createDefaultTenantSettings(tenantID)
		} else {
			logger.Error("Failed to get tenant settings: %v", err)
			return nil, errors.ErrInternalServer
		}
	}

	// Update Business fields
	if req.CompanyName != "" {
		settings.CompanyName = req.CompanyName
	}
	if req.CompanyAddress != "" {
		settings.CompanyAddress = req.CompanyAddress
	}
	if req.CompanyPhone != "" {
		settings.CompanyPhone = req.CompanyPhone
	}
	if req.CompanyEmail != "" {
		settings.CompanyEmail = req.CompanyEmail
	}
	
	// Update Billing fields
	if req.BillingType != "" {
		settings.BillingType = req.BillingType
	}
	if req.BillingDateType != "" {
		settings.BillingDateType = req.BillingDateType
	}
	if req.BillingDay != nil {
		settings.BillingDay = *req.BillingDay
	}
	if req.DefaultDueDate != nil {
		settings.DefaultDueDate = *req.DefaultDueDate
	}
	if req.GracePeriodDays != nil {
		settings.GracePeriodDays = *req.GracePeriodDays
	}
	if req.LateFee != nil {
		settings.LateFee = *req.LateFee
	}
	if req.LateFeeType != "" {
		settings.LateFeeType = req.LateFeeType
	}
	if req.AutoSuspendEnabled != nil {
		settings.AutoSuspendEnabled = *req.AutoSuspendEnabled
	}
	if req.AutoSuspendDays != nil {
		settings.AutoSuspendDays = *req.AutoSuspendDays
	}
	if req.AutoReactivateOnPayment != nil {
		settings.AutoReactivateOnPayment = *req.AutoReactivateOnPayment
	}
	
	// Update Invoice fields
	if req.InvoicePrefix != "" {
		settings.InvoicePrefix = req.InvoicePrefix
	}
	if req.InvoiceFooter != "" {
		settings.InvoiceFooter = req.InvoiceFooter
	}
	if req.InvoiceDueDays != nil {
		settings.InvoiceDueDays = *req.InvoiceDueDays
	}
	if req.GenerateInvoiceDaysBefore != nil {
		settings.GenerateInvoiceDaysBefore = *req.GenerateInvoiceDaysBefore
	}
	if req.TaxEnabled != nil {
		settings.TaxEnabled = *req.TaxEnabled
	}
	if req.TaxPercentage != nil {
		settings.TaxPercentage = *req.TaxPercentage
	}
	
	// Update Notification fields
	if req.SendPaymentReminder != nil {
		settings.SendPaymentReminder = *req.SendPaymentReminder
	}
	if req.ReminderDaysBefore != nil {
		settings.ReminderDaysBefore = *req.ReminderDaysBefore
	}
	if req.SendOverdueNotice != nil {
		settings.SendOverdueNotice = *req.SendOverdueNotice
	}
	if req.SendPaymentConfirmation != nil {
		settings.SendPaymentConfirmation = *req.SendPaymentConfirmation
	}
	if req.SendSuspensionWarning != nil {
		settings.SendSuspensionWarning = *req.SendSuspensionWarning
	}
	if req.WarningDaysBeforeSuspension != nil {
		settings.WarningDaysBeforeSuspension = *req.WarningDaysBeforeSuspension
	}

	if settings.ID == uuid.Nil {
		if err := s.settingsRepo.CreateTenantSettings(ctx, settings); err != nil {
			logger.Error("Failed to create tenant settings: %v", err)
			return nil, errors.ErrInternalServer
		}
	} else {
		if err := s.settingsRepo.UpdateTenantSettings(ctx, settings); err != nil {
			logger.Error("Failed to update tenant settings: %v", err)
			return nil, errors.ErrInternalServer
		}
	}

	return s.toTenantSettingsResponse(settings), nil
}

func (s *settingsService) UpdateIntegrationSettings(ctx context.Context, tenantID string, req *dto.UpdateIntegrationSettingsRequest) error {
	settings, err := s.settingsRepo.GetTenantSettings(ctx, tenantID)
	if err != nil {
		if err == errors.ErrNotFound {
			settings = s.createDefaultTenantSettings(tenantID)
		} else {
			logger.Error("Failed to get tenant settings: %v", err)
			return errors.ErrInternalServer
		}
	}

	if req.WhatsappEnabled != nil {
		settings.WhatsappEnabled = *req.WhatsappEnabled
	}
	if req.WhatsappAPIKey != "" {
		settings.WhatsappAPIKey = req.WhatsappAPIKey
	}
	if req.TelegramEnabled != nil {
		settings.TelegramEnabled = *req.TelegramEnabled
	}
	if req.TelegramBotToken != "" {
		settings.TelegramBotToken = req.TelegramBotToken
	}

	if settings.ID == uuid.Nil {
		if err := s.settingsRepo.CreateTenantSettings(ctx, settings); err != nil {
			logger.Error("Failed to create tenant settings: %v", err)
			return errors.ErrInternalServer
		}
	} else {
		if err := s.settingsRepo.UpdateTenantSettings(ctx, settings); err != nil {
			logger.Error("Failed to update integration settings: %v", err)
			return errors.ErrInternalServer
		}
	}

	return nil
}

// ==================== PROFILE ====================

func (s *settingsService) UpdateProfile(ctx context.Context, tenantID, userID string, req *dto.UpdateProfileRequest) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to find user: %v", err)
		return errors.ErrNotFound
	}

	user.Name = req.Name
	user.Email = req.Email
	// Phone field not available in User entity yet
	// if req.Phone != "" {
	// 	user.Phone = req.Phone
	// }

	if err := s.userRepo.Update(ctx, user); err != nil {
		logger.Error("Failed to update user profile: %v", err)
		return errors.ErrInternalServer
	}

	return nil
}

func (s *settingsService) ChangePassword(ctx context.Context, tenantID, userID string, req *dto.ChangePasswordRequest) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to find user: %v", err)
		return errors.ErrNotFound
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		return errors.New("AUTH_INVALID_PASSWORD", "Current password is incorrect", 401)
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password: %v", err)
		return errors.ErrInternalServer
	}

	user.Password = string(hashedPassword)

	if err := s.userRepo.Update(ctx, user); err != nil {
		logger.Error("Failed to update password: %v", err)
		return errors.ErrInternalServer
	}

	return nil
}

// ==================== HELPERS ====================

func (s *settingsService) createDefaultUserSettings(tenantID, userID string) *entity.UserSettings {
	tenantUUID, _ := uuid.Parse(tenantID)
	userUUID, _ := uuid.Parse(userID)

	return &entity.UserSettings{
		TenantID:               tenantUUID,
		UserID:                 userUUID,
		EmailNotifications:     true,
		PaymentNotifications:   true,
		SystemNotifications:    true,
		MarketingNotifications: false,
		Language:               "id",
		Timezone:               "Asia/Jakarta",
		DateFormat:             "DD/MM/YYYY",
	}
}

func (s *settingsService) createDefaultTenantSettings(tenantID string) *entity.TenantSettings {
	tenantUUID, _ := uuid.Parse(tenantID)

	return &entity.TenantSettings{
		TenantID:                    tenantUUID,
		BillingType:                 "postpaid",
		BillingDateType:             "fixed",
		BillingDay:                  1,
		DefaultDueDate:              10,
		GracePeriodDays:             7,
		LateFee:                     0,
		LateFeeType:                 "fixed",
		AutoSuspendEnabled:          true,
		AutoSuspendDays:             14,
		AutoReactivateOnPayment:     true,
		InvoicePrefix:               "INV",
		InvoiceDueDays:              14,
		GenerateInvoiceDaysBefore:   7,
		TaxEnabled:                  false,
		TaxPercentage:               0,
		SendPaymentReminder:         true,
		ReminderDaysBefore:          3,
		SendOverdueNotice:           true,
		SendPaymentConfirmation:     true,
		SendSuspensionWarning:       true,
		WarningDaysBeforeSuspension: 3,
		WhatsappEnabled:             false,
		TelegramEnabled:             false,
	}
}

func (s *settingsService) toUserSettingsResponse(settings *entity.UserSettings) *dto.UserSettingsResponse {
	return &dto.UserSettingsResponse{
		ID:                     settings.ID.String(),
		UserID:                 settings.UserID.String(),
		EmailNotifications:     settings.EmailNotifications,
		PaymentNotifications:   settings.PaymentNotifications,
		SystemNotifications:    settings.SystemNotifications,
		MarketingNotifications: settings.MarketingNotifications,
		Language:               settings.Language,
		Timezone:               settings.Timezone,
		DateFormat:             settings.DateFormat,
	}
}

func (s *settingsService) toTenantSettingsResponse(settings *entity.TenantSettings) *dto.TenantSettingsResponse {
	return &dto.TenantSettingsResponse{
		ID:                          settings.ID.String(),
		TenantID:                    settings.TenantID.String(),
		CompanyName:                 settings.CompanyName,
		CompanyAddress:              settings.CompanyAddress,
		CompanyPhone:                settings.CompanyPhone,
		CompanyEmail:                settings.CompanyEmail,
		CompanyLogo:                 settings.CompanyLogo,
		BillingType:                 settings.BillingType,
		BillingDateType:             settings.BillingDateType,
		BillingDay:                  settings.BillingDay,
		DefaultDueDate:              settings.DefaultDueDate,
		GracePeriodDays:             settings.GracePeriodDays,
		LateFee:                     settings.LateFee,
		LateFeeType:                 settings.LateFeeType,
		AutoSuspendEnabled:          settings.AutoSuspendEnabled,
		AutoSuspendDays:             settings.AutoSuspendDays,
		AutoReactivateOnPayment:     settings.AutoReactivateOnPayment,
		InvoicePrefix:               settings.InvoicePrefix,
		InvoiceFooter:               settings.InvoiceFooter,
		InvoiceDueDays:              settings.InvoiceDueDays,
		GenerateInvoiceDaysBefore:   settings.GenerateInvoiceDaysBefore,
		TaxEnabled:                  settings.TaxEnabled,
		TaxPercentage:               settings.TaxPercentage,
		SendPaymentReminder:         settings.SendPaymentReminder,
		ReminderDaysBefore:          settings.ReminderDaysBefore,
		SendOverdueNotice:           settings.SendOverdueNotice,
		SendPaymentConfirmation:     settings.SendPaymentConfirmation,
		SendSuspensionWarning:       settings.SendSuspensionWarning,
		WarningDaysBeforeSuspension: settings.WarningDaysBeforeSuspension,
		WhatsappEnabled:             settings.WhatsappEnabled,
		TelegramEnabled:             settings.TelegramEnabled,
	}
}
