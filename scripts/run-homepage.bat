@echo off
echo Starting HomePage...
cd /d "%~dp0..\Frontend\HomePage"
echo HomePage running on http://localhost:5721
npm run dev -- --port 5721
