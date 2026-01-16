package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/auth"
	"github.com/rtrwnet/saas-backend/pkg/config"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
)

type AuthService interface {
	Register(ctx context.Context, tenantID, email, password, name, role string) (*UserProfile, error)
	Login(ctx context.Context, tenantID, email, password string) (*AuthResponse, error)
	SimpleLogin(ctx context.Context, username, password string) (*AuthResponse, error)
	Logout(ctx context.Context, refreshToken string) error
	RefreshToken(ctx context.Context, refreshToken string) (*TokenResponse, error)
	ValidateToken(ctx context.Context, token string) (*auth.TokenClaims, error)
}

type AuthResponse struct {
	AccessToken        string              `json:"access_token"`
	RefreshToken       string              `json:"refresh_token"`
	ExpiresIn          int64               `json:"expires_in"`
	User               *UserProfile        `json:"user"`
	SubscriptionStatus string              `json:"subscription_status,omitempty"`
	PendingOrderID     string              `json:"pending_order_id,omitempty"`
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"`
}

type UserProfile struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	Name      string  `json:"name"`
	Role      string  `json:"role"`
	TenantID  string  `json:"tenant_id"`
	AvatarURL *string `json:"avatar_url,omitempty"`
}

type authService struct {
	userRepo   repository.UserRepository
	tenantRepo repository.TenantRepository
	jwtConfig  *config.JWTConfig
	cache      CacheService
}

type CacheService interface {
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Get(ctx context.Context, key string, dest interface{}) error
	Delete(ctx context.Context, key string) error
}

func NewAuthService(
	userRepo repository.UserRepository,
	tenantRepo repository.TenantRepository,
	jwtConfig *config.JWTConfig,
	cache CacheService,
) AuthService {
	return &authService{
		userRepo:   userRepo,
		tenantRepo: tenantRepo,
		jwtConfig:  jwtConfig,
		cache:      cache,
	}
}

func (s *authService) Login(ctx context.Context, tenantID, email, password string) (*AuthResponse, error) {
	// Verify tenant exists and is active
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil {
		logger.Error("Failed to find tenant: %v", err)
		return nil, errors.ErrTenantNotFound
	}

	// Additional nil check
	if tenant == nil {
		logger.Error("Tenant is nil for ID: %s", tenantID)
		return nil, errors.ErrTenantNotFound
	}

	if !tenant.IsActive {
		return nil, errors.ErrTenantInactive
	}

	// Find user by email
	user, err := s.userRepo.FindByEmail(ctx, tenantID, email)
	if err != nil {
		logger.Error("Failed to find user: %v", err)
		return nil, errors.ErrInvalidCredentials
	}

	// Additional nil check
	if user == nil {
		logger.Error("User is nil for email: %s", email)
		return nil, errors.ErrInvalidCredentials
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.ErrUserInactive
	}

	// Verify password
	if err := auth.VerifyPassword(user.Password, password); err != nil {
		logger.Error("Invalid password for user: %s", email)
		return nil, errors.ErrInvalidCredentials
	}

	// Generate token pair
	tokenPair, err := auth.GenerateTokenPair(user.ID, user.TenantID, user.Role, s.jwtConfig)
	if err != nil {
		logger.Error("Failed to generate tokens: %v", err)
		return nil, errors.ErrInternalServer
	}

	// Store refresh token in cache (if cache is available)
	if s.cache != nil {
		refreshKey := fmt.Sprintf("refresh_token:%s", user.ID)
		if err := s.cache.Set(ctx, refreshKey, tokenPair.RefreshToken, s.jwtConfig.RefreshTokenExpiry); err != nil {
			logger.Error("Failed to store refresh token: %v", err)
			// Continue anyway, token is still valid
		}
	}

	logger.Info("User logged in successfully: %s (%s)", user.Email, user.ID)

	return &AuthResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresIn:    tokenPair.ExpiresIn,
		User: &UserProfile{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Role:      user.Role,
			TenantID:  user.TenantID,
			AvatarURL: user.AvatarURL,
		},
	}, nil
}

func (s *authService) SimpleLogin(ctx context.Context, username, password string) (*AuthResponse, error) {
	var tenant *entity.Tenant
	var user *entity.User
	var err error

	// Validate input
	if len(username) < 3 {
		return nil, errors.NewWithDetails("VAL_2006", "Invalid username", 400, map[string]string{
			"username": "Username must be at least 3 characters",
		})
	}

	if len(password) < 6 {
		return nil, errors.NewWithDetails("VAL_2005", "Invalid password", 400, map[string]string{
			"password": "Password must be at least 6 characters",
		})
	}

	// Find user by email across all tenants
	user, err = s.userRepo.FindByEmailGlobal(ctx, username)
	if err != nil || user == nil {
		logger.Error("User not found for email: %s", username)
		return nil, errors.ErrInvalidCredentials
	}

	// Get the tenant for this user
	tenant, err = s.tenantRepo.FindByID(ctx, user.TenantID)
	if err != nil || tenant == nil {
		logger.Error("Tenant not found for user: %s", username)
		return nil, errors.ErrTenantNotFound
	}

	// Check tenant is active
	if !tenant.IsActive {
		return nil, errors.ErrTenantInactive
	}

	// Check user is active
	if !user.IsActive {
		return nil, errors.ErrUserInactive
	}

	// Verify password
	if err := auth.VerifyPassword(user.Password, password); err != nil {
		logger.Error("Invalid password for user: %s", username)
		return nil, errors.ErrInvalidCredentials
	}

	// Generate token pair
	tokenPair, err := auth.GenerateTokenPair(user.ID, user.TenantID, user.Role, s.jwtConfig)
	if err != nil {
		logger.Error("Failed to generate tokens: %v", err)
		return nil, errors.ErrInternalServer
	}

	// Store refresh token in cache (if cache is available)
	if s.cache != nil {
		refreshKey := fmt.Sprintf("refresh_token:%s", user.ID)
		if err := s.cache.Set(ctx, refreshKey, tokenPair.RefreshToken, s.jwtConfig.RefreshTokenExpiry); err != nil {
			logger.Error("Failed to store refresh token: %v", err)
			// Continue anyway, token is still valid
		}
	}

	logger.Info("User logged in successfully via simple login: %s (%s)", user.Email, user.ID)

	return &AuthResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresIn:    tokenPair.ExpiresIn,
		User: &UserProfile{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Role:      user.Role,
			TenantID:  user.TenantID,
			AvatarURL: user.AvatarURL,
		},
	}, nil
}

func (s *authService) Logout(ctx context.Context, refreshToken string) error {
	// Validate refresh token to get user ID
	userID, err := auth.ValidateRefreshToken(refreshToken, s.jwtConfig)
	if err != nil {
		// If token is invalid, just proceed with logout
		logger.Info("Invalid refresh token during logout, proceeding anyway")
		return nil
	}

	// Delete refresh token from cache (if cache is available)
	if s.cache != nil {
		refreshKey := fmt.Sprintf("refresh_token:%s", userID)
		if err := s.cache.Delete(ctx, refreshKey); err != nil {
			// Log info but don't fail logout if cache is unavailable
			logger.Info("Cache unavailable, refresh token not invalidated (user: %s)", userID)
			// Continue with logout anyway - token will expire naturally
		}
	}

	logger.Info("User logged out successfully: %s", userID)

	return nil
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*TokenResponse, error) {
	// Validate refresh token and get user ID
	userID, err := auth.ValidateRefreshToken(refreshToken, s.jwtConfig)
	if err != nil {
		logger.Error("Failed to validate refresh token: %v", err)
		return nil, errors.ErrUnauthorized
	}

	// Check if refresh token exists in cache (if cache is available)
	if s.cache != nil {
		refreshKey := fmt.Sprintf("refresh_token:%s", userID)
		var storedToken string
		if err := s.cache.Get(ctx, refreshKey, &storedToken); err != nil {
			// Cache miss - token might still be valid if cache was cleared
			logger.Info("Refresh token not found in cache for user: %s, proceeding anyway", userID)
		} else if storedToken != refreshToken {
			logger.Error("Refresh token mismatch for user: %s", userID)
			return nil, errors.ErrUnauthorized
		}
	}

	// Get user to verify still active
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to find user: %v", err)
		return nil, errors.ErrUnauthorized
	}

	if !user.IsActive {
		return nil, errors.New("USER_INACTIVE", "User account is inactive", 403)
	}

	// Generate new access token
	accessToken, err := auth.GenerateAccessToken(user.ID, user.TenantID, user.Role, s.jwtConfig)
	if err != nil {
		logger.Error("Failed to generate access token: %v", err)
		return nil, errors.ErrInternalServer
	}

	logger.Info("Token refreshed for user: %s", user.ID)

	return &TokenResponse{
		AccessToken: accessToken,
		ExpiresIn:   int64(s.jwtConfig.AccessTokenExpiry.Seconds()),
	}, nil
}

func (s *authService) ValidateToken(ctx context.Context, token string) (*auth.TokenClaims, error) {
	claims, err := auth.ValidateToken(token, s.jwtConfig)
	if err != nil {
		logger.Error("Failed to validate token: %v", err)
		return nil, errors.ErrUnauthorized
	}

	return claims, nil
}


func (s *authService) Register(ctx context.Context, tenantID, email, password, name, role string) (*UserProfile, error) {
	// Verify tenant exists and is active
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil {
		logger.Error("Failed to find tenant: %v", err)
		return nil, errors.ErrTenantNotFound
	}

	// Additional nil check
	if tenant == nil {
		logger.Error("Tenant is nil for ID: %s", tenantID)
		return nil, errors.ErrTenantNotFound
	}

	if !tenant.IsActive {
		return nil, errors.ErrTenantInactive
	}

	// Check if user already exists
	existingUser, err := s.userRepo.FindByEmail(ctx, tenantID, email)
	if err == nil && existingUser != nil {
		return nil, errors.NewWithDetails("RES_6002", "User already exists", 409, map[string]string{
			"email": "User with this email already exists in this tenant",
		})
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		logger.Error("Failed to hash password: %v", err)
		return nil, errors.ErrInternalServer
	}

	// Create user
	user := &entity.User{
		TenantID: tenantID,
		Email:    email,
		Password: hashedPassword,
		Name:     name,
		Role:     role,
		IsActive: true,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		logger.Error("Failed to create user: %v", err)
		return nil, errors.ErrInternalServer
	}

	logger.Info("User registered successfully: %s (%s)", user.Email, user.ID)

	return &UserProfile{
		ID:       user.ID,
		Email:    user.Email,
		Name:     user.Name,
		Role:     user.Role,
		TenantID: user.TenantID,
	}, nil
}
