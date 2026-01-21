# Technology Stack

## Backend

- **Language**: Go 1.24+
- **Framework**: Gin (HTTP router)
- **ORM**: GORM
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Authentication**: JWT (golang-jwt/jwt)
- **API Documentation**: Swagger/OpenAPI (swaggo)
- **Network**: RADIUS server (layeh.com/radius)
- **Storage**: AWS S3-compatible (Cloudflare R2)
- **Payment**: Midtrans integration
- **WebSocket**: gorilla/websocket

### Backend Architecture

Clean architecture with dependency injection:
- `cmd/api/` - Application entry point
- `internal/domain/` - Domain entities and repository interfaces
- `internal/usecase/` - Business logic services
- `internal/delivery/http/` - HTTP handlers, DTOs, routing
- `internal/repository/postgres/` - Database implementations
- `internal/middleware/` - HTTP middleware (auth, CORS, rate limiting)
- `internal/infrastructure/` - External services (cache, RADIUS)
- `pkg/` - Shared utilities (auth, logger, errors, config)

## Frontend

All three frontends use similar stack:

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Frontend Applications

1. **HomePage** (port 3000) - Landing page with registration and pricing
2. **UserDashboard** (port 5175) - Tenant admin dashboard for ISP management
3. **AdminDashboard** (port 5174) - Super admin dashboard for platform management

## Infrastructure

- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with Kustomize
- **CI/CD**: Jenkins pipeline
- **Web Server**: Nginx (for frontend static files)
- **Monitoring**: Prometheus + Grafana
- **VPN**: OpenVPN server integration

## Common Commands

### Backend

```bash
# Development
go run cmd/api/main.go
make run

# Build
go build -o bin/api cmd/api/main.go
make build

# Testing
go test ./...
go test -cover ./...
make test

# Dependencies
go mod download
go mod tidy
make deps

# Swagger docs
swag init -g cmd/api/main.go -o docs/swagger
make swagger

# Database migrations (PowerShell)
$env:PGPASSWORD="postgres"
Get-ChildItem migrations\*up.sql | ForEach-Object { psql -h localhost -U postgres -d rtrwnet_saas -f $_.FullName }

# Docker
docker-compose up -d
docker-compose down
make docker-up
make docker-down
```

### Frontend

```bash
# Development (all frontends)
npm install
npm run dev

# Build
npm run build
npm run build:dev  # development mode build

# Preview production build
npm run preview

# Linting
npm run lint
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Kubernetes

```bash
# Deploy to staging
kubectl apply -k k8s/overlays/staging

# Deploy to production
kubectl apply -k k8s/overlays/production

# Check status
kubectl get pods -n rtrwnet-staging
kubectl rollout status deployment/backend -n rtrwnet-staging

# View logs
kubectl logs -f deployment/backend -n rtrwnet-staging
```

## Environment Variables

Backend uses `.env` file with key variables:
- `SERVER_PORT` - API port (default: 8089)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL config
- `REDIS_HOST`, `REDIS_PORT` - Redis config
- `JWT_SECRET` - JWT signing key
- `CORS_ALLOWED_ORIGINS` - Comma-separated allowed origins
- `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` - Payment gateway
- `VPN_SERVER_IP`, `ENABLE_RADIUS` - VPN/RADIUS config

Frontend uses Vite environment variables:
- `VITE_API_URL` or `VITE_API_BASE_URL` - Backend API endpoint

## Package Managers

- Backend: Go modules (`go mod`)
- Frontend: npm (some projects also support bun)
