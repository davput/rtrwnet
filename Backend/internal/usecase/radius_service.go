package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type RadiusService interface {
	// NAS Management
	CreateNAS(ctx context.Context, tenantID string, req *CreateNASRequest) (*entity.RadiusNAS, error)
	ListNAS(ctx context.Context, tenantID string) ([]*entity.RadiusNAS, error)
	GetNAS(ctx context.Context, tenantID, nasID string) (*entity.RadiusNAS, error)
	UpdateNAS(ctx context.Context, tenantID, nasID string, req *UpdateNASRequest) error
	DeleteNAS(ctx context.Context, tenantID, nasID string) error

	// User Management
	CreateUser(ctx context.Context, tenantID string, req *CreateRadiusUserRequest) (*entity.RadiusUser, error)
	ListUsers(ctx context.Context, tenantID string, filters map[string]interface{}) ([]*entity.RadiusUser, error)
	GetUser(ctx context.Context, tenantID, userID string) (*entity.RadiusUser, error)
	UpdateUser(ctx context.Context, tenantID, userID string, req *UpdateRadiusUserRequest) error
	DeleteUser(ctx context.Context, tenantID, userID string) error
	SuspendUser(ctx context.Context, tenantID, userID string) error
	ActivateUser(ctx context.Context, tenantID, userID string) error

	// Profile Management
	CreateProfile(ctx context.Context, tenantID string, req *CreateProfileRequest) (*entity.RadiusProfile, error)
	ListProfiles(ctx context.Context, tenantID string) ([]*entity.RadiusProfile, error)
	GetProfile(ctx context.Context, tenantID, profileID string) (*entity.RadiusProfile, error)
	UpdateProfile(ctx context.Context, tenantID, profileID string, req *UpdateProfileRequest) error
	DeleteProfile(ctx context.Context, tenantID, profileID string) error
	SyncProfileFromServicePlan(ctx context.Context, tenantID, servicePlanID string) (*entity.RadiusProfile, error)

	// Accounting
	GetUserSessions(ctx context.Context, tenantID, userID string, limit int) ([]*entity.RadiusAccounting, error)
	GetActiveSessions(ctx context.Context, tenantID string) ([]*entity.RadiusAccounting, error)
	GetUsageStats(ctx context.Context, tenantID, userID string, startDate, endDate time.Time) (*UsageStats, error)

	// Auto-create user from customer
	CreateUserFromCustomer(ctx context.Context, tenantID string, customer *entity.Customer) (*entity.RadiusUser, error)
}

// Request/Response types
type CreateNASRequest struct {
	NASName     string `json:"nasname" binding:"required"`
	ShortName   string `json:"shortname" binding:"required"`
	Type        string `json:"type"`
	Ports       int    `json:"ports"`
	Secret      string `json:"secret" binding:"required"`
	Server      string `json:"server"`
	Community   string `json:"community"`
	Description string `json:"description"`
}

type UpdateNASRequest struct {
	NASName     string `json:"nasname"`
	ShortName   string `json:"shortname"`
	Type        string `json:"type"`
	Ports       int    `json:"ports"`
	Secret      string `json:"secret"`
	Server      string `json:"server"`
	Community   string `json:"community"`
	Description string `json:"description"`
	IsActive    *bool  `json:"is_active"`
}

type CreateRadiusUserRequest struct {
	CustomerID      string `json:"customer_id"`
	Username        string `json:"username" binding:"required"`
	Password        string `json:"password" binding:"required"`
	AuthType        string `json:"auth_type"`
	ProfileName     string `json:"profile_name"`
	IPAddress       string `json:"ip_address"`
	MACAddress      string `json:"mac_address"`
	SimultaneousUse int    `json:"simultaneous_use"`
	ExpireDays      int    `json:"expire_days"` // 0 = no expiry
}

type UpdateRadiusUserRequest struct {
	Password        string `json:"password"`
	AuthType        string `json:"auth_type"`
	ProfileName     string `json:"profile_name"`
	IPAddress       string `json:"ip_address"`
	MACAddress      string `json:"mac_address"`
	SimultaneousUse int    `json:"simultaneous_use"`
	ExpireDays      int    `json:"expire_days"`
	IsActive        *bool  `json:"is_active"`
}

type CreateProfileRequest struct {
	ServicePlanID    string `json:"service_plan_id"`
	Name             string `json:"name" binding:"required"`
	Description      string `json:"description"`
	RateLimitRx      int    `json:"rate_limit_rx"` // kbps
	RateLimitTx      int    `json:"rate_limit_tx"` // kbps
	BurstLimitRx     int    `json:"burst_limit_rx"`
	BurstLimitTx     int    `json:"burst_limit_tx"`
	BurstThresholdRx int    `json:"burst_threshold_rx"`
	BurstThresholdTx int    `json:"burst_threshold_tx"`
	BurstTime        int    `json:"burst_time"`
	SessionTimeout   int    `json:"session_timeout"`
	IdleTimeout      int    `json:"idle_timeout"`
	IPPool           string `json:"ip_pool"`
}

type UpdateProfileRequest struct {
	Name             string `json:"name"`
	Description      string `json:"description"`
	RateLimitRx      int    `json:"rate_limit_rx"`
	RateLimitTx      int    `json:"rate_limit_tx"`
	BurstLimitRx     int    `json:"burst_limit_rx"`
	BurstLimitTx     int    `json:"burst_limit_tx"`
	BurstThresholdRx int    `json:"burst_threshold_rx"`
	BurstThresholdTx int    `json:"burst_threshold_tx"`
	BurstTime        int    `json:"burst_time"`
	SessionTimeout   int    `json:"session_timeout"`
	IdleTimeout      int    `json:"idle_timeout"`
	IPPool           string `json:"ip_pool"`
	IsActive         *bool  `json:"is_active"`
}

type UsageStats struct {
	TotalSessions    int     `json:"total_sessions"`
	TotalUpload      int64   `json:"total_upload"`      // bytes
	TotalDownload    int64   `json:"total_download"`    // bytes
	TotalSessionTime int     `json:"total_session_time"` // seconds
	AvgSessionTime   float64 `json:"avg_session_time"`
}

// Implementation
type radiusService struct {
	db              *gorm.DB
	freeradiusSync  *FreeRADIUSSyncService
}

func NewRadiusService(db *gorm.DB) RadiusService {
	return &radiusService{
		db:             db,
		freeradiusSync: NewFreeRADIUSSyncService(db),
	}
}

// NAS Management
func (s *radiusService) CreateNAS(ctx context.Context, tenantID string, req *CreateNASRequest) (*entity.RadiusNAS, error) {
	nas := &entity.RadiusNAS{
		TenantID:    tenantID,
		NASName:     req.NASName,
		ShortName:   req.ShortName,
		Type:        req.Type,
		Ports:       req.Ports,
		Secret:      req.Secret,
		Server:      req.Server,
		Community:   req.Community,
		Description: req.Description,
		IsActive:    true,
	}

	if nas.Type == "" {
		nas.Type = "other"
	}

	if err := s.db.WithContext(ctx).Create(nas).Error; err != nil {
		logger.Error("Failed to create NAS: %v", err)
		return nil, errors.ErrInternalServer
	}

	logger.Info("NAS created: %s (%s)", nas.ShortName, nas.ID)
	return nas, nil
}

func (s *radiusService) ListNAS(ctx context.Context, tenantID string) ([]*entity.RadiusNAS, error) {
	var nasList []*entity.RadiusNAS
	if err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Find(&nasList).Error; err != nil {
		return nil, errors.ErrInternalServer
	}
	return nasList, nil
}

func (s *radiusService) GetNAS(ctx context.Context, tenantID, nasID string) (*entity.RadiusNAS, error) {
	var nas entity.RadiusNAS
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", nasID, tenantID).First(&nas).Error; err != nil {
		return nil, errors.ErrNotFound
	}
	return &nas, nil
}

func (s *radiusService) UpdateNAS(ctx context.Context, tenantID, nasID string, req *UpdateNASRequest) error {
	nas, err := s.GetNAS(ctx, tenantID, nasID)
	if err != nil {
		return err
	}

	if req.NASName != "" {
		nas.NASName = req.NASName
	}
	if req.ShortName != "" {
		nas.ShortName = req.ShortName
	}
	if req.Type != "" {
		nas.Type = req.Type
	}
	if req.Ports > 0 {
		nas.Ports = req.Ports
	}
	if req.Secret != "" {
		nas.Secret = req.Secret
	}
	nas.Server = req.Server
	nas.Community = req.Community
	nas.Description = req.Description
	if req.IsActive != nil {
		nas.IsActive = *req.IsActive
	}

	if err := s.db.WithContext(ctx).Save(nas).Error; err != nil {
		return errors.ErrInternalServer
	}
	return nil
}

func (s *radiusService) DeleteNAS(ctx context.Context, tenantID, nasID string) error {
	result := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", nasID, tenantID).Delete(&entity.RadiusNAS{})
	if result.Error != nil {
		return errors.ErrInternalServer
	}
	if result.RowsAffected == 0 {
		return errors.ErrNotFound
	}
	return nil
}

// User Management
func (s *radiusService) CreateUser(ctx context.Context, tenantID string, req *CreateRadiusUserRequest) (*entity.RadiusUser, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.ErrInternalServer
	}

	user := &entity.RadiusUser{
		TenantID:        tenantID,
		Username:        req.Username,
		PasswordHash:    string(hashedPassword),
		PasswordPlain:   req.Password, // TODO: Encrypt this for CHAP
		AuthType:        req.AuthType,
		ProfileName:     req.ProfileName,
		IPAddress:       req.IPAddress,
		MACAddress:      req.MACAddress,
		SimultaneousUse: req.SimultaneousUse,
		IsActive:        true,
	}

	if req.CustomerID != "" {
		user.CustomerID = &req.CustomerID
	}

	if user.AuthType == "" {
		user.AuthType = entity.AuthTypePAP
	}

	if user.SimultaneousUse == 0 {
		user.SimultaneousUse = 1
	}

	if req.ExpireDays > 0 {
		expireDate := time.Now().AddDate(0, 0, req.ExpireDays)
		user.ExpireDate = &expireDate
	}

	if err := s.db.WithContext(ctx).Create(user).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			return nil, errors.New("DUPLICATE_USERNAME", "Username already exists", 400)
		}
		logger.Error("Failed to create RADIUS user: %v", err)
		return nil, errors.ErrInternalServer
	}

	// Create default attributes
	s.createDefaultAttributes(ctx, user)

	// Sync to FreeRADIUS
	if err := s.freeradiusSync.SyncRadiusUser(user); err != nil {
		logger.Error("Failed to sync user to FreeRADIUS: %v", err)
		// Don't fail the request, just log the error
	}

	logger.Info("RADIUS user created: %s (%s)", user.Username, user.ID)
	return user, nil
}

func (s *radiusService) createDefaultAttributes(ctx context.Context, user *entity.RadiusUser) {
	attrs := []entity.RadiusUserAttribute{}

	// Add profile/rate limit if specified
	if user.ProfileName != "" {
		attrs = append(attrs, entity.RadiusUserAttribute{
			RadiusUserID: user.ID,
			Attribute:    "Mikrotik-Rate-Limit",
			Op:           ":=",
			Value:        user.ProfileName,
			AttrType:     "reply",
		})
	}

	// Add static IP if specified
	if user.IPAddress != "" {
		attrs = append(attrs, entity.RadiusUserAttribute{
			RadiusUserID: user.ID,
			Attribute:    "Framed-IP-Address",
			Op:           ":=",
			Value:        user.IPAddress,
			AttrType:     "reply",
		})
	}

	// Add simultaneous use check
	if user.SimultaneousUse > 0 {
		attrs = append(attrs, entity.RadiusUserAttribute{
			RadiusUserID: user.ID,
			Attribute:    "Simultaneous-Use",
			Op:           ":=",
			Value:        fmt.Sprintf("%d", user.SimultaneousUse),
			AttrType:     "check",
		})
	}

	if len(attrs) > 0 {
		s.db.WithContext(ctx).Create(&attrs)
	}
}

func (s *radiusService) ListUsers(ctx context.Context, tenantID string, filters map[string]interface{}) ([]*entity.RadiusUser, error) {
	var users []*entity.RadiusUser
	query := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Preload("Customer")

	if customerID, ok := filters["customer_id"].(string); ok && customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if isActive, ok := filters["is_active"].(bool); ok {
		query = query.Where("is_active = ?", isActive)
	}

	if err := query.Find(&users).Error; err != nil {
		return nil, errors.ErrInternalServer
	}
	return users, nil
}

func (s *radiusService) GetUser(ctx context.Context, tenantID, userID string) (*entity.RadiusUser, error) {
	var user entity.RadiusUser
	if err := s.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", userID, tenantID).
		Preload("Customer").
		Preload("Attributes").
		First(&user).Error; err != nil {
		return nil, errors.ErrNotFound
	}
	return &user, nil
}

func (s *radiusService) UpdateUser(ctx context.Context, tenantID, userID string, req *UpdateRadiusUserRequest) error {
	user, err := s.GetUser(ctx, tenantID, userID)
	if err != nil {
		return err
	}

	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return errors.ErrInternalServer
		}
		user.PasswordHash = string(hashedPassword)
		user.PasswordPlain = req.Password
	}

	if req.AuthType != "" {
		user.AuthType = req.AuthType
	}
	if req.ProfileName != "" {
		user.ProfileName = req.ProfileName
	}
	user.IPAddress = req.IPAddress
	user.MACAddress = req.MACAddress
	if req.SimultaneousUse > 0 {
		user.SimultaneousUse = req.SimultaneousUse
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	if req.ExpireDays > 0 {
		expireDate := time.Now().AddDate(0, 0, req.ExpireDays)
		user.ExpireDate = &expireDate
	}

	if err := s.db.WithContext(ctx).Save(user).Error; err != nil {
		return errors.ErrInternalServer
	}

	// Update attributes
	s.db.WithContext(ctx).Where("radius_user_id = ?", user.ID).Delete(&entity.RadiusUserAttribute{})
	s.createDefaultAttributes(ctx, user)

	// Sync to FreeRADIUS
	if err := s.freeradiusSync.SyncRadiusUser(user); err != nil {
		logger.Error("Failed to sync user to FreeRADIUS: %v", err)
	}

	return nil
}

func (s *radiusService) DeleteUser(ctx context.Context, tenantID, userID string) error {
	// Get user first to get username
	user, err := s.GetUser(ctx, tenantID, userID)
	if err != nil {
		return err
	}

	// Delete from FreeRADIUS
	if err := s.freeradiusSync.DeleteUser(user.Username); err != nil {
		logger.Error("Failed to delete user from FreeRADIUS: %v", err)
	}

	// Delete attributes first
	s.db.WithContext(ctx).Where("radius_user_id = ?", userID).Delete(&entity.RadiusUserAttribute{})

	result := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", userID, tenantID).Delete(&entity.RadiusUser{})
	if result.Error != nil {
		return errors.ErrInternalServer
	}
	if result.RowsAffected == 0 {
		return errors.ErrNotFound
	}
	return nil
}

func (s *radiusService) SuspendUser(ctx context.Context, tenantID, userID string) error {
	user, err := s.GetUser(ctx, tenantID, userID)
	if err != nil {
		return err
	}

	result := s.db.WithContext(ctx).Model(&entity.RadiusUser{}).
		Where("id = ? AND tenant_id = ?", userID, tenantID).
		Update("is_active", false)
	if result.Error != nil {
		return errors.ErrInternalServer
	}
	if result.RowsAffected == 0 {
		return errors.ErrNotFound
	}

	// Sync to FreeRADIUS (will remove user since inactive)
	user.IsActive = false
	if err := s.freeradiusSync.SyncRadiusUser(user); err != nil {
		logger.Error("Failed to sync suspended user to FreeRADIUS: %v", err)
	}

	return nil
}

func (s *radiusService) ActivateUser(ctx context.Context, tenantID, userID string) error {
	user, err := s.GetUser(ctx, tenantID, userID)
	if err != nil {
		return err
	}

	result := s.db.WithContext(ctx).Model(&entity.RadiusUser{}).
		Where("id = ? AND tenant_id = ?", userID, tenantID).
		Update("is_active", true)
	if result.Error != nil {
		return errors.ErrInternalServer
	}
	if result.RowsAffected == 0 {
		return errors.ErrNotFound
	}

	// Sync to FreeRADIUS
	user.IsActive = true
	if err := s.freeradiusSync.SyncRadiusUser(user); err != nil {
		logger.Error("Failed to sync activated user to FreeRADIUS: %v", err)
	}

	return nil
}

// Profile Management
func (s *radiusService) CreateProfile(ctx context.Context, tenantID string, req *CreateProfileRequest) (*entity.RadiusProfile, error) {
	profile := &entity.RadiusProfile{
		TenantID:         tenantID,
		Name:             req.Name,
		Description:      req.Description,
		RateLimitRx:      req.RateLimitRx,
		RateLimitTx:      req.RateLimitTx,
		BurstLimitRx:     req.BurstLimitRx,
		BurstLimitTx:     req.BurstLimitTx,
		BurstThresholdRx: req.BurstThresholdRx,
		BurstThresholdTx: req.BurstThresholdTx,
		BurstTime:        req.BurstTime,
		SessionTimeout:   req.SessionTimeout,
		IdleTimeout:      req.IdleTimeout,
		IPPool:           req.IPPool,
		IsActive:         true,
	}

	if req.ServicePlanID != "" {
		profile.ServicePlanID = &req.ServicePlanID
	}

	if profile.BurstTime == 0 {
		profile.BurstTime = 10
	}
	if profile.IdleTimeout == 0 {
		profile.IdleTimeout = 300
	}

	if err := s.db.WithContext(ctx).Create(profile).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			return nil, errors.New("DUPLICATE_PROFILE", "Profile name already exists", 400)
		}
		logger.Error("Failed to create RADIUS profile: %v", err)
		return nil, errors.ErrInternalServer
	}

	logger.Info("RADIUS profile created: %s (%s)", profile.Name, profile.ID)
	return profile, nil
}

func (s *radiusService) ListProfiles(ctx context.Context, tenantID string) ([]*entity.RadiusProfile, error) {
	var profiles []*entity.RadiusProfile
	if err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Preload("ServicePlan").Find(&profiles).Error; err != nil {
		return nil, errors.ErrInternalServer
	}
	return profiles, nil
}

func (s *radiusService) GetProfile(ctx context.Context, tenantID, profileID string) (*entity.RadiusProfile, error) {
	var profile entity.RadiusProfile
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", profileID, tenantID).Preload("ServicePlan").First(&profile).Error; err != nil {
		return nil, errors.ErrNotFound
	}
	return &profile, nil
}

func (s *radiusService) UpdateProfile(ctx context.Context, tenantID, profileID string, req *UpdateProfileRequest) error {
	profile, err := s.GetProfile(ctx, tenantID, profileID)
	if err != nil {
		return err
	}

	if req.Name != "" {
		profile.Name = req.Name
	}
	profile.Description = req.Description
	profile.RateLimitRx = req.RateLimitRx
	profile.RateLimitTx = req.RateLimitTx
	profile.BurstLimitRx = req.BurstLimitRx
	profile.BurstLimitTx = req.BurstLimitTx
	profile.BurstThresholdRx = req.BurstThresholdRx
	profile.BurstThresholdTx = req.BurstThresholdTx
	if req.BurstTime > 0 {
		profile.BurstTime = req.BurstTime
	}
	if req.SessionTimeout >= 0 {
		profile.SessionTimeout = req.SessionTimeout
	}
	if req.IdleTimeout > 0 {
		profile.IdleTimeout = req.IdleTimeout
	}
	profile.IPPool = req.IPPool
	if req.IsActive != nil {
		profile.IsActive = *req.IsActive
	}

	if err := s.db.WithContext(ctx).Save(profile).Error; err != nil {
		return errors.ErrInternalServer
	}
	return nil
}

func (s *radiusService) DeleteProfile(ctx context.Context, tenantID, profileID string) error {
	// Check if profile is in use
	var count int64
	s.db.WithContext(ctx).Model(&entity.RadiusUser{}).Where("profile_name = (SELECT name FROM radius_profiles WHERE id = ?)", profileID).Count(&count)
	if count > 0 {
		return errors.New("PROFILE_IN_USE", "Profile is being used by users", 400)
	}

	result := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", profileID, tenantID).Delete(&entity.RadiusProfile{})
	if result.Error != nil {
		return errors.ErrInternalServer
	}
	if result.RowsAffected == 0 {
		return errors.ErrNotFound
	}
	return nil
}

func (s *radiusService) SyncProfileFromServicePlan(ctx context.Context, tenantID, servicePlanID string) (*entity.RadiusProfile, error) {
	// Get service plan
	var plan entity.ServicePlan
	if err := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", servicePlanID, tenantID).First(&plan).Error; err != nil {
		return nil, errors.ErrNotFound
	}

	// Check if profile already exists
	var existingProfile entity.RadiusProfile
	err := s.db.WithContext(ctx).Where("service_plan_id = ? AND tenant_id = ?", servicePlanID, tenantID).First(&existingProfile).Error
	
	profileName := fmt.Sprintf("plan_%s", strings.ToLower(strings.ReplaceAll(plan.Name, " ", "_")))
	
	// Convert Mbps to kbps
	rateLimitRx := plan.SpeedDownload * 1000
	rateLimitTx := plan.SpeedUpload * 1000

	if err == nil {
		// Update existing
		existingProfile.Name = profileName
		existingProfile.Description = plan.Description
		existingProfile.RateLimitRx = rateLimitRx
		existingProfile.RateLimitTx = rateLimitTx
		s.db.WithContext(ctx).Save(&existingProfile)
		return &existingProfile, nil
	}

	// Create new
	return s.CreateProfile(ctx, tenantID, &CreateProfileRequest{
		ServicePlanID: servicePlanID,
		Name:          profileName,
		Description:   plan.Description,
		RateLimitRx:   rateLimitRx,
		RateLimitTx:   rateLimitTx,
	})
}

// Accounting
func (s *radiusService) GetUserSessions(ctx context.Context, tenantID, userID string, limit int) ([]*entity.RadiusAccounting, error) {
	var sessions []*entity.RadiusAccounting
	query := s.db.WithContext(ctx).Where("tenant_id = ? AND radius_user_id = ?", tenantID, userID).Order("acct_start_time DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&sessions).Error; err != nil {
		return nil, errors.ErrInternalServer
	}
	return sessions, nil
}

func (s *radiusService) GetActiveSessions(ctx context.Context, tenantID string) ([]*entity.RadiusAccounting, error) {
	var sessions []*entity.RadiusAccounting
	if err := s.db.WithContext(ctx).
		Preload("RadiusUser").
		Where("tenant_id = ? AND acct_stop_time IS NULL", tenantID).
		Order("acct_start_time DESC").
		Find(&sessions).Error; err != nil {
		return nil, errors.ErrInternalServer
	}
	return sessions, nil
}

func (s *radiusService) GetUsageStats(ctx context.Context, tenantID, userID string, startDate, endDate time.Time) (*UsageStats, error) {
	var stats UsageStats
	
	query := s.db.WithContext(ctx).Model(&entity.RadiusAccounting{}).
		Where("tenant_id = ? AND radius_user_id = ?", tenantID, userID)
	
	if !startDate.IsZero() {
		query = query.Where("acct_start_time >= ?", startDate)
	}
	if !endDate.IsZero() {
		query = query.Where("acct_start_time <= ?", endDate)
	}

	query.Select(`
		COUNT(*) as total_sessions,
		COALESCE(SUM(acct_input_octets), 0) as total_upload,
		COALESCE(SUM(acct_output_octets), 0) as total_download,
		COALESCE(SUM(acct_session_time), 0) as total_session_time
	`).Scan(&stats)

	if stats.TotalSessions > 0 {
		stats.AvgSessionTime = float64(stats.TotalSessionTime) / float64(stats.TotalSessions)
	}

	return &stats, nil
}

// Auto-create user from customer
func (s *radiusService) CreateUserFromCustomer(ctx context.Context, tenantID string, customer *entity.Customer) (*entity.RadiusUser, error) {
	// Generate username and password based on service type
	var username, password string

	switch customer.ServiceType {
	case entity.ServiceTypePPPoE:
		if customer.PPPoEUsername != "" {
			username = customer.PPPoEUsername
			password = customer.PPPoEPassword
		} else {
			username = fmt.Sprintf("pppoe_%s", customer.CustomerCode)
			password = generateRandomPassword(12)
		}
	case entity.ServiceTypeStatic:
		username = fmt.Sprintf("static_%s", customer.CustomerCode)
		password = generateRandomPassword(12)
	default: // DHCP
		username = fmt.Sprintf("dhcp_%s", customer.CustomerCode)
		password = generateRandomPassword(12)
	}

	// Get profile from service plan
	profileName := ""
	if customer.ServicePlanID != "" {
		profile, err := s.SyncProfileFromServicePlan(ctx, tenantID, customer.ServicePlanID)
		if err == nil {
			profileName = profile.Name
		}
	}

	return s.CreateUser(ctx, tenantID, &CreateRadiusUserRequest{
		CustomerID:      customer.ID,
		Username:        username,
		Password:        password,
		AuthType:        entity.AuthTypePAP,
		ProfileName:     profileName,
		IPAddress:       customer.StaticIP,
		SimultaneousUse: 1,
	})
}

func generateRandomPassword(length int) string {
	bytes := make([]byte, length/2)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
