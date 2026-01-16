# Verify Password Hash Script

Write-Host "=== Password Verification ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$env:PGPASSWORD = "cvkcvk12"
$DB_HOST = "localhost"
$DB_USER = "postgres"
$DB_NAME = "rtrwnet_saas"

Write-Host "Checking users in database..." -ForegroundColor Yellow
Write-Host ""

# Get all users with their password hashes
$query = "SELECT email, password, is_active FROM users WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c $query

Write-Host ""
Write-Host "Expected password hash for 'password123':" -ForegroundColor Yellow
Write-Host '$2a$12$d1lLF8ARvS94LWI40nHDguNWosLyiVi9rFLxo/7QpanA2XbcAGaa.' -ForegroundColor White
Write-Host ""

Write-Host "If the hash doesn't match, run:" -ForegroundColor Yellow
Write-Host "  .\scripts\setup_database.ps1" -ForegroundColor White
Write-Host ""
