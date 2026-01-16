package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
)

const (
	TenantContextKey = "tenant"
	TenantIDKey      = "tenant_id"
)

type TenantMiddleware struct {
	tenantRepo repository.TenantRepository
}

func NewTenantMiddleware(tenantRepo repository.TenantRepository) *TenantMiddleware {
	return &TenantMiddleware{
		tenantRepo: tenantRepo,
	}
}

// ExtractTenant middleware extracts tenant from request and injects into context
func (m *TenantMiddleware) ExtractTenant() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tenant *entity.Tenant
		var err error

		// Try to extract from X-Tenant-ID header first
		tenantID := c.GetHeader("X-Tenant-ID")
		if tenantID != "" {
			tenant, err = m.tenantRepo.FindByID(c.Request.Context(), tenantID)
			if err != nil {
				logger.Error("Failed to find tenant by ID: %v", err)
				c.JSON(401, errors.New("INVALID_TENANT", "Invalid tenant ID", 401))
				c.Abort()
				return
			}
		}

		// If no tenant found, return error
		if tenant == nil {
			c.JSON(401, errors.New("TENANT_REQUIRED", "Tenant identification required", 401))
			c.Abort()
			return
		}

		// Check if tenant is active
		if !tenant.IsActive {
			c.JSON(403, errors.New("TENANT_INACTIVE", "Tenant is inactive", 403))
			c.Abort()
			return
		}

		// Inject tenant into context
		c.Set(TenantContextKey, tenant)
		c.Set(TenantIDKey, tenant.ID)

		logger.Debug("Tenant extracted: %s (%s)", tenant.Name, tenant.ID)

		c.Next()
	}
}

// extractSubdomain extracts subdomain from host
// Example: tenant1.rtrwnet.com -> tenant1
func extractSubdomain(host string) string {
	// Remove port if present
	if idx := strings.Index(host, ":"); idx != -1 {
		host = host[:idx]
	}

	parts := strings.Split(host, ".")
	if len(parts) >= 3 {
		return parts[0]
	}

	return ""
}

// GetTenantFromContext retrieves tenant from gin context
func GetTenantFromContext(c *gin.Context) (*entity.Tenant, error) {
	tenant, exists := c.Get(TenantContextKey)
	if !exists {
		return nil, errors.New("TENANT_NOT_FOUND", "Tenant not found in context", 500)
	}

	t, ok := tenant.(*entity.Tenant)
	if !ok {
		return nil, errors.New("INVALID_TENANT_TYPE", "Invalid tenant type in context", 500)
	}

	return t, nil
}

// GetTenantIDFromContext retrieves tenant ID from gin context
func GetTenantIDFromContext(c *gin.Context) (string, error) {
	tenantID, exists := c.Get(TenantIDKey)
	if !exists {
		return "", errors.New("TENANT_ID_NOT_FOUND", "Tenant ID not found in context", 500)
	}

	id, ok := tenantID.(string)
	if !ok {
		return "", errors.New("INVALID_TENANT_ID_TYPE", "Invalid tenant ID type in context", 500)
	}

	return id, nil
}
