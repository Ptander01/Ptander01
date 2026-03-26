# run_server.ps1 - Start Data Center Graveyard Dashboard

Write-Host "========================================"
Write-Host " Data Center Graveyard Dashboard"
Write-Host "========================================"
Write-Host ""

# Check if data exists
if (-not (Test-Path "data\projects.geojson")) {
    Write-Host "[WARNING] No data found. Running data ingestion first..." -ForegroundColor Yellow
    Write-Host ""
    Set-Location scripts
    python ingest_from_sheets.py
    Set-Location ..
    Write-Host ""
}

Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host ""

# Start backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    python -m uvicorn main:app --reload --port 8001
}

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm run dev
}

Write-Host ""
Write-Host "========================================"
Write-Host " Dashboard starting..." -ForegroundColor Green
Write-Host " - Frontend: http://localhost:5174"
Write-Host " - API: http://localhost:8001/docs"
Write-Host "========================================"
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers."

# Wait for jobs
try {
    Wait-Job $backendJob, $frontendJob
} finally {
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
}
