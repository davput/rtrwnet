package router

import (
	"context"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/handler"
	"github.com/rtrwnet/saas-backend/internal/infrastructure/cache"
	radiusModule "github.com/rtrwnet/saas-backend/internal/infrastructure/radius"
	"github.com/rtrwnet/saas-backend/internal/middleware"
	"github.com/rtrwnet/saas-backend/internal/repository/postgres"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/config"
	"github.com/rtrwnet/saas-backend/pkg/email"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"github.com/rtrwnet/saas-backend/pkg/payment"
	"github.com/rtrwnet/saas-backend/pkg/storage"
	"github.com/rtrwnet/saas-backend/pkg/websocket"
	"gorm.io/gorm"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type RouterConfig struct {
	DB        *gorm.DB
	Cache     *cache.RedisCache
	Config    *config.Config
}

func SetupRouter(cfg *RouterConfig) *gin.Engine {
	router := gin.Default()

	// Apply global middleware
	router.Use(middleware.CORSMiddleware(cfg.Config.CORS.AllowedOrigins))
	router.Use(middleware.Logger())
	router.Use(middleware.ErrorHandler())

	// Apply rate limiter (10 requests per second per user)
	var redisClient *redis.Client
	if cfg.Cache != nil {
		redisClient = cfg.Cache.Client()
	}
	router.Use(middleware.PerUserRateLimiter(redisClient, 10, time.Second))

	// Initialize repositories
	tenantRepo := postgres.NewTenantRepository(cfg.DB)
	userRepo := postgres.NewUserRepository(cfg.DB)
	planRepo := postgres.NewSubscriptionPlanRepository(cfg.DB)
	subscriptionRepo := postgres.NewTenantSubscriptionRepository(cfg.DB)
	transactionRepo := postgres.NewPaymentTransactionRepository(cfg.DB)
	customerRepo := postgres.NewCustomerRepository(cfg.DB)
	paymentRepo := postgres.NewPaymentRepository(cfg.DB)
	servicePlanRepo := postgres.NewServicePlanRepository(cfg.DB)
	ticketRepo := postgres.NewTicketRepository(cfg.DB)
	infraRepo := postgres.NewInfrastructureRepository(cfg.DB)
	deviceRepo := postgres.NewDeviceRepository(cfg.DB)
	settingsRepo := postgres.NewSettingsRepository(cfg.DB)
	chatRepo := postgres.NewChatRepository(cfg.DB)

	// Admin repositories
	adminUserRepo := postgres.NewAdminUserRepository(cfg.DB)
	adminAuditLogRepo := postgres.NewAdminAuditLogRepository(cfg.DB)
	supportTicketRepo := postgres.NewSupportTicketRepository(cfg.DB)
	adminTenantRepo := postgres.NewAdminTenantRepository(cfg.DB)
	otpRepo := postgres.NewOTPRepository(cfg.DB)

	// Initialize middleware
	tenantMiddleware := middleware.NewTenantMiddleware(tenantRepo)
	authMiddleware := middleware.NewAuthMiddleware(userRepo, &cfg.Config.JWT)
	adminAuthMiddleware := middleware.NewAdminAuthMiddleware(adminUserRepo, cfg.Config.JWT.Secret)
	planLimitMiddleware := middleware.NewPlanLimitMiddleware(subscriptionRepo, planRepo, customerRepo, userRepo)

	// Initialize services
	authService := usecase.NewAuthService(userRepo, tenantRepo, &cfg.Config.JWT, cfg.Cache)
	tenantService := usecase.NewTenantService(tenantRepo)
	subscriptionService := usecase.NewSubscriptionService(planRepo, tenantRepo, userRepo, subscriptionRepo, transactionRepo)
	dashboardService := usecase.NewDashboardService(cfg.DB, customerRepo, paymentRepo, servicePlanRepo, tenantRepo, userRepo, subscriptionRepo, planRepo)
	billingService := usecase.NewBillingService(tenantRepo, subscriptionRepo, planRepo, transactionRepo)
	ticketService := usecase.NewTicketService(ticketRepo, customerRepo)
	infraService := usecase.NewInfrastructureService(infraRepo)
	mikrotikService := usecase.NewMikrotikService()
	deviceService := usecase.NewDeviceService(deviceRepo, mikrotikService)
	settingsService := usecase.NewSettingsService(settingsRepo, userRepo)
	radiusService := usecase.NewRadiusService(cfg.DB)
	vpnService := usecase.NewVPNService(cfg.DB)

	// Initialize Midtrans client
	midtransConfig := &payment.MidtransConfig{
		ServerKey:    cfg.Config.Midtrans.ServerKey,
		ClientKey:    cfg.Config.Midtrans.ClientKey,
		IsProduction: cfg.Config.Midtrans.IsProduction,
	}
	midtransClient := payment.NewMidtransClient(midtransConfig)

	// Initialize Email service (optional - nil if not configured)
	var emailService *email.Service
	if cfg.Config.Email.SMTPHost != "" {
		smtpPort := 587
		if cfg.Config.Email.SMTPPort != "" {
			if p, err := strconv.Atoi(cfg.Config.Email.SMTPPort); err == nil {
				smtpPort = p
			}
		}
		emailService = email.NewService(&email.Config{
			SMTPHost:     cfg.Config.Email.SMTPHost,
			SMTPPort:     smtpPort,
			SMTPUsername: cfg.Config.Email.SMTPUsername,
			SMTPPassword: cfg.Config.Email.SMTPPassword,
			FromEmail:    cfg.Config.Email.SMTPFrom,
			FromName:     "RT/RW Net SaaS",
			UseTLS:       smtpPort == 465,
		})
	}

	// OTP service
	otpService := usecase.NewOTPService(otpRepo, userRepo, emailService)
	
	// Payment service
	paymentService := usecase.NewPaymentService(transactionRepo, tenantRepo, subscriptionRepo, planRepo, userRepo, midtransClient)

	// Notification service
	var notificationService usecase.NotificationService
	if cfg.Cache != nil {
		notificationService = usecase.NewNotificationService(cfg.DB, cfg.Cache.Client())
	} else {
		notificationService = usecase.NewNotificationService(cfg.DB, nil)
	}

	// Support ticket service (for user dashboard) - with notification
	supportTicketService := usecase.NewSupportTicketServiceWithNotification(supportTicketRepo, notificationService)

	// Admin service
	adminService := usecase.NewAdminServiceWithNotification(
		adminUserRepo,
		adminAuditLogRepo,
		supportTicketRepo,
		adminTenantRepo,
		planRepo,
		tenantRepo,
		userRepo,
		transactionRepo,
		midtransClient,
		cfg.Config.JWT.Secret,
		notificationService,
	)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	tenantHandler := handler.NewTenantHandler(tenantService)
	subscriptionHandler := handler.NewSubscriptionHandler(subscriptionService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	billingHandler := handler.NewBillingHandler(billingService)
	paymentHandler := handler.NewPaymentHandler(paymentService)
	ticketHandler := handler.NewTicketHandler(ticketService)
	infraHandler := handler.NewInfrastructureHandler(infraService)
	deviceHandler := handler.NewDeviceHandler(deviceService)
	settingsHandler := handler.NewSettingsHandler(settingsService)
	adminHandler := handler.NewAdminHandler(adminService)
	otpHandler := handler.NewOTPHandler(otpService)
	supportTicketHandler := handler.NewSupportTicketHandler(supportTicketService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	exportHandler := handler.NewExportHandler(customerRepo, servicePlanRepo)
	radiusHandler := handler.NewRadiusHandler(radiusService)
	vpnHandler := handler.NewVPNHandler(vpnService)
	customerEventsHandler := handler.NewCustomerEventsHandler(cfg.Config.JWT.Secret)

	// Set up customer event broadcaster for RADIUS server
	radiusModule.SetCustomerEventBroadcaster(handler.GetBroadcaster())

	// Initialize R2 storage client (optional)
	var r2Client *storage.R2Client
	if cfg.Config.R2Storage.AccountID != "" {
		var err error
		r2Client, err = storage.NewR2Client(&cfg.Config.R2Storage)
		if err != nil {
			logger.Warn("R2 storage not configured: %v", err)
		} else {
			logger.Info("R2 storage initialized successfully")
		}
	}
	uploadHandler := handler.NewUploadHandler(r2Client, userRepo, adminUserRepo)

	// Initialize WebSocket hub for live chat with Redis support
	var chatHub *websocket.Hub
	if redisClient != nil {
		chatHub = websocket.NewHubWithRedis(redisClient)
		logger.Info("WebSocket hub initialized with Redis pub/sub")
	} else {
		chatHub = websocket.NewHub()
		logger.Info("WebSocket hub initialized without Redis")
	}
	go chatHub.Run()
	chatHandler := handler.NewChatHandler(chatRepo, chatHub, cfg.Config.JWT.Secret)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"message": "RT/RW Net SaaS Backend is running",
		})
	})

	// Prometheus metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// WebSocket routes (handle auth via query params)
		v1.GET("/chat/:room_id/ws", chatHandler.HandleUserWebSocket)
		v1.GET("/admin/chats/:room_id/ws", chatHandler.HandleAdminWebSocket)

		// SSE routes (handle auth via query params - EventSource doesn't support headers)
		v1.GET("/customers/events/stream", customerEventsHandler.StreamEvents)

		// Public routes (no auth required)
		public := v1.Group("/public")
		{
			public.GET("/plans", subscriptionHandler.GetPlans)
			public.POST("/signup", subscriptionHandler.SignUp)
			public.GET("/payment-methods", subscriptionHandler.GetPaymentMethods)
			public.POST("/payments", subscriptionHandler.CreatePayment)
			public.GET("/payments/:order_id/status", subscriptionHandler.GetPaymentStatus)
		}

		// Webhook routes
		webhooks := v1.Group("/webhooks")
		{
			webhooks.POST("/payment", subscriptionHandler.PaymentWebhook)
			webhooks.POST("/midtrans", subscriptionHandler.MidtransWebhook)
		}

		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/simple-login", authHandler.SimpleLogin) // New: Simple login endpoint
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		// OTP routes (public - for email verification before registration)
		otp := v1.Group("/otp")
		{
			otp.POST("/send", otpHandler.SendOTP)
			otp.POST("/verify", otpHandler.VerifyOTP)
		}

		// Auth routes that require token (but not tenant ID)
		authProtected := v1.Group("/auth")
		authProtected.Use(authMiddleware.RequireAuth())
		{
			authProtected.POST("/logout", authHandler.Logout)
		}

		// ============================================
		// ADMIN ROUTES (Super Admin Dashboard)
		// ============================================
		admin := v1.Group("/admin")
		{
			// Admin auth (public)
			admin.POST("/auth/login", adminHandler.Login)
			admin.POST("/auth/refresh", adminHandler.RefreshToken)

			// Protected admin routes
			adminProtected := admin.Group("")
			adminProtected.Use(adminAuthMiddleware.RequireAdminAuth())
			{
				adminProtected.POST("/auth/logout", adminHandler.Logout)
				adminProtected.GET("/auth/profile", adminHandler.GetProfile)

				// Dashboard
				adminProtected.GET("/dashboard/stats", adminHandler.GetDashboardStats)
				adminProtected.GET("/dashboard/revenue", adminHandler.GetRevenueData)
				adminProtected.GET("/dashboard/growth", adminHandler.GetTenantGrowthData)

				// Tenants management
				adminProtected.GET("/tenants", adminHandler.ListTenants)
				adminProtected.GET("/tenants/:id", adminHandler.GetTenant)
				adminProtected.POST("/tenants", adminHandler.CreateTenant)
				adminProtected.PUT("/tenants/:id", adminHandler.UpdateTenant)
				adminProtected.DELETE("/tenants/:id", adminHandler.DeleteTenant)
				adminProtected.POST("/tenants/:id/suspend", adminHandler.SuspendTenant)
				adminProtected.POST("/tenants/:id/activate", adminHandler.ActivateTenant)

				// Subscription plans management
				adminProtected.GET("/plans", adminHandler.ListPlans)
				adminProtected.POST("/plans", adminHandler.CreatePlan)
				adminProtected.PUT("/plans/:id", adminHandler.UpdatePlan)
				adminProtected.DELETE("/plans/:id", adminHandler.DeletePlan)

				// Admin users management (super admin only)
				adminProtected.GET("/admins", adminHandler.ListAdmins)
				adminProtected.POST("/admins", adminHandler.CreateAdmin)
				adminProtected.PUT("/admins/:id", adminHandler.UpdateAdmin)
				adminProtected.DELETE("/admins/:id", adminHandler.DeleteAdmin)

				// Audit logs
				adminProtected.GET("/audit-logs", adminHandler.ListAuditLogs)

				// Support tickets
				adminProtected.GET("/support-tickets", adminHandler.ListSupportTickets)
				adminProtected.GET("/support-tickets/:id", adminHandler.GetSupportTicket)
				adminProtected.PUT("/support-tickets/:id", adminHandler.UpdateSupportTicket)
				adminProtected.POST("/support-tickets/:id/reply", adminHandler.AddTicketReply)
				adminProtected.POST("/support-tickets/:id/resolve", adminHandler.ResolveTicket)
				adminProtected.POST("/support-tickets/:id/close", adminHandler.CloseTicket)

				// Payment transactions management
				adminProtected.GET("/payments", adminHandler.ListPaymentTransactions)
				adminProtected.GET("/payments/stats", adminHandler.GetPaymentStats)
				adminProtected.GET("/payments/:id", adminHandler.GetPaymentTransaction)
				adminProtected.POST("/payments/:order_id/reconcile", adminHandler.ReconcilePayment)

				// Admin notifications
				adminProtected.GET("/notifications", notificationHandler.GetAdminNotifications)
				adminProtected.GET("/notifications/unread-count", notificationHandler.GetAdminUnreadCount)
				adminProtected.GET("/notifications/stream", notificationHandler.SimplifiedStreamAdminNotifications)
				adminProtected.PUT("/notifications/:id/read", notificationHandler.MarkAdminAsRead)
				adminProtected.POST("/notifications/mark-all-read", notificationHandler.MarkAllAdminAsRead)
				adminProtected.DELETE("/notifications/:id", notificationHandler.DeleteAdminNotification)

				// Admin upload (avatar)
				adminProtected.POST("/upload/avatar", uploadHandler.UploadAdminAvatar)
				adminProtected.DELETE("/upload/avatar", uploadHandler.DeleteAdminAvatar)

				// Live Chat management
				adminProtected.GET("/chats/waiting", chatHandler.GetWaitingChats)
				adminProtected.GET("/chats/active", chatHandler.GetAllActiveChats)
				adminProtected.GET("/chats/my", chatHandler.GetAdminChats)
				adminProtected.POST("/chats/:room_id/join", chatHandler.JoinChat)
				adminProtected.GET("/chats/:room_id/messages", chatHandler.GetAdminChatMessages)
				adminProtected.POST("/chats/:room_id/close", chatHandler.AdminCloseChat)
			}
		}

		// Protected routes (auth + tenant required)
		protected := v1.Group("")
		protected.Use(tenantMiddleware.ExtractTenant())
		protected.Use(authMiddleware.RequireAuth())
		{
			protected.GET("/auth/me", authHandler.Me)
			
			// Dashboard routes (overview only)
			dashboard := protected.Group("/dashboard")
			{
				dashboard.GET("/overview", dashboardHandler.GetOverview)
			}

			// Onboarding routes
			onboarding := protected.Group("/onboarding")
			{
				onboarding.GET("/status", dashboardHandler.GetOnboardingStatus)
				onboarding.PUT("/step", dashboardHandler.UpdateOnboardingStep)
				onboarding.POST("/complete", dashboardHandler.CompleteOnboarding)
			}

			// Plan limits route
			protected.GET("/plan-limits", dashboardHandler.GetPlanLimits)

			// Notifications
			notifications := protected.Group("/notifications")
			{
				notifications.GET("", notificationHandler.GetNotifications)
				notifications.GET("/unread-count", notificationHandler.GetUnreadCount)
				notifications.GET("/stream", notificationHandler.StreamNotifications)
				notifications.PUT("/:id/read", notificationHandler.MarkAsRead)
				notifications.POST("/mark-all-read", notificationHandler.MarkAllAsRead)
				notifications.DELETE("/:id", notificationHandler.DeleteNotification)
			}

			// Live Chat with Admin
			chat := protected.Group("/chat")
			{
				chat.POST("/start", chatHandler.StartChat)
				chat.GET("/active", chatHandler.GetUserChat)
				chat.GET("/:room_id/messages", chatHandler.GetChatMessages)
				chat.POST("/:room_id/close", chatHandler.CloseChat)
			}

			// Customer management (with feature and limit check)
			customers := protected.Group("/customers")
			customers.Use(planLimitMiddleware.CheckFeature("customer_management"))
			{
				customers.GET("", dashboardHandler.ListCustomers)
				customers.GET("/:id", dashboardHandler.GetCustomerDetail)
				customers.POST("", planLimitMiddleware.CheckCustomerLimit(), dashboardHandler.CreateCustomer)
				customers.PUT("/:id", dashboardHandler.UpdateCustomer)
				customers.DELETE("/:id", dashboardHandler.DeleteCustomer)
				
				// Customer status management
				customers.POST("/:id/activate", dashboardHandler.ActivateCustomer)
				customers.POST("/:id/suspend", dashboardHandler.SuspendCustomer)
				customers.POST("/:id/terminate", dashboardHandler.TerminateCustomer)
				
				// Export/Import
				customers.GET("/export", exportHandler.ExportCustomers)
				customers.GET("/template", exportHandler.DownloadTemplate)
				customers.POST("/import", exportHandler.ImportCustomers)
			}

			// Payment management (with feature check)
			payments := protected.Group("/payments")
			payments.Use(planLimitMiddleware.CheckFeature("billing_management"))
			{
				payments.GET("", dashboardHandler.ListPayments)
				payments.POST("", dashboardHandler.RecordPayment)
			}

			// Service plan management
			servicePlans := protected.Group("/service-plans")
			{
				servicePlans.GET("", dashboardHandler.ListServicePlans)
				servicePlans.POST("", dashboardHandler.CreateServicePlan)
				servicePlans.PUT("/:id", dashboardHandler.UpdateServicePlan)
				servicePlans.DELETE("/:id", dashboardHandler.DeleteServicePlan)
			}
			
			// Payment/Invoice management
			payment := protected.Group("/payment")
			{
				payment.GET("/methods", paymentHandler.GetPaymentMethods)
				payment.GET("/:order_id/details", paymentHandler.GetInvoiceDetails)
				payment.POST("/:order_id/token", paymentHandler.CreatePaymentToken)
				payment.GET("/:order_id/status", paymentHandler.GetPaymentStatus)
			}
			
			// Ticket management (internal customer tickets)
			tickets := protected.Group("/tickets")
			{
				tickets.GET("", ticketHandler.ListTickets)
				tickets.POST("", ticketHandler.CreateTicket)
				tickets.GET("/:id", ticketHandler.GetTicket)
				tickets.PUT("/:id", ticketHandler.UpdateTicket)
				tickets.POST("/:id/assign", ticketHandler.AssignTicket)
				tickets.POST("/:id/resolve", ticketHandler.ResolveTicket)
				tickets.POST("/:id/close", ticketHandler.CloseTicket)
			}

			// Support tickets (communication with admin/platform support)
			supportTickets := protected.Group("/support-tickets")
			{
				supportTickets.GET("", supportTicketHandler.ListTickets)
				supportTickets.GET("/stats", supportTicketHandler.GetTicketStats)
				supportTickets.POST("", supportTicketHandler.CreateTicket)
				supportTickets.GET("/:id", supportTicketHandler.GetTicket)
				supportTickets.POST("/:id/reply", supportTicketHandler.AddReply)
			}
			
			// Infrastructure management (requires network_monitoring feature)
			infra := protected.Group("/infrastructure")
			infra.Use(planLimitMiddleware.CheckFeature("network_monitoring"))
			{
				// OLT routes
				infra.GET("/olts", infraHandler.ListOLTs)
				infra.POST("/olts", infraHandler.CreateOLT)
				infra.GET("/olts/:id", infraHandler.GetOLT)
				infra.PUT("/olts/:id", infraHandler.UpdateOLT)
				infra.DELETE("/olts/:id", infraHandler.DeleteOLT)
				
				// ODC routes
				infra.GET("/odcs", infraHandler.ListODCs)
				infra.POST("/odcs", infraHandler.CreateODC)
				infra.GET("/odcs/:id", infraHandler.GetODC)
				infra.PUT("/odcs/:id", infraHandler.UpdateODC)
				infra.DELETE("/odcs/:id", infraHandler.DeleteODC)
				
				// ODP routes
				infra.GET("/odps", infraHandler.ListODPs)
				infra.POST("/odps", infraHandler.CreateODP)
				infra.GET("/odps/:id", infraHandler.GetODP)
				infra.PUT("odps/:id", infraHandler.UpdateODP)
				infra.DELETE("/odps/:id", infraHandler.DeleteODP)
			}
			
			// Device management (requires device_management feature)
			devices := protected.Group("/devices")
			devices.Use(planLimitMiddleware.CheckFeature("device_management"))
			{
				devices.GET("", deviceHandler.ListDevices)
				devices.POST("", planLimitMiddleware.CheckResourceLimit("devices", func(ctx context.Context, tenantID string) (int, error) {
					return deviceRepo.CountByTenantID(ctx, tenantID)
				}), deviceHandler.CreateDevice)
				devices.GET("/:id", deviceHandler.GetDevice)
				devices.PUT("/:id", deviceHandler.UpdateDevice)
				devices.DELETE("/:id", deviceHandler.DeleteDevice)
				devices.POST("/:id/test-connection", planLimitMiddleware.CheckFeature("mikrotik_integration"), deviceHandler.TestMikrotikConnection)
				devices.POST("/:id/sync-queues", planLimitMiddleware.CheckFeature("mikrotik_integration"), deviceHandler.SyncMikrotikQueues)
			}

			// RADIUS management (requires mikrotik_integration feature)
			radius := protected.Group("/radius")
			radius.Use(planLimitMiddleware.CheckFeature("mikrotik_integration"))
			{
				// NAS management
				radius.GET("/nas", radiusHandler.ListNAS)
				radius.POST("/nas", radiusHandler.CreateNAS)
				radius.GET("/nas/:id", radiusHandler.GetNAS)
				radius.PUT("/nas/:id", radiusHandler.UpdateNAS)
				radius.DELETE("/nas/:id", radiusHandler.DeleteNAS)

				// User management
				radius.GET("/users", radiusHandler.ListUsers)
				radius.POST("/users", radiusHandler.CreateUser)
				radius.GET("/users/:id", radiusHandler.GetUser)
				radius.PUT("/users/:id", radiusHandler.UpdateUser)
				radius.DELETE("/users/:id", radiusHandler.DeleteUser)
				radius.POST("/users/:id/suspend", radiusHandler.SuspendUser)
				radius.POST("/users/:id/activate", radiusHandler.ActivateUser)
				radius.GET("/users/:id/sessions", radiusHandler.GetUserSessions)
				radius.GET("/users/:id/usage", radiusHandler.GetUsageStats)

				// Profile management
				radius.GET("/profiles", radiusHandler.ListProfiles)
				radius.POST("/profiles", radiusHandler.CreateProfile)
				radius.GET("/profiles/:id", radiusHandler.GetProfile)
				radius.PUT("/profiles/:id", radiusHandler.UpdateProfile)
				radius.DELETE("/profiles/:id", radiusHandler.DeleteProfile)
				radius.POST("/profiles/sync/:service_plan_id", radiusHandler.SyncProfileFromServicePlan)

				// Sessions
				radius.GET("/sessions/active", radiusHandler.GetActiveSessions)

				// Script generator
				radius.POST("/generate-script", radiusHandler.GenerateMikroTikScript)
				radius.GET("/server-config", radiusHandler.GetServerConfig)
			}

			// VPN management (for connecting MikroTik to VPS)
			vpn := protected.Group("/vpn")
			vpn.Use(planLimitMiddleware.CheckFeature("mikrotik_integration"))
			{
				// Generate MikroTik script with VPN + RADIUS config
				vpn.GET("/mikrotik-script/:nas_id", vpnHandler.GenerateMikroTikScript)
				
				// OpenVPN client config
				vpn.GET("/client-config/:nas_id", vpnHandler.GetClientConfig)
				vpn.GET("/download/:nas_id", vpnHandler.DownloadClientConfig)
				
				// VPN connections management
				vpn.GET("/connections", vpnHandler.ListVPNConnections)
				vpn.POST("/connections", vpnHandler.CreateVPNConnection)
				vpn.DELETE("/connections/:id", vpnHandler.DeleteVPNConnection)
			}
			
			// Billing routes
			protected.GET("/billing", billingHandler.GetBillingDashboard)
			protected.PUT("/billing/subscription", billingHandler.UpdateSubscription)
			protected.POST("/billing/order", billingHandler.CreateOrder)
			protected.GET("/billing/pending-order", billingHandler.GetPendingOrder)
			protected.PUT("/billing/settings", billingHandler.UpdateTenantSettings)
			protected.POST("/billing/cancel", billingHandler.CancelSubscription)
			protected.PUT("/billing/payment-method", billingHandler.UpdatePaymentMethod)

			// Settings routes
			settings := protected.Group("/settings")
			{
				settings.GET("/user", settingsHandler.GetUserSettings)
				settings.PUT("/user", settingsHandler.UpdateUserSettings)
				settings.PUT("/notifications", settingsHandler.UpdateNotificationSettings)
				settings.GET("/tenant", settingsHandler.GetTenantSettings)
				settings.PUT("/tenant", settingsHandler.UpdateTenantSettings)
				settings.PUT("/integrations", settingsHandler.UpdateIntegrationSettings)
				settings.PUT("/profile", settingsHandler.UpdateProfile)
				settings.PUT("/password", settingsHandler.ChangePassword)
			}

			// Upload routes (avatar)
			upload := protected.Group("/upload")
			{
				upload.POST("/avatar", uploadHandler.UploadUserAvatar)
				upload.DELETE("/avatar", uploadHandler.DeleteUserAvatar)
			}

			// Tenant management (admin only - requires auth + tenant)
			tenants := protected.Group("/tenants")
			{
				tenants.GET("/:id", tenantHandler.GetByID)
				tenants.PUT("/:id", tenantHandler.Update)
			}

			// Placeholder for future routes
			protected.GET("/ping", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "pong"})
			})
		}
	}

	return router
}
