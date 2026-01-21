package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/router"
	"github.com/rtrwnet/saas-backend/internal/infrastructure/cache"
	"github.com/rtrwnet/saas-backend/internal/infrastructure/database"
	"github.com/rtrwnet/saas-backend/internal/repository/postgres"
	"github.com/rtrwnet/saas-backend/pkg/config"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"gorm.io/gorm"

	_ "github.com/rtrwnet/saas-backend/docs/swagger" // Import generated docs
)

// @title           RT RW Net SaaS Backend API
// @version         2.0.0
// @description     API untuk sistem manajemen RT RW Net berbasis SaaS dengan multi-tenant architecture.
// @description     
// @description     ## Features
// @description     - Multi-tenant architecture
// @description     - JWT authentication
// @description     - Free trial support (7 days)
// @description     - Subscription management
// @description     - Billing dashboard
// @description     
// @description     ## Authentication
// @description     Gunakan Bearer token di header Authorization untuk protected endpoints.
// @description     Untuk tenant identification, sertakan X-Tenant-ID di header.

// @contact.name   RT RW Net Support
// @contact.email  support@rtrwnet.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8089
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

// @securityDefinitions.apikey TenantID
// @in header
// @name X-Tenant-ID
// @description Tenant ID for multi-tenant access

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Set Gin mode
	gin.SetMode(cfg.Server.Mode)

	// Initialize database
	db, err := database.NewPostgresDB(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Redis cache
	redisCache, err := cache.NewRedisCache(&cfg.Redis)
	if err != nil {
		logger.Error("Failed to connect to Redis: %v", err)
		logger.Info("Continuing without Redis cache")
	}

	// Setup router with all dependencies
	routerCfg := &router.RouterConfig{
		DB:     db,
		Cache:  redisCache,
		Config: cfg,
	}

	r := router.SetupRouter(routerCfg)

	// Log startup info
	logger.Info("Database: connected")
	if redisCache != nil {
		logger.Info("Redis cache: connected")
	}

	// Note: RADIUS server is now handled by FreeRADIUS container
	// No need to start built-in RADIUS server
	logger.Info("RADIUS: Using FreeRADIUS server (external container)")

	// Start hotspot background jobs
	startHotspotBackgroundJobs(db)

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	logger.Info("Starting server on %s", addr)
	logger.Info("Environment: %s", cfg.Server.Mode)
	
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// startHotspotBackgroundJobs starts background jobs for hotspot management
func startHotspotBackgroundJobs(db *gorm.DB) {
	// Initialize repositories
	voucherRepo := postgres.NewHotspotVoucherRepository(db)

	// Start voucher status updater (every 5 minutes)
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		logger.Info("Voucher status updater started (interval: 5m)")

		for range ticker.C {
			ctx := context.Background()
			if err := voucherRepo.UpdateExpiredVouchers(ctx); err != nil {
				logger.Error("Voucher status updater error: %v", err)
			} else {
				logger.Info("Voucher status updated successfully")
			}
		}
	}()

	logger.Info("Hotspot background jobs started successfully")
}
