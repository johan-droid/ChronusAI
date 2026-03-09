$env:PORT = "8000"
$env:APP_ENV = "development"

Write-Host "Activating virtual environment..." -ForegroundColor Cyan
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Virtual environment not found. Please ensure it's created at ./venv" -ForegroundColor Red
    exit 1
}

Write-Host "Running database migrations..." -ForegroundColor Cyan
alembic upgrade head

Write-Host "Starting application..." -ForegroundColor Cyan
uvicorn app.main:app --host 0.0.0.0 --port $env:PORT --reload
