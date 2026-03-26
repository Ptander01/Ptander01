@echo off
REM Data Center Consensus Dashboard - One-Click Startup (Windows)
REM This script starts both the backend API server and opens the dashboard

echo ============================================================
echo   Data Center Consensus Dashboard - Starting...
echo ============================================================
echo.

cd /d "%~dp0"

REM Check if Python is available
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.9+
    pause
    exit /b 1
)

REM Check if uvicorn is installed
python -c "import uvicorn" >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing required packages...
    pip install -r backend\requirements.txt
)

REM Check if data files exist
if not exist "data\buildings.geojson" (
    echo.
    echo WARNING: GeoJSON data files not found!
    echo Please run the export script in ArcGIS Pro first:
    echo   exec(open(r"web_dashboard\08_web_export\export_to_geojson.py", encoding='utf-8').read())
    echo.
    pause
    exit /b 1
)

echo Starting backend server on http://localhost:8000
echo.
echo API Documentation: http://localhost:8000/docs
echo Frontend: http://localhost:5173 (if running)
echo.
echo Press Ctrl+C to stop the server
echo.

cd backend
python -m uvicorn main:app --reload --port 8000
