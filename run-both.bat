@echo off
echo Starting Smart Campus Portal - Web and Desktop Applications
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Web Application...
start "Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak > nul

echo Starting Desktop Application...
start "Desktop" cmd /k "cd desktop-app && npm install && npm start"

echo.
echo All applications are starting...
echo - Backend: http://localhost:5000
echo - Web App: http://localhost:3000
echo - Desktop App: Will open automatically
echo.
pause