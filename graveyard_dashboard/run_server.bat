@echo off
echo ========================================
echo  Data Center Graveyard Dashboard
echo ========================================
echo.

REM Check if data exists
if not exist "data\projects.geojson" (
    echo [WARNING] No data found. Running data ingestion first...
    echo.
    cd scripts
    python ingest_from_sheets.py
    cd ..
    echo.
)

echo Starting servers...
echo.

REM Start backend in background
start "Graveyard API (port 8001)" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8001"

REM Wait for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
start "Graveyard Dashboard (port 5174)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo  Dashboard starting...
echo  - Frontend: http://localhost:5174
echo  - API: http://localhost:8001/docs
echo ========================================
echo.
echo Close this window to stop both servers.
pause
