@echo off
echo ==========================================
echo   AmblyoCare - Development Launcher
echo ==========================================

echo [1/2] Starting Backend Server (FastAPI)...
:: Opens a new window for the backend
start "AmblyoCare Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo [2/2] Starting Frontend Server (Next.js)...
:: Opens a new window for the frontend
start "AmblyoCare Frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo   Success! verify at:
echo   Frontend: http://localhost:3000/therapy
echo   Backend:  http://localhost:8000/docs
echo ==========================================
echo.
pause
