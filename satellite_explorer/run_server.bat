@echo off
echo.
echo ===============================================
echo   DCII Satellite Explorer - Starting...
echo ===============================================
echo.

:: Check if node_modules exists
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

:: Start backend in new window
echo [INFO] Starting backend server on port 8000...
start "DCII Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

:: Wait for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend
echo [INFO] Starting frontend on port 5173...
cd frontend
call npm run dev

pause
