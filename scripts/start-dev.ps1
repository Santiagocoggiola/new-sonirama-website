# ============================================
# Sonirama - Start Development Environment
# ============================================
# Este script inicia el backend y frontend juntos
# Uso: .\scripts\start-dev.ps1
# ============================================

$ErrorActionPreference = "Continue"
$rootPath = Split-Path -Parent $PSScriptRoot

Write-Host "Iniciando entorno de desarrollo de Sonirama..." -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker esta corriendo (para la base de datos)
Write-Host "Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = & docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker no esta corriendo. Iniciando base de datos puede fallar." -ForegroundColor Red
    Write-Host "Por favor, inicia Docker Desktop y vuelve a intentar." -ForegroundColor Red
}

# Iniciar base de datos con Docker Compose
Write-Host "Iniciando base de datos con Docker Compose..." -ForegroundColor Yellow
Push-Location $rootPath
try {
    docker compose up -d
    Write-Host "Base de datos iniciada" -ForegroundColor Green
} catch {
    Write-Host "Error iniciando Docker Compose: $_" -ForegroundColor Red
}
Pop-Location

Write-Host ""

# Iniciar Backend (.NET)
Write-Host "Iniciando Backend (API .NET)..." -ForegroundColor Yellow
$backendPath = Join-Path $rootPath "src\Sonirama.Api"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$backendPath`" && dotnet watch run" -WindowStyle Normal

Write-Host "Backend iniciado en nueva ventana" -ForegroundColor Green
Write-Host "   URL: https://localhost:5001" -ForegroundColor Gray
Write-Host ""

# Esperar un poco para que el backend inicie
Write-Host "Esperando 5 segundos para que el backend inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Iniciar Frontend (Next.js)
Write-Host "Iniciando Frontend (Next.js)..." -ForegroundColor Yellow
$frontendPath = Join-Path $rootPath "webapp"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$frontendPath`" && npm run dev" -WindowStyle Normal

Write-Host "Frontend iniciado en nueva ventana" -ForegroundColor Green
Write-Host "   URL: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Entorno de desarrollo iniciado!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   Backend:  https://localhost:5001" -ForegroundColor Gray
Write-Host "   Swagger:  https://localhost:5001/swagger" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener, cierra las ventanas de terminal abiertas" -ForegroundColor Yellow
Write-Host "o usa Ctrl+C en cada una." -ForegroundColor Yellow
