@echo off
REM Script untuk menjalankan Backend dan Frontend
REM Jalankan dengan: run-all.bat

echo ========================================
echo   Starting All Services
echo ========================================

REM Start Backend (Go API)
echo.
echo [1/3] Starting Backend API...
start "Backend API" cmd /k "cd Backend && echo Backend API running on http://localhost:8089 && go run cmd/api/main.go"

REM Start Frontend HomePage
echo [2/3] Starting Frontend HomePage...
start "HomePage" cmd /k "cd Frontend\HomePage && echo HomePage running on http://localhost:5173 && npm run dev -- --port 5174"

REM Start Frontend UserDashboard
echo [3/3] Starting Frontend UserDashboard...
start "UserDashboard" cmd /k "cd Frontend\UserDashboard && echo UserDashboard running on http://localhost:5174 && npm run dev "

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo Services:
echo   - Backend API:     http://localhost:8089
echo   - HomePage:        http://localhost:5173
echo   - UserDashboard:   http://localhost:5174
echo.
echo Each service runs in its own terminal window.
echo Close the terminal windows to stop the services.
