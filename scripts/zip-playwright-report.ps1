# ============================================
# Zip Playwright report
# Uso: .\scripts\zip-playwright-report.ps1
# Crea playwright-report.zip en la carpeta playwright
# ============================================

$ErrorActionPreference = "Stop"
$rootPath = Split-Path -Parent $PSScriptRoot
$pwPath = Join-Path $rootPath "playwright"
$reportPath = Join-Path $pwPath "playwright-report"
$zipPath = Join-Path $pwPath "playwright-report.zip"

if (-not (Test-Path $reportPath)) {
    Write-Host "No existe la carpeta playwright-report. Ejecuta primero los tests." -ForegroundColor Red
    exit 1
}

# Borrar zip previo si existe
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Write-Host "Comprimiendo reporte en $zipPath ..." -ForegroundColor Cyan
Compress-Archive -Path (Join-Path $reportPath '*') -DestinationPath $zipPath -Force

Write-Host "Listo. Envía el archivo:" -ForegroundColor Green
Write-Host "  $zipPath" -ForegroundColor Gray
