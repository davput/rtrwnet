package middleware

import (
	"context"
	"encoding/json"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

// PlanLimits holds the current tenant's plan limits
type PlanLimits struct {
	PlanID       string              `json:"plan_id"`
	PlanName     string              `json:"plan_name"`
	PlanSlug     string              `json:"plan_slug"`
	IsTrial      bool                `json:"is_trial"`
	MaxCustomers int                 `json:"max_customers"`
	MaxUsers     int                 `json:"max_users"`
	Limits       entity.PlanLimits   `json:"limits"`
	Features     entity.PlanFeatures `json:"features"`
}

// PlanLimitMiddleware checks plan limits before allowing operations
type PlanLimitMiddleware struct {
	subscriptionRepo repository.TenantSubscriptionRepository
	planRepo         repository.SubscriptionPlanRepository
	customerRepo     repository.CustomerRepository
	userRepo         repository.UserRepository
}

func NewPlanLimitMiddleware(
	subscriptionRepo repository.TenantSubscriptionRepository,
	planRepo repository.SubscriptionPlanRepository,
	customerRepo repository.CustomerRepository,
	userRepo repository.UserRepository,
) *PlanLimitMiddleware {
	return &PlanLimitMiddleware{
		subscriptionRepo: subscriptionRepo,
		planRepo:         planRepo,
		customerRepo:     customerRepo,
		userRepo:         userRepo,
	}
}

// GetPlanLimits retrieves the plan limits for a tenant
func (m *PlanLimitMiddleware) GetPlanLimits(ctx context.Context, tenantID string) (*PlanLimits, error) {
	subscription, err := m.subscriptionRepo.FindActiveByTenantID(ctx, tenantID)
	if err != nil || subscription == nil {
		return nil, errors.ErrSubscriptionRequired
	}

	plan, err := m.planRepo.FindByID(ctx, subscription.PlanID)
	if err != nil || plan == nil {
		return nil, errors.ErrInvalidPlan
	}

	// Parse limits JSON
	var limits entity.PlanLimits
	if plan.Limits != "" {
		json.Unmarshal([]byte(plan.Limits), &limits)
	} else {
		// Fallback to legacy fields
		limits = entity.PlanLimits{
			MaxCustomers: plan.MaxCustomers,
			MaxUsers:     plan.MaxUsers,
		}
	}

	// Parse features JSON
	var features entity.PlanFeatures
	if plan.PlanFeatures != "" {
		json.Unmarshal([]byte(plan.PlanFeatures), &features)
	}

	return &PlanLimits{
		PlanID:       plan.ID,
		PlanName:     plan.Name,
		PlanSlug:     plan.Slug,
		IsTrial:      plan.IsTrial || subscription.Status == entity.SubscriptionStatusTrial,
		MaxCustomers: limits.MaxCustomers,
		MaxUsers:     limits.MaxUsers,
		Limits:       limits,
		Features:     features,
	}, nil
}

// CheckCustomerLimit checks if tenant can add more customers
func (m *PlanLimitMiddleware) CheckCustomerLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID, err := GetTenantIDFromContext(c)
		if err != nil {
			response.ErrorFromAppError(c, err.(*errors.AppError))
			c.Abort()
			return
		}

		limits, err := m.GetPlanLimits(c.Request.Context(), tenantID)
		if err != nil {
			if appErr, ok := err.(*errors.AppError); ok {
				response.ErrorFromAppError(c, appErr)
			} else {
				response.InternalServerError(c, "SRV_9001", "Failed to get plan limits")
			}
			c.Abort()
			return
		}

		// -1 means unlimited
		if limits.MaxCustomers == -1 {
			c.Set("plan_limits", limits)
			c.Next()
			return
		}

		// Count current customers
		currentCount, err := m.customerRepo.CountByTenantID(c.Request.Context(), tenantID)
		if err != nil {
			response.InternalServerError(c, "SRV_9001", "Failed to count customers")
			c.Abort()
			return
		}

		if currentCount >= limits.MaxCustomers {
			response.Error(c, 403, "PLAN_4001", "Customer limit reached", map[string]interface{}{
				"current":  currentCount,
				"limit":    limits.MaxCustomers,
				"plan":     limits.PlanName,
				"message":  "Upgrade paket Anda untuk menambah lebih banyak pelanggan",
			})
			c.Abort()
			return
		}

		c.Set("plan_limits", limits)
		c.Next()
	}
}

// CheckUserLimit checks if tenant can add more users
func (m *PlanLimitMiddleware) CheckUserLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID, err := GetTenantIDFromContext(c)
		if err != nil {
			response.ErrorFromAppError(c, err.(*errors.AppError))
			c.Abort()
			return
		}

		limits, err := m.GetPlanLimits(c.Request.Context(), tenantID)
		if err != nil {
			if appErr, ok := err.(*errors.AppError); ok {
				response.ErrorFromAppError(c, appErr)
			} else {
				response.InternalServerError(c, "SRV_9001", "Failed to get plan limits")
			}
			c.Abort()
			return
		}

		// -1 means unlimited
		if limits.MaxUsers == -1 {
			c.Set("plan_limits", limits)
			c.Next()
			return
		}

		// Count current users
		currentCount, err := m.userRepo.CountByTenantID(c.Request.Context(), tenantID)
		if err != nil {
			response.InternalServerError(c, "SRV_9001", "Failed to count users")
			c.Abort()
			return
		}

		if currentCount >= limits.MaxUsers {
			response.Error(c, 403, "PLAN_4002", "User limit reached", map[string]interface{}{
				"current":  currentCount,
				"limit":    limits.MaxUsers,
				"plan":     limits.PlanName,
				"message":  "Upgrade paket Anda untuk menambah lebih banyak user",
			})
			c.Abort()
			return
		}

		c.Set("plan_limits", limits)
		c.Next()
	}
}

// CheckFeature checks if a specific feature is enabled for the tenant's plan
func (m *PlanLimitMiddleware) CheckFeature(featureName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID, err := GetTenantIDFromContext(c)
		if err != nil {
			response.ErrorFromAppError(c, err.(*errors.AppError))
			c.Abort()
			return
		}

		limits, err := m.GetPlanLimits(c.Request.Context(), tenantID)
		if err != nil {
			if appErr, ok := err.(*errors.AppError); ok {
				response.ErrorFromAppError(c, appErr)
			} else {
				response.InternalServerError(c, "SRV_9001", "Failed to get plan limits")
			}
			c.Abort()
			return
		}

		// Check feature using reflection-like approach
		enabled := m.isFeatureEnabled(limits.Features, featureName)
		if enabled {
			c.Set("plan_limits", limits)
			c.Next()
			return
		}

		response.Error(c, 403, "PLAN_4003", "Feature not available", map[string]interface{}{
			"feature": featureName,
			"plan":    limits.PlanName,
			"message": "Fitur ini tidak tersedia di paket Anda. Upgrade untuk mengakses fitur ini.",
		})
		c.Abort()
	}
}

// isFeatureEnabled checks if a feature is enabled
func (m *PlanLimitMiddleware) isFeatureEnabled(features entity.PlanFeatures, featureName string) bool {
	switch featureName {
	case "customer_management":
		return features.CustomerManagement
	case "billing_management":
		return features.BillingManagement
	case "device_management":
		return features.DeviceManagement
	case "network_monitoring":
		return features.NetworkMonitoring
	case "user_management":
		return features.UserManagement
	case "mikrotik_integration":
		return features.MikrotikIntegration
	case "hotspot_management":
		return features.HotspotManagement
	case "vlan_management":
		return features.VLANManagement
	case "firewall_management":
		return features.FirewallManagement
	case "queue_management":
		return features.QueueManagement
	case "speed_boost":
		return features.SpeedBoost
	case "real_time_monitoring":
		return features.RealTimeMonitoring
	case "advanced_reports":
		return features.AdvancedReports
	case "custom_dashboard":
		return features.CustomDashboard
	case "data_export":
		return features.DataExport
	case "alert_system":
		return features.AlertSystem
	case "api_access":
		return features.APIAccess
	case "webhook_support":
		return features.WebhookSupport
	case "third_party_integration":
		return features.ThirdPartyIntegration
	case "custom_branding":
		return features.CustomBranding
	case "white_label":
		return features.WhiteLabel
	case "priority_support":
		return features.PrioritySupport
	case "phone_support":
		return features.PhoneSupport
	case "dedicated_manager":
		return features.DedicatedManager
	case "custom_training":
		return features.CustomTraining
	default:
		return false
	}
}

// CheckResourceLimit checks a specific resource limit
func (m *PlanLimitMiddleware) CheckResourceLimit(resourceType string, getCurrentCount func(ctx context.Context, tenantID string) (int, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID, err := GetTenantIDFromContext(c)
		if err != nil {
			response.ErrorFromAppError(c, err.(*errors.AppError))
			c.Abort()
			return
		}

		limits, err := m.GetPlanLimits(c.Request.Context(), tenantID)
		if err != nil {
			if appErr, ok := err.(*errors.AppError); ok {
				response.ErrorFromAppError(c, appErr)
			} else {
				response.InternalServerError(c, "SRV_9001", "Failed to get plan limits")
			}
			c.Abort()
			return
		}

		maxLimit := m.getResourceLimit(limits.Limits, resourceType)
		
		// -1 means unlimited
		if maxLimit == -1 {
			c.Set("plan_limits", limits)
			c.Next()
			return
		}

		currentCount, err := getCurrentCount(c.Request.Context(), tenantID)
		if err != nil {
			response.InternalServerError(c, "SRV_9001", "Failed to count resources")
			c.Abort()
			return
		}

		if currentCount >= maxLimit {
			response.Error(c, 403, "PLAN_4004", "Resource limit reached", map[string]interface{}{
				"resource": resourceType,
				"current":  currentCount,
				"limit":    maxLimit,
				"plan":     limits.PlanName,
				"message":  "Batas resource tercapai. Upgrade paket Anda untuk menambah lebih banyak.",
			})
			c.Abort()
			return
		}

		c.Set("plan_limits", limits)
		c.Next()
	}
}

// getResourceLimit gets the limit for a specific resource type
func (m *PlanLimitMiddleware) getResourceLimit(limits entity.PlanLimits, resourceType string) int {
	switch resourceType {
	case "customers":
		return limits.MaxCustomers
	case "users":
		return limits.MaxUsers
	case "devices":
		return limits.MaxDevices
	case "hotspots":
		return limits.MaxHotspots
	case "vlans":
		return limits.MaxVLANs
	case "firewall_rules":
		return limits.MaxFirewallRules
	case "queue_rules":
		return limits.MaxQueueRules
	case "alerts":
		return limits.MaxAlerts
	case "webhooks":
		return limits.MaxWebhooks
	default:
		return -1 // unlimited by default
	}
}

// AttachPlanLimits attaches plan limits to context without blocking
func (m *PlanLimitMiddleware) AttachPlanLimits() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID, err := GetTenantIDFromContext(c)
		if err != nil {
			c.Next()
			return
		}

		limits, err := m.GetPlanLimits(c.Request.Context(), tenantID)
		if err == nil {
			c.Set("plan_limits", limits)
		}

		c.Next()
	}
}
