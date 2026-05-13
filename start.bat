@echo off
echo Starting Greenfield Training — Claude for Beginners Automation...

REM Kill any existing process on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

REM Start the server
node src/server.js
