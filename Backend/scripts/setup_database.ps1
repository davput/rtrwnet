# Setup Database Script for Windows PowerShell

Write-Host "=== RT/RW Net SaaS Backend - Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$env:PGPASSWORD = "cvkcvk12"
$DB_HOST = "localhost"
$DB_USER = "postgres"
$DB_NAME = "rtrwnet_saas"

# Check if PostgreSQL is accessible
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
$testConnection = psql -h $DB_HOST -U $DB_USER -d postgres -c "SELECT 1" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to PostgreSQL!" -ForegroundColor Red
    Write-Host "Make sure Docker is running: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ PostgreSQL is accessible" -ForegroundColor Green
Write-Host ""

# Step 1: Run migrations
Write-Host "Step 1: Running database migrations..." -ForegroundColor Yellow
$migrationFiles = Get-ChildItem -Path "migrations\*up.sql" | Sort-Object Name

foreach ($file in $migrationFiles) {
    Write-Host "  Applying: $($file.Name)" -ForegroundColor Gray
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f $file.FullName -q
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Failed to apply $($file.Name)" -ForegroundColor Red
    } else {
        Write-Host "  ✓ Applied $($file.Name)" -ForegroundColor Green
    }
}
Write-Host ""

# Step 2: Reset existing data (optional)
Write-Host "Step 2: Resetting existing data..." -ForegroundColor Yellow
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "scripts\reset_database.sql" -q
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database reset complete" -ForegroundColor Green
} else {
    Write-Host "✗ Database reset failed (this is OK if tables don't exist yet)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Load seed data
Write-Host "Step 3: Loading seed data..." -ForegroundColor Yellow
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "scripts\seed_data.sql"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Seed data loaded successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to load seed data" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Verify data
Write-Host "Step 4: Verifying data..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Tenants:" -ForegroundColor Cyan
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT id, name, subdomain, is_active FROM tenants;"
Write-Host ""
Write-Host "Users:" -ForegroundColor Cyan
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT id, email, name, role, is_active FROM users;"
Write-Host ""
Write-Host "Service Plans:" -ForegroundColor Cyan
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT id, name, speed_download, speed_upload, price FROM service_plans;"
Write-Host ""

Write-Host "=== Database Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Cyan
Write-Host "  Tenant ID: 550e8400-e29b-41d4-a716-446655440000" -ForegroundColor White
Write-Host "  Email:     admin@demo.com" -ForegroundColor White
Write-Host "  Password:  password123" -ForegroundColor White
Write-Host ""
Write-Host "You can now start the application:" -ForegroundColor Yellow
Write-Host "  go run cmd/api/main.go" -ForegroundColor White
Write-Host ""
