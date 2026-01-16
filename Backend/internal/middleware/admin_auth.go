package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

// AdminAuthMiddleware handles admin authentication
type AdminAuthMiddleware struct {
	adminUserRepo repository.AdminUserRepository
	jwtSecret     string
}

func NewAdminAuthMiddleware(adminUserRepo repository.AdminUserRepository, jwtSecret string) *AdminAuthMiddleware {
	return &AdminAuthMiddleware{
		adminUserRepo: adminUserRepo,
		jwtSecret:     jwtSecret,
	}
}

// RequireAdminAuth middleware to check admin authentication
func (m *AdminAuthMiddleware) RequireAdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "AUTH_1002", "Authorization header is required")
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(c, "AUTH_1002", "Invalid authorization header format")
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Parse and validate JWT token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(m.jwtSecret), nil
		})

		if err != nil || !token.Valid {
			response.Unauthorized(c, "AUTH_1002", "Invalid or expired token")
			c.Abort()
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			response.Unauthorized(c, "AUTH_1002", "Invalid token claims")
			c.Abort()
			return
		}

		// Get admin_id from claims
		adminID, ok := claims["admin_id"].(string)
		if !ok || adminID == "" {
			response.Unauthorized(c, "AUTH_1002", "Invalid admin token")
			c.Abort()
			return
		}

		// Get admin from database to verify still active
		admin, err := m.adminUserRepo.GetByID(c.Request.Context(), adminID)
		if err != nil {
			response.Unauthorized(c, "AUTH_1002", "Admin not found")
			c.Abort()
			return
		}

		if !admin.IsActive {
			response.Forbidden(c, "AUTH_1003", "Account is inactive")
			c.Abort()
			return
		}

		// Set admin info in context
		c.Set("admin_id", admin.ID)
		c.Set("admin_email", admin.Email)
		c.Set("admin_name", admin.Name)
		c.Set("admin_role", admin.Role)

		c.Next()
	}
}

// RequireSuperAdmin middleware to check super admin role
func (m *AdminAuthMiddleware) RequireSuperAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("admin_role")
		if role != "super_admin" {
			response.Forbidden(c, "AUTH_1004", "Super admin access required")
			c.Abort()
			return
		}
		c.Next()
	}
}
