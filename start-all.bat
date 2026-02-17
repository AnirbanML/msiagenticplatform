@echo off
echo Starting MSI Agentic Platform...
echo ================================

REM Start Python Services
echo.
echo Starting Python Services on port 8000...
start cmd /k "cd backend\python-services && python main.py"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting Angular Frontend on port 4200...
start cmd /k "cd frontend\workflow-builder-app && npm start"

echo.
echo ================================
echo All services are starting...
echo.
echo Frontend:       http://localhost:4200
echo Python API:     http://localhost:8000
echo.
echo Check the individual terminal windows for startup status.
echo.
pause
