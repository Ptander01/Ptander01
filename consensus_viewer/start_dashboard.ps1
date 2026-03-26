# Data Center Consensus Dashboard - Startup Script
# This script starts both backend and frontend servers
# Run with: pwsh -File start_dashboard.ps1

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Data Center Consensus Dashboard" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Reload PATH to pick up Node.js if just installed
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# ArcGIS Pro Python path
$ArcGISPython = "C:\Program Files\ArcGIS\Pro\bin\Python\envs\arcgispro-py3\python.exe"

# Check if data files exist
if (-not (Test-Path "data\buildings.geojson") -and -not (Test-Path "data\campuses.geojson")) {
    Write-Host ""
    Write-Host "WARNING: GeoJSON data files not found!" -ForegroundColor Yellow
    Write-Host "Please run the export script in ArcGIS Pro first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host '  exec(open(r".\08_web_export\export_to_geojson.py", encoding=''utf-8'').read())' -ForegroundColor Cyan
    Write-Host ""
    $response = Read-Host "Press Enter to exit, or type 'continue' to start servers anyway"
    if ($response -ne "continue") {
        exit 1
    }
}

Write-Host "Starting servers..." -ForegroundColor Green
Write-Host ""

# Start backend in new window
$backendCmd = "cd '$ScriptDir\backend'; & '$ArcGISPython' -m uvicorn main:app --reload --port 8000"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

Write-Host "[Backend] Started on http://localhost:8000" -ForegroundColor Cyan
Write-Host "[Backend] API Docs: http://localhost:8000/docs" -ForegroundColor Cyan

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend in new window
$frontendCmd = "cd '$ScriptDir\frontend'; npm run dev"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal

Write-Host "[Frontend] Starting on http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

# Wait a moment then open browser
Start-Sleep -Seconds 3
Write-Host "Opening dashboard in browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Dashboard is running!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  Share this URL with colleagues on your network:" -ForegroundColor Yellow

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
if ($localIP) {
    Write-Host "  http://${localIP}:5173" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "  Close the PowerShell windows to stop the servers." -ForegroundColor Gray
Write-Host ""
