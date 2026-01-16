# Script untuk menjalankan Backend dan Frontend
# Jalankan dengan: .\run-all.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Start Backend (Go API)
Write-Host "`n[1/3] Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Backend; Write-Host 'Backend API running on http://localhost:8089' -ForegroundColor Green; go run cmd/api/main.go"

# Start Frontend HomePage
Write-Host "[2/3] Starting Frontend HomePage..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Frontend/HomePage; Write-Host 'HomePage running on http://localhost:5173' -ForegroundColor Green; npm run dev"

# Start Frontend UserDashboard
Write-Host "[3/3] Starting Frontend UserDashboard..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Frontend/UserDashboard; Write-Host 'UserDashboard running on http://localhost:5174' -ForegroundColor Green; npm run dev -- --port 5174"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nServices:"
Write-Host "  - Backend API:     http://localhost:8089"
Write-Host "  - HomePage:        http://localhost:5173"
Write-Host "  - UserDashboard:   http://localhost:5174"
Write-Host "`nEach service runs in its own terminal window."
Write-Host "Close the terminal windows to stop the services."
