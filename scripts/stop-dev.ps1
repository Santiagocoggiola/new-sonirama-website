# ============================================
# Sonirama - Stop All Services
# ============================================
# Este script detiene todos los servicios de desarrollo
# Uso: .\scripts\stop-dev.ps1
# ============================================

$ErrorActionPreference = "SilentlyContinue"
$rootPath = Split-Path -Parent $PSScriptRoot

Write-Host "Deteniendo servicios de desarrollo..." -ForegroundColor Cyan
Write-Host ""

# Detener procesos de dotnet
Write-Host "Deteniendo procesos de Backend (.NET)..." -ForegroundColor Yellow
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Procesos dotnet detenidos" -ForegroundColor Green

# Detener procesos de Node.js
Write-Host "Deteniendo procesos de Node.js (Frontend)..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Procesos node detenidos" -ForegroundColor Green

# Detener Docker Compose
Write-Host "Deteniendo Docker Compose..." -ForegroundColor Yellow
Push-Location $rootPath
docker compose down 2>$null
Pop-Location
Write-Host "Docker Compose detenido" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Todos los servicios detenidos!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
