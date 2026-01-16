@echo off
echo Starting UserDashboard...
cd /d "%~dp0..\Frontend\UserDashboard"
echo UserDashboard running on http://localhost:8080
npm run dev -- --port 8080
