# DCII Satellite Explorer - Startup Script
# Run this script to start both backend and frontend servers

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   DCII Satellite Explorer - Starting..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if node_modules exists
if (-not (Test-Path "$projectRoot\frontend\node_modules")) {
    Write-Host "[INFO] Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "$projectRoot\frontend"
    npm install
    Set-Location $projectRoot
}

# Check if Python dependencies are installed
Write-Host "[INFO] Checking Python dependencies..." -ForegroundColor Yellow
pip show fastapi | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[INFO] Installing backend dependencies..." -ForegroundColor Yellow
    pip install -r "$projectRoot\backend\requirements.txt"
}

# Start backend server in new window
Write-Host "[INFO] Starting backend server on port 8000..." -ForegroundColor Green
$backendScript = {
    param($path)
    Set-Location "$path\backend"
    python -m uvicorn main:app --reload --port 8000
}
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot\backend'; python -m uvicorn main:app --reload --port 8000"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "[INFO] Starting frontend on port 5173..." -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

Set-Location "$projectRoot\frontend"
npm run dev
