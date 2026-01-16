# 📁 Project Structure - RT RW Net SaaS Backend

## Overview

Project ini menggunakan **Clean Architecture** dengan struktur folder yang terorganisir untuk memisahkan concerns dan memudahkan maintenance.

---

## 🏗️ Root Structure

```
rtrwnet-saas-backend/
├── cmd/                    # Application entry points
├── internal/               # Private application code
├── pkg/                    # Public reusable packages
├── migrations/             # Database migrations
├── scripts/                # Utility scripts
├── tests/                  # Test files
├── docs/                   # Documentation
├── bin/                    # Compiled binaries
├── frontend/               # Frontend integration docs
├── .env                    # Environment variables
├── go.mod                  # Go module definition
└── Makefile               # Build automation
```

---

## 📂 Detailed Structure

### 1. `/cmd` - Application Entry Points

```
cmd/
└── api/
    └── main.go            # Main application entry point
```

**Purpose:** 
- Entry point untuk menjalankan aplikasi
- Initialize dependencies (database, cache, config)
- Setup router dan start server

**Example:**
```bash
go run cmd/api/main.go
```

---

### 2. `/internal` - Private Application Code

Folder ini mengikuti **Clean Architecture** dengan layers:

```
internal/
├── delivery/              # Presentation Layer (HTTP handlers, DTOs)
│   └── http/
│       ├── handler/       # HTTP request handlers
│       ├── dto/           # Data Transfer Objects
│       └── router/        # Route definitions
│
├── domain/                # Domain Layer (Business entities & interfaces)
│   ├── entity/            # Business entities (Tenant, User, etc)
│   └── repository/        # Repository interfaces
│
├── usecase/               # Use Case Layer (Business logic)
│   ├── auth_service.go
│   ├── tenant_service.go
│   ├── subscription_service.go
│   └── billing_service.go
│
├── repository/            # Data Access Layer
│   └── postgres/          # PostgreSQL implementations
│
├── infrastructure/        # Infrastructure Layer
│   └── cache/             # Redis cache implementation
│
└── middleware/            # HTTP middleware
    ├── auth.go            # Authentication middleware
    ├── cors.go            # CORS middleware
    ├── tenant.go          # Tenant extraction middleware
    ├── logger.go          # Request logging
    └── error_handler.go   # Error handling
```

#### 2.1 `/internal/delivery/http`

**Handler** - HTTP request handlers
```go
// Example: auth_handler.go
func (h *AuthHandler) Login(c *gin.Context) {
    // Handle login request
}
```

**DTO** - Data Transfer Objects
```go
// Example: auth_dto.go
type LoginRequest struct {
    Username string `json:"username"`
    Password string `json:"password"`
}
```

**Router** - Route definitions
```go
// Example: router.go
auth.POST("/login", authHandler.Login)
```

#### 2.2 `/internal/domain`

**Entity** - Business entities
```go
// Example: tenant.go
type Tenant struct {
    ID       string
    Name     string
    Email    string
    IsActive bool
}
```

**Repository** - Repository interfaces
```go
// Example: tenant_repository.go
type TenantRepository interface {
    Create(ctx context.Context, tenant *entity.Tenant) error
    FindByID(ctx context.Context, id string) (*entity.Tenant, error)
    FindByEmail(ctx context.Context, email string) (*entity.Tenant, error)
}
```

#### 2.3 `/internal/usecase`

Business logic services
```go
// Example: auth_service.go
type AuthService interface {
    Login(ctx context.Context, email, password string) (*AuthResponse, error)
    Register(ctx context.Context, req RegisterRequest) (*User, error)
}
```

#### 2.4 `/internal/repository/postgres`

Repository implementations
```go
// Example: tenant_repository.go
func (r *tenantRepository) FindByEmail(ctx context.Context, email string) (*entity.Tenant, error) {
    // PostgreSQL implementation
}
```

#### 2.5 `/internal/middleware`

HTTP middleware untuk:
- **auth.go** - JWT authentication
- **cors.go** - CORS handling
- **tenant.go** - Tenant extraction from header
- **logger.go** - Request/response logging
- **error_handler.go** - Global error handling

---

### 3. `/pkg` - Public Reusable Packages

```
pkg/
├── auth/                  # Authentication utilities
│   ├── jwt.go            # JWT token generation/validation
│   └── password.go       # Password hashing/verification
│
├── config/               # Configuration management
│   └── config.go         # Load config from .env
│
├── database/             # Database utilities
│   └── postgres.go       # PostgreSQL connection
│
├── errors/               # Error definitions
│   └── errors.go         # Custom error types
│
├── logger/               # Logging utilities
│   └── logger.go         # Structured logging
│
├── response/             # HTTP response helpers
│   └── response.go       # Standard response format
│
└── validator/            # Validation utilities
    └── validator.go      # Input validation
```

**Purpose:** Reusable packages yang bisa digunakan di berbagai bagian aplikasi atau bahkan di project lain.

---

### 4. `/migrations` - Database Migrations

```
migrations/
├── 000001_create_tenants_table.up.sql
├── 000001_create_tenants_table.down.sql
├── 000002_create_users_table.up.sql
├── 000002_create_users_table.down.sql
├── ...
└── 000010_remove_subdomain_column.up.sql
```

**Purpose:**
- Database schema versioning
- `.up.sql` - Apply migration
- `.down.sql` - Rollback migration

**Usage:**
```bash
# Apply migrations
migrate -path migrations -database "postgres://..." up

# Rollback
migrate -path migrations -database "postgres://..." down 1
```

---

### 5. `/scripts` - Utility Scripts

```
scripts/
├── setup_database.ps1     # Setup database (Windows)
├── reset_database.sql     # Reset database to clean state
├── seed_data.sql          # Seed initial data
├── generate_password.go   # Generate password hash
└── verify_password.ps1    # Verify password hash
```

**Purpose:** Helper scripts untuk development dan maintenance.

---

### 6. `/tests` - Test Files

```
tests/
├── integration/           # Integration tests
│   ├── auth_test.go
│   ├── tenant_test.go
│   └── subscription_test.go
│
└── unit/                  # Unit tests (future)
```

**Purpose:** Test files terpisah dari source code.

---

### 7. `/docs` - Documentation

```
docs/
├── API_RESPONSE_STANDARD.md
├── FRONTEND_API_DOCUMENTATION.md
├── FRONTEND_INTEGRATION.md
├── SAAS_FLOW.md
├── USER_JOURNEY.md
├── LANDING_API_SPEC.yaml
└── frontend-types.ts
```

**Purpose:** 
- API documentation
- Integration guides
- Architecture diagrams
- Frontend types

---

### 8. `/bin` - Compiled Binaries

```
bin/
└── api.exe               # Compiled binary (Windows)
```

**Purpose:** Output folder untuk compiled binaries.

---

## 🔄 Data Flow

```
HTTP Request
    ↓
[Router] → routes request to handler
    ↓
[Middleware] → auth, cors, logging, etc
    ↓
[Handler] → parse request, validate input
    ↓
[DTO] → data transfer object
    ↓
[UseCase/Service] → business logic
    ↓
[Repository] → data access
    ↓
[Database] → PostgreSQL
    ↓
[Response] → standard format
    ↓
HTTP Response
```

---

## 🎯 Clean Architecture Layers

### 1. **Presentation Layer** (`internal/delivery`)
- HTTP handlers
- Request/response DTOs
- Route definitions
- **Depends on:** Use Case Layer

### 2. **Use Case Layer** (`internal/usecase`)
- Business logic
- Service interfaces
- **Depends on:** Domain Layer

### 3. **Domain Layer** (`internal/domain`)
- Business entities
- Repository interfaces
- **Depends on:** Nothing (pure business logic)

### 4. **Data Access Layer** (`internal/repository`)
- Repository implementations
- Database queries
- **Depends on:** Domain Layer

### 5. **Infrastructure Layer** (`internal/infrastructure`)
- External services (cache, queue, etc)
- **Depends on:** Domain Layer

---

## 📋 File Naming Conventions

### Entities
```
internal/domain/entity/tenant.go
internal/domain/entity/user.go
```

### Repositories
```
internal/domain/repository/tenant_repository.go        # Interface
internal/repository/postgres/tenant_repository.go      # Implementation
```

### Services
```
internal/usecase/auth_service.go
internal/usecase/tenant_service.go
```

### Handlers
```
internal/delivery/http/handler/auth_handler.go
internal/delivery/http/handler/tenant_handler.go
```

### DTOs
```
internal/delivery/http/dto/auth_dto.go
internal/delivery/http/dto/tenant_dto.go
```

---

## 🔧 Configuration Files

### `.env`
Environment variables untuk configuration:
```env
SERVER_PORT=8089
DB_HOST=localhost
DB_NAME=rtrwnet_saas
JWT_SECRET=your-secret-key
CORS_ALLOWED_ORIGINS=http://localhost:8081
```

### `go.mod`
Go module dependencies:
```go
module github.com/rtrwnet/saas-backend

require (
    github.com/gin-gonic/gin v1.9.1
    gorm.io/gorm v1.25.5
    ...
)
```

### `Makefile`
Build automation:
```makefile
run:
    go run cmd/api/main.go

build:
    go build -o bin/api cmd/api/main.go

test:
    go test ./...
```

---

## 🚀 Quick Commands

### Run Application
```bash
go run cmd/api/main.go
```

### Build Binary
```bash
go build -o bin/api.exe cmd/api/main.go
```

### Run Tests
```bash
go test ./tests/integration/...
```

### Apply Migrations
```bash
migrate -path migrations -database "postgres://..." up
```

### Seed Data
```bash
psql -U postgres -d rtrwnet_saas -f scripts/seed_data.sql
```

---

## 📦 Dependencies

### Core
- **Gin** - HTTP framework
- **GORM** - ORM for database
- **JWT** - Authentication
- **Redis** - Caching (optional)

### Database
- **PostgreSQL** - Main database
- **golang-migrate** - Database migrations

### Utilities
- **godotenv** - Load .env files
- **validator** - Input validation
- **bcrypt** - Password hashing

---

## 🎨 Design Patterns Used

1. **Clean Architecture** - Separation of concerns
2. **Repository Pattern** - Data access abstraction
3. **Dependency Injection** - Loose coupling
4. **Middleware Pattern** - Request/response processing
5. **DTO Pattern** - Data transfer between layers
6. **Service Layer Pattern** - Business logic encapsulation

---

## 📚 Key Principles

1. **Separation of Concerns** - Each layer has specific responsibility
2. **Dependency Rule** - Dependencies point inward (toward domain)
3. **Interface Segregation** - Small, focused interfaces
4. **Single Responsibility** - One reason to change
5. **DRY (Don't Repeat Yourself)** - Reusable packages in `/pkg`

---

## 🔍 Finding Things

### "Where do I add a new endpoint?"
1. Create handler in `internal/delivery/http/handler/`
2. Create DTO in `internal/delivery/http/dto/`
3. Register route in `internal/delivery/http/router/router.go`

### "Where do I add business logic?"
1. Create service in `internal/usecase/`
2. Define interface
3. Implement methods

### "Where do I add database queries?"
1. Define interface in `internal/domain/repository/`
2. Implement in `internal/repository/postgres/`

### "Where do I add reusable utilities?"
1. Create package in `pkg/`
2. Make it generic and reusable

---

## ✅ Best Practices

1. **Always use interfaces** for dependencies
2. **Keep handlers thin** - delegate to services
3. **Use DTOs** for request/response
4. **Validate input** at handler level
5. **Handle errors** consistently
6. **Log important events**
7. **Write tests** for critical paths
8. **Document APIs** in `/docs`

---

## 🎯 Summary

```
cmd/          → Entry point
internal/     → Application code (Clean Architecture)
  ├── delivery/    → HTTP layer
  ├── domain/      → Business entities
  ├── usecase/     → Business logic
  ├── repository/  → Data access
  └── middleware/  → HTTP middleware
pkg/          → Reusable packages
migrations/   → Database schema
scripts/      → Utility scripts
tests/        → Test files
docs/         → Documentation
```

**Architecture:** Clean Architecture with clear separation of concerns

**Pattern:** Repository + Service + Handler

**Database:** PostgreSQL with GORM

**API:** RESTful with standard response format

**Auth:** JWT-based authentication

**CORS:** Configurable origins

---

**Need help?** Check `/docs` folder for detailed documentation! 📖
