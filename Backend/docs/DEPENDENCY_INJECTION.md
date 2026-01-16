# 🔌 Dependency Injection Pattern

## Overview

Project ini menggunakan **Manual Dependency Injection** (Constructor Injection) **tanpa library**.

**Kenapa tidak pakai library?**
- ✅ Lebih simple dan explicit
- ✅ Tidak ada magic/reflection
- ✅ Compile-time safety
- ✅ Mudah di-debug
- ✅ Tidak ada learning curve library DI

---

## 📋 Pattern yang Digunakan

### 1. Constructor Injection

Setiap component menerima dependencies melalui constructor:

```go
// Handler depends on Service
type AuthHandler struct {
    authService usecase.AuthService
}

func NewAuthHandler(authService usecase.AuthService) *AuthHandler {
    return &AuthHandler{
        authService: authService,
    }
}
```

### 2. Interface-Based Dependencies

Dependencies selalu berupa **interface**, bukan concrete type:

```go
// ✅ Good - depends on interface
type AuthHandler struct {
    authService usecase.AuthService  // interface
}

// ❌ Bad - depends on concrete type
type AuthHandler struct {
    authService *authService  // concrete struct
}
```

---

## 🏗️ Dependency Flow

### Level 1: Main (Entry Point)

**File:** `cmd/api/main.go`

```go
func main() {
    // 1. Load configuration
    cfg, err := config.Load()
    
    // 2. Initialize infrastructure
    db, err := database.NewPostgresDB(&cfg.Database)
    redisCache, err := cache.NewRedisCache(&cfg.Redis)
    
    // 3. Pass to router
    routerCfg := &router.RouterConfig{
        DB:     db,
        Cache:  redisCache,
        Config: cfg,
    }
    
    r := router.SetupRouter(routerCfg)
    
    // 4. Start server
    r.Run(addr)
}
```

**Dependencies:**
- Config
- Database
- Cache

---

### Level 2: Router Setup

**File:** `internal/delivery/http/router/router.go`

```go
func SetupRouter(cfg *RouterConfig) *gin.Engine {
    router := gin.Default()
    
    // 1. Initialize Repositories (depends on DB)
    tenantRepo := postgres.NewTenantRepository(cfg.DB)
    userRepo := postgres.NewUserRepository(cfg.DB)
    planRepo := postgres.NewSubscriptionPlanRepository(cfg.DB)
    
    // 2. Initialize Middleware (depends on Repositories)
    tenantMiddleware := middleware.NewTenantMiddleware(tenantRepo)
    authMiddleware := middleware.NewAuthMiddleware(userRepo, &cfg.Config.JWT)
    
    // 3. Initialize Services (depends on Repositories)
    authService := usecase.NewAuthService(
        userRepo,
        tenantRepo,
        &cfg.Config.JWT,
        cfg.Cache,
    )
    
    // 4. Initialize Handlers (depends on Services)
    authHandler := handler.NewAuthHandler(authService)
    
    // 5. Register routes
    auth.POST("/login", authHandler.Login)
    
    return router
}
```

**Dependency Chain:**
```
DB → Repository → Service → Handler
                ↓
            Middleware
```

---

### Level 3: Repository

**File:** `internal/repository/postgres/tenant_repository.go`

```go
type tenantRepository struct {
    db *gorm.DB
}

func NewTenantRepository(db *gorm.DB) repository.TenantRepository {
    return &tenantRepository{
        db: db,
    }
}

func (r *tenantRepository) FindByID(ctx context.Context, id string) (*entity.Tenant, error) {
    var tenant entity.Tenant
    err := r.db.WithContext(ctx).Where("id = ?", id).First(&tenant).Error
    return &tenant, err
}
```

**Dependencies:**
- Database connection (`*gorm.DB`)

---

### Level 4: Service (Use Case)

**File:** `internal/usecase/auth_service.go`

```go
type authService struct {
    userRepo   repository.UserRepository
    tenantRepo repository.TenantRepository
    jwtConfig  *config.JWTConfig
    cache      CacheService
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

func (s *authService) Login(ctx context.Context, email, password string) (*AuthResponse, error) {
    // Use injected dependencies
    user, err := s.userRepo.FindByEmail(ctx, email)
    tenant, err := s.tenantRepo.FindByID(ctx, user.TenantID)
    token, err := auth.GenerateToken(user.ID, s.jwtConfig)
    
    return &AuthResponse{Token: token}, nil
}
```

**Dependencies:**
- UserRepository (interface)
- TenantRepository (interface)
- JWTConfig
- CacheService (interface)

---

### Level 5: Handler

**File:** `internal/delivery/http/handler/auth_handler.go`

```go
type AuthHandler struct {
    authService usecase.AuthService
}

func NewAuthHandler(authService usecase.AuthService) *AuthHandler {
    return &AuthHandler{
        authService: authService,
    }
}

func (h *AuthHandler) Login(c *gin.Context) {
    var req dto.LoginRequest
    c.ShouldBindJSON(&req)
    
    // Use injected service
    response, err := h.authService.Login(
        c.Request.Context(),
        req.Email,
        req.Password,
    )
    
    c.JSON(200, response)
}
```

**Dependencies:**
- AuthService (interface)

---

## 🎯 Complete Example

### Scenario: User Login

**1. Main creates infrastructure:**
```go
// cmd/api/main.go
db := database.NewPostgresDB(&cfg.Database)
cache := cache.NewRedisCache(&cfg.Redis)
```

**2. Router creates repositories:**
```go
// router/router.go
userRepo := postgres.NewUserRepository(db)
tenantRepo := postgres.NewTenantRepository(db)
```

**3. Router creates services:**
```go
// router/router.go
authService := usecase.NewAuthService(
    userRepo,      // injected
    tenantRepo,    // injected
    &cfg.JWT,      // injected
    cache,         // injected
)
```

**4. Router creates handlers:**
```go
// router/router.go
authHandler := handler.NewAuthHandler(authService)  // injected
```

**5. Router registers routes:**
```go
// router/router.go
auth.POST("/login", authHandler.Login)
```

**6. Request flow:**
```
HTTP Request
    ↓
authHandler.Login()
    ↓
authService.Login()  ← uses injected userRepo, tenantRepo
    ↓
userRepo.FindByEmail()  ← uses injected db
    ↓
Database Query
```

---

## 📦 Dependency Graph

```
main.go
  ├── Config
  ├── Database
  └── Cache
      ↓
router.go
  ├── Repositories (DB)
  │   ├── TenantRepository
  │   ├── UserRepository
  │   ├── PlanRepository
  │   └── SubscriptionRepository
  │
  ├── Middleware (Repositories, Config)
  │   ├── AuthMiddleware
  │   └── TenantMiddleware
  │
  ├── Services (Repositories, Config, Cache)
  │   ├── AuthService
  │   ├── TenantService
  │   ├── SubscriptionService
  │   └── BillingService
  │
  └── Handlers (Services)
      ├── AuthHandler
      ├── TenantHandler
      ├── SubscriptionHandler
      └── BillingHandler
```

---

## ✅ Benefits of Manual DI

### 1. Explicit Dependencies
```go
// You can see exactly what a component needs
func NewAuthService(
    userRepo repository.UserRepository,      // Clear!
    tenantRepo repository.TenantRepository,  // Clear!
    jwtConfig *config.JWTConfig,            // Clear!
    cache CacheService,                      // Clear!
) AuthService
```

### 2. Compile-Time Safety
```go
// ✅ Compiler catches missing dependencies
authService := usecase.NewAuthService(
    userRepo,
    tenantRepo,
    // Missing jwtConfig - COMPILE ERROR!
)
```

### 3. Easy Testing
```go
// Easy to create mocks
mockUserRepo := &MockUserRepository{}
mockTenantRepo := &MockTenantRepository{}

authService := usecase.NewAuthService(
    mockUserRepo,    // Inject mock
    mockTenantRepo,  // Inject mock
    &testConfig,
    nil,
)
```

### 4. No Magic
```go
// No reflection, no tags, no magic
// Just plain Go constructors
func NewAuthHandler(authService usecase.AuthService) *AuthHandler {
    return &AuthHandler{authService: authService}
}
```

---

## 🔄 Comparison with DI Libraries

### Manual DI (Current)
```go
// Explicit
authService := usecase.NewAuthService(userRepo, tenantRepo, cfg, cache)
authHandler := handler.NewAuthHandler(authService)
```

**Pros:**
- ✅ Simple and clear
- ✅ No learning curve
- ✅ Compile-time safety
- ✅ Easy to debug
- ✅ No reflection overhead

**Cons:**
- ❌ More boilerplate in router.go
- ❌ Manual wiring

### With DI Library (e.g., Wire, Dig)
```go
// Wire example
wire.Build(
    postgres.NewUserRepository,
    usecase.NewAuthService,
    handler.NewAuthHandler,
)
```

**Pros:**
- ✅ Less boilerplate
- ✅ Auto-wiring

**Cons:**
- ❌ Learning curve
- ❌ Code generation (Wire)
- ❌ Reflection (Dig)
- ❌ Harder to debug
- ❌ Magic behavior

---

## 🎨 Design Principles

### 1. Depend on Interfaces
```go
// ✅ Good
type AuthHandler struct {
    authService usecase.AuthService  // interface
}

// ❌ Bad
type AuthHandler struct {
    authService *authService  // concrete
}
```

### 2. Constructor Injection Only
```go
// ✅ Good - inject via constructor
func NewAuthHandler(authService usecase.AuthService) *AuthHandler {
    return &AuthHandler{authService: authService}
}

// ❌ Bad - setter injection
func (h *AuthHandler) SetAuthService(authService usecase.AuthService) {
    h.authService = authService
}
```

### 3. Single Responsibility
```go
// ✅ Good - focused dependencies
func NewAuthService(
    userRepo repository.UserRepository,
    jwtConfig *config.JWTConfig,
) AuthService

// ❌ Bad - too many dependencies
func NewAuthService(
    userRepo, tenantRepo, planRepo, subRepo, txRepo repository.Repository,
    jwtCfg, dbCfg, cacheCfg, emailCfg *config.Config,
) AuthService
```

---

## 🧪 Testing with Manual DI

### Unit Test Example

```go
func TestAuthService_Login(t *testing.T) {
    // 1. Create mocks
    mockUserRepo := &MockUserRepository{
        FindByEmailFunc: func(ctx context.Context, email string) (*entity.User, error) {
            return &entity.User{
                ID:       "user-123",
                Email:    "test@example.com",
                Password: "$2a$10$hashedpassword",
            }, nil
        },
    }
    
    mockTenantRepo := &MockTenantRepository{
        FindByIDFunc: func(ctx context.Context, id string) (*entity.Tenant, error) {
            return &entity.Tenant{
                ID:       "tenant-123",
                IsActive: true,
            }, nil
        },
    }
    
    // 2. Inject mocks
    authService := usecase.NewAuthService(
        mockUserRepo,
        mockTenantRepo,
        &config.JWTConfig{Secret: "test-secret"},
        nil,
    )
    
    // 3. Test
    response, err := authService.Login(context.Background(), "test@example.com", "password")
    
    assert.NoError(t, err)
    assert.NotEmpty(t, response.Token)
}
```

---

## 📝 Adding New Dependencies

### Step 1: Define Interface
```go
// internal/usecase/email_service.go
type EmailService interface {
    SendEmail(to, subject, body string) error
}
```

### Step 2: Create Implementation
```go
// internal/infrastructure/email/smtp_email.go
type smtpEmail struct {
    config *config.SMTPConfig
}

func NewSMTPEmail(config *config.SMTPConfig) EmailService {
    return &smtpEmail{config: config}
}
```

### Step 3: Inject in Router
```go
// router/router.go
func SetupRouter(cfg *RouterConfig) *gin.Engine {
    // Initialize email service
    emailService := email.NewSMTPEmail(&cfg.Config.SMTP)
    
    // Inject into service that needs it
    authService := usecase.NewAuthService(
        userRepo,
        tenantRepo,
        &cfg.Config.JWT,
        cfg.Cache,
        emailService,  // New dependency
    )
    
    // ...
}
```

### Step 4: Update Service Constructor
```go
// internal/usecase/auth_service.go
type authService struct {
    userRepo     repository.UserRepository
    tenantRepo   repository.TenantRepository
    jwtConfig    *config.JWTConfig
    cache        CacheService
    emailService EmailService  // New field
}

func NewAuthService(
    userRepo repository.UserRepository,
    tenantRepo repository.TenantRepository,
    jwtConfig *config.JWTConfig,
    cache CacheService,
    emailService EmailService,  // New parameter
) AuthService {
    return &authService{
        userRepo:     userRepo,
        tenantRepo:   tenantRepo,
        jwtConfig:    jwtConfig,
        cache:        cache,
        emailService: emailService,  // Assign
    }
}
```

---

## 🎯 Best Practices

### 1. Keep Constructors Simple
```go
// ✅ Good - just assignment
func NewAuthHandler(authService usecase.AuthService) *AuthHandler {
    return &AuthHandler{authService: authService}
}

// ❌ Bad - logic in constructor
func NewAuthHandler(authService usecase.AuthService) *AuthHandler {
    h := &AuthHandler{authService: authService}
    h.initialize()  // Don't do this
    h.loadConfig()  // Don't do this
    return h
}
```

### 2. Use Interfaces for Dependencies
```go
// ✅ Good
type AuthService interface {
    Login(ctx context.Context, email, password string) (*AuthResponse, error)
}

// ❌ Bad - no interface
type AuthService struct {
    // concrete struct
}
```

### 3. Centralize Wiring in Router
```go
// ✅ Good - all wiring in one place (router.go)
func SetupRouter(cfg *RouterConfig) *gin.Engine {
    // All initialization here
}

// ❌ Bad - scattered initialization
func main() {
    authService := usecase.NewAuthService(...)  // Don't do this
    authHandler := handler.NewAuthHandler(...)  // Don't do this
}
```

---

## 🔍 Troubleshooting

### Issue: Circular Dependency
```go
// ❌ Bad
// ServiceA depends on ServiceB
// ServiceB depends on ServiceA
```

**Solution:** Extract common logic to a third service or use events/callbacks.

### Issue: Too Many Dependencies
```go
// ❌ Bad - 10+ parameters
func NewService(dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8, dep9, dep10 interface{}) Service
```

**Solution:** 
1. Group related dependencies into a config struct
2. Split service into smaller services
3. Use facade pattern

### Issue: Nil Dependencies
```go
// ❌ Bad - no validation
func NewAuthService(userRepo repository.UserRepository) AuthService {
    return &authService{userRepo: userRepo}  // What if userRepo is nil?
}
```

**Solution:** Validate in constructor
```go
// ✅ Good
func NewAuthService(userRepo repository.UserRepository) AuthService {
    if userRepo == nil {
        panic("userRepo cannot be nil")
    }
    return &authService{userRepo: userRepo}
}
```

---

## 📚 Summary

**Pattern:** Manual Constructor Injection

**Why:** Simple, explicit, compile-safe, no magic

**How:**
1. Define interfaces for dependencies
2. Create constructors that accept dependencies
3. Wire everything in `router.go`
4. Pass dependencies down the chain

**Benefits:**
- ✅ Clear and explicit
- ✅ Compile-time safety
- ✅ Easy to test
- ✅ No library needed
- ✅ Easy to debug

**Trade-offs:**
- ❌ More boilerplate in router.go
- ❌ Manual wiring

**Verdict:** Perfect for this project size! 🎯
