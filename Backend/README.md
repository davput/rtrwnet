# RT/RW Net SaaS Backend

Platform multi-tenant untuk manajemen ISP (Internet Service Provider) berbasis SaaS yang memungkinkan operator RT/RW Net mengelola pelanggan, paket layanan, pembayaran, perangkat jaringan, dan monitoring secara terpusat.

## Tech Stack

- **Language**: Go 1.21+
- **Web Framework**: Gin
- **ORM**: GORM
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Message Queue**: RabbitMQ 3.12+
- **Authentication**: JWT

## Project Structure

```
rtrwnet-saas-backend/
├── cmd/
│   ├── api/           # API server entry point
│   ├── worker/        # Background worker entry point
│   └── migrate/       # Migration tool entry point
├── internal/
│   ├── domain/        # Domain entities and interfaces
│   ├── usecase/       # Business logic / use cases
│   ├── delivery/      # HTTP handlers, WebSocket handlers
│   ├── repository/    # Database implementations
│   ├── middleware/    # HTTP middleware
│   └── infrastructure/# External services (email, cache, queue)
├── pkg/               # Shared packages
│   ├── auth/          # Authentication utilities
│   ├── validator/     # Input validation
│   ├── logger/        # Logging utilities
│   └── errors/        # Error definitions
├── migrations/        # Database migrations
├── docs/              # API documentation
└── tests/             # Integration tests
```

## Getting Started

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 14 or higher
- Redis 7 or higher
- RabbitMQ 3.12 or higher (optional for async operations)

### Installation

1. Clone the repository
```bash
git clone https://github.com/rtrwnet/saas-backend.git
cd saas-backend
```

2. Install dependencies
```bash
go mod download
```

3. Copy environment file
```bash
copy .env.example .env
```

4. Configure your `.env` file with appropriate values

5. Run database migrations
```bash
go run cmd/migrate/main.go up
```

6. Run the application
```bash
go run cmd/api/main.go
```

The API will be available at `http://localhost:8080`

## Development

### Running Tests

```bash
go test ./...
```

### Running with Coverage

```bash
go test -cover ./...
```

### Linting

```bash
golangci-lint run
```

## API Documentation

API documentation is available at `/swagger/index.html` when the server is running.

## Frontend Integration

### Landing Page Integration

Complete integration guide untuk Landing Page (Register & Pricing):

**Quick Start (3 minutes):**
1. Read: `FRONTEND_QUICK_START.md`
2. Copy API client code for your framework
3. Setup environment variables
4. Start integrating!

**Documentation:**
- **Quick Start**: `FRONTEND_QUICK_START.md` - 3-minute integration
- **Complete Guide**: `docs/FRONTEND_INTEGRATION.md` - Full integration guide
- **API Examples**: `docs/API_CLIENT_EXAMPLES.md` - React, Vue, Angular examples
- **TypeScript Types**: `docs/frontend-types.ts` - Type definitions
- **API Spec**: `docs/LANDING_API_SPEC.yaml` - OpenAPI specification

**API Endpoints for Landing:**
- `GET /api/v1/public/plans` - Get subscription plans
- `POST /api/v1/public/signup` - Register new tenant (trial or paid)

**Supported Frameworks:**
- ✅ React (Fetch & Axios)
- ✅ Vue 3 (Composition API)
- ✅ Next.js (API Routes)
- ✅ Angular (HttpClient)
- ✅ Vanilla JavaScript

See `FRONTEND_INTEGRATION_COMPLETE.md` for complete documentation.

## Testing

### Free Trial Feature Testing

Complete testing suite untuk Free Trial 7-day feature:

**Quick Start (3 minutes):**
1. Import Postman collection: `postman/Free_Trial_Testing.postman_collection.json`
2. Start server: `go run cmd/api/main.go`
3. Run tests in Postman

**Documentation:**
- **Quick Start**: `POSTMAN_QUICK_START.md` - 3-minute setup guide
- **Visual Guide**: `POSTMAN_VISUAL_GUIDE.md` - Step-by-step with details
- **Complete Guide**: `POSTMAN_TESTING_GUIDE.md` - Full reference
- **PowerShell**: `TEST_FREE_TRIAL.md` - Command-line testing
- **Index**: `TESTING_INDEX.md` - All testing documentation

**What Gets Tested:**
- ✅ Free trial sign up (no payment required)
- ✅ Immediate activation
- ✅ Login without payment
- ✅ Profile access
- ✅ Paid sign up comparison

See `TESTING_INDEX.md` for complete testing documentation.

## License

Proprietary - All rights reserved
