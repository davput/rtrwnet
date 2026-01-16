package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/auth"
	"github.com/rtrwnet/saas-backend/pkg/config"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
)

const (
	UserContextKey = "user"
	UserIDKey      = "user_id"
	UserRoleKey    = "user_role"
)

type AuthMiddleware struct {
	userRepo  repository.UserRepository
	jwtConfig *config.JWTConfig
}

func NewAuthMiddleware(userRepo repository.UserRepository, jwtConfig *config.JWTConfig) *AuthMiddleware {
	return &AuthMiddleware{
		userRepo:  userRepo,
		jwtConfig: jwtConfig,
	}
}

// RequireAuth middleware validates JWT token and loads user
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, errors.ErrUnauthorized)
			c.Abort()
			return
		}

		// Check Bearer prefix
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(401, errors.New("INVALID_TOKEN_FORMAT", "Invalid authorization header format", 401))
			c.Abort()
			return
		}

		token := parts[1]

		// Validate token
		claims, err := auth.ValidateToken(token, m.jwtConfig)
		if err != nil {
			logger.Error("Failed to validate token: %v", err)
			c.JSON(401, errors.ErrUnauthorized)
			c.Abort()
			return
		}

		// Load user from database
		user, err := m.userRepo.FindByID(c.Request.Context(), claims.UserID)
		if err != nil {
			logger.Error("Failed to find user: %v", err)
			c.JSON(401, errors.ErrUnauthorized)
			c.Abort()
			return
		}

		// Check if user is active
		if !user.IsActive {
			c.JSON(403, errors.New("USER_INACTIVE", "User account is inactive", 403))
			c.Abort()
			return
		}

		// Verify tenant matches
		tenantID, _ := GetTenantIDFromContext(c)
		if tenantID != "" && user.TenantID != tenantID {
			c.JSON(403, errors.New("TENANT_MISMATCH", "User does not belong to this tenant", 403))
			c.Abort()
			return
		}

		// Inject user into context
		c.Set(UserContextKey, user)
		c.Set(UserIDKey, user.ID)
		c.Set(UserRoleKey, user.Role)

		logger.Debug("User authenticated: %s (%s)", user.Email, user.ID)

		c.Next()
	}
}

// RequireRole middleware checks if user has required role
func (m *AuthMiddleware) RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			c.JSON(401, errors.ErrUnauthorized)
			c.Abort()
			return
		}

		// Check if user has any of the required roles
		hasRole := false
		for _, role := range roles {
			if user.Role == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			logger.Error("User %s does not have required role. Has: %s, Required: %v", user.ID, user.Role, roles)
			c.JSON(403, errors.ErrForbidden)
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetUserFromContext retrieves user from gin context
func GetUserFromContext(c *gin.Context) (*entity.User, error) {
	user, exists := c.Get(UserContextKey)
	if !exists {
		return nil, errors.New("USER_NOT_FOUND", "User not found in context", 500)
	}

	u, ok := user.(*entity.User)
	if !ok {
		return nil, errors.New("INVALID_USER_TYPE", "Invalid user type in context", 500)
	}

	return u, nil
}

// GetUserIDFromContext retrieves user ID from gin context
func GetUserIDFromContext(c *gin.Context) (string, error) {
	userID, exists := c.Get(UserIDKey)
	if !exists {
		return "", errors.New("USER_ID_NOT_FOUND", "User ID not found in context", 500)
	}

	id, ok := userID.(string)
	if !ok {
		return "", errors.New("INVALID_USER_ID_TYPE", "Invalid user ID type in context", 500)
	}

	return id, nil
}
