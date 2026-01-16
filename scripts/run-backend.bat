@echo off
echo Starting Backend API...
cd /d "%~dp0..\Backend"
echo Backend API running on http://localhost:8089
go run cmd/api/main.go
