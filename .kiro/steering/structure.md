# Project Structure

## Repository Layout

```
rtrwnet-saas/
├── Backend/              # Go backend API
├── Frontend/
│   ├── HomePage/         # Landing page (registration, pricing)
│   ├── UserDashboard/    # Tenant admin dashboard
│   └── AdminDashboard/   # Super admin dashboard
├── k8s/                  # Kubernetes manifests
│   ├── base/             # Base configurations
│   └── overlays/         # Environment-specific (staging, production)
├── scripts/              # Utility scripts
├── docker-compose.yml    # Local development setup
├── Jenkinsfile          # CI/CD pipeline
└── .kiro/               # Kiro AI assistant configuration
```

## Backend Structure

```
Backend/
├── cmd/
│   └── api/              # Main application entry point
├── internal/
│   ├── domain/
│   │   ├── entity/       # Domain models (Customer, Tenant, ServicePlan, etc.)
│   │   └── repository/   # Repository interfaces
│   ├── usecase/          # Business logic services
│   ├── delivery/http/
│   │   ├── handler/      # HTTP request handlers
│   │   ├── dto/          # Data transfer objects
│   │   └── router/       # Route definitions
│   ├── repository/postgres/  # Database implementations
│   ├── middleware/       # HTTP middleware (auth, CORS, rate limit)
│   └── infrastructure/   # External services (cache, RADIUS, SNMP)
├── pkg/                  # Shared packages
│   ├── auth/             # JWT and password utilities
│   ├── config/           # Configuration management
│   ├── errors/           # Error definitions and codes
│   ├── logger/           # Logging utilities
│   ├── payment/          # Midtrans integration
│   ├── storage/          # R2/S3 storage
│   ├── validator/        # Input validation
│   └── websocket/        # WebSocket hub
├── migrations/           # SQL migration files
├── docs/                 # API documentation
│   ├── swagger/          # Generated Swagger docs
│   └── *.md              # API guides
├── tests/                # Integration tests
├── Dockerfile
├── Makefile
└── go.mod
```

## Frontend Structure (Common Pattern)

All three frontends follow similar structure:

```
Frontend/[App]/
├── src/
│   ├── api/              # API client functions (axios)
│   ├── components/
│   │   ├── layout/       # Layout components (Sidebar, Navbar)
│   │   └── ui/           # shadcn/ui components
│   ├── pages/            # Page components (routes)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities (utils.ts, validation.ts)
│   ├── types/            # TypeScript type definitions
│   ├── contexts/         # React contexts (UserDashboard only)
│   ├── features/         # Feature modules (UserDashboard only)
│   ├── App.tsx           # Root component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── Dockerfile
├── nginx.conf            # Nginx configuration for production
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Key Domain Entities

Located in `Backend/internal/domain/entity/`:

- `tenant.go` - ISP operator accounts (multi-tenant)
- `customer.go` - End user subscribers
- `user.go` - Tenant admin users
- `admin.go` - Super admin users
- `service_plan.go` - Internet packages/plans
- `subscription.go` - Customer subscriptions
- `payment.go` - Payment transactions
- `device.go` - Customer devices (routers, etc.)
- `infrastructure.go` - Network infrastructure (routers, APs)
- `ticket.go` - Support tickets
- `chat.go` - Live chat messages
- `notification.go` - User notifications
- `radius.go` - RADIUS authentication
- `otp.go` - Email OTP verification

## Naming Conventions

### Backend (Go)

- **Files**: snake_case (e.g., `customer_service.go`)
- **Packages**: lowercase, single word when possible
- **Types**: PascalCase (e.g., `CustomerService`)
- **Functions/Methods**: PascalCase for exported, camelCase for private
- **Constants**: PascalCase or SCREAMING_SNAKE_CASE
- **Interfaces**: Often end with "Repository" or "Service"

### Frontend (TypeScript/React)

- **Files**: PascalCase for components (e.g., `CustomerTable.tsx`), camelCase for utilities
- **Components**: PascalCase (e.g., `CustomerForm`)
- **Functions**: camelCase (e.g., `fetchCustomers`)
- **Types/Interfaces**: PascalCase (e.g., `Customer`, `ApiResponse`)
- **Constants**: SCREAMING_SNAKE_CASE or camelCase

## Database Migrations

Located in `Backend/migrations/`:
- Numbered sequentially: `000010_create_admin_tables.up.sql`
- Each migration has `.up.sql` (apply) and `.down.sql` (rollback)
- Run in order using PowerShell script or psql

## API Structure

- Base path: `/api/v1`
- Public endpoints: `/api/v1/public/*` (no auth)
- Tenant endpoints: `/api/v1/tenant/*` (JWT + tenant context)
- Admin endpoints: `/api/v1/admin/*` (admin JWT)
- Swagger docs: `/swagger/index.html`

## Deployment Structure

- **Local**: Docker Compose with all services
- **Staging**: Kubernetes namespace `rtrwnet-staging`
- **Production**: Kubernetes namespace `rtrwnet-prod`
- **Monitoring**: Separate namespace with Prometheus + Grafana
