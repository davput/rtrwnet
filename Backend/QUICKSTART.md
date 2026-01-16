# Quick Start Guide

## Prerequisites

- Go 1.21 or higher
- Docker Desktop (for Windows)
- Git

## Step 1: Start Docker Services

Open PowerShell or Command Prompt and run:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- RabbitMQ on port 5672 (management UI on 15672)

## Step 2: Verify Docker Services

Check if all services are running:

```bash
docker-compose ps
```

You should see all services with status "Up".

## Step 3: Install Go Dependencies

```bash
go mod download
```

## Step 4: Run Database Migrations

For Windows PowerShell:
```powershell
$env:PGPASSWORD="postgres"
Get-ChildItem migrations\*up.sql | ForEach-Object { 
    Write-Host "Applying $_"
    psql -h localhost -U postgres -d rtrwnet_saas -f $_.FullName
}
```

Or manually run each migration file using a PostgreSQL client.

## Step 5: Run the Application

```bash
go run cmd/api/main.go
```

Or using Make:
```bash
make run
```

## Step 6: Test the API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:8080/health

# Ping endpoint
curl http://localhost:8080/api/v1/ping
```

Expected response:
```json
{
  "status": "ok",
  "message": "RT/RW Net SaaS Backend is running"
}
```

## Step 7: Access Services

- **API**: http://localhost:8080
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **PostgreSQL**: localhost:5432 (postgres/postgres)
- **Redis**: localhost:6379

## Troubleshooting

### Docker services not starting

```bash
# Stop all services
docker-compose down

# Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

### Database connection error

1. Check if PostgreSQL is running: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Verify credentials in `.env` file

### Port already in use

If port 8080 is already in use, change `SERVER_PORT` in `.env` file:
```
SERVER_PORT=8081
```

## Next Steps

1. Read the [SETUP_SUMMARY.md](SETUP_SUMMARY.md) for detailed information
2. Check the [specifications](.kiro/specs/rtrwnet-saas-backend/) for requirements
3. Start implementing Phase 2: Multi-Tenant Architecture

## Development Workflow

1. Make changes to code
2. Run tests: `go test ./...`
3. Run the application: `make run`
4. Test endpoints using curl or Postman

## Useful Commands

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Build the application
go build -o bin/api.exe cmd/api/main.go

# Run linter (if installed)
golangci-lint run

# Format code
go fmt ./...

# Update dependencies
go mod tidy
```

## Environment Variables

All configuration is in `.env` file. Key variables:

- `SERVER_PORT`: API server port (default: 8080)
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_NAME`: Database name (default: rtrwnet_saas)
- `REDIS_HOST`: Redis host (default: localhost)
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)

## Support

For issues or questions:
1. Check existing issues in the repository
2. Read the documentation in `.kiro/specs/`
3. Create a new issue with detailed information

---

Happy coding! 🚀
