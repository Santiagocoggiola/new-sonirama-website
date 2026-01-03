# ============================================
# Sonirama - Start Dev + Playwright UI
# ============================================
# Este script inicia backend, frontend y Playwright UI
# Uso: .\scripts\start-dev-with-tests.ps1
# ============================================

$ErrorActionPreference = "Continue"
$rootPath = Split-Path -Parent $PSScriptRoot

function Wait-ForPort {
    param(
        [string] $TargetHost = "localhost",
        [int] $Port = 55432,
        [int] $TimeoutSeconds = 60
    )

    $start = Get-Date
    while ((Get-Date) - $start -lt [TimeSpan]::FromSeconds($TimeoutSeconds)) {
        try {
            $result = Test-NetConnection -ComputerName $TargetHost -Port $Port -InformationLevel Quiet
            if ($result) { return $true }
        } catch {}
        Start-Sleep -Seconds 1
    }
    return $false
}

Write-Host "Iniciando entorno de desarrollo + Playwright UI..." -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker esta corriendo
Write-Host "Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = & docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker no esta corriendo. Iniciando base de datos puede fallar." -ForegroundColor Red
    Write-Host "Por favor, inicia Docker Desktop y vuelve a intentar." -ForegroundColor Red
}

# Reiniciar base de datos de pruebas con Docker Compose (volúmenes limpios)
Write-Host "Reiniciando base de datos de pruebas (compose tests)..." -ForegroundColor Yellow
$composeFile = Join-Path $rootPath "docker-compose.tests.yml"
Push-Location $rootPath
try {
    docker compose -f $composeFile down -v
    docker compose -f $composeFile up -d
    Write-Host "Base de datos de pruebas iniciada" -ForegroundColor Green
    Write-Host "   Compose: docker-compose.tests.yml" -ForegroundColor Gray
    Write-Host "   Contenedor: sonirama-postgres-tests (puerto host 55432)" -ForegroundColor Gray
    Write-Host "Esperando que la base de datos acepte conexiones..." -ForegroundColor Gray
    $dbReady = Wait-ForPort -TargetHost "localhost" -Port 55432 -TimeoutSeconds 60
    if (-not $dbReady) {
        Write-Host "La base de datos no respondió en 60s; el backend puede fallar al iniciar." -ForegroundColor DarkYellow
    } else {
        Write-Host "Base de datos lista." -ForegroundColor Green
    }
} catch {
    Write-Host "Error reiniciando Docker Compose de pruebas: $_" -ForegroundColor Red
}
Pop-Location

# Limpiar estado previo de Playwright para evitar tokens/session caducados
Write-Host "Limpiando estado previo de Playwright (.auth, reportes, resultados)..." -ForegroundColor Yellow
$pwPath = Join-Path $rootPath "playwright"
$pwAuth = Join-Path $pwPath ".auth"
$pwReport = Join-Path $pwPath "playwright-report"
$pwResults = Join-Path $pwPath "test-results"
foreach ($dir in @($pwAuth, $pwReport, $pwResults)) {
    if (Test-Path $dir) {
        try { Remove-Item -Recurse -Force $dir; Write-Host "   Limpiado: $dir" -ForegroundColor Gray }
        catch { Write-Host "   No se pudo limpiar ${dir}: $_" -ForegroundColor DarkYellow }
    }
}

Write-Host ""

# Iniciar Backend (.NET)
Write-Host "Iniciando Backend (API .NET)..." -ForegroundColor Yellow
$backendPath = Join-Path $rootPath "src\Sonirama.Api"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "set ConnectionStrings__Default=Host=localhost;Port=55432;Database=sonirama_tests;Username=app_user;Password=change_me && cd /d `"$backendPath`" && dotnet watch run" -WindowStyle Normal

Write-Host "Backend iniciado en nueva ventana" -ForegroundColor Green
Write-Host "   URL: https://localhost:5001" -ForegroundColor Gray
Write-Host ""

# Breve espera para warm-up del backend (db ya debería estar lista)
Write-Host "Esperando 3 segundos para que el backend inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Iniciar Frontend (Next.js)
Write-Host "Iniciando Frontend (Next.js)..." -ForegroundColor Yellow
$frontendPath = Join-Path $rootPath "webapp"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$frontendPath`" && npm run dev" -WindowStyle Normal

Write-Host "Frontend iniciado en nueva ventana" -ForegroundColor Green
Write-Host "   URL: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

# Esperar para que el frontend inicie
Write-Host "Esperando 10 segundos para que el frontend inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Iniciar Playwright UI
Write-Host "Iniciando Playwright UI..." -ForegroundColor Yellow
$playwrightPath = Join-Path $rootPath "playwright"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$playwrightPath`" && npx playwright test --ui" -WindowStyle Normal

Write-Host "Playwright UI iniciado en nueva ventana" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Todo listo para testing E2E!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:" -ForegroundColor White
Write-Host "   Frontend:     http://localhost:3000" -ForegroundColor Gray
Write-Host "   Backend:      https://localhost:5001" -ForegroundColor Gray
Write-Host "   Swagger:      https://localhost:5001/swagger" -ForegroundColor Gray
Write-Host "   Playwright:   Se abre en nueva ventana" -ForegroundColor Gray
Write-Host ""
Write-Host "Ventanas abiertas:" -ForegroundColor Yellow
Write-Host "   1. Backend (dotnet watch run)" -ForegroundColor Gray
Write-Host "   2. Frontend (npm run dev)" -ForegroundColor Gray
Write-Host "   3. Playwright UI" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener todo, cierra las ventanas de terminal" -ForegroundColor Yellow
