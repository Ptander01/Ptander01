# Data Center Consensus Dashboard - One-Click Startup (PowerShell)
# Run with: pwsh -File run_server.ps1

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Data Center Consensus Dashboard - Starting..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Check if Python is available
try {
    $null = Get-Command python -ErrorAction Stop
} catch {
    Write-Host "ERROR: Python not found. Please install Python 3.9+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if uvicorn is installed
$uvicornCheck = python -c "import uvicorn" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing required packages..." -ForegroundColor Yellow
    pip install -r backend\requirements.txt
}

# Check if data files exist
if (-not (Test-Path "data\buildings.geojson")) {
    Write-Host ""
    Write-Host "WARNING: GeoJSON data files not found!" -ForegroundColor Yellow
    Write-Host "Please run the export script in ArcGIS Pro first:" -ForegroundColor Yellow
    Write-Host '  exec(open(r"web_dashboard\08_web_export\export_to_geojson.py", encoding=''utf-8'').read())' -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting backend server on http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend:          http://localhost:5173 (if running)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

Set-Location backend
python -m uvicorn main:app --reload --port 8000
