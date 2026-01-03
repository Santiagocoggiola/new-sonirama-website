# Sonirama Development Scripts

Scripts de PowerShell para facilitar el desarrollo.

## Scripts disponibles

### `start-dev.ps1`
Inicia el entorno de desarrollo completo:
- 🐳 Base de datos (Docker Compose)
- 🔧 Backend (.NET API)
- 🎨 Frontend (Next.js)

```powershell
.\scripts\start-dev.ps1
```

### `start-dev-with-tests.ps1`
Igual que `start-dev.ps1` pero también abre Playwright UI para testing E2E:
- 🐳 Base de datos
- 🔧 Backend
- 🎨 Frontend
- 🧪 Playwright UI

```powershell
.\scripts\start-dev-with-tests.ps1
```

### `stop-dev.ps1`
Detiene todos los servicios de desarrollo:
- Cierra procesos de dotnet
- Cierra procesos de node
- Detiene Docker Compose

```powershell
.\scripts\stop-dev.ps1
```

## Solución de problemas

### Error: "La ejecución de scripts está deshabilitada"

Si ves este error al ejecutar los scripts:

```
No se puede cargar el archivo porque la ejecución de scripts está deshabilitada en este sistema.
```

**Solución 1**: Ejecutar con bypass (temporal)
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
```

**Solución 2**: Habilitar scripts permanentemente (como Administrador)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Los puertos ya están en uso

Si el backend o frontend no inician porque los puertos están ocupados:

1. Ejecuta `.\scripts\stop-dev.ps1` para detener todo
2. O manualmente busca qué proceso usa el puerto:
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :5001
```
