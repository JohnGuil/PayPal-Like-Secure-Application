# PayPal-Like Secure Application - Startup Script (Windows PowerShell)
# This script ensures containers are ready before opening the browser

Write-Host "🚀 Starting PayPal-Like Secure Application..." -ForegroundColor Cyan
Write-Host ""

# Start Docker containers
Write-Host "📦 Starting Docker containers..." -ForegroundColor Yellow
docker compose up -d

# Wait for database
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 2
    $dbReady = docker exec paypal_db pg_isready -U paypal_user 2>$null
} until ($LASTEXITCODE -eq 0)
Write-Host "✅ Database is ready!" -ForegroundColor Green

# Wait for backend
Write-Host "⏳ Waiting for backend to be ready..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 3
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        $backendReady = $response.StatusCode -eq 200
    } catch {
        $backendReady = $false
        Write-Host "   Still waiting for backend..." -ForegroundColor Gray
    }
} until ($backendReady)
Write-Host "✅ Backend is ready!" -ForegroundColor Green

# Wait for frontend
Write-Host "⏳ Waiting for frontend to be ready..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        $frontendReady = $response.StatusCode -eq 200
    } catch {
        $frontendReady = $false
    }
} until ($frontendReady)
Write-Host "✅ Frontend is ready!" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Application is ready!" -ForegroundColor Green -BackgroundColor Black
Write-Host ""
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📍 Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "📍 Database: localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor Yellow
Write-Host "  👑 Super Admin: superadmin@paypal.test / SuperAdmin123!" -ForegroundColor White
Write-Host "  🛡️  Admin:       admin@paypal.test / Admin123!" -ForegroundColor White
Write-Host "  📊 Manager:     manager@paypal.test / Manager123!" -ForegroundColor White
Write-Host "  👤 User:        user@paypal.test / User123!" -ForegroundColor White
Write-Host ""
Write-Host "To view logs: docker compose logs -f" -ForegroundColor Gray
Write-Host "To stop:      docker compose down" -ForegroundColor Gray
Write-Host ""

# Open browser
Start-Process "http://localhost:3000"
